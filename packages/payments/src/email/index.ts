/**
 * @fileoverview Email Service for Invoices
 * @description Send invoice emails to customers.
 * 
 * @module @prvcsh/payments/email
 * @version 0.1.0
 */

import type { Invoice, Merchant, Currency } from '../types';

// =============================================================================
// EMAIL SERVICE INTERFACE
// =============================================================================

/**
 * Email service interface
 */
export interface IEmailService {
  sendInvoice(invoice: Invoice, merchant: Merchant, options?: SendInvoiceOptions): Promise<EmailResult>;
  sendReceipt(invoice: Invoice, merchant: Merchant): Promise<EmailResult>;
  sendReminder(invoice: Invoice, merchant: Merchant, reminderNumber: number): Promise<EmailResult>;
  sendPaymentConfirmation(invoice: Invoice, merchant: Merchant): Promise<EmailResult>;
}

/**
 * Send invoice options
 */
export interface SendInvoiceOptions {
  /** Include PDF attachment */
  includePDF?: boolean;
  
  /** Custom message */
  customMessage?: string;
  
  /** CC addresses */
  cc?: string[];
  
  /** BCC addresses */
  bcc?: string[];
}

/**
 * Email result
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  sentAt?: Date;
}

/**
 * Email template type
 */
export type EmailTemplateType = 
  | 'invoice'
  | 'receipt'
  | 'reminder'
  | 'payment_confirmation'
  | 'refund';

/**
 * Email service configuration
 */
export interface EmailServiceConfig {
  /** From address */
  fromAddress: string;
  
  /** From name */
  fromName: string;
  
  /** Reply-to address */
  replyTo?: string;
  
  /** Company name for templates */
  companyName: string;
  
  /** Company logo URL */
  companyLogo?: string;
  
  /** Primary color */
  primaryColor: string;
  
  /** Base URL for links */
  baseUrl: string;
  
  /** Enable tracking */
  enableTracking: boolean;
}

/**
 * Default email configuration
 */
export const DEFAULT_EMAIL_CONFIG: EmailServiceConfig = {
  fromAddress: 'invoices@privacycash.app',
  fromName: 'PRVCSH',
  companyName: 'PRVCSH',
  primaryColor: '#6366f1',
  baseUrl: 'https://pay.privacycash.app',
  enableTracking: false,
};

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

/**
 * Format currency amount
 */
function formatAmount(amount: bigint, currency: Currency, decimals: number = 6): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 2);
  return `${whole}.${fractionStr} ${currency}`;
}

/**
 * Format date
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate invoice email HTML
 */
