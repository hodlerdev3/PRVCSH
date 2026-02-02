/**
 * @fileoverview PDF Invoice Generator
 * @description Generate PDF invoices for merchants.
 * 
 * @module @prvcsh/payments/pdf
 * @version 0.1.0
 */

import type { Invoice, InvoiceLineItem, Currency } from '../types';

// =============================================================================
// PDF GENERATOR INTERFACE
// =============================================================================

/**
 * PDF generator interface
 */
export interface IPDFGenerator {
  generateInvoicePDF(invoice: Invoice, config: PDFConfig): Promise<Uint8Array>;
  generateReceipt(invoice: Invoice, config: PDFConfig): Promise<Uint8Array>;
}

/**
 * PDF configuration
 */
export interface PDFConfig {
  /** Company name */
  companyName: string;
  
  /** Company logo URL */
  companyLogo?: string;
  
  /** Company address */
  companyAddress: string;
  
  /** Company email */
  companyEmail: string;
  
  /** Company phone */
  companyPhone?: string;
  
  /** Company website */
  companyWebsite?: string;
  
  /** Tax ID */
  taxId?: string;
  
  /** Primary color (hex) */
  primaryColor: string;
  
  /** Secondary color (hex) */
  secondaryColor: string;
  
  /** Footer text */
  footerText?: string;
  
  /** Date format */
  dateFormat: 'US' | 'EU' | 'ISO';
  
  /** Currency decimals */
  currencyDecimals: number;
}

/**
 * Default PDF configuration
 */
export const DEFAULT_PDF_CONFIG: PDFConfig = {
  companyName: 'PRVCSH',
  companyAddress: '',
  companyEmail: 'billing@privacycash.app',
  primaryColor: '#6366f1',
  secondaryColor: '#4f46e5',
  dateFormat: 'ISO',
  currencyDecimals: 6,
  footerText: 'Thank you for your business!',
};

// =============================================================================
// PDF DOCUMENT BUILDER
// =============================================================================

/**
 * PDF document elements
 */
interface PDFElement {
  type: 'text' | 'line' | 'rect' | 'table' | 'image';
  x: number;
  y: number;
  content?: string;
  width?: number;
  height?: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right';
  data?: unknown;
}

/**
 * PDF document builder
 */
class PDFDocumentBuilder {
  private elements: PDFElement[] = [];
  private readonly width: number = 612; // US Letter width in points
  private readonly height: number = 792; // US Letter height in points
  private readonly margin: number = 50;
  private currentY: number = 50;
  
  /**
   * Add text element
   */
  text(
    content: string,
    options: {
      x?: number;
      fontSize?: number;
      fontWeight?: 'normal' | 'bold';
      color?: string;
      align?: 'left' | 'center' | 'right';
    } = {}
  ): this {
    const x = options.x ?? this.margin;
    const fontSize = options.fontSize ?? 12;
    
    this.elements.push({
      type: 'text',
      x,
      y: this.currentY,
      content,
      fontSize,
      fontWeight: options.fontWeight ?? 'normal',
      color: options.color ?? '#000000',
      align: options.align ?? 'left',
    });
    
    this.currentY += fontSize + 4;
    return this;
  }
  
  /**
   * Add heading
   */
  heading(content: string, level: 1 | 2 | 3 = 1): this {
    const fontSizes = { 1: 24, 2: 18, 3: 14 };
    return this.text(content, {
      fontSize: fontSizes[level],
      fontWeight: 'bold',
    });
  }
  
  /**
   * Add horizontal line
   */
  line(width?: number): this {
    this.elements.push({
      type: 'line',
      x: this.margin,
      y: this.currentY,
      width: width ?? (this.width - this.margin * 2),
    });
    this.currentY += 10;
    return this;
  }
  
  /**
   * Add spacing
   */
  space(height: number): this {
    this.currentY += height;
    return this;
  }
  
  /**
   * Add table
   */
  table(
    headers: string[],
    rows: string[][],
    options: { columnWidths?: number[]; headerColor?: string } = {}
  ): this {
    const tableWidth = this.width - this.margin * 2;
    const columnCount = headers.length;
    const columnWidths = options.columnWidths ?? 
      Array(columnCount).fill(tableWidth / columnCount);
    
    // Header
    this.elements.push({
      type: 'table',
      x: this.margin,
      y: this.currentY,
      data: { headers, rows, columnWidths, headerColor: options.headerColor },
    });
    
    // Calculate table height
    const rowHeight = 25;
    this.currentY += (rows.length + 1) * rowHeight + 10;
    
    return this;
  }
  
