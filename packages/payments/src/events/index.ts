/**
 * @fileoverview Event Bus System
 * @description Central event bus for payment events and webhook triggers.
 * 
 * @module @prvcsh/payments/events
 * @version 0.1.0
 */

import type { WebhookEventType } from '../types';

// =============================================================================
// EVENT BUS INTERFACE
// =============================================================================

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (event: PaymentEvent<T>) => void | Promise<void>;

/**
 * Payment event
 */
export interface PaymentEvent<T = unknown> {
  /** Event ID */
  id: string;
  
  /** Event type */
  type: WebhookEventType;
  
  /** Merchant ID */
  merchantId: string;
  
  /** Event payload */
  payload: T;
  
  /** Event timestamp */
  timestamp: Date;
  
  /** Correlation ID for tracing */
  correlationId?: string;
  
  /** Source of the event */
  source: string;
}

/**
 * Event bus interface
 */
export interface IEventBus {
  emit<T>(type: WebhookEventType, merchantId: string, payload: T): Promise<string>;
  on<T>(type: WebhookEventType, handler: EventHandler<T>): () => void;
  off(type: WebhookEventType, handler: EventHandler): void;
  once<T>(type: WebhookEventType, handler: EventHandler<T>): () => void;
  getEventHistory(merchantId: string, options?: EventHistoryOptions): PaymentEvent[];
}

/**
 * Event history options
 */
export interface EventHistoryOptions {
  type?: WebhookEventType;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}

/**
 * Event bus configuration
 */
export interface EventBusConfig {
  /** Maximum event history size */
  maxHistorySize: number;
  
  /** Event retention period in ms */
  retentionPeriod: number;
  
  /** Enable async handlers */
  asyncHandlers: boolean;
  
  /** Catch handler errors */
  catchErrors: boolean;
}

/**
 * Default event bus configuration
 */
export const DEFAULT_EVENT_BUS_CONFIG: EventBusConfig = {
  maxHistorySize: 10000,
  retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
  asyncHandlers: true,
  catchErrors: true,
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

// =============================================================================
// EVENT BUS IMPLEMENTATION
// =============================================================================

/**
 * Event bus implementation
 */
export class EventBus implements IEventBus {
  private handlers: Map<WebhookEventType, Set<EventHandler>> = new Map();
  private eventHistory: PaymentEvent[] = [];
  private readonly config: EventBusConfig;
  
  constructor(config: Partial<EventBusConfig> = {}) {
    this.config = { ...DEFAULT_EVENT_BUS_CONFIG, ...config };
  }
  
  /**
   * Emit an event
   */
  async emit<T>(
    type: WebhookEventType,
    merchantId: string,
    payload: T
  ): Promise<string> {
    const event: PaymentEvent<T> = {
      id: generateId('evt'),
      type,
      merchantId,
      payload,
      timestamp: new Date(),
      source: 'payments',
    };
    
    // Store in history
    this.storeEvent(event);
    
    // Get handlers for this event type
    const handlers = this.handlers.get(type) ?? new Set();
    const wildcardHandlers = this.handlers.get('*' as WebhookEventType) ?? new Set();
    const allHandlers = [...handlers, ...wildcardHandlers];
    
    // Execute handlers
    for (const handler of allHandlers) {
      try {
        if (this.config.asyncHandlers) {
          // Fire and forget
          Promise.resolve(handler(event)).catch((error) => {
            if (!this.config.catchErrors) throw error;
            console.error(`[EventBus] Handler error for ${type}:`, error);
          });
        } else {
          await handler(event);
        }
      } catch (error) {
        if (!this.config.catchErrors) throw error;
        console.error(`[EventBus] Handler error for ${type}:`, error);
      }
    }
    
    return event.id;
  }
  
  /**
   * Subscribe to an event
   */
  on<T>(type: WebhookEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    
    this.handlers.get(type)!.add(handler as EventHandler);
    
    // Return unsubscribe function
    return () => this.off(type, handler as EventHandler);
  }
  
  /**
   * Unsubscribe from an event
   */
  off(type: WebhookEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }
  
  /**
   * Subscribe to an event once
   */
  once<T>(type: WebhookEventType, handler: EventHandler<T>): () => void {
    const wrappedHandler: EventHandler<T> = (event) => {
      this.off(type, wrappedHandler as EventHandler);
      return handler(event);
    };
    
    return this.on(type, wrappedHandler);
  }
  
  /**
   * Get event history
   */
  getEventHistory(
    merchantId: string,
    options: EventHistoryOptions = {}
  ): PaymentEvent[] {
    let events = this.eventHistory.filter((e) => e.merchantId === merchantId);
    
    if (options.type) {
      events = events.filter((e) => e.type === options.type);
    }
    
    if (options.fromDate) {
      events = events.filter((e) => e.timestamp >= options.fromDate!);
    }
    
    if (options.toDate) {
      events = events.filter((e) => e.timestamp <= options.toDate!);
    }
    
    // Sort by timestamp descending
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    if (options.limit) {
      events = events.slice(0, options.limit);
    }
    
    return events;
  }
  
  /**
   * Store event in history
   */
  private storeEvent(event: PaymentEvent): void {
    this.eventHistory.push(event);
    
    // Trim history if needed
    if (this.eventHistory.length > this.config.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.config.maxHistorySize);
    }
    
    // Clean old events
    this.cleanupOldEvents();
  }
  
  /**
   * Clean up old events
   */
  private cleanupOldEvents(): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod);
    this.eventHistory = this.eventHistory.filter((e) => e.timestamp >= cutoff);
  }
  
  /**
   * Get handler count
   */
  getHandlerCount(type?: WebhookEventType): number {
    if (type) {
      return this.handlers.get(type)?.size ?? 0;
    }
    
    let total = 0;
    for (const handlers of this.handlers.values()) {
      total += handlers.size;
    }
    return total;
  }
  
  /**
   * Clear all handlers
   */
  clearHandlers(): void {
    this.handlers.clear();
  }
  
  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }
}

