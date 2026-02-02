/**
 * @fileoverview Refund Management System
 * @description Handles partial and full refunds for payments.
 * 
 * @module @prvcsh/payments/refunds
 * @version 0.1.0
 */

import type {
  Refund,
  RefundStatus,
  RefundReason,
  Currency,
  PaymentStatus,
} from '../types';

// =============================================================================
// REFUND TYPES
// =============================================================================

/**
 * Payment data for refund
 */
export interface PaymentForRefund {
  /** Payment ID */
  id: string;
  
  /** Merchant ID */
  merchantId: string;
  
  /** Original payment amount */
  amount: bigint;
  
  /** Payment currency */
  currency: Currency;
  
  /** Payment status */
  status: PaymentStatus;
  
  /** Transaction signature */
  transactionSignature?: string;
  
  /** Customer wallet */
  customerWallet: string;
  
  /** Merchant wallet */
  merchantWallet: string;
  
  /** Payment created date */
  createdAt: Date;
}

/**
 * Create refund input
 */
export interface CreateRefundInput {
  /** Payment ID to refund */
  paymentId: string;
  
  /** Refund amount (null for full refund) */
  amount?: bigint;
  
  /** Refund reason */
  reason: RefundReason;
  
  /** Additional notes */
  notes?: string;
  
  /** Metadata */
  metadata?: Record<string, unknown>;
  
  /** Notify customer */
  notifyCustomer?: boolean;
}

/**
 * Process refund input
 */
export interface ProcessRefundInput {
  /** Refund ID */
  refundId: string;
  
  /** Transaction signature from blockchain */
  transactionSignature: string;
}

/**
 * Refund calculation result
 */
export interface RefundCalculation {
  /** Original payment amount */
  originalAmount: bigint;
  
  /** Already refunded amount */
  alreadyRefunded: bigint;
  
  /** Requested refund amount */
  requestedAmount: bigint;
  
  /** Maximum refundable amount */
  maxRefundable: bigint;
  
  /** Is full refund */
  isFullRefund: boolean;
  
  /** Is partial refund */
  isPartialRefund: boolean;
  
  /** Remaining after this refund */
  remainingAfterRefund: bigint;
  
  /** Refund is valid */
  isValid: boolean;
  
  /** Validation error */
  error?: string;
}

/**
 * Refund query options
 */
export interface RefundQueryOptions {
  /** Filter by payment ID */
  paymentId?: string;
  
  /** Filter by merchant ID */
  merchantId?: string;
  
  /** Filter by status */
  status?: RefundStatus;
  
  /** Filter by reason */
  reason?: RefundReason;
  
  /** From date */
  fromDate?: Date;
  
  /** To date */
  toDate?: Date;
  
  /** Limit */
  limit?: number;
  
  /** Offset */
  offset?: number;
  
  /** Sort by */
  sortBy?: 'createdAt' | 'amount' | 'status';
  
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Refund statistics
 */
export interface RefundStats {
  /** Total refunds count */
  totalCount: number;
  
  /** Total refunded amount */
  totalAmount: bigint;
  
  /** Pending refunds count */
  pendingCount: number;
  
  /** Pending refunds amount */
  pendingAmount: bigint;
  
  /** Completed refunds count */
  completedCount: number;
  
  /** Completed refunds amount */
  completedAmount: bigint;
  
  /** Failed refunds count */
  failedCount: number;
  
  /** Refund rate (refunded/total payments) */
  refundRate: number;
  
  /** Average refund amount */
  averageAmount: bigint;
  
  /** Refunds by reason */
  byReason: Record<RefundReason, number>;
}

/**
 * Refund manager configuration
 */
export interface RefundManagerConfig {
  /** Allow partial refunds */
  allowPartialRefunds: boolean;
  
  /** Refund window in days (0 = no limit) */
  refundWindowDays: number;
  
  /** Maximum refund percentage (100 = full refund) */
  maxRefundPercentage: number;
  
  /** Require reason for refund */
  requireReason: boolean;
  
  /** Auto-approve refunds under amount */
  autoApproveUnderAmount?: bigint;
  
  /** Minimum refund amount */
  minimumRefundAmount?: bigint;
  
