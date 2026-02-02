/**
 * @fileoverview Webhook Delivery Queue
 * @description Reliable webhook delivery with persistence and retry.
 * 
 * @module @prvcsh/payments/queue
 * @version 0.1.0
 */

import type {
  WebhookEventType,
  WebhookDeliveryStatus,
  WebhookEvent,
} from '../types';

// =============================================================================
// QUEUE TYPES
// =============================================================================

/**
 * Queue item status
 */
export type QueueItemStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'dead';

/**
 * Queue item
 */
export interface QueueItem {
  /** Item ID */
  id: string;
  
  /** Webhook endpoint ID */
  endpointId: string;
  
  /** Merchant ID */
  merchantId: string;
  
  /** Event type */
  eventType: WebhookEventType;
  
  /** Event payload */
  payload: unknown;
  
  /** Item status */
  status: QueueItemStatus;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Scheduled delivery time */
  scheduledAt: Date;
  
  /** Number of attempts */
  attempts: number;
  
  /** Last attempt timestamp */
  lastAttemptAt?: Date;
  
  /** Last error message */
  lastError?: string;
  
  /** Next retry timestamp */
  nextRetryAt?: Date;
  
  /** Delivery result */
  result?: DeliveryResult;
}

/**
 * Delivery result
 */
export interface DeliveryResult {
  /** Success status */
  success: boolean;
  
  /** HTTP status code */
  statusCode?: number;
  
  /** Response body */
  responseBody?: string;
  
  /** Response time in ms */
  responseTimeMs: number;
  
  /** Error message */
  error?: string;
  
  /** Timestamp */
  timestamp: Date;
}

/**
 * Queue configuration
 */
export interface QueueConfig {
  /** Maximum concurrent deliveries */
  concurrency: number;
  
  /** Maximum retry attempts */
  maxRetries: number;
  
  /** Base retry delay in ms */
  baseRetryDelay: number;
  
  /** Maximum retry delay in ms */
  maxRetryDelay: number;
  
  /** Retry backoff multiplier */
  backoffMultiplier: number;
  
  /** Dead letter threshold */
  deadLetterThreshold: number;
  
  /** Processing timeout in ms */
  processingTimeout: number;
  
  /** Queue size limit */
  maxQueueSize: number;
  
  /** Poll interval in ms */
  pollInterval: number;
  
  /** Persistence enabled */
  persistenceEnabled: boolean;
}

/**
 * Default queue configuration
 */
export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  concurrency: 10,
  maxRetries: 5,
  baseRetryDelay: 1000,
  maxRetryDelay: 60 * 60 * 1000, // 1 hour
  backoffMultiplier: 2,
  deadLetterThreshold: 10,
  processingTimeout: 30000,
  maxQueueSize: 100000,
  pollInterval: 1000,
  persistenceEnabled: false,
};

/**
 * Queue statistics
 */
export interface QueueStats {
  /** Total items in queue */
  totalItems: number;
  
  /** Pending items */
  pending: number;
  
  /** Processing items */
  processing: number;
  
  /** Completed items */
  completed: number;
  
  /** Failed items */
  failed: number;
  
  /** Dead items */
  dead: number;
  
  /** Average delivery time */
  avgDeliveryTime: number;
  
  /** Success rate */
  successRate: number;
  
  /** Items processed per minute */
  throughput: number;
}

/**
 * Delivery handler type
 */
export type DeliveryHandler = (item: QueueItem) => Promise<DeliveryResult>;

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
 * Calculate retry delay
 */
function calculateRetryDelay(
  attempt: number,
  baseDelay: number,
  multiplier: number,
  maxDelay: number
): number {
  const delay = baseDelay * Math.pow(multiplier, attempt - 1);
  // Add jitter
  const jitter = delay * 0.2 * Math.random();
  return Math.min(delay + jitter, maxDelay);
}

// =============================================================================
// DELIVERY QUEUE
// =============================================================================

/**
 * Webhook delivery queue
 */