// =============================================================================
// WEBHOOK DISPATCHER
// =============================================================================

import { WebhookManager, type WebhookManagerConfig } from '../webhooks';

/**
 * Webhook dispatcher configuration
 */
export interface WebhookDispatcherConfig {
  /** Event bus config */
  eventBus?: Partial<EventBusConfig>;
  
  /** Webhook manager config */
  webhookManager?: Partial<WebhookManagerConfig>;
  
  /** Batch size for delivery */
  batchSize: number;
  
  /** Batch delay in ms */
  batchDelay: number;
  
  /** Enable batching */
  enableBatching: boolean;
}

/**
 * Default webhook dispatcher configuration
 */
export const DEFAULT_DISPATCHER_CONFIG: WebhookDispatcherConfig = {
  batchSize: 100,
  batchDelay: 1000,
  enableBatching: false,
};

/**
 * Webhook dispatcher
 * Connects event bus to webhook delivery
 */
export class WebhookDispatcher {
  private readonly eventBus: EventBus;
  private readonly webhookManager: WebhookManager;
  private readonly config: WebhookDispatcherConfig;
  private pendingEvents: Map<string, PaymentEvent[]> = new Map();
  private batchTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private unsubscribers: (() => void)[] = [];
  
  constructor(config: Partial<WebhookDispatcherConfig> = {}) {
    this.config = { ...DEFAULT_DISPATCHER_CONFIG, ...config };
    this.eventBus = new EventBus(config.eventBus);
    this.webhookManager = new WebhookManager(config.webhookManager);
    
    // Subscribe to all events
    this.setupEventHandlers();
  }
  
  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }
  
  /**
   * Get webhook manager
   */
  getWebhookManager(): WebhookManager {
    return this.webhookManager;
  }
  
  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    const eventTypes: WebhookEventType[] = [
      'payment.created',
      'payment.processing',
      'payment.completed',
      'payment.failed',
      'payment.expired',
      'payment.cancelled',
      'invoice.created',
      'invoice.sent',
      'invoice.viewed',
      'invoice.paid',
      'invoice.overdue',
      'refund.created',
      'refund.completed',
      'refund.failed',
    ];
    
    for (const eventType of eventTypes) {
      const unsubscribe = this.eventBus.on(eventType, (event) => {
        this.dispatchWebhook(event);
      });
      this.unsubscribers.push(unsubscribe);
    }
  }
  
  /**
   * Dispatch webhook for event
   */
  private async dispatchWebhook(event: PaymentEvent): Promise<void> {
    if (this.config.enableBatching) {
      this.addToBatch(event);
    } else {
      await this.deliverWebhook(event);
    }
  }
  
  /**
   * Add event to batch
   */
  private addToBatch(event: PaymentEvent): void {
    const merchantId = event.merchantId;
    
    if (!this.pendingEvents.has(merchantId)) {
      this.pendingEvents.set(merchantId, []);
    }
    
    this.pendingEvents.get(merchantId)!.push(event);
    
    // Check if batch is full
    if (this.pendingEvents.get(merchantId)!.length >= this.config.batchSize) {
      this.flushBatch(merchantId);
      return;
    }
    
    // Set timer if not already set
    if (!this.batchTimers.has(merchantId)) {
      const timer = setTimeout(() => {
        this.flushBatch(merchantId);
      }, this.config.batchDelay);
      
      this.batchTimers.set(merchantId, timer);
    }
  }
  
  /**
   * Flush batch for merchant
   */
  private async flushBatch(merchantId: string): Promise<void> {
    const events = this.pendingEvents.get(merchantId) ?? [];
    this.pendingEvents.delete(merchantId);
    
    const timer = this.batchTimers.get(merchantId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(merchantId);
    }
    
    for (const event of events) {
      await this.deliverWebhook(event);
    }
  }
  
  /**
   * Deliver webhook
   */
  private async deliverWebhook(event: PaymentEvent): Promise<void> {
    try {
      await this.webhookManager.emitEvent(
        event.merchantId,
        event.type,
        event.payload as Record<string, unknown>
      );
    } catch (error) {
      console.error(`[WebhookDispatcher] Failed to dispatch webhook:`, error);
    }
  }
  
  /**
   * Emit payment event
   */
  async emitPaymentCreated(merchantId: string, paymentId: string, amount: bigint, currency: string): Promise<string> {
    return this.eventBus.emit('payment.created', merchantId, {
      paymentId,
      amount: amount.toString(),
      currency,
    });
  }
  
  async emitPaymentCompleted(merchantId: string, paymentId: string, amount: bigint, txSignature: string): Promise<string> {
    return this.eventBus.emit('payment.completed', merchantId, {
      paymentId,
      amount: amount.toString(),
      transactionSignature: txSignature,
    });
  }
  
  async emitPaymentFailed(merchantId: string, paymentId: string, error: string, errorCode: string): Promise<string> {
    return this.eventBus.emit('payment.failed', merchantId, {
      paymentId,
      error,
      errorCode,
    });
  }
  
  async emitPaymentCancelled(merchantId: string, paymentId: string, reason: string): Promise<string> {
    return this.eventBus.emit('payment.cancelled', merchantId, {
      paymentId,
      reason,
    });
  }
  
  /**
   * Emit invoice events
   */
  async emitInvoiceCreated(merchantId: string, invoiceId: string, invoiceNumber: string, total: bigint): Promise<string> {
    return this.eventBus.emit('invoice.created', merchantId, {
      invoiceId,
      invoiceNumber,
      total: total.toString(),
    });
  }
  
  async emitInvoiceSent(merchantId: string, invoiceId: string, customerEmail: string): Promise<string> {
    return this.eventBus.emit('invoice.sent', merchantId, {
      invoiceId,
      customerEmail,
    });
  }
  
  async emitInvoicePaid(merchantId: string, invoiceId: string, paymentId: string): Promise<string> {
    return this.eventBus.emit('invoice.paid', merchantId, {
      invoiceId,
      paymentId,
    });
  }
  
  async emitInvoiceOverdue(merchantId: string, invoiceId: string, daysOverdue: number): Promise<string> {
    return this.eventBus.emit('invoice.overdue', merchantId, {
      invoiceId,
      daysOverdue,
    });
  }
  
  /**
   * Emit refund events
   */
  async emitRefundCreated(merchantId: string, refundId: string, paymentId: string, amount: bigint): Promise<string> {
    return this.eventBus.emit('refund.created', merchantId, {
      refundId,
      paymentId,
      amount: amount.toString(),
    });
  }
  
  async emitRefundCompleted(merchantId: string, refundId: string, txSignature: string): Promise<string> {
    return this.eventBus.emit('refund.completed', merchantId, {
      refundId,
      transactionSignature: txSignature,
    });
  }
  
  async emitRefundFailed(merchantId: string, refundId: string, error: string): Promise<string> {
    return this.eventBus.emit('refund.failed', merchantId, {
      refundId,
      error,
    });
  }
  
  /**
   * Shutdown dispatcher
   */
  shutdown(): void {
    // Unsubscribe all handlers
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.unsubscribers = [];
    
    // Clear batch timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();
    
    // Flush remaining batches
    for (const merchantId of this.pendingEvents.keys()) {
      this.flushBatch(merchantId);
    }
    
    // Shutdown webhook manager
    this.webhookManager.shutdown();
  }
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create event bus
 */
export function createEventBus(config?: Partial<EventBusConfig>): EventBus {
  return new EventBus(config);
}

/**
 * Create webhook dispatcher
 */
export function createWebhookDispatcher(config?: Partial<WebhookDispatcherConfig>): WebhookDispatcher {
  return new WebhookDispatcher(config);
}

/**
 * All payment event types
 */
export const PAYMENT_EVENT_TYPES: WebhookEventType[] = [
  'payment.created',
  'payment.processing',
  'payment.completed',
  'payment.failed',
  'payment.expired',
  'payment.cancelled',
];

/**
 * All invoice event types
 */
export const INVOICE_EVENT_TYPES: WebhookEventType[] = [
  'invoice.created',
  'invoice.sent',
  'invoice.viewed',
  'invoice.paid',
  'invoice.overdue',
];

/**
 * All refund event types
 */
export const REFUND_EVENT_TYPES: WebhookEventType[] = [
  'refund.created',
  'refund.completed',
  'refund.failed',
];