  /** Maximum refunds per payment */
  maxRefundsPerPayment: number;
}

/**
 * Default refund manager configuration
 */
export const DEFAULT_REFUND_CONFIG: RefundManagerConfig = {
  allowPartialRefunds: true,
  refundWindowDays: 30,
  maxRefundPercentage: 100,
  requireReason: true,
  maxRefundsPerPayment: 10,
};

/**
 * Refund manager interface
 */
export interface IRefundManager {
  createRefund(input: CreateRefundInput): Promise<Refund>;
  processRefund(input: ProcessRefundInput): Promise<Refund>;
  cancelRefund(refundId: string, reason: string): Promise<Refund>;
  getRefund(refundId: string): Promise<Refund | null>;
  getRefunds(options?: RefundQueryOptions): Promise<Refund[]>;
  getRefundsByPayment(paymentId: string): Promise<Refund[]>;
  calculateRefund(paymentId: string, amount?: bigint): Promise<RefundCalculation>;
  getStats(merchantId: string, fromDate?: Date, toDate?: Date): Promise<RefundStats>;
}

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
 * Generate refund number
 */
function generateRefundNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `REF-${year}${month}-${random}`;
}

/**
 * Validate refund reason
 */
function isValidReason(reason: string): reason is RefundReason {
  const validReasons: RefundReason[] = [
    'requested_by_customer',
    'duplicate',
    'fraudulent',
    'order_cancelled',
    'product_not_received',
    'product_not_delivered',
    'product_unacceptable',
    'product_unsatisfactory',
    'other',
  ];
  return validReasons.includes(reason as RefundReason);
}

// =============================================================================
// REFUND MANAGER
// =============================================================================

/**
 * Refund manager implementation
 */
export class RefundManager implements IRefundManager {
  private refunds: Map<string, Refund> = new Map();
  private payments: Map<string, PaymentForRefund> = new Map();
  private readonly config: RefundManagerConfig;
  
  // Event callbacks
  private onRefundCreated?: (refund: Refund) => void;
  private onRefundProcessed?: (refund: Refund) => void;
  private onRefundFailed?: (refund: Refund, error: string) => void;
  
  constructor(config: Partial<RefundManagerConfig> = {}) {
    this.config = { ...DEFAULT_REFUND_CONFIG, ...config };
  }
  
  /**
   * Set event handlers
   */
  setEventHandlers(handlers: {
    onCreated?: (refund: Refund) => void;
    onProcessed?: (refund: Refund) => void;
    onFailed?: (refund: Refund, error: string) => void;
  }): void {
    this.onRefundCreated = handlers.onCreated;
    this.onRefundProcessed = handlers.onProcessed;
    this.onRefundFailed = handlers.onFailed;
  }
  
  /**
   * Register a payment (for internal tracking)
   */
  registerPayment(payment: PaymentForRefund): void {
    this.payments.set(payment.id, payment);
  }
  
  /**
   * Create a refund
   */
  async createRefund(input: CreateRefundInput): Promise<Refund> {
    // Get payment
    const payment = this.payments.get(input.paymentId);
    if (!payment) {
      throw new Error(`Payment not found: ${input.paymentId}`);
    }
    
    // Validate payment status
    if (payment.status !== 'completed') {
      throw new Error(`Cannot refund payment with status: ${payment.status}`);
    }
    
    // Calculate refund
    const calculation = await this.calculateRefund(
      input.paymentId,
      input.amount
    );
    
    if (!calculation.isValid) {
      throw new Error(calculation.error ?? 'Invalid refund');
    }
    
    // Validate reason
    if (this.config.requireReason && !isValidReason(input.reason)) {
      throw new Error('Valid refund reason is required');
    }
    
    // Check refund window
    if (this.config.refundWindowDays > 0) {
      const windowMs = this.config.refundWindowDays * 24 * 60 * 60 * 1000;
      const deadline = new Date(payment.createdAt.getTime() + windowMs);
      if (new Date() > deadline) {
        throw new Error(
          `Refund window expired. Refunds must be requested within ${this.config.refundWindowDays} days`
        );
      }
    }
    
    // Check partial refund config
    if (!this.config.allowPartialRefunds && calculation.isPartialRefund) {
      throw new Error('Partial refunds are not allowed');
    }
    
    // Check minimum amount
    if (
      this.config.minimumRefundAmount &&
      calculation.requestedAmount < this.config.minimumRefundAmount
    ) {
      throw new Error(
        `Minimum refund amount is ${this.config.minimumRefundAmount}`
      );
    }
    
    // Check max refund percentage
    const refundPercentage = Number(
      (calculation.requestedAmount * 100n) / payment.amount
    );
    if (refundPercentage > this.config.maxRefundPercentage) {
      throw new Error(
        `Refund percentage (${refundPercentage}%) exceeds maximum (${this.config.maxRefundPercentage}%)`
      );
    }
    
    // Check max refunds per payment
    const existingRefunds = await this.getRefundsByPayment(input.paymentId);
    if (existingRefunds.length >= this.config.maxRefundsPerPayment) {
      throw new Error(
        `Maximum refunds per payment (${this.config.maxRefundsPerPayment}) exceeded`
      );
    }
    
    // Determine initial status
    let status: RefundStatus = 'pending';
    if (
      this.config.autoApproveUnderAmount &&
      calculation.requestedAmount <= this.config.autoApproveUnderAmount
    ) {
      status = 'processing';
    }
    
    const now = new Date();
    const refund: Refund = {
      id: generateId('ref'),
      paymentId: input.paymentId,
      merchantId: payment.merchantId,
      refundNumber: generateRefundNumber(),
      amount: calculation.requestedAmount,
      currency: payment.currency,
      status,
      reason: input.reason,
      notes: input.notes,
      customerWallet: payment.customerWallet,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };
    
    this.refunds.set(refund.id, refund);
    
    // Emit event
    this.onRefundCreated?.(refund);
    
    return refund;
  }
  