  /**
   * Add two columns
   */
  columns(left: string, right: string, options: { fontSize?: number } = {}): this {
    const fontSize = options.fontSize ?? 12;
    
    this.elements.push({
      type: 'text',
      x: this.margin,
      y: this.currentY,
      content: left,
      fontSize,
      align: 'left',
    });
    
    this.elements.push({
      type: 'text',
      x: this.width - this.margin,
      y: this.currentY,
      content: right,
      fontSize,
      align: 'right',
    });
    
    this.currentY += fontSize + 6;
    return this;
  }
  
  /**
   * Move to position
   */
  moveTo(y: number): this {
    this.currentY = y;
    return this;
  }
  
  /**
   * Get current Y position
   */
  getY(): number {
    return this.currentY;
  }
  
  /**
   * Build PDF content
   */
  build(): string {
    // Generate simple PDF structure
    // In production, use proper PDF library like pdf-lib or jsPDF
    const lines: string[] = [
      '%PDF-1.7',
      '%âãÏÓ',
      '',
      '1 0 obj',
      '<<',
      '/Type /Catalog',
      '/Pages 2 0 R',
      '>>',
      'endobj',
      '',
      '2 0 obj',
      '<<',
      '/Type /Pages',
      `/Kids [3 0 R]`,
      '/Count 1',
      '>>',
      'endobj',
      '',
      '3 0 obj',
      '<<',
      '/Type /Page',
      '/Parent 2 0 R',
      `/MediaBox [0 0 ${this.width} ${this.height}]`,
      '/Contents 4 0 R',
      '/Resources <<',
      '/Font <<',
      '/F1 5 0 R',
      '>>',
      '>>',
      '>>',
      'endobj',
      '',
      '4 0 obj',
      '<<',
      `/Length ${this.generateContentStream().length}`,
      '>>',
      'stream',
      this.generateContentStream(),
      'endstream',
      'endobj',
      '',
      '5 0 obj',
      '<<',
      '/Type /Font',
      '/Subtype /Type1',
      '/BaseFont /Helvetica',
      '>>',
      'endobj',
      '',
      'xref',
      '0 6',
      '0000000000 65535 f',
      '0000000015 00000 n',
      '0000000068 00000 n',
      '0000000125 00000 n',
      '0000000300 00000 n',
      '0000000500 00000 n',
      '',
      'trailer',
      '<<',
      '/Size 6',
      '/Root 1 0 R',
      '>>',
      'startxref',
      '600',
      '%%EOF',
    ];
    
    return lines.join('\n');
  }
  
  /**
   * Generate content stream
   */
  private generateContentStream(): string {
    const operations: string[] = ['BT'];
    
    for (const element of this.elements) {
      if (element.type === 'text') {
        const y = this.height - element.y;
        let x = element.x;
        
        // Simple alignment calculation
        if (element.align === 'right') {
          x = this.width - this.margin;
        } else if (element.align === 'center') {
          x = this.width / 2;
        }
        
        operations.push(
          `/F1 ${element.fontSize ?? 12} Tf`,
          `${x} ${y} Td`,
          `(${this.escapePDFString(element.content ?? '')}) Tj`,
          `${-x} ${-y} Td`
        );
      }
    }
    
    operations.push('ET');
    return operations.join('\n');
  }
  
  /**
   * Escape PDF string
   */
  private escapePDFString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }
}

// =============================================================================
// PDF GENERATOR IMPLEMENTATION
// =============================================================================

/**
 * Format amount for display
 */
function formatAmount(amount: bigint, currency: Currency, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 2);
  
  return `${whole}.${fractionStr} ${currency}`;
}

/**
 * Format date
 */
