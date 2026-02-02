/**
 * @fileoverview Invoice Management API
 * @description Handles invoice creation, sending, and PDF generation.
 * 
 * @module @prvcsh/payments/invoices
 * @version 0.1.0
 */

import {
  Invoice,
  InvoiceStatus,
  InvoiceLineItem,
  CreateInvoiceInput,
  Currency,
  PaymentErrorCode,
  PaginatedResponse,
} from '../types';

// =============================================================================
// INVOICE MANAGER INTERFACE
// =============================================================================

/**
 * Invoice manager interface
 */
export interface IInvoiceManager {
  // Invoice CRUD
  createInvoice(merchantId: string, input: CreateInvoiceInput): Promise<Invoice>;
  getInvoice(invoiceId: string): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  listInvoices(merchantId: string, options?: InvoiceQueryOptions): Promise<PaginatedResponse<Invoice>>;
  
  // Invoice actions
  sendInvoice(invoiceId: string): Promise<Invoice>;
  markViewed(invoiceId: string): Promise<Invoice>;
  markPaid(invoiceId: string, paymentId: string): Promise<Invoice>;
  cancelInvoice(invoiceId: string): Promise<Invoice>;
  voidInvoice(invoiceId: string): Promise<Invoice>;
  
  // PDF generation
  generatePdf(invoiceId: string): Promise<Uint8Array>;
  getInvoiceUrl(invoiceId: string): string;
}

/**
 * Invoice query options
 */
export interface InvoiceQueryOptions {
  /** Filter by status */
  status?: InvoiceStatus;
  
  /** Filter by customer email */
  customerEmail?: string;
  
  /** Filter by date range */
  fromDate?: Date;
  toDate?: Date;
  
  /** Include overdue only */
  overdueOnly?: boolean;
  
  /** Pagination */
  limit?: number;
  offset?: number;
  
  /** Sort */
  sortBy?: 'createdAt' | 'dueDate' | 'total';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Invoice manager configuration
 */
export interface InvoiceManagerConfig {
  /** Base URL for invoice links */
  baseUrl: string;
  
  /** Invoice number prefix */
  invoicePrefix: string;
  
  /** Default due days */
  defaultDueDays: number;
  