  /**
   * Process a refund (mark as completed with tx signature)
   */
  async processRefund(input: ProcessRefundInput): Promise<Refund> {
    const refund = this.refunds.get(input.refundId);
    if (!refund) {
      throw new Error(`Refund not found: ${input.refundId}`);
    }
    
    if (refund.status !== 'pending' && refund.status !== 'processing') {
      throw new Error(`Cannot process refund with status: ${refund.status}`);
    }
    
    const now = new Date();
    refund.status = 'completed';
    refund.transactionSignature = input.transactionSignature;
    refund.processedAt = now;
    refund.updatedAt = now;
    
    this.refunds.set(refund.id, refund);
    
    // Emit event
    this.onRefundProcessed?.(refund);
    
    return refund;
  }
  
  /**
   * Cancel a refund
   */
  async cancelRefund(refundId: string, reason: string): Promise<Refund> {
    const refund = this.refunds.get(refundId);
    if (!refund) {
      throw new Error(`Refund not found: ${refundId}`);
    }
    
    if (refund.status === 'completed') {
      throw new Error('Cannot cancel a completed refund');
    }
    
    if (refund.status === 'cancelled') {
      throw new Error('Refund is already cancelled');
    }
    
    refund.status = 'cancelled';
    refund.notes = refund.notes
      ? `${refund.notes}\n\nCancellation reason: ${reason}`
      : `Cancellation reason: ${reason}`;
    refund.updatedAt = new Date();
    
    this.refunds.set(refund.id, refund);
    
    return refund;
  }
  
  /**
   * Mark refund as failed
   */
  async failRefund(refundId: string, error: string): Promise<Refund> {
    const refund = this.refunds.get(refundId);
    if (!refund) {
      throw new Error(`Refund not found: ${refundId}`);
    }
    
    refund.status = 'failed';
    refund.failureReason = error;
    refund.updatedAt = new Date();
    
    this.refunds.set(refund.id, refund);
    
    // Emit event
    this.onRefundFailed?.(refund, error);
    
    return refund;
  }
  
  /**
   * Get refund by ID
   */
  async getRefund(refundId: string): Promise<Refund | null> {
    return this.refunds.get(refundId) ?? null;
  }
  
  /**
   * Get refund by refund number
   */
  async getRefundByNumber(refundNumber: string): Promise<Refund | null> {
    for (const refund of this.refunds.values()) {
      if (refund.refundNumber === refundNumber) {
        return refund;
      }
    }
    return null;
  }
  
  /**
   * Get refunds with filters
   */
  async getRefunds(options: RefundQueryOptions = {}): Promise<Refund[]> {
    let refunds = Array.from(this.refunds.values());
    
    // Apply filters
    if (options.paymentId) {
      refunds = refunds.filter((r) => r.paymentId === options.paymentId);
    }
    
    if (options.merchantId) {
      refunds = refunds.filter((r) => r.merchantId === options.merchantId);
    }
    
    if (options.status) {
      refunds = refunds.filter((r) => r.status === options.status);
    }
    
    if (options.reason) {
      refunds = refunds.filter((r) => r.reason === options.reason);
    }
    
    if (options.fromDate) {
      refunds = refunds.filter((r) => r.createdAt >= options.fromDate!);
    }
    
    if (options.toDate) {
      refunds = refunds.filter((r) => r.createdAt <= options.toDate!);
    }
    
    // Sort
    const sortBy = options.sortBy ?? 'createdAt';
    const sortOrder = options.sortOrder ?? 'desc';
    
    refunds.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'amount':
          comparison = Number(a.amount - b.amount);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    // Pagination
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 100;
    
    return refunds.slice(offset, offset + limit);
  }
  
