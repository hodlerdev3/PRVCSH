/**
 * @fileoverview PRVCSH Merchant SDK
 * @description Easy-to-use SDK for merchants to integrate PRVCSH payments.
 * 
 * @module @prvcsh/payments/sdk
 * @version 0.1.0
 * 
 * @example
 * ```typescript
 * import { PRVCSHSDK } from '@prvcsh/payments/sdk';
 * 
 * const sdk = new PRVCSHSDK({
 *   apiKey: 'pk_live_xxx',
 *   secretKey: 'sk_live_xxx',
 * });
 * 
 * // Create a payment
 * const payment = await sdk.payments.create({
 *   amount: 1000000n, // 1 USDC
 *   currency: 'USDC',
 *   description: 'Order #1234',
 * });
 * 
 * // Create an invoice
 * const invoice = await sdk.invoices.create({
 *   customerEmail: 'customer@example.com',
 *   items: [{ description: 'Product', quantity: 1, unitPrice: 1000000n }],
 * });
 * ```
 */

import type {
  Payment,
  PaymentStatus,
  Invoice,
  InvoiceStatus,
  Refund,
  RefundStatus,
  RefundReason,
  PaymentLink,
  WebhookEvent,
  WebhookEventType,
  Currency,
} from '../types';

// =============================================================================
// SDK TYPES
// =============================================================================

/**
 * SDK configuration
 */
export interface PRVCSHSDKConfig {
  /** API key (pk_live_xxx or pk_test_xxx) */
  apiKey: string;
  
  /** Secret key (sk_live_xxx or sk_test_xxx) */
  secretKey: string;
  
  /** API base URL */
  baseUrl?: string;
  
  /** API version */
  apiVersion?: string;
  
  /** Request timeout in ms */
  timeout?: number;
  
  /** Max retries */
  maxRetries?: number;
  
  /** Debug mode */
  debug?: boolean;
  
  /** Custom fetch implementation */
  fetch?: typeof fetch;
}

/**
 * Default SDK configuration
 */
export const DEFAULT_SDK_CONFIG: Partial<PRVCSHSDKConfig> = {
  baseUrl: 'https://api.privacycash.app',
  apiVersion: '2024-01-01',
  timeout: 30000,
  maxRetries: 3,
  debug: false,
};

/**
 * SDK error
 */
export class PRVCSHError extends Error {
  readonly code: string;
  readonly statusCode?: number;
  readonly details?: unknown;
  readonly requestId?: string;
  
  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: unknown,
    requestId?: string
  ) {
    super(message);
    this.name = 'PRVCSHError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
  }
}

/**
 * API response
 */
export interface APIResponse<T> {
  data: T;
  requestId: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  totalCount: number;
  requestId: string;
}

/**
 * List options
 */
export interface ListOptions {
  limit?: number;
  offset?: number;
  startingAfter?: string;
  endingBefore?: string;
}

// =============================================================================
// PAYMENT TYPES
// =============================================================================

/**
 * Create payment input
 */
export interface CreatePaymentInput {
  /** Amount in smallest unit */
  amount: bigint;
  
  /** Currency */
  currency: Currency;
  
  /** Description */
  description?: string;
  
  /** Customer email */
  customerEmail?: string;
  
  /** Order ID */
  orderId?: string;
  
  /** Success URL */
  successUrl?: string;
  
  /** Cancel URL */
  cancelUrl?: string;
  
  /** Webhook URL for this payment */
  webhookUrl?: string;
  
  /** Expires in seconds */
  expiresIn?: number;
  
  /** Metadata */
  metadata?: Record<string, string>;
}

/**
 * List payments options
 */
export interface ListPaymentsOptions extends ListOptions {
  status?: PaymentStatus;
  currency?: Currency;
  fromDate?: Date;
  toDate?: Date;
}

// =============================================================================
// INVOICE TYPES
// =============================================================================

/**
 * Invoice line item input
 */
export interface InvoiceLineItemInput {
  description: string;
  quantity: number;
  unitPrice: bigint;
  taxRate?: number;
}

/**
 * Create invoice input
 */
export interface CreateInvoiceInput {
  /** Customer email */
  customerEmail: string;
  
  /** Customer name */
  customerName?: string;
  
  /** Line items */
  items: InvoiceLineItemInput[];
  
  /** Currency */
  currency?: Currency;
  
  /** Due date */
  dueDate?: Date;
  
  /** Notes */
  notes?: string;
  
  /** Auto-send email */
  autoSend?: boolean;
  
  /** Metadata */
  metadata?: Record<string, string>;
}