export class DeliveryQueue {
  private readonly config: QueueConfig;
  private items: Map<string, QueueItem> = new Map();
  private processing: Set<string> = new Set();
  private deliveryHandler?: DeliveryHandler;
  private pollTimer?: ReturnType<typeof setInterval>;
  private isRunning: boolean = false;
  private deliveryTimes: number[] = [];
  private successCount: number = 0;
  private failureCount: number = 0;
  private startTime: number = Date.now();
  
  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
  }
  
  /**
   * Set delivery handler
   */
  setDeliveryHandler(handler: DeliveryHandler): void {
    this.deliveryHandler = handler;
  }
  
  /**
   * Start processing
   */
  start(): void {
    if (this.isRunning) return;
    
    if (!this.deliveryHandler) {
      throw new Error('Delivery handler not set');
    }
    
    this.isRunning = true;
    this.startTime = Date.now();
    
    this.pollTimer = setInterval(() => {
      this.processQueue();
    }, this.config.pollInterval);
  }
  
  /**
   * Stop processing
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }
  
  /**
   * Enqueue item
   */
  enqueue(
    endpointId: string,
    merchantId: string,
    eventType: WebhookEventType,
    payload: unknown
  ): QueueItem {
    if (this.items.size >= this.config.maxQueueSize) {
      throw new Error('Queue is full');
    }
    
    const now = new Date();
    const item: QueueItem = {
      id: generateId('qi'),
      endpointId,
      merchantId,
      eventType,
      payload,
      status: 'pending',
      createdAt: now,
      scheduledAt: now,
      attempts: 0,
    };
    
    this.items.set(item.id, item);
    return item;
  }
  
  /**
   * Get item by ID
   */
  getItem(id: string): QueueItem | undefined {
    return this.items.get(id);
  }
  
  /**
   * Get items by status
   */
  getItemsByStatus(status: QueueItemStatus): QueueItem[] {
    return Array.from(this.items.values()).filter((item) => item.status === status);
  }
  
  /**
   * Get items by merchant
   */
  getItemsByMerchant(merchantId: string): QueueItem[] {
    return Array.from(this.items.values()).filter((item) => item.merchantId === merchantId);
  }
  
  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    if (!this.isRunning) return;
    
    const now = new Date();
    
    // Get pending items that are due
    const pendingItems = Array.from(this.items.values())
      .filter((item) => 
        item.status === 'pending' &&
        item.scheduledAt <= now &&
        !this.processing.has(item.id)
      )
      .slice(0, this.config.concurrency - this.processing.size);
    
    // Process items
    for (const item of pendingItems) {
      this.processItem(item);
    }
  }
  
  /**
   * Process single item
   */
  private async processItem(item: QueueItem): Promise<void> {
    if (!this.deliveryHandler) return;
    
    this.processing.add(item.id);
    item.status = 'processing';
    item.attempts++;
    item.lastAttemptAt = new Date();
    
    const startTime = Date.now();
    
    try {
      // Set timeout
      const timeoutPromise = new Promise<DeliveryResult>((_, reject) => {
        setTimeout(() => reject(new Error('Delivery timeout')), this.config.processingTimeout);
      });
      
      // Deliver
      const result = await Promise.race([
        this.deliveryHandler(item),
        timeoutPromise,
      ]);
      
      const deliveryTime = Date.now() - startTime;
      this.deliveryTimes.push(deliveryTime);
      
      if (result.success) {
        this.handleSuccess(item, result);
      } else {
        this.handleFailure(item, result);
      }
    } catch (error) {
      const deliveryTime = Date.now() - startTime;
      this.deliveryTimes.push(deliveryTime);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.handleFailure(item, {
        success: false,
        error: errorMessage,
        responseTimeMs: deliveryTime,
        timestamp: new Date(),
      });
    } finally {
      this.processing.delete(item.id);
    }
  }
  
  /**
   * Handle successful delivery
   */
  private handleSuccess(item: QueueItem, result: DeliveryResult): void {
    item.status = 'completed';
    item.result = result;
    this.successCount++;
  }
  
  /**
   * Handle failed delivery
   */
  private handleFailure(item: QueueItem, result: DeliveryResult): void {
    item.lastError = result.error;
    item.result = result;
    this.failureCount++;
    
    if (item.attempts >= this.config.deadLetterThreshold) {
      // Move to dead letter
      item.status = 'dead';
    } else if (item.attempts >= this.config.maxRetries) {
      // Mark as failed
      item.status = 'failed';
    } else {
      // Schedule retry
      const retryDelay = calculateRetryDelay(
        item.attempts,
        this.config.baseRetryDelay,
        this.config.backoffMultiplier,
        this.config.maxRetryDelay
      );
      
      item.status = 'pending';
      item.nextRetryAt = new Date(Date.now() + retryDelay);
      item.scheduledAt = item.nextRetryAt;
    }
  }
  
  /**
   * Retry failed item
   */
  retryItem(id: string): boolean {
    const item = this.items.get(id);
    if (!item) return false;
    
    if (item.status !== 'failed' && item.status !== 'dead') {
      return false;
    }
    
    item.status = 'pending';
    item.scheduledAt = new Date();
    item.attempts = 0;
    item.nextRetryAt = undefined;
    
    return true;
  }
  
  /**
   * Remove item
   */
  removeItem(id: string): boolean {
    return this.items.delete(id);
  }
  
  /**
   * Clear completed items
   */
  clearCompleted(): number {
    let count = 0;
    for (const [id, item] of this.items) {
      if (item.status === 'completed') {
        this.items.delete(id);
        count++;
      }
    }
    return count;
  }
  
  /**
   * Clear dead items
   */
  clearDead(): number {
    let count = 0;
    for (const [id, item] of this.items) {
      if (item.status === 'dead') {
        this.items.delete(id);
        count++;
      }
    }
    return count;
  }
  
  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const items = Array.from(this.items.values());
    const pending = items.filter((i) => i.status === 'pending').length;
    const processing = items.filter((i) => i.status === 'processing').length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const failed = items.filter((i) => i.status === 'failed').length;
    const dead = items.filter((i) => i.status === 'dead').length;
    
    const avgDeliveryTime = this.deliveryTimes.length > 0
      ? this.deliveryTimes.reduce((a, b) => a + b, 0) / this.deliveryTimes.length
      : 0;
    
    const totalAttempts = this.successCount + this.failureCount;
    const successRate = totalAttempts > 0 ? this.successCount / totalAttempts : 0;
    
    const runtime = (Date.now() - this.startTime) / 60000; // minutes
    const throughput = runtime > 0 ? (this.successCount + this.failureCount) / runtime : 0;
    
    return {
      totalItems: items.length,
      pending,
      processing,
      completed,
      failed,
      dead,
      avgDeliveryTime,
      successRate,
      throughput,
    };
  }
  
  /**
   * Get queue size
   */
  get size(): number {
    return this.items.size;
  }
  
  /**
   * Check if running
   */
  get running(): boolean {
    return this.isRunning;
  }
}

