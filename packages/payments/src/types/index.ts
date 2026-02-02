/**
 * @fileoverview Core type definitions for Privacy Payments
 * @description This module defines the fundamental types for payment processing,
 * merchant management, invoices, and webhooks.
 * 
 * @module @prvcsh/payments/types
 * @version 0.1.0
 */

// =============================================================================
// MERCHANT TYPES
// =============================================================================

/**
 * Merchant account status
 */
export type MerchantStatus = 
  | 'pending'     // Awaiting verification
  | 'active'      // Fully verified and active
  | 'suspended'   // Temporarily suspended
  | 'disabled';   // Permanently disabled

/**
 * Merchant tier for rate limits and features
 */
export type MerchantTier = 
  | 'starter'     // Free tier
  | 'growth'      // Small business
  | 'enterprise'  // Large business
  | 'custom';     // Custom plan

/**
 * Merchant account information
 */
export interface Merchant {
  /** Unique merchant ID */
  readonly id: string;
  
  /** Merchant name */
  readonly name: string;
  
  /** Business email */
  readonly email: string;
  
  /** Merchant status */
  status: MerchantStatus;
  
  /** Merchant tier */
  tier: MerchantTier;
  
  /** Wallet address for receiving payments */
  readonly walletAddress: string;
  
  /** Business website */
  readonly websiteUrl?: string;
  
  /** Business logo URL */
  readonly logoUrl?: string;
  
  /** Webhook URL for payment events */
  webhookUrl?: string;
  
  /** Webhook secret for verification */
  readonly webhookSecret?: string;
  
  /** Created timestamp */
  readonly createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
  
  /** Metadata */
  metadata?: Record<string, string>;
}

/**
 * API key for merchant authentication
 */
export interface APIKey {
  /** Key ID (public) */
  readonly id: string;
  
  /** Key prefix (first 8 chars of key for display) */
  readonly prefix: string;
  
  /** Full key hash (for validation) */
  readonly keyHash: string;
  
  /** Merchant ID */
  readonly merchantId: string;
  
  /** Key name/label */
  readonly name: string;
  
  /** Key permissions */
  readonly permissions: APIKeyPermission[];
  
  /** Is this a live key or test key */
  readonly isLive: boolean;
  
  /** Last used timestamp */
  lastUsedAt?: Date;
  
  /** Expiry date */
  readonly expiresAt?: Date;
  
  /** Created timestamp */
  readonly createdAt: Date;
  
  /** Is key active */
  isActive: boolean;
}

/**
 * API key permissions
 */
export type APIKeyPermission = 
  | 'payments:read'
  | 'payments:write'
  | 'invoices:read'
  | 'invoices:write'
  | 'refunds:read'
  | 'refunds:write'
  | 'webhooks:read'
  | 'webhooks:write'
  | 'merchant:read'
  | 'merchant:write';

/**
 * Create merchant input
 */
export interface CreateMerchantInput {
  /** Merchant name */
  name: string;
  
  /** Business email */
  email: string;
  
  /** Wallet address */
  walletAddress: string;
  
  /** Website URL */
  websiteUrl?: string;
  
  /** Logo URL */
  logoUrl?: string;
  
  /** Webhook URL */
  webhookUrl?: string;
  
  /** Metadata */
  metadata?: Record<string, string>;
}

/**
 * Update merchant input
 */
export interface UpdateMerchantInput {
  /** Merchant name */
  name?: string;
  
  /** Website URL */
  websiteUrl?: string;
  
  /** Logo URL */
  logoUrl?: string;
  
  /** Webhook URL */
  webhookUrl?: string;
  
  /** Metadata */
  metadata?: Record<string, string>;
}

// =============================================================================
// PAYMENT TYPES
// =============================================================================

/**
 * Payment status
 */
export type PaymentStatus = 
  | 'pending'       // Awaiting payment
  | 'processing'    // Payment being processed
  | 'completed'     // Payment successful
  | 'failed'        // Payment failed
  | 'expired'       // Payment expired
  | 'cancelled'     // Payment cancelled
  | 'refunded'      // Fully refunded
  | 'partially_refunded';  // Partially refunded

/**
 * Payment method
 */
export type PaymentMethod = 
  | 'direct'        // Direct wallet transfer
  | 'link'          // Payment link
  | 'invoice'       // Invoice payment
  | 'checkout'      // Hosted checkout
  | 'api';          // API integration