/**
 * List invoices options
 */
export interface ListInvoicesOptions extends ListOptions {
  status?: InvoiceStatus;
  customerEmail?: string;
  fromDate?: Date;
  toDate?: Date;
}

// =============================================================================
// REFUND TYPES
// =============================================================================

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
  
  /** Notes */
  notes?: string;
  
  /** Metadata */
  metadata?: Record<string, string>;
}

/**
 * List refunds options
 */
export interface ListRefundsOptions extends ListOptions {
  status?: RefundStatus;
  paymentId?: string;
  fromDate?: Date;
  toDate?: Date;
}

// =============================================================================
// PAYMENT LINK TYPES
// =============================================================================

/**
 * Create payment link input
 */
export interface CreatePaymentLinkInput {
  /** Amount */
  amount: bigint;
  
  /** Currency */
  currency: Currency;
  
  /** Title */
  title: string;
  
  /** Description */
  description?: string;
  
  /** Success URL */
  successUrl?: string;
  
  /** Image URL */
  imageUrl?: string;
  
  /** Allow multiple uses */
  reusable?: boolean;
  
  /** Max uses (if reusable) */
  maxUses?: number;
  
  /** Expires at */
  expiresAt?: Date;
  
  /** Metadata */
  metadata?: Record<string, string>;
}

// =============================================================================
// WEBHOOK TYPES
// =============================================================================

/**
 * Create webhook endpoint input
 */
export interface CreateWebhookEndpointInput {
  /** URL */
  url: string;
  
  /** Events to subscribe */
  events: WebhookEventType[];
  
  /** Description */
  description?: string;
  
  /** Enabled */
  enabled?: boolean;
}

/**
 * Update webhook endpoint input
 */
export interface UpdateWebhookEndpointInput {
  /** URL */
  url?: string;
  
  /** Events */
  events?: WebhookEventType[];
  
  /** Enabled */
  enabled?: boolean;
}

// =============================================================================
// HTTP CLIENT
// =============================================================================

/**
 * HTTP request options
 */
interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  idempotencyKey?: string;
}

/**
 * HTTP client
 */
class HTTPClient {
  private readonly config: PRVCSHSDKConfig;
  private readonly fetchFn: typeof fetch;
  
  constructor(config: PRVCSHSDKConfig) {
    this.config = config;
    this.fetchFn = config.fetch ?? globalThis.fetch;
  }
  
  /**
   * Make API request
   */
  async request<T>(options: RequestOptions): Promise<APIResponse<T>> {
    const url = this.buildUrl(options.path, options.query);
    const headers = this.buildHeaders(options.idempotencyKey);
    
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= (this.config.maxRetries ?? 3); attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, {
          method: options.method,
          headers,
          body: options.body ? JSON.stringify(options.body, bigIntReplacer) : undefined,
        });
        
        const requestId = response.headers.get('x-request-id') ?? '';
        
        if (!response.ok) {
          const error = await this.parseError(response, requestId);
          
          // Don't retry 4xx errors
          if (response.status >= 400 && response.status < 500) {
            throw error;
          }
          
          lastError = error;
          continue;
        }
        
