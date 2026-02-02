/**
 * @fileoverview Webhook Management System
 * @description Handles webhook delivery, retries, and signature verification.
 * 
 * @module @prvcsh/payments/webhooks
 * @version 0.1.0
 */

import type {
  WebhookEndpoint,
  WebhookEvent,
  WebhookEventType,
  WebhookDelivery,
} from '../types';

// =============================================================================
// WEBHOOK MANAGER INTERFACE
// =============================================================================

/**
 * Webhook manager interface
 */
export interface IWebhookManager {
  // Endpoint management
  registerEndpoint(
    merchantId: string,
    input: CreateWebhookEndpointInput
  ): Promise<WebhookEndpoint>;
  getEndpoint(endpointId: string): Promise<WebhookEndpoint | undefined>;
  listEndpoints(merchantId: string): Promise<WebhookEndpoint[]>;
  updateEndpoint(
    endpointId: string,
    input: UpdateWebhookEndpointInput
  ): Promise<WebhookEndpoint>;
  deleteEndpoint(endpointId: string): Promise<void>;
  rotateSecret(endpointId: string): Promise<WebhookEndpoint>;
  
  // Event handling
  emitEvent(
    merchantId: string,
    eventType: WebhookEventType,
    payload: Record<string, unknown>
  ): Promise<WebhookEvent>;
  
  // Delivery
  getDelivery(deliveryId: string): Promise<WebhookDelivery | undefined>;
  listDeliveries(endpointId: string, options?: DeliveryQueryOptions): Promise<WebhookDelivery[]>;
  retryDelivery(deliveryId: string): Promise<WebhookDelivery>;
}

/**
 * Create webhook endpoint input
 */
export interface CreateWebhookEndpointInput {
  url: string;
  description?: string;
  events: WebhookEventType[];
  metadata?: Record<string, unknown>;
}

/**
 * Update webhook endpoint input
 */
export interface UpdateWebhookEndpointInput {
  url?: string;
  description?: string;
  events?: WebhookEventType[];
  enabled?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Delivery query options
 */
export interface DeliveryQueryOptions {
  status?: 'pending' | 'delivered' | 'retrying' | 'failed';
  eventType?: WebhookEventType;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Webhook event payloads by type
 */
export interface WebhookEventPayload {
  'payment.created': { paymentId: string; amount: string; currency: string };
  'payment.completed': { paymentId: string; amount: string; transactionSignature: string };
  'payment.failed': { paymentId: string; error: string; errorCode: string };
  'payment.cancelled': { paymentId: string; reason: string };
  'payment.refunded': { paymentId: string; refundId: string; amount: string };
  'invoice.created': { invoiceId: string; invoiceNumber: string; total: string };
  'invoice.sent': { invoiceId: string; customerEmail: string };
  'invoice.paid': { invoiceId: string; paymentId: string };
  'invoice.overdue': { invoiceId: string; daysOverdue: number };
  'invoice.cancelled': { invoiceId: string };
  'refund.created': { refundId: string; paymentId: string; amount: string };
  'refund.completed': { refundId: string; transactionSignature: string };
  'refund.failed': { refundId: string; error: string };
  'merchant.updated': { merchantId: string; changes: string[] };
  'merchant.suspended': { merchantId: string; reason: string };
  'payout.created': { payoutId: string; amount: string };
  'payout.completed': { payoutId: string; transactionSignature: string };
  'payout.failed': { payoutId: string; error: string };
}

/**
 * Webhook manager configuration
 */
export interface WebhookManagerConfig {
  /** Maximum retry attempts */
  maxRetries: number;
  
  /** Retry delays in milliseconds */
  retryDelays: number[];
  
  /** Request timeout in milliseconds */
  requestTimeout: number;
  
  /** User agent for requests */
  userAgent: string;
  
  /** Signature header name */
  signatureHeader: string;
  
  /** Event ID header name */
  eventIdHeader: string;
  