/**
 * Supported currencies
 */
export type Currency = 
  | 'SOL'
  | 'USDC'
  | 'USDT'
  | 'PRIVACY';  // Native privacy token

/**
 * Payment record
 */
export interface Payment {
  /** Unique payment ID */
  readonly id: string;
  
  /** Merchant ID */
  readonly merchantId: string;
  
  /** Payment status */
  status: PaymentStatus;
  
  /** Payment method */
  readonly method: PaymentMethod;
  
  /** Payment amount */
  readonly amount: bigint;
  
  /** Currency */
  readonly currency: Currency;
  
  /** Amount in USD (for reference) */
  readonly amountUsd?: number;
  
  /** Description */
  readonly description?: string;
  
  /** Customer email */
  readonly customerEmail?: string;
  
  /** Customer wallet address */
  readonly customerWallet?: string;
  
  /** Transaction hash (once completed) */
  txHash?: string;
  
  /** Invoice ID (if from invoice) */
  readonly invoiceId?: string;
  
  /** Payment link ID (if from link) */
  readonly paymentLinkId?: string;
  
  /** Privacy mode enabled */
  readonly isPrivate: boolean;
  
  /** Expiry timestamp */
  readonly expiresAt: Date;
  
  /** Completed timestamp */
  completedAt?: Date;
  
  /** Created timestamp */
  readonly createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
  
  /** Refund amount (if any) */
  refundedAmount?: bigint;
  
  /** Metadata */
  metadata?: Record<string, string>;
}

/**
 * Create payment input
 */
export interface CreatePaymentInput {
  /** Payment amount */
  amount: bigint;
  
  /** Currency */
  currency: Currency;
  
  /** Description */
  description?: string;
  
  /** Customer email */
  customerEmail?: string;
  
  /** Payment method */
  method?: PaymentMethod;
  
  /** Enable privacy mode */
  isPrivate?: boolean;
  
  /** Expiry time (minutes from now) */
  expiresInMinutes?: number;
  
  /** Metadata */
  metadata?: Record<string, string>;
  
  /** Redirect URL after payment */
  redirectUrl?: string;
  
  /** Cancel URL */
  cancelUrl?: string;
}

/**
 * Payment query options
 */
export interface PaymentQueryOptions {
  /** Filter by status */
  status?: PaymentStatus;
  
  /** Filter by method */
  method?: PaymentMethod;
  
  /** Filter by currency */
  currency?: Currency;
  
  /** Filter by date range */
  fromDate?: Date;
  toDate?: Date;
  
  /** Pagination */
  limit?: number;
  offset?: number;
  
  /** Sort order */
  sortBy?: 'createdAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// PAYMENT LINK TYPES
// =============================================================================

/**
 * Payment link
 */
export interface PaymentLink {
  /** Unique link ID */
  readonly id: string;
  
  /** Merchant ID */
  readonly merchantId: string;
  
  /** Short code for URL */
  readonly shortCode: string;
  
  /** Full URL */
  readonly url: string;
  
  /** Link name */
  readonly name: string;
  
  /** Description */
  readonly description?: string;
  
  /** Fixed amount (null for open amount) */
  readonly amount?: bigint;
  
  /** Currency */
  readonly currency: Currency;
  
  /** Is link active */
  isActive: boolean;
  
  /** Single use or reusable */
  readonly isSingleUse: boolean;
  
  /** Number of times used */
  usageCount: number;
  
  /** Max uses (null for unlimited) */
  readonly maxUses?: number;
  
  /** Expiry date */
  readonly expiresAt?: Date;
  
  /** Redirect URL after payment */
  readonly redirectUrl?: string;
  
  /** Created timestamp */
  readonly createdAt: Date;
  
  /** Metadata */
  metadata?: Record<string, string>;
}

/**
 * Create payment link input
 */
export interface CreatePaymentLinkInput {
  /** Link name */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Fixed amount (omit for open amount) */
  amount?: bigint;
  
  /** Currency */
  currency: Currency;
  
  /** Single use */
  isSingleUse?: boolean;
  
  /** Max uses */
  maxUses?: number;
  
  /** Expiry date */
  expiresAt?: Date;
  
  /** Redirect URL */
  redirectUrl?: string;
  