  /**
   * Get refunds for a payment
   */
  async getRefundsByPayment(paymentId: string): Promise<Refund[]> {
    return this.getRefunds({ paymentId });
  }
  
  /**
   * Calculate refund
   */
  async calculateRefund(
    paymentId: string,
    requestedAmount?: bigint
  ): Promise<RefundCalculation> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return {
        originalAmount: 0n,
        alreadyRefunded: 0n,
        requestedAmount: 0n,
        maxRefundable: 0n,
        isFullRefund: false,
        isPartialRefund: false,
        remainingAfterRefund: 0n,
        isValid: false,
        error: `Payment not found: ${paymentId}`,
      };
    }
    
    // Calculate already refunded amount
    const existingRefunds = await this.getRefundsByPayment(paymentId);
    const alreadyRefunded = existingRefunds
      .filter((r) => r.status === 'completed' || r.status === 'processing' || r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0n);
    
    const maxRefundable = payment.amount - alreadyRefunded;
    const requested = requestedAmount ?? maxRefundable;
    const isFullRefund = requested === maxRefundable;
    const isPartialRefund = requested < maxRefundable;
    const remainingAfterRefund = maxRefundable - requested;
    
    // Validate
    let isValid = true;
    let error: string | undefined;
    
    if (requested <= 0n) {
      isValid = false;
      error = 'Refund amount must be positive';
    } else if (requested > maxRefundable) {
      isValid = false;
      error = `Requested amount (${requested}) exceeds maximum refundable (${maxRefundable})`;
    }
    
    return {
      originalAmount: payment.amount,
      alreadyRefunded,
      requestedAmount: requested,
      maxRefundable,
      isFullRefund,
      isPartialRefund,
      remainingAfterRefund,
      isValid,
      error,
    };
  }
  
  /**
   * Get refund statistics
   */
  async getStats(
    merchantId: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<RefundStats> {
    let refunds = await this.getRefunds({ merchantId });
    
    if (fromDate) {
      refunds = refunds.filter((r) => r.createdAt >= fromDate);
    }
    
    if (toDate) {
      refunds = refunds.filter((r) => r.createdAt <= toDate);
    }
    
    const pending = refunds.filter(
      (r) => r.status === 'pending' || r.status === 'processing'
    );
    const completed = refunds.filter((r) => r.status === 'completed');
    const failed = refunds.filter((r) => r.status === 'failed');
    
    const totalAmount = refunds.reduce((sum, r) => sum + r.amount, 0n);
    const pendingAmount = pending.reduce((sum, r) => sum + r.amount, 0n);
    const completedAmount = completed.reduce((sum, r) => sum + r.amount, 0n);
    
    const averageAmount =
      refunds.length > 0 ? totalAmount / BigInt(refunds.length) : 0n;
    
    // Count by reason
    const byReason: Record<RefundReason, number> = {
      requested_by_customer: 0,
      duplicate: 0,
      fraudulent: 0,
      order_cancelled: 0,
      product_not_received: 0,
      product_not_delivered: 0,
      product_unacceptable: 0,
      product_unsatisfactory: 0,
      other: 0,
    };
    
    for (const refund of refunds) {
      byReason[refund.reason]++;
    }
    
    // Calculate refund rate (would need total payments for accurate rate)
    const merchantPayments = Array.from(this.payments.values()).filter(
      (p) => p.merchantId === merchantId
    );
    const refundRate =
      merchantPayments.length > 0
        ? refunds.length / merchantPayments.length
        : 0;
    
    return {
      totalCount: refunds.length,
      totalAmount,
      pendingCount: pending.length,
      pendingAmount,
      completedCount: completed.length,
      completedAmount,
      failedCount: failed.length,
      refundRate,
      averageAmount,
      byReason,
    };
  }
  
  /**
   * Check if payment is fully refunded
   */
  async isFullyRefunded(paymentId: string): Promise<boolean> {
    const calculation = await this.calculateRefund(paymentId);
    return calculation.maxRefundable === 0n;
  }
  
  /**
   * Get total refunded amount for payment
   */
  async getTotalRefunded(paymentId: string): Promise<bigint> {
    const refunds = await this.getRefundsByPayment(paymentId);
    return refunds
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + r.amount, 0n);
  }
}