  /** Timestamp header name */
  timestampHeader: string;
}

/**
 * Default webhook manager configuration
 */
export const DEFAULT_WEBHOOK_CONFIG: WebhookManagerConfig = {
  maxRetries: 5,
  retryDelays: [
    60000,     // 1 minute
    300000,    // 5 minutes
    1800000,   // 30 minutes
    3600000,   // 1 hour
    86400000,  // 24 hours
  ],
  requestTimeout: 30000,
  userAgent: 'PRVCSH-Webhooks/1.0',
  signatureHeader: 'X-Privacy-Signature',
  eventIdHeader: 'X-Privacy-Event-Id',
  timestampHeader: 'X-Privacy-Timestamp',
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
 * Generate random hex string
 */
function generateRandomHex(length: number): string {
  const array = new Uint8Array(length / 2);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate webhook signature
 */
async function generateSignature(
  payload: string,
  secret: string,
  timestamp: number
): Promise<string> {
  const message = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `v1=${signatureHex}`;
}

/**
 * Verify webhook signature
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: number,
  tolerance: number = 300000 // 5 minutes
): Promise<boolean> {
  // Check timestamp freshness
  const now = Date.now();
  if (Math.abs(now - timestamp) > tolerance) {
    return false;
  }
  
  // Generate expected signature
  const expected = await generateSignature(payload, secret, timestamp);
  
  // Constant-time comparison
  if (signature.length !== expected.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  
  return result === 0;
}

// =============================================================================
// WEBHOOK MANAGER IMPLEMENTATION
// =============================================================================

/**
 * Webhook manager implementation
 */
export class WebhookManager implements IWebhookManager {
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private events: Map<string, WebhookEvent> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private readonly config: WebhookManagerConfig;
  private pendingRetries: Map<string, ReturnType<typeof setTimeout>> = new Map();
  
  constructor(config: Partial<WebhookManagerConfig> = {}) {
    this.config = { ...DEFAULT_WEBHOOK_CONFIG, ...config };
  }
  
  /**
   * Register a webhook endpoint
   */
  async registerEndpoint(
    merchantId: string,
    input: CreateWebhookEndpointInput
  ): Promise<WebhookEndpoint> {
    // Validate URL
    try {
      new URL(input.url);
    } catch {
      throw new Error('Invalid webhook URL');
    }
    
    if (!input.url.startsWith('https://')) {
      throw new Error('Webhook URL must use HTTPS');
    }
    
    if (!input.events || input.events.length === 0) {
      throw new Error('At least one event type is required');
    }
    
    const id = generateId('whep');
    const secret = `whsec_${generateRandomHex(32)}`;
    
    const endpoint: WebhookEndpoint = {
      id,
      merchantId,
      url: input.url,
      description: input.description,
      secret,
      events: input.events,
      isActive: true,
      enabled: true,
      metadata: input.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.endpoints.set(id, endpoint);
    
    return endpoint;
  }
  
  /**
   * Get endpoint by ID
   */
  async getEndpoint(endpointId: string): Promise<WebhookEndpoint | undefined> {
    return this.endpoints.get(endpointId);
  }
  
  /**
   * List endpoints for merchant
   */
  async listEndpoints(merchantId: string): Promise<WebhookEndpoint[]> {
    return Array.from(this.endpoints.values()).filter(
      (ep) => ep.merchantId === merchantId
    );
  }
  
  /**
   * Update endpoint
   */
  async updateEndpoint(
    endpointId: string,
    input: UpdateWebhookEndpointInput
  ): Promise<WebhookEndpoint> {
    const endpoint = this.endpoints.get(endpointId);
    
    if (!endpoint) {
      throw new Error(`Endpoint not found: ${endpointId}`);
    }
    
    if (input.url !== undefined) {
      try {
        new URL(input.url);
      } catch {
        throw new Error('Invalid webhook URL');
      }
      
      if (!input.url.startsWith('https://')) {
        throw new Error('Webhook URL must use HTTPS');
      }
      
      endpoint.url = input.url;
    }
    
    if (input.description !== undefined) {
      endpoint.description = input.description;
    }
    
    if (input.events !== undefined && input.events.length > 0) {
      endpoint.events = input.events;
    }
    
    if (input.enabled !== undefined) {
      endpoint.enabled = input.enabled;
    }
    
    if (input.metadata !== undefined) {
      endpoint.metadata = input.metadata;
    }
    
    endpoint.updatedAt = new Date();
    
    return endpoint;
  }
  
  /**
   * Delete endpoint
   */
  async deleteEndpoint(endpointId: string): Promise<void> {
    if (!this.endpoints.has(endpointId)) {
      throw new Error(`Endpoint not found: ${endpointId}`);
    }
    
    this.endpoints.delete(endpointId);
    
    // Cancel pending retries
    const retryTimer = this.pendingRetries.get(endpointId);
    if (retryTimer) {
      clearTimeout(retryTimer);
      this.pendingRetries.delete(endpointId);
    }
  }
  
  /**
   * Rotate endpoint secret
   */
  async rotateSecret(endpointId: string): Promise<WebhookEndpoint> {
    const endpoint = this.endpoints.get(endpointId);
    
    if (!endpoint) {
      throw new Error(`Endpoint not found: ${endpointId}`);
    }
    
    // Create new endpoint with rotated secret
    const updated: WebhookEndpoint = {
      ...endpoint,
      secret: `whsec_${generateRandomHex(32)}`,
      updatedAt: new Date(),
    };
    
    this.endpoints.set(endpointId, updated);
    
    return updated;
  }
  
  /**
   * Emit webhook event
   */
  async emitEvent(
    merchantId: string,
    eventType: WebhookEventType,
    payload: Record<string, unknown>
  ): Promise<WebhookEvent> {
    const id = generateId('evt');
    
    // Create the event with all required fields
    const dummyData = {
      id: 'dummy',
      merchantId,
      status: 'pending' as const,
      method: 'api' as const,
      amount: 0n,
      currency: 'SOL' as const,
      isPrivate: false,
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const event: WebhookEvent = {
      id,
      type: eventType,
      merchantId,
      apiVersion: '2024-01-01',
      createdAt: new Date(),
      data: { ...dummyData, ...payload } as any,
    };
    
    this.events.set(id, event);
    
    // Find matching endpoints
    const endpoints = await this.listEndpoints(merchantId);
    const matchingEndpoints = endpoints.filter(
      (ep) => ep.enabled && ep.events.includes(eventType)
    );
    
    // Deliver to each endpoint
    for (const endpoint of matchingEndpoints) {
      await this.deliverEvent(event, endpoint);
    }
    
    return event;
  }
  
  /**
   * Deliver event to endpoint
   */
  private async deliverEvent(
    event: WebhookEvent,
    endpoint: WebhookEndpoint
  ): Promise<WebhookDelivery> {
    const deliveryId = generateId('del');
    const timestamp = Date.now();
    const payload = JSON.stringify(event, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
    
    // Generate signature
    const signature = await generateSignature(payload, endpoint.secret, timestamp);
    
    const delivery: WebhookDelivery = {
      id: deliveryId,
      eventId: event.id,
      endpointId: endpoint.id,
      url: endpoint.url,
      status: 'pending',
      attempts: 0,
      requestBody: payload,
      createdAt: new Date(),
    };
    
    this.deliveries.set(deliveryId, delivery);
    
    // Attempt delivery
    await this.attemptDelivery(delivery, signature, timestamp);
    
    return delivery;
  }
  
  /**
   * Attempt webhook delivery
   */
  private async attemptDelivery(
    delivery: WebhookDelivery,
    signature: string,
    timestamp: number
  ): Promise<void> {
    delivery.attempts++;
    delivery.lastAttemptAt = new Date();
    
    const endpoint = this.endpoints.get(delivery.endpointId);
    if (!endpoint) {
      delivery.status = 'failed';
      delivery.lastError = 'Endpoint no longer exists';
      return;
    }
    
    try {
      // In production, make actual HTTP request
      // For now, simulate delivery
      const success = await this.simulateDelivery(delivery);
      
      if (success) {
        delivery.status = 'delivered';
        delivery.responseCode = 200;
        delivery.responseBody = '{"received": true}';
      } else {
        throw new Error('Delivery failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      delivery.lastError = errorMessage;
      
      if (delivery.attempts >= this.config.maxRetries) {
        delivery.status = 'failed';
      } else {
        delivery.status = 'retrying';
        
        // Schedule retry
        const delay = this.config.retryDelays[delivery.attempts - 1] || 60000;
        delivery.nextRetryAt = new Date(Date.now() + delay);
        
        const retryTimer = setTimeout(async () => {
          const newTimestamp = Date.now();
          const newSignature = await generateSignature(
            delivery.requestBody,
            endpoint.secret,
            newTimestamp
          );
          await this.attemptDelivery(delivery, newSignature, newTimestamp);
        }, delay);
        
        this.pendingRetries.set(delivery.id, retryTimer);
      }
    }
  }
  
  /**
   * Simulate webhook delivery (for development)
   */
  private async simulateDelivery(
    delivery: WebhookDelivery
  ): Promise<boolean> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    // Simulate 95% success rate
    const success = Math.random() > 0.05;
    
    if (success) {
      console.log(`[Webhook] Delivered ${delivery.id} to ${delivery.url}`);
    } else {
      console.log(`[Webhook] Failed to deliver ${delivery.id} to ${delivery.url}`);
    }
    
    return success;
  }
  
  /**
   * Get delivery by ID
   */
  async getDelivery(deliveryId: string): Promise<WebhookDelivery | undefined> {
    return this.deliveries.get(deliveryId);
  }
  
  /**
   * List deliveries for endpoint
   */
  async listDeliveries(
    endpointId: string,
    options: DeliveryQueryOptions = {}
  ): Promise<WebhookDelivery[]> {
    let deliveries = Array.from(this.deliveries.values()).filter(
      (d) => d.endpointId === endpointId
    );
    
    if (options.status) {
      deliveries = deliveries.filter((d) => d.status === options.status);
    }
    
    if (options.fromDate) {
      deliveries = deliveries.filter((d) => d.createdAt >= options.fromDate!);
    }
    
    if (options.toDate) {
      deliveries = deliveries.filter((d) => d.createdAt <= options.toDate!);
    }
    
    // Sort by creation date descending
    deliveries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Paginate
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    
    return deliveries.slice(offset, offset + limit);
  }
  
  /**
   * Retry failed delivery
   */
  async retryDelivery(deliveryId: string): Promise<WebhookDelivery> {
    const delivery = this.deliveries.get(deliveryId);
    
    if (!delivery) {
      throw new Error(`Delivery not found: ${deliveryId}`);
    }
    
    if (delivery.status !== 'failed') {
      throw new Error(`Cannot retry delivery with status: ${delivery.status}`);
    }
    
    const endpoint = this.endpoints.get(delivery.endpointId);
    if (!endpoint) {
      throw new Error('Endpoint no longer exists');
    }
    
    // Reset status and retry
    delivery.status = 'pending';
    delivery.attempts = 0;
    
    const timestamp = Date.now();
    const signature = await generateSignature(
      delivery.requestBody,
      endpoint.secret,
      timestamp
    );
    
    await this.attemptDelivery(delivery, signature, timestamp);
    
    return delivery;
  }
  
  /**
   * Get webhook stats for endpoint
   */
  getEndpointStats(endpointId: string): {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    successRate: number;
  } {
    const deliveries = Array.from(this.deliveries.values()).filter(
      (d) => d.endpointId === endpointId
    );
    
    const delivered = deliveries.filter((d) => d.status === 'delivered').length;
    const failed = deliveries.filter((d) => d.status === 'failed').length;
    const pending = deliveries.filter(
      (d) => d.status === 'pending' || d.status === 'retrying'
    ).length;
    const total = deliveries.length;
    
    return {
      total,
      delivered,
      failed,
      pending,
      successRate: total > 0 ? (delivered / total) * 100 : 100,
    };
  }
  
  /**
   * Clean up old deliveries
   */
  cleanupOldDeliveries(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
    const cutoff = new Date(Date.now() - maxAge);
    let count = 0;
    
    for (const [id, delivery] of this.deliveries) {
      if (
        delivery.createdAt < cutoff &&
        (delivery.status === 'delivered' || delivery.status === 'failed')
      ) {
        this.deliveries.delete(id);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Shutdown manager
   */
  shutdown(): void {
    // Cancel all pending retries
    for (const timer of this.pendingRetries.values()) {
      clearTimeout(timer);
    }
    this.pendingRetries.clear();
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create webhook manager
 */
export function createWebhookManager(
  config?: Partial<WebhookManagerConfig>
): WebhookManager {
  return new WebhookManager(config);
}

/**
 * Parse webhook signature header
 */
export function parseWebhookSignature(
  signatureHeader: string
): { version: string; signature: string } | null {
  const match = signatureHeader.match(/^(v\d+)=([a-f0-9]+)$/);
  
  if (!match) {
    return null;
  }
  
  return {
    version: match[1]!,
    signature: match[2]!,
  };
}

/**
 * Construct webhook event from request
 */
export async function constructWebhookEvent(
  payload: string,
  signatureHeader: string,
  timestampHeader: string,
  secret: string
): Promise<WebhookEvent> {
  const timestamp = parseInt(timestampHeader, 10);
  
  if (isNaN(timestamp)) {
    throw new Error('Invalid timestamp');
  }
  
  const isValid = await verifyWebhookSignature(
    payload,
    signatureHeader,
    secret,
    timestamp
  );
  
  if (!isValid) {
    throw new Error('Invalid signature');
  }
  
  const event = JSON.parse(payload) as WebhookEvent;
  return event;
}

/**
 * All webhook event types
 */
export const ALL_WEBHOOK_EVENTS: WebhookEventType[] = [
  'payment.created',
  'payment.completed',
  'payment.failed',
  'payment.cancelled',
  'payment.refunded',
  'invoice.created',
  'invoice.sent',
  'invoice.paid',
  'invoice.overdue',
  'invoice.cancelled',
  'refund.created',
  'refund.completed',
  'refund.failed',
  'merchant.updated',
  'merchant.suspended',
  'payout.created',
  'payout.completed',
  'payout.failed',
];