  /** Metadata */
  metadata?: Record<string, string>;
}

// =============================================================================
// INVOICE TYPES
// =============================================================================

/**
 * Invoice status
 */
export type InvoiceStatus = 
  | 'draft'       // Not sent
  | 'sent'        // Sent to customer
  | 'viewed'      // Customer viewed
  | 'paid'        // Fully paid
  | 'overdue'     // Past due date
  | 'cancelled'   // Cancelled
  | 'void';       // Voided

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  /** Line item ID */
  readonly id: string;
  
  /** Description */
  readonly description: string;
  
  /** Quantity */
  readonly quantity: number;
  
  /** Unit price */
  readonly unitPrice: bigint;
  
  /** Total (quantity * unitPrice) */
  readonly total: bigint;
  
  /** Tax rate (basis points) */
  readonly taxRateBps?: number;
  
  /** Tax amount */
  readonly taxAmount?: bigint;
}

/**
 * Invoice
 */
export interface Invoice {
  /** Unique invoice ID */
  readonly id: string;
  
  /** Invoice number (human readable) */
  readonly invoiceNumber: string;
  
  /** Merchant ID */
  readonly merchantId: string;
  
  /** Invoice status */
  status: InvoiceStatus;
  
  /** Customer email */
  readonly customerEmail: string;
  
  /** Customer name */
  readonly customerName?: string;
  
  /** Customer address */
  readonly customerAddress?: string;
  
  /** Line items */
  readonly items: InvoiceLineItem[];
  
  /** Subtotal (before tax) */
  readonly subtotal: bigint;
  
  /** Tax total */
  readonly taxTotal: bigint;
  
  /** Total amount */
  readonly total: bigint;
  
  /** Currency */
  readonly currency: Currency;
  
  /** Notes */
  readonly notes?: string;
  
  /** Due date */
  readonly dueDate: Date;
  
  /** Sent date */
  sentAt?: Date;
  
  /** Viewed date */
  viewedAt?: Date;
  
  /** Paid date */
  paidAt?: Date;
  
  /** Associated payment ID */
  paymentId?: string;
  
  /** Invoice URL */
  readonly url: string;
  
  /** PDF URL */
  readonly pdfUrl?: string;
  
  /** Created timestamp */
  readonly createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
  
  /** Metadata */
  metadata?: Record<string, string>;
}

/**
 * Create invoice input
 */
export interface CreateInvoiceInput {
  /** Customer email */
  customerEmail: string;
  
  /** Customer name */
  customerName?: string;
  
  /** Customer address */
  customerAddress?: string;
  
  /** Line items */
  items: Omit<InvoiceLineItem, 'id' | 'total' | 'taxAmount'>[];
  
  /** Currency */
  currency: Currency;
  
  /** Tax rate (basis points) */
  taxRateBps?: number;
  
  /** Notes */
  notes?: string;
  
  /** Due date */
  dueDate: Date;
  
  /** Send immediately */
  sendImmediately?: boolean;
  
  /** Metadata */
  metadata?: Record<string, string>;
}

// =============================================================================
// REFUND TYPES
// =============================================================================

/**
 * Refund status
 */
export type RefundStatus = 
  | 'pending'     // Awaiting processing
  | 'processing'  // Being processed
  | 'completed'   // Refund complete
  | 'failed'      // Refund failed
  | 'cancelled';  // Refund cancelled

/**
 * Refund reason
 */
export type RefundReason = 
  | 'requested_by_customer'
  | 'duplicate'
  | 'fraudulent'
  | 'order_cancelled'
  | 'product_not_received'
  | 'product_not_delivered'
  | 'product_unacceptable'
  | 'product_unsatisfactory'
  | 'other';

/**
 * Refund record
 */
export interface Refund {
  /** Unique refund ID */
  readonly id: string;
  
  /** Payment ID */
  readonly paymentId: string;
  
  /** Merchant ID */
  readonly merchantId: string;
  
  /** Refund number (human-readable) */
  refundNumber: string;
  
  /** Refund status */
  status: RefundStatus;
  
  /** Refund amount */
  readonly amount: bigint;
  
  /** Currency */
  readonly currency: Currency;
  
  /** Reason */
  readonly reason: RefundReason;
  
  /** Description */
  readonly description?: string;
  
  /** Notes */
  notes?: string;
  
  /** Customer wallet */
  customerWallet: string;
  