  /** Company info for PDF */
  companyName: string;
  companyAddress: string;
  companyEmail: string;
}

/**
 * Default invoice manager configuration
 */
export const DEFAULT_INVOICE_CONFIG: InvoiceManagerConfig = {
  baseUrl: 'https://pay.privacycash.app',
  invoicePrefix: 'INV',
  defaultDueDays: 30,
  companyName: 'PRVCSH',
  companyAddress: '',
  companyEmail: 'invoices@privacycash.app',
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate unique ID
 */
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${timestamp}${random}`;
}

/**
 * Generate invoice number
 */
function generateInvoiceNumber(prefix: string, sequence: number): string {
  const year = new Date().getFullYear();
  const paddedSeq = sequence.toString().padStart(6, '0');
  return `${prefix}-${year}-${paddedSeq}`;
}

/**
 * Calculate line item total
 */
function calculateLineItemTotal(item: Omit<InvoiceLineItem, 'id' | 'total' | 'taxAmount'>): InvoiceLineItem {
  const total = BigInt(item.quantity) * item.unitPrice;
  const taxAmount = item.taxRateBps
    ? (total * BigInt(item.taxRateBps)) / 10000n
    : undefined;
  
  return {
    id: generateId('item'),
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total,
    taxRateBps: item.taxRateBps,
    taxAmount,
  };
}

// =============================================================================
// INVOICE MANAGER IMPLEMENTATION
// =============================================================================

/**
 * Invoice manager implementation
 */
export class InvoiceManager implements IInvoiceManager {
  private invoices: Map<string, Invoice> = new Map();
  private invoicesByNumber: Map<string, string> = new Map(); // number -> id
  private invoiceSequence: Map<string, number> = new Map(); // merchantId -> sequence
  private readonly config: InvoiceManagerConfig;
  
  constructor(config: Partial<InvoiceManagerConfig> = {}) {
    this.config = { ...DEFAULT_INVOICE_CONFIG, ...config };
  }
  
  /**
   * Create a new invoice
   */
  async createInvoice(
    merchantId: string,
    input: CreateInvoiceInput
  ): Promise<Invoice> {
    // Validate input
    if (!input.customerEmail || !input.customerEmail.includes('@')) {
      throw new Error('Valid customer email is required');
    }
    
    if (!input.items || input.items.length === 0) {
      throw new Error('At least one line item is required');
    }
    
    // Generate invoice number
    const sequence = (this.invoiceSequence.get(merchantId) || 0) + 1;
    this.invoiceSequence.set(merchantId, sequence);
    const invoiceNumber = generateInvoiceNumber(this.config.invoicePrefix, sequence);
    
    // Calculate line items
    const items = input.items.map((item) => calculateLineItemTotal({
      ...item,
      taxRateBps: item.taxRateBps ?? input.taxRateBps,
    }));
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0n);
    const taxTotal = items.reduce((sum, item) => sum + (item.taxAmount || 0n), 0n);
    const total = subtotal + taxTotal;
    
    // Generate ID
    const id = generateId('inv');
    
    const invoice: Invoice = {
      id,
      invoiceNumber,
      merchantId,
      status: 'draft',
      customerEmail: input.customerEmail.toLowerCase(),
      customerName: input.customerName,
      customerAddress: input.customerAddress,
      items,
      subtotal,
      taxTotal,
      total,
      currency: input.currency,
      notes: input.notes,
      dueDate: input.dueDate,
      url: `${this.config.baseUrl}/invoice/${id}`,
      pdfUrl: `${this.config.baseUrl}/invoice/${id}/pdf`,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: input.metadata,
    };
    
    this.invoices.set(id, invoice);
    this.invoicesByNumber.set(invoiceNumber, id);
    
    // Send immediately if requested
    if (input.sendImmediately) {
      return this.sendInvoice(id);
    }
    
    return invoice;
  }
  
  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice | undefined> {
    return this.invoices.get(invoiceId);
  }
  
  /**
   * Get invoice by number
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const id = this.invoicesByNumber.get(invoiceNumber);
    return id ? this.invoices.get(id) : undefined;
  }
  
  /**
   * List invoices for merchant
   */
  async listInvoices(
    merchantId: string,
    options: InvoiceQueryOptions = {}
  ): Promise<PaginatedResponse<Invoice>> {
    let invoices = Array.from(this.invoices.values())
      .filter((inv) => inv.merchantId === merchantId);
    
    // Apply filters
    if (options.status) {
      invoices = invoices.filter((inv) => inv.status === options.status);
    }
    
    if (options.customerEmail) {
      invoices = invoices.filter(
        (inv) => inv.customerEmail === options.customerEmail?.toLowerCase()
      );
    }
    
    if (options.fromDate) {
      invoices = invoices.filter((inv) => inv.createdAt >= options.fromDate!);
    }
    
    if (options.toDate) {
      invoices = invoices.filter((inv) => inv.createdAt <= options.toDate!);
    }
    
    if (options.overdueOnly) {
      const now = new Date();
      invoices = invoices.filter(
        (inv) => inv.status === 'sent' && inv.dueDate < now
      );
    }
    
    // Sort
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    
    invoices.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'dueDate':
          comparison = a.dueDate.getTime() - b.dueDate.getTime();
          break;
        case 'total':
          comparison = Number(a.total - b.total);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    // Paginate
    const total = invoices.length;
    const offset = options.offset || 0;
    const limit = options.limit || 20;
    
    const data = invoices.slice(offset, offset + limit);
    
    return {
      data,
      total,
      hasMore: offset + limit < total,
      nextCursor: offset + limit < total ? String(offset + limit) : undefined,
    };
  }
  
  /**
   * Send invoice to customer
   */
  async sendInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = this.invoices.get(invoiceId);
    
    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }
    
    if (invoice.status !== 'draft') {
      throw new Error(`Cannot send invoice with status: ${invoice.status}`);
    }
    
    // Update status
    invoice.status = 'sent';
    invoice.sentAt = new Date();
    invoice.updatedAt = new Date();
    
    // In production, send email here
    console.log(`[Invoice] Sending invoice ${invoice.invoiceNumber} to ${invoice.customerEmail}`);
    
    return invoice;
  }
  
  /**
   * Mark invoice as viewed
   */
  async markViewed(invoiceId: string): Promise<Invoice> {
    const invoice = this.invoices.get(invoiceId);
    
    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }
    
    if (invoice.status === 'sent' && !invoice.viewedAt) {
      invoice.status = 'viewed';
      invoice.viewedAt = new Date();
      invoice.updatedAt = new Date();
    }
    
    return invoice;
  }
  
  /**
   * Mark invoice as paid
   */
  async markPaid(invoiceId: string, paymentId: string): Promise<Invoice> {
    const invoice = this.invoices.get(invoiceId);
    
    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }
    
    if (invoice.status === 'paid') {
      throw new Error('Invoice already paid');
    }
    
    if (invoice.status === 'cancelled' || invoice.status === 'void') {
      throw new Error(`Cannot pay invoice with status: ${invoice.status}`);
    }
    
    invoice.status = 'paid';
    invoice.paidAt = new Date();
    invoice.paymentId = paymentId;
    invoice.updatedAt = new Date();
    
    return invoice;
  }
  
  /**
   * Cancel invoice
   */
  async cancelInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = this.invoices.get(invoiceId);
    
    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }
    
    if (invoice.status === 'paid') {
      throw new Error('Cannot cancel paid invoice');
    }
    
    invoice.status = 'cancelled';
    invoice.updatedAt = new Date();
    
    return invoice;
  }
  
  /**
   * Void invoice
   */
  async voidInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = this.invoices.get(invoiceId);
    
    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }
    
    invoice.status = 'void';
    invoice.updatedAt = new Date();
    
    return invoice;
  }
  
  /**
   * Check and mark overdue invoices
   */
  async checkOverdueInvoices(): Promise<number> {
    const now = new Date();
    let count = 0;
    
    for (const invoice of this.invoices.values()) {
      if (
        (invoice.status === 'sent' || invoice.status === 'viewed') &&
        invoice.dueDate < now
      ) {
        invoice.status = 'overdue';
        invoice.updatedAt = new Date();
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Generate PDF for invoice
   */
  async generatePdf(invoiceId: string): Promise<Uint8Array> {
    const invoice = this.invoices.get(invoiceId);
    
    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }
    
    // In production, use a PDF library like PDFKit
    // For now, return a placeholder
    const pdfContent = this.generatePdfContent(invoice);
    const encoder = new TextEncoder();
    return encoder.encode(pdfContent);
  }
  
  /**
   * Generate PDF content (placeholder)
   */
  private generatePdfContent(invoice: Invoice): string {
    const lines = [
      `%PDF-1.4`,
      `% PRVCSH Invoice`,
      ``,
      `INVOICE: ${invoice.invoiceNumber}`,
      `Date: ${invoice.createdAt.toLocaleDateString()}`,
      `Due Date: ${invoice.dueDate.toLocaleDateString()}`,
      ``,
      `From: ${this.config.companyName}`,
      ``,
      `To: ${invoice.customerName || invoice.customerEmail}`,
      `Email: ${invoice.customerEmail}`,
      invoice.customerAddress ? `Address: ${invoice.customerAddress}` : '',
      ``,
      `Items:`,
      `${'─'.repeat(60)}`,
    ];
    
    for (const item of invoice.items) {
      lines.push(
        `${item.description}`,
        `  Qty: ${item.quantity} x ${item.unitPrice} = ${item.total}`
      );
      if (item.taxAmount) {
        lines.push(`  Tax: ${item.taxAmount}`);
      }
    }
    
    lines.push(
      `${'─'.repeat(60)}`,
      `Subtotal: ${invoice.subtotal} ${invoice.currency}`,
      `Tax: ${invoice.taxTotal} ${invoice.currency}`,
      `TOTAL: ${invoice.total} ${invoice.currency}`,
      ``,
      invoice.notes ? `Notes: ${invoice.notes}` : '',
      ``,
      `Pay online: ${invoice.url}`,
    );
    
    return lines.filter(Boolean).join('\n');
  }
  
  /**
   * Get invoice URL
   */
  getInvoiceUrl(invoiceId: string): string {
    return `${this.config.baseUrl}/invoice/${invoiceId}`;
  }
  
  /**
   * Get invoice stats
   */
  getStats(merchantId: string): {
    total: number;
    byStatus: Record<InvoiceStatus, number>;
    totalAmount: bigint;
    paidAmount: bigint;
    overdueAmount: bigint;
  } {
    const byStatus: Record<InvoiceStatus, number> = {
      draft: 0,
      sent: 0,
      viewed: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
      void: 0,
    };
    
    let totalAmount = 0n;
    let paidAmount = 0n;
    let overdueAmount = 0n;
    
    for (const invoice of this.invoices.values()) {
      if (invoice.merchantId !== merchantId) continue;
      
      byStatus[invoice.status]++;
      totalAmount += invoice.total;
      
      if (invoice.status === 'paid') {
        paidAmount += invoice.total;
      } else if (invoice.status === 'overdue') {
        overdueAmount += invoice.total;
      }
    }
    
    return {
      total: Array.from(this.invoices.values()).filter(
        (i) => i.merchantId === merchantId
      ).length,
      byStatus,
      totalAmount,
      paidAmount,
      overdueAmount,
    };
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create invoice manager
 */
export function createInvoiceManager(
  config?: Partial<InvoiceManagerConfig>
): InvoiceManager {
  return new InvoiceManager(config);
}

/**
 * Format currency amount for display
 */
export function formatInvoiceAmount(
  amount: bigint,
  currency: Currency,
  decimals: number = 6
): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 2);
  
  return `${whole}.${fractionStr} ${currency}`;
}

/**
 * Calculate invoice due date
 */
export function calculateDueDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