function generateInvoiceEmailHTML(
  invoice: Invoice,
  merchant: Merchant,
  config: EmailServiceConfig,
  customMessage?: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: bold; color: ${config.primaryColor}; }
    .invoice-title { font-size: 18px; color: #666; margin-top: 8px; }
    .details { margin: 24px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .details-label { color: #666; }
    .details-value { font-weight: 500; }
    .items { margin: 24px 0; }
    .item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
    .item-desc { flex: 1; }
    .item-amount { font-weight: 500; }
    .total { display: flex; justify-content: space-between; padding: 16px 0; font-size: 18px; font-weight: bold; border-top: 2px solid #333; }
    .cta { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: ${config.primaryColor}; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 500; }
    .btn:hover { opacity: 0.9; }
    .message { background: #f8f9fa; padding: 16px; border-radius: 6px; margin: 24px 0; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">${merchant.name}</div>
        <div class="invoice-title">Invoice #${invoice.invoiceNumber}</div>
      </div>
      
      ${customMessage ? `<div class="message">${customMessage}</div>` : ''}
      
      <div class="details">
        <div class="details-row">
          <span class="details-label">Invoice Date</span>
          <span class="details-value">${formatDate(invoice.createdAt)}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Due Date</span>
          <span class="details-value">${formatDate(invoice.dueDate)}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Billed To</span>
          <span class="details-value">${invoice.customerName ?? invoice.customerEmail}</span>
        </div>
      </div>
      
      <div class="items">
        ${invoice.items.map(item => `
          <div class="item">
            <div class="item-desc">
              ${item.description}
              <span style="color: #666; font-size: 14px;"> × ${item.quantity}</span>
            </div>
            <div class="item-amount">${formatAmount(item.total, invoice.currency)}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="total">
        <span>Total Due</span>
        <span>${formatAmount(invoice.total, invoice.currency)}</span>
      </div>
      
      <div class="cta">
        <a href="${invoice.url}" class="btn">Pay Invoice</a>
      </div>
      
      <div class="footer">
        <p>If you have any questions, please contact us at ${merchant.email}</p>
        <p>Powered by PRVCSH</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Generate receipt email HTML
 */
function generateReceiptEmailHTML(
  invoice: Invoice,
  merchant: Merchant,
  config: EmailServiceConfig
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt for Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: bold; color: ${config.primaryColor}; }
    .success { font-size: 48px; margin: 16px 0; }
    .title { font-size: 18px; color: #666; }
    .details { margin: 24px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .amount { font-size: 24px; font-weight: bold; text-align: center; margin: 24px 0; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">${merchant.name}</div>
        <div class="success">✓</div>
        <div class="title">Payment Received</div>
      </div>
      
      <div class="amount">${formatAmount(invoice.total, invoice.currency)}</div>
      
      <div class="details">
        <div class="details-row">
          <span>Receipt #</span>
          <span>${invoice.invoiceNumber}</span>
        </div>
        <div class="details-row">
          <span>Date</span>
          <span>${formatDate(invoice.paidAt ?? new Date())}</span>
        </div>
        <div class="details-row">
          <span>Payment Method</span>
          <span>Cryptocurrency</span>
        </div>
      </div>
      
      <div class="footer">
        <p>Thank you for your payment!</p>
        <p>Questions? Contact ${merchant.email}</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Generate reminder email HTML
 */
function generateReminderEmailHTML(
  invoice: Invoice,
  merchant: Merchant,
  config: EmailServiceConfig,
  reminderNumber: number
): string {
  const isOverdue = invoice.dueDate < new Date();
  const urgencyClass = isOverdue ? 'color: #dc2626;' : 'color: #f59e0b;';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice Reminder - ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: bold; color: ${config.primaryColor}; }
    .alert { font-size: 18px; font-weight: bold; ${urgencyClass} margin: 16px 0; }
    .amount { font-size: 24px; font-weight: bold; text-align: center; margin: 24px 0; }
    .cta { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: ${config.primaryColor}; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 500; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">${merchant.name}</div>
        <div class="alert">${isOverdue ? '⚠️ Payment Overdue' : '📋 Payment Reminder #' + reminderNumber}</div>
      </div>
      
      <p>This is a friendly reminder that invoice #${invoice.invoiceNumber} for ${formatAmount(invoice.total, invoice.currency)} ${isOverdue ? 'was due on' : 'is due by'} ${formatDate(invoice.dueDate)}.</p>
      
      <div class="amount">${formatAmount(invoice.total, invoice.currency)}</div>
      
      <div class="cta">
        <a href="${invoice.url}" class="btn">Pay Now</a>
      </div>
      
      <div class="footer">
        <p>If you've already paid, please disregard this reminder.</p>
        <p>Questions? Contact ${merchant.email}</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

// =============================================================================
// EMAIL SERVICE IMPLEMENTATION
// =============================================================================

/**
 * Email service implementation
 */
export class EmailService implements IEmailService {
  private readonly config: EmailServiceConfig;
  private readonly sentEmails: Map<string, EmailResult> = new Map();
  
  constructor(config: Partial<EmailServiceConfig> = {}) {
    this.config = { ...DEFAULT_EMAIL_CONFIG, ...config };
  }
  
  /**
   * Send invoice email
   */
  async sendInvoice(
    invoice: Invoice,
    merchant: Merchant,
    options: SendInvoiceOptions = {}
  ): Promise<EmailResult> {
    const html = generateInvoiceEmailHTML(invoice, merchant, this.config, options.customMessage);
    
    const result = await this.send({
      to: invoice.customerEmail,
      cc: options.cc,
      bcc: options.bcc,
      subject: `Invoice #${invoice.invoiceNumber} from ${merchant.name}`,
      html,
      attachments: options.includePDF ? [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: 'PDF_PLACEHOLDER',
        }
      ] : undefined,
    });
    
    return result;
  }
  
  /**
   * Send receipt email
   */
  async sendReceipt(invoice: Invoice, merchant: Merchant): Promise<EmailResult> {
    const html = generateReceiptEmailHTML(invoice, merchant, this.config);
    
    return this.send({
      to: invoice.customerEmail,
      subject: `Receipt for Invoice #${invoice.invoiceNumber}`,
      html,
    });
  }
  
  /**
   * Send reminder email
   */
  async sendReminder(
    invoice: Invoice,
    merchant: Merchant,
    reminderNumber: number
  ): Promise<EmailResult> {
    const html = generateReminderEmailHTML(invoice, merchant, this.config, reminderNumber);
    const isOverdue = invoice.dueDate < new Date();
    
    return this.send({
      to: invoice.customerEmail,
      subject: isOverdue 
        ? `⚠️ Overdue: Invoice #${invoice.invoiceNumber}` 
        : `Reminder: Invoice #${invoice.invoiceNumber} due soon`,
      html,
    });
  }
  
  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(invoice: Invoice, merchant: Merchant): Promise<EmailResult> {
    return this.sendReceipt(invoice, merchant);
  }
  
  /**
   * Internal send method
   */
  private async send(options: {
    to: string;
    cc?: string[];
    bcc?: string[];
    subject: string;
    html: string;
    attachments?: Array<{ filename: string; content: string }>;
  }): Promise<EmailResult> {
    // In production, integrate with email provider (SendGrid, AWS SES, etc.)
    // For now, simulate sending
    
    const messageId = `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
    
    console.log(`[Email] Sending to ${options.to}: ${options.subject}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const result: EmailResult = {
      success: true,
      messageId,
      sentAt: new Date(),
    };
    
    this.sentEmails.set(messageId, result);
    
    return result;
  }
  
  /**
   * Get sent email status
   */
  getEmailStatus(messageId: string): EmailResult | undefined {
    return this.sentEmails.get(messageId);
  }
  
  /**
   * Get email statistics
   */
  getStats(): {
    total: number;
    successful: number;
    failed: number;
  } {
    const emails = Array.from(this.sentEmails.values());
    
    return {
      total: emails.length,
      successful: emails.filter(e => e.success).length,
      failed: emails.filter(e => !e.success).length,
    };
  }
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create email service
 */
export function createEmailService(config?: Partial<EmailServiceConfig>): EmailService {
  return new EmailService(config);
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