  /** Transaction signature */
  transactionSignature?: string;
  
  /** Transaction hash (alias) */
  txHash?: string;
  
  /** Processed timestamp */
  processedAt?: Date;
  
  /** Completed timestamp */
  completedAt?: Date;
  
  /** Failure reason */
  failureReason?: string;
  
  /** Created timestamp */
  readonly createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
  
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Create refund input
 */
export interface CreateRefundInput {
  /** Payment ID */
  paymentId: string;
  
  /** Refund amount (omit for full refund) */
  amount?: bigint;
  
  /** Reason */
  reason: RefundReason;
  
  /** Description */
  description?: string;
  
  /** Metadata */
  metadata?: Record<string, string>;
}

// =============================================================================
// WEBHOOK TYPES
// =============================================================================

/**
 * Webhook event types
 */
export type WebhookEventType = 
  // Payment events
  | 'payment.created'
  | 'payment.processing'
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.expired'
  | 'payment.cancelled'
  | 'payment.refunded'
  // Invoice events
  | 'invoice.created'
  | 'invoice.sent'
  | 'invoice.viewed'
  | 'invoice.paid'
  | 'invoice.overdue'
  | 'invoice.cancelled'
  // Refund events
  | 'refund.created'
  | 'refund.completed'
  | 'refund.failed'
  // Merchant events
  | 'merchant.updated'
  | 'merchant.suspended'
  // Payout events
  | 'payout.created'
  | 'payout.completed'
  | 'payout.failed';

/**
 * Webhook endpoint
 */
export interface WebhookEndpoint {
  /** Endpoint ID */
  readonly id: string;
  
  /** Merchant ID */
  readonly merchantId: string;
  
  /** Endpoint URL */
  url: string;
  
  /** Description */
  description?: string;
  
  /** Events to receive */
  events: WebhookEventType[];
  
  /** Endpoint secret */
  secret: string;
  
  /** Is active */
  isActive: boolean;
  
  /** Is enabled */
  enabled: boolean;
  
  /** Metadata */
  metadata?: Record<string, unknown>;
  
  /** Created timestamp */
  readonly createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Webhook event payload
 */
export interface WebhookEvent {
  /** Event ID */
  readonly id: string;
  
  /** Event type */
  readonly type: WebhookEventType;
  
  /** Merchant ID */
  readonly merchantId: string;
  
  /** Event data */
  readonly data: Payment | Invoice | Refund;
  
  /** Previous data (for updates) */
  readonly previousData?: Partial<Payment | Invoice | Refund>;
  
  /** Event timestamp */
  readonly createdAt: Date;
  
  /** API version */
  readonly apiVersion: string;
}

/**
 * Webhook delivery attempt
 */
export interface WebhookDelivery {
  /** Delivery ID */
  readonly id: string;
  
  /** Event ID */
  readonly eventId: string;
  
  /** Endpoint ID */
  readonly endpointId: string;
  
  /** URL */
  url: string;
  
  /** Status */
  status: WebhookDeliveryStatus;
  
  /** HTTP status code */
  statusCode?: number;
  
  /** Response code */
  responseCode?: number;
  
  /** Request body */
  requestBody: string;
  
  /** Response body */
  responseBody?: string;
  
  /** Error message */
  error?: string;
  
  /** Last error */
  lastError?: string;
  
  /** Attempt number */
  attempts: number;
  
  /** Success */
  success?: boolean;
  
  /** Created timestamp */
  readonly createdAt: Date;
  
  /** Last attempt timestamp */
  lastAttemptAt?: Date;
  
  /** Next retry timestamp */
  nextRetryAt?: Date;
  
  /** Duration (ms) */
  readonly durationMs?: number;
}

/**
 * Webhook delivery status
 */
export type WebhookDeliveryStatus = 
  | 'pending'
  | 'delivered'
  | 'retrying'
  | 'failed';

/**
 * Create webhook endpoint input
 */
export interface CreateWebhookEndpointInput {
  /** Endpoint URL */
  url: string;
  
  /** Events to receive */
  events: WebhookEventType[];
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  /** Data items */
  data: T[];
  
  /** Total count */
  total: number;
  
  /** Has more */
  hasMore: boolean;
  
  /** Next cursor */
  nextCursor?: string;
}

/**
 * API error
 */
export interface APIError {
  /** Error code */
  code: PaymentErrorCode;
  