// =============================================================================
// PRIORITY QUEUE
// =============================================================================

/**
 * Priority level
 */
export type PriorityLevel = 'critical' | 'high' | 'normal' | 'low';

/**
 * Priority values
 */
const PRIORITY_VALUES: Record<PriorityLevel, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

/**
 * Priority queue item
 */
export interface PriorityQueueItem extends QueueItem {
  priority: PriorityLevel;
}

/**
 * Priority delivery queue
 */
export class PriorityDeliveryQueue extends DeliveryQueue {
  private priorityItems: Map<string, PriorityQueueItem> = new Map();
  
  /**
   * Enqueue with priority
   */
  enqueueWithPriority(
    endpointId: string,
    merchantId: string,
    eventType: WebhookEventType,
    payload: unknown,
    priority: PriorityLevel = 'normal'
  ): PriorityQueueItem {
    const baseItem = super.enqueue(endpointId, merchantId, eventType, payload);
    
    const priorityItem: PriorityQueueItem = {
      ...baseItem,
      priority,
    };
    
    this.priorityItems.set(priorityItem.id, priorityItem);
    return priorityItem;
  }
  
  /**
   * Get items sorted by priority
   */
  getItemsByPriority(): PriorityQueueItem[] {
    return Array.from(this.priorityItems.values())
      .sort((a, b) => 
        PRIORITY_VALUES[b.priority] - PRIORITY_VALUES[a.priority]
      );
  }
}

// =============================================================================
// DEAD LETTER QUEUE
// =============================================================================

/**
 * Dead letter queue
 */
export class DeadLetterQueue {
  private items: Map<string, QueueItem> = new Map();
  private readonly maxSize: number;
  
  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
  }
  
  /**
   * Add item to dead letter queue
   */
  add(item: QueueItem): void {
    if (this.items.size >= this.maxSize) {
      // Remove oldest item
      const oldest = Array.from(this.items.entries())
        .sort(([, a], [, b]) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      if (oldest) {
        this.items.delete(oldest[0]);
      }
    }
    
    item.status = 'dead';
    this.items.set(item.id, item);
  }
  
  /**
   * Get item
   */
  get(id: string): QueueItem | undefined {
    return this.items.get(id);
  }
  
  /**
   * Get all items
   */
  getAll(): QueueItem[] {
    return Array.from(this.items.values());
  }
  
  /**
   * Remove item
   */
  remove(id: string): boolean {
    return this.items.delete(id);
  }
  
  /**
   * Clear all items
   */
  clear(): void {
    this.items.clear();
  }
  
  /**
   * Get size
   */
  get size(): number {
    return this.items.size;
  }
  
  /**
   * Get items by merchant
   */
  getByMerchant(merchantId: string): QueueItem[] {
    return Array.from(this.items.values())
      .filter((item) => item.merchantId === merchantId);
  }
  
  /**
   * Get items by event type
   */
  getByEventType(eventType: WebhookEventType): QueueItem[] {
    return Array.from(this.items.values())
      .filter((item) => item.eventType === eventType);
  }
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create delivery queue
 */
export function createDeliveryQueue(config?: Partial<QueueConfig>): DeliveryQueue {
  return new DeliveryQueue(config);
}

/**
 * Create priority delivery queue
 */
export function createPriorityDeliveryQueue(config?: Partial<QueueConfig>): PriorityDeliveryQueue {
  return new PriorityDeliveryQueue(config);
}

/**
 * Create dead letter queue
 */
export function createDeadLetterQueue(maxSize?: number): DeadLetterQueue {
  return new DeadLetterQueue(maxSize);
}