// =============================================================================
// REFUND POLICY
// =============================================================================

/**
 * Refund policy rules
 */
export interface RefundPolicyRule {
  /** Rule ID */
  id: string;
  
  /** Rule name */
  name: string;
  
  /** Description */
  description: string;
  
  /** Condition function */
  condition: (refund: Refund, payment: PaymentForRefund) => boolean;
  
  /** Action: allow, deny, or require_approval */
  action: 'allow' | 'deny' | 'require_approval';
  
  /** Priority (higher = evaluated first) */
  priority: number;
}

/**
 * Refund policy engine
 */
export class RefundPolicyEngine {
  private rules: RefundPolicyRule[] = [];
  
  /**
   * Add rule
   */
  addRule(rule: RefundPolicyRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Remove rule
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((r) => r.id !== ruleId);
  }
  
  /**
   * Evaluate refund against policy
   */
  evaluate(
    refund: Refund,
    payment: PaymentForRefund
  ): {
    allowed: boolean;
    requiresApproval: boolean;
    matchedRule?: RefundPolicyRule;
    reason?: string;
  } {
    for (const rule of this.rules) {
      if (rule.condition(refund, payment)) {
        switch (rule.action) {
          case 'allow':
            return {
              allowed: true,
              requiresApproval: false,
              matchedRule: rule,
            };
          case 'deny':
            return {
              allowed: false,
              requiresApproval: false,
              matchedRule: rule,
              reason: rule.description,
            };
          case 'require_approval':
            return {
              allowed: true,
              requiresApproval: true,
              matchedRule: rule,
            };
        }
      }
    }
    
    // Default: allow
    return {
      allowed: true,
      requiresApproval: false,
    };
  }
  
  /**
   * Get all rules
   */
  getRules(): RefundPolicyRule[] {
    return [...this.rules];
  }
}

/**
 * Create default refund policy
 */
export function createDefaultRefundPolicy(): RefundPolicyEngine {
  const engine = new RefundPolicyEngine();
  
  // Rule: Auto-approve small refunds
  engine.addRule({
    id: 'auto_approve_small',
    name: 'Auto-approve small refunds',
    description: 'Automatically approve refunds under 10 USDC',
    condition: (refund) => refund.amount <= 10_000_000n, // 10 USDC
    action: 'allow',
    priority: 100,
  });
  
  // Rule: Require approval for large refunds
  engine.addRule({
    id: 'approval_large',
    name: 'Require approval for large refunds',
    description: 'Require manual approval for refunds over 1000 USDC',
    condition: (refund) => refund.amount > 1000_000_000n, // 1000 USDC
    action: 'require_approval',
    priority: 90,
  });
  
  // Rule: Deny refunds after 30 days
  engine.addRule({
    id: 'deny_old_payments',
    name: 'Deny refunds for old payments',
    description: 'Deny refunds for payments older than 30 days',
    condition: (_, payment) => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return payment.createdAt < thirtyDaysAgo;
    },
    action: 'deny',
    priority: 80,
  });
  
  // Rule: Flag suspected fraud
  engine.addRule({
    id: 'flag_fraud',
    name: 'Flag fraudulent refunds',
    description: 'Require approval for fraudulent refund claims',
    condition: (refund) => refund.reason === 'fraudulent',
    action: 'require_approval',
    priority: 70,
  });
  
  return engine;
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create refund manager
 */
export function createRefundManager(
  config?: Partial<RefundManagerConfig>
): RefundManager {
  return new RefundManager(config);
}

/**
 * Create refund policy engine
 */
export function createRefundPolicyEngine(): RefundPolicyEngine {
  return new RefundPolicyEngine();
}

/**
 * All refund reasons
 */
export const REFUND_REASONS: RefundReason[] = [
  'requested_by_customer',
  'duplicate',
  'fraudulent',
  'order_cancelled',
  'product_not_received',
  'product_not_delivered',
  'product_unacceptable',
  'product_unsatisfactory',
  'other',
];

/**
 * All refund statuses
 */
export const REFUND_STATUSES: RefundStatus[] = [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
];