  /** Error message */
  message: string;
  
  /** Field (for validation errors) */
  field?: string;
  
  /** Details */
  details?: Record<string, unknown>;
}

/**
 * Payment error codes
 */
export enum PaymentErrorCode {
  // Auth errors
  INVALID_API_KEY = 'INVALID_API_KEY',
  EXPIRED_API_KEY = 'EXPIRED_API_KEY',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Merchant errors
  MERCHANT_NOT_FOUND = 'MERCHANT_NOT_FOUND',
  MERCHANT_SUSPENDED = 'MERCHANT_SUSPENDED',
  MERCHANT_DISABLED = 'MERCHANT_DISABLED',
  
  // Payment errors
  PAYMENT_NOT_FOUND = 'PAYMENT_NOT_FOUND',
  PAYMENT_ALREADY_COMPLETED = 'PAYMENT_ALREADY_COMPLETED',
  PAYMENT_EXPIRED = 'PAYMENT_EXPIRED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_CURRENCY = 'INVALID_CURRENCY',
  
  // Invoice errors
  INVOICE_NOT_FOUND = 'INVOICE_NOT_FOUND',
  INVOICE_ALREADY_PAID = 'INVOICE_ALREADY_PAID',
  INVOICE_CANCELLED = 'INVOICE_CANCELLED',
  
  // Refund errors
  REFUND_NOT_FOUND = 'REFUND_NOT_FOUND',
  REFUND_EXCEEDS_PAYMENT = 'REFUND_EXCEEDS_PAYMENT',
  REFUND_ALREADY_PROCESSED = 'REFUND_ALREADY_PROCESSED',
  
  // Webhook errors
  WEBHOOK_NOT_FOUND = 'WEBHOOK_NOT_FOUND',
  WEBHOOK_DELIVERY_FAILED = 'WEBHOOK_DELIVERY_FAILED',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  
  // General errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Rate limit info
 */
export interface RateLimitInfo {
  /** Limit per window */
  limit: number;
  
  /** Remaining requests */
  remaining: number;
  
  /** Reset timestamp */
  resetAt: Date;
}

// =============================================================================
// CONFIG TYPES
// =============================================================================

/**
 * Payment API configuration
 */
export interface PaymentAPIConfig {
  /** API base URL */
  baseUrl: string;
  
  /** API version */
  apiVersion: string;
  
  /** Default currency */
  defaultCurrency: Currency;
  
  /** Default payment expiry (minutes) */
  defaultExpiryMinutes: number;
  
  /** Webhook retry attempts */
  webhookRetryAttempts: number;
  
  /** Webhook timeout (ms) */
  webhookTimeoutMs: number;
  
  /** Rate limits by tier */
  rateLimits: Record<MerchantTier, RateLimitConfig>;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Requests per minute */
  requestsPerMinute: number;
  
  /** Requests per hour */
  requestsPerHour: number;
  
  /** Requests per day */
  requestsPerDay: number;
}

// =============================================================================
// DEFAULTS
// =============================================================================

/**
 * Default rate limits by tier
 */
export const DEFAULT_RATE_LIMITS: Record<MerchantTier, RateLimitConfig> = {
  starter: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
  },
  growth: {
    requestsPerMinute: 300,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
  },
  enterprise: {
    requestsPerMinute: 1000,
    requestsPerHour: 20000,
    requestsPerDay: 200000,
  },
  custom: {
    requestsPerMinute: 10000,
    requestsPerHour: 100000,
    requestsPerDay: 1000000,
  },
};

/**
 * Default payment API configuration
 */
export const DEFAULT_PAYMENT_API_CONFIG: PaymentAPIConfig = {
  baseUrl: 'https://api.privacycash.app',
  apiVersion: '2026-02-01',
  defaultCurrency: 'USDC',
  defaultExpiryMinutes: 30,
  webhookRetryAttempts: 5,
  webhookTimeoutMs: 30000,
  rateLimits: DEFAULT_RATE_LIMITS,
};

/**
 * All API key permissions
 */
export const ALL_API_KEY_PERMISSIONS: APIKeyPermission[] = [
  'payments:read',
  'payments:write',
  'invoices:read',
  'invoices:write',
  'refunds:read',
  'refunds:write',
  'webhooks:read',
  'webhooks:write',
  'merchant:read',
  'merchant:write',
];