function formatDate(date: Date, format: 'US' | 'EU' | 'ISO'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  switch (format) {
    case 'US':
      return `${month}/${day}/${year}`;
    case 'EU':
      return `${day}/${month}/${year}`;
    case 'ISO':
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * PDF generator implementation
 */
export class PDFGenerator implements IPDFGenerator {
  private readonly config: PDFConfig;
  
  constructor(config: Partial<PDFConfig> = {}) {
    this.config = { ...DEFAULT_PDF_CONFIG, ...config };
  }
  
  /**
   * Generate invoice PDF
   */
  async generateInvoicePDF(invoice: Invoice, config?: Partial<PDFConfig>): Promise<Uint8Array> {
    const cfg = { ...this.config, ...config };
    const doc = new PDFDocumentBuilder();
    
    // Header
    doc.heading(cfg.companyName, 1)
      .space(5);
    
    if (cfg.companyAddress) {
      doc.text(cfg.companyAddress, { fontSize: 10, color: '#666666' });
    }
    
    doc.text(cfg.companyEmail, { fontSize: 10, color: '#666666' });
    
    if (cfg.companyPhone) {
      doc.text(cfg.companyPhone, { fontSize: 10, color: '#666666' });
    }
    
    doc.space(20)
      .line()
      .space(10);
    
    // Invoice title
    doc.heading(`INVOICE #${invoice.invoiceNumber}`, 2)
      .space(15);
    
    // Invoice details
    doc.columns('Invoice Date:', formatDate(invoice.createdAt, cfg.dateFormat))
      .columns('Due Date:', formatDate(invoice.dueDate, cfg.dateFormat))
      .columns('Status:', invoice.status.toUpperCase())
      .space(20);
    
    // Bill to
    doc.text('BILL TO:', { fontWeight: 'bold', fontSize: 12 })
      .space(5)
      .text(invoice.customerName ?? invoice.customerEmail, { fontSize: 11 })
      .text(invoice.customerEmail, { fontSize: 10, color: '#666666' });
    
    if (invoice.customerAddress) {
      doc.text(invoice.customerAddress, { fontSize: 10, color: '#666666' });
    }
    
    doc.space(20)
      .line()
      .space(10);
    
    // Line items table
    const headers = ['Description', 'Qty', 'Unit Price', 'Total'];
    const rows = invoice.items.map((item: InvoiceLineItem) => [
      item.description,
      String(item.quantity),
      formatAmount(item.unitPrice, invoice.currency, cfg.currencyDecimals),
      formatAmount(item.total, invoice.currency, cfg.currencyDecimals),
    ]);
    
    doc.table(headers, rows, {
      columnWidths: [250, 50, 100, 100],
      headerColor: cfg.primaryColor,
    });
    
    doc.space(10)
      .line()
      .space(10);
    
    // Totals
    doc.columns('Subtotal:', formatAmount(invoice.subtotal, invoice.currency, cfg.currencyDecimals))
      .columns('Tax:', formatAmount(invoice.taxTotal, invoice.currency, cfg.currencyDecimals))
      .space(5)
      .columns('TOTAL:', formatAmount(invoice.total, invoice.currency, cfg.currencyDecimals));
    
    doc.space(30);
    
    // Notes
    if (invoice.notes) {
      doc.text('Notes:', { fontWeight: 'bold' })
        .text(invoice.notes, { fontSize: 10, color: '#666666' });
    }
    
    doc.space(20);
    
    // Payment link
    doc.text('Pay Online:', { fontWeight: 'bold' })
      .text(invoice.url, { fontSize: 10, color: cfg.primaryColor });
    
    // Footer
    doc.space(40);
    if (cfg.footerText) {
      doc.text(cfg.footerText, { fontSize: 10, color: '#999999', align: 'center' });
    }
    
    // Generate PDF
    const pdfContent = doc.build();
    const encoder = new TextEncoder();
    return encoder.encode(pdfContent);
  }
  
  /**
   * Generate receipt PDF
   */
  async generateReceipt(invoice: Invoice, config?: Partial<PDFConfig>): Promise<Uint8Array> {
    const cfg = { ...this.config, ...config };
    const doc = new PDFDocumentBuilder();
    
    // Header
    doc.heading(cfg.companyName, 2)
      .space(5)
      .text('PAYMENT RECEIPT', { fontSize: 16, fontWeight: 'bold' })
      .space(20);
    
    // Receipt details
    doc.columns('Receipt #:', invoice.invoiceNumber)
      .columns('Date:', formatDate(invoice.paidAt ?? new Date(), cfg.dateFormat))
      .columns('Payment Method:', 'Cryptocurrency')
      .space(20);
    
    // Customer
    doc.text('Received from:', { fontWeight: 'bold' })
      .text(invoice.customerName ?? invoice.customerEmail)
      .space(20);
    
    // Items
    doc.line()
      .space(10);
    
    for (const item of invoice.items) {
      doc.columns(
        item.description,
        formatAmount(item.total, invoice.currency, cfg.currencyDecimals)
      );
    }
    
    doc.space(10)
      .line()
      .space(10);
    
    // Total
    doc.columns('TOTAL PAID:', formatAmount(invoice.total, invoice.currency, cfg.currencyDecimals));
    
    doc.space(40);
    
    // Footer
    doc.text('Thank you for your payment!', { align: 'center', color: '#666666' });
    
    const pdfContent = doc.build();
    const encoder = new TextEncoder();
    return encoder.encode(pdfContent);
  }
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create PDF generator
 */
export function createPDFGenerator(config?: Partial<PDFConfig>): PDFGenerator {
  return new PDFGenerator(config);
}