        const data = await response.json();
        return {
          data: this.reviveData(data) as T,
          requestId,
        };
      } catch (error) {
        if (error instanceof PRVCSHError && error.statusCode && error.statusCode < 500) {
          throw error;
        }
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < (this.config.maxRetries ?? 3)) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }
    
    throw lastError ?? new Error('Request failed');
  }
  
  /**
   * Build URL with query params
   */
  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.config.baseUrl);
    
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    
    return url.toString();
  }
  
  /**
   * Build request headers
   */
  private buildHeaders(idempotencyKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.secretKey}`,
      'X-API-Key': this.config.apiKey,
      'X-API-Version': this.config.apiVersion ?? '2024-01-01',
    };
    
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    
    return headers;
  }
  
  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout ?? 30000);
    
    try {
      return await this.fetchFn(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }
  
  /**
   * Parse error response
   */
  private async parseError(response: Response, requestId: string): Promise<PRVCSHError> {
    try {
      const body = await response.json();
      return new PRVCSHError(
        body.message ?? 'Unknown error',
        body.code ?? 'unknown_error',
        response.status,
        body.details,
        requestId
      );
    } catch {
      return new PRVCSHError(
        `HTTP ${response.status}`,
        'http_error',
        response.status,
        undefined,
        requestId
      );
    }
  }
  
  /**
   * Revive data (convert date strings, etc.)
   */
  private reviveData(data: unknown): unknown {
    if (data === null || data === undefined) return data;
    
    if (Array.isArray(data)) {
      return data.map((item) => this.reviveData(item));
    }
    
    if (typeof data === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          result[key] = new Date(value);
        } else if (typeof value === 'string' && /^\d+n?$/.test(value)) {
          result[key] = BigInt(value.replace('n', ''));
        } else {
          result[key] = this.reviveData(value);
        }
      }
      return result;
    }
    
    return data;
  }
  
  /**
   * Delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * BigInt replacer for JSON.stringify
 */
function bigIntReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

// =============================================================================
// RESOURCE CLASSES
// =============================================================================

/**
 * Payments resource
 */
export class PaymentsResource {
  constructor(private readonly client: HTTPClient) {}
  
  /**
   * Create a payment
   */
  async create(input: CreatePaymentInput): Promise<Payment> {
    const response = await this.client.request<Payment>({
      method: 'POST',
      path: '/v1/payments',
      body: input,
    });
    return response.data;
  }
  
  /**
   * Get a payment
   */
  async retrieve(paymentId: string): Promise<Payment> {
    const response = await this.client.request<Payment>({
      method: 'GET',
      path: `/v1/payments/${paymentId}`,
    });
    return response.data;
  }
  
  /**
   * List payments
   */
  async list(options?: ListPaymentsOptions): Promise<PaginatedResponse<Payment>> {
    const response = await this.client.request<PaginatedResponse<Payment>>({
      method: 'GET',
      path: '/v1/payments',
      query: {
        limit: options?.limit,
        offset: options?.offset,
        status: options?.status,
        currency: options?.currency,
        from_date: options?.fromDate?.toISOString(),
        to_date: options?.toDate?.toISOString(),
      },
    });
    return response.data;
  }
  
  /**
   * Cancel a payment
   */
  async cancel(paymentId: string): Promise<Payment> {
    const response = await this.client.request<Payment>({
      method: 'POST',
      path: `/v1/payments/${paymentId}/cancel`,
    });
    return response.data;
  }
  
  /**
   * Confirm a payment (for manual confirmation flow)
   */
  async confirm(paymentId: string, transactionSignature: string): Promise<Payment> {
    const response = await this.client.request<Payment>({
      method: 'POST',
      path: `/v1/payments/${paymentId}/confirm`,
      body: { transactionSignature },
    });
    return response.data;
  }
}

/**
 * Invoices resource
 */
export class InvoicesResource {
  constructor(private readonly client: HTTPClient) {}
  
  /**
   * Create an invoice
   */
  async create(input: CreateInvoiceInput): Promise<Invoice> {
    const response = await this.client.request<Invoice>({
      method: 'POST',
      path: '/v1/invoices',
      body: input,
    });
    return response.data;
  }
  
  /**
   * Get an invoice
   */
  async retrieve(invoiceId: string): Promise<Invoice> {
    const response = await this.client.request<Invoice>({
      method: 'GET',
      path: `/v1/invoices/${invoiceId}`,
    });
    return response.data;
  }
  
  /**
   * List invoices
   */
  async list(options?: ListInvoicesOptions): Promise<PaginatedResponse<Invoice>> {
    const response = await this.client.request<PaginatedResponse<Invoice>>({
      method: 'GET',
      path: '/v1/invoices',
      query: {
        limit: options?.limit,
        offset: options?.offset,
        status: options?.status,
        customer_email: options?.customerEmail,
        from_date: options?.fromDate?.toISOString(),
        to_date: options?.toDate?.toISOString(),
      },
    });
    return response.data;
  }
  
  /**
   * Send an invoice
   */
  async send(invoiceId: string): Promise<Invoice> {
    const response = await this.client.request<Invoice>({
      method: 'POST',
      path: `/v1/invoices/${invoiceId}/send`,
    });
    return response.data;
  }
  
  /**
   * Void an invoice
   */
  async void(invoiceId: string): Promise<Invoice> {
    const response = await this.client.request<Invoice>({
      method: 'POST',
      path: `/v1/invoices/${invoiceId}/void`,
    });
    return response.data;
  }
  
  /**
   * Get invoice PDF URL
   */
  async getPdfUrl(invoiceId: string): Promise<string> {
    const response = await this.client.request<{ url: string }>({
      method: 'GET',
      path: `/v1/invoices/${invoiceId}/pdf`,
    });
    return response.data.url;
  }
}

/**
 * Refunds resource
 */
export class RefundsResource {
  constructor(private readonly client: HTTPClient) {}
  
  /**
   * Create a refund
   */
  async create(input: CreateRefundInput): Promise<Refund> {
    const response = await this.client.request<Refund>({
      method: 'POST',
      path: '/v1/refunds',
      body: input,
    });
    return response.data;
  }
  
  /**
   * Get a refund
   */
  async retrieve(refundId: string): Promise<Refund> {
    const response = await this.client.request<Refund>({
      method: 'GET',
      path: `/v1/refunds/${refundId}`,
    });
    return response.data;
  }
  
  /**
   * List refunds
   */
  async list(options?: ListRefundsOptions): Promise<PaginatedResponse<Refund>> {
    const response = await this.client.request<PaginatedResponse<Refund>>({
      method: 'GET',
      path: '/v1/refunds',
      query: {
        limit: options?.limit,
        offset: options?.offset,
        status: options?.status,
        payment_id: options?.paymentId,
        from_date: options?.fromDate?.toISOString(),
        to_date: options?.toDate?.toISOString(),
      },
    });
    return response.data;
  }
}

/**
 * Payment links resource
 */
export class PaymentLinksResource {
  constructor(private readonly client: HTTPClient) {}
  
  /**
   * Create a payment link
   */
  async create(input: CreatePaymentLinkInput): Promise<PaymentLink> {
    const response = await this.client.request<PaymentLink>({
      method: 'POST',
      path: '/v1/payment-links',
      body: input,
    });
    return response.data;
  }
  
  /**
   * Get a payment link
   */
  async retrieve(linkId: string): Promise<PaymentLink> {
    const response = await this.client.request<PaymentLink>({
      method: 'GET',
      path: `/v1/payment-links/${linkId}`,
    });
    return response.data;
  }
  
  /**
   * List payment links
   */
  async list(options?: ListOptions): Promise<PaginatedResponse<PaymentLink>> {
    const response = await this.client.request<PaginatedResponse<PaymentLink>>({
      method: 'GET',
      path: '/v1/payment-links',
      query: {
        limit: options?.limit,
        offset: options?.offset,
      },
    });
    return response.data;
  }
  
  /**
   * Deactivate a payment link
   */
  async deactivate(linkId: string): Promise<PaymentLink> {
    const response = await this.client.request<PaymentLink>({
      method: 'POST',
      path: `/v1/payment-links/${linkId}/deactivate`,
    });
    return response.data;
  }
}

/**
 * Webhooks resource
 */
export class WebhooksResource {
  private readonly webhookSecret?: string;
  
  constructor(
    private readonly client: HTTPClient,
    webhookSecret?: string
  ) {
    this.webhookSecret = webhookSecret;
  }
  
  /**
   * Create a webhook endpoint
   */
  async create(input: CreateWebhookEndpointInput): Promise<WebhookEndpointResponse> {
    const response = await this.client.request<WebhookEndpointResponse>({
      method: 'POST',
      path: '/v1/webhooks/endpoints',
      body: input,
    });
    return response.data;
  }
  
  /**
   * Get a webhook endpoint
   */
  async retrieve(endpointId: string): Promise<WebhookEndpointResponse> {
    const response = await this.client.request<WebhookEndpointResponse>({
      method: 'GET',
      path: `/v1/webhooks/endpoints/${endpointId}`,
    });
    return response.data;
  }
  
  /**
   * List webhook endpoints
   */
  async list(): Promise<PaginatedResponse<WebhookEndpointResponse>> {
    const response = await this.client.request<PaginatedResponse<WebhookEndpointResponse>>({
      method: 'GET',
      path: '/v1/webhooks/endpoints',
    });
    return response.data;
  }
  
  /**
   * Update a webhook endpoint
   */
  async update(endpointId: string, input: UpdateWebhookEndpointInput): Promise<WebhookEndpointResponse> {
    const response = await this.client.request<WebhookEndpointResponse>({
      method: 'PATCH',
      path: `/v1/webhooks/endpoints/${endpointId}`,
      body: input,
    });
    return response.data;
  }
  
  /**
   * Delete a webhook endpoint
   */
  async delete(endpointId: string): Promise<void> {
    await this.client.request<void>({
      method: 'DELETE',
      path: `/v1/webhooks/endpoints/${endpointId}`,
    });
  }
  
  /**
   * Construct webhook event from payload
   */
  constructEvent(payload: string, signature: string, secret?: string): WebhookEvent {
    const webhookSecret = secret ?? this.webhookSecret;
    if (!webhookSecret) {
      throw new PRVCSHError(
        'Webhook secret not configured',
        'webhook_secret_missing'
      );
    }
    
    // Parse signature header
    const signatureParts = parseSignatureHeader(signature);
    if (!signatureParts) {
      throw new PRVCSHError(
        'Invalid signature header format',
        'invalid_signature'
      );
    }
    
    // Verify timestamp (within 5 minutes)
    const timestamp = signatureParts.timestamp;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      throw new PRVCSHError(
        'Webhook timestamp too old',
        'webhook_timestamp_expired'
      );
    }
    
    // Verify signature
    const expectedSignature = computeSignature(payload, timestamp, webhookSecret);
    if (!secureCompare(expectedSignature, signatureParts.signature)) {
      throw new PRVCSHError(
        'Webhook signature verification failed',
        'invalid_signature'
      );
    }
    
    // Parse event
    try {
      return JSON.parse(payload) as WebhookEvent;
    } catch {
      throw new PRVCSHError(
        'Invalid webhook payload',
        'invalid_payload'
      );
    }
  }
}

/**
 * Webhook endpoint response
 */
export interface WebhookEndpointResponse {
  id: string;
  url: string;
  events: WebhookEventType[];
  enabled: boolean;
  secret: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Parse signature header
 */
function parseSignatureHeader(header: string): { timestamp: number; signature: string } | null {
  const parts = header.split(',');
  let timestamp: number | undefined;
  let signature: string | undefined;
  
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') {
      timestamp = parseInt(value, 10);
    } else if (key === 'v1') {
      signature = value;
    }
  }
  
  if (timestamp === undefined || !signature) {
    return null;
  }
  
  return { timestamp, signature };
}

/**
 * Compute webhook signature
 */
function computeSignature(payload: string, timestamp: number, secret: string): string {
  const signedPayload = `${timestamp}.${payload}`;
  
  // Use Web Crypto API
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(signedPayload);
  
  // Simple HMAC simulation (in real implementation, use crypto.subtle)
  // This is a placeholder - actual implementation would use proper HMAC
  let hash = 0;
  for (let i = 0; i < messageData.length; i++) {
    hash = ((hash << 5) - hash + messageData[i] + keyData[i % keyData.length]) | 0;
  }
  
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Secure string comparison
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// =============================================================================
// MAIN SDK CLASS
// =============================================================================

/**
 * PRVCSH SDK
 */
export class PRVCSHSDK {
  /** Payments resource */
  readonly payments: PaymentsResource;
  
  /** Invoices resource */
  readonly invoices: InvoicesResource;
  
  /** Refunds resource */
  readonly refunds: RefundsResource;
  
  /** Payment links resource */
  readonly paymentLinks: PaymentLinksResource;
  
  /** Webhooks resource */
  readonly webhooks: WebhooksResource;
  
  /** SDK configuration */
  private readonly config: PRVCSHSDKConfig;
  
  /** HTTP client */
  private readonly client: HTTPClient;
  
  constructor(config: PRVCSHSDKConfig) {
    this.config = { ...DEFAULT_SDK_CONFIG, ...config };
    
    // Validate API keys
    if (!config.apiKey.startsWith('pk_')) {
      throw new PRVCSHError(
        'Invalid API key format. Must start with pk_',
        'invalid_api_key'
      );
    }
    
    if (!config.secretKey.startsWith('sk_')) {
      throw new PRVCSHError(
        'Invalid secret key format. Must start with sk_',
        'invalid_secret_key'
      );
    }
    
    // Check key mode consistency
    const isTestAPIKey = config.apiKey.startsWith('pk_test_');
    const isTestSecretKey = config.secretKey.startsWith('sk_test_');
    
    if (isTestAPIKey !== isTestSecretKey) {
      throw new PRVCSHError(
        'API key and secret key must be from the same mode (test or live)',
        'key_mode_mismatch'
      );
    }
    
    this.client = new HTTPClient(this.config);
    
    // Initialize resources
    this.payments = new PaymentsResource(this.client);
    this.invoices = new InvoicesResource(this.client);
    this.refunds = new RefundsResource(this.client);
    this.paymentLinks = new PaymentLinksResource(this.client);
    this.webhooks = new WebhooksResource(this.client);
  }
  
  /**
   * Check if using test mode
   */
  get isTestMode(): boolean {
    return this.config.apiKey.startsWith('pk_test_');
  }
  
  /**
   * Get API version
   */
  get apiVersion(): string {
    return this.config.apiVersion ?? '2024-01-01';
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

/**
 * Create SDK instance
 */
export function createPRVCSHSDK(config: PRVCSHSDKConfig): PRVCSHSDK {
  return new PRVCSHSDK(config);
}

/**
 * Re-export error class
 */
export { PRVCSHError as SDKError };
