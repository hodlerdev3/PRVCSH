/**
 * @fileoverview Timelock module for Privacy DAO
 * @description Handles time-delayed execution of approved proposals
 * with security gates and cancellation mechanisms.
 * 
 * @module @prvcsh/dao/timelock
 * @version 0.1.0
 */

import {
  DAOError,
  DAOErrorCode,
  type TimelockTransaction,
  type TimelockStatus,
  type ProposalAction,
  type DAOEvent,
  type DAOEventListener,
} from '../types';

// =============================================================================
// TIMELOCK TYPES
// =============================================================================

/**
 * Timelock configuration
 */
export interface TimelockConfig {
  /** Minimum delay before execution (seconds) */
  readonly minDelay: number;
  
  /** Maximum delay allowed (seconds) */
  readonly maxDelay: number;
  
  /** Grace period after delay (seconds) - tx can be executed during this time */
  readonly gracePeriod: number;
  
  /** Emergency delay for critical transactions (seconds) */
  readonly emergencyDelay: number;
  
  /** Guardian addresses that can cancel */
  readonly guardians: string[];
  
  /** Admin address (can update config) */
  readonly admin: string;
}

/**
 * Queue transaction input
 */
export interface QueueTransactionInput {
  /** Proposal ID */
  readonly proposalId: string;
  
  /** Actions to execute */
  readonly actions: ProposalAction[];
  
  /** Custom delay (if allowed) */
  readonly delay?: number;
  
  /** ZK proof of proposer identity (optional for privacy) */
  readonly proposerProof?: Uint8Array;
  
  /** Metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Execute transaction input
 */
export interface ExecuteTransactionInput {
  /** Transaction ID */
  readonly txId: string;
  
  /** ZK proof of executor (optional) */
  readonly executorProof?: Uint8Array;
}

/**
 * Cancel transaction input
 */
export interface CancelTransactionInput {
  /** Transaction ID */
  readonly txId: string;
  
  /** Reason for cancellation */
  readonly reason: string;
  
  /** Guardian or admin signature */
  readonly signature: Uint8Array;
}

/**
 * Timelock operation result
 */
export interface TimelockResult {
  /** Operation success */
  readonly success: boolean;
  
  /** Transaction (if success) */
  readonly transaction?: TimelockTransaction;
  
  /** Transaction hash (if success) */
  readonly txHash?: string;
  
  /** Error (if failure) */
  readonly error?: DAOError;
}

/**
 * Transaction schedule info
 */
export interface TransactionSchedule {
  /** Transaction ID */
  readonly txId: string;
  
  /** When it can be executed */
  readonly executeAt: Date;
  
  /** When grace period ends */
  readonly expiresAt: Date;
  
  /** Seconds until executable */
  readonly secondsUntilExecutable: number;
  
  /** Is currently executable */
  readonly isExecutable: boolean;
  
  /** Is expired */
  readonly isExpired: boolean;
}

// =============================================================================
// TIMELOCK INTERFACE
// =============================================================================

/**
 * Timelock interface for delayed execution
 */
export interface ITimelock {
  /**
   * Queue transaction for delayed execution
   * @param input Queue input
   * @returns Timelock result
   */
  queueTransaction(input: QueueTransactionInput): Promise<TimelockResult>;
  
  /**
   * Execute queued transaction
   * @param input Execute input
   * @returns Timelock result
   */
  executeTransaction(input: ExecuteTransactionInput): Promise<TimelockResult>;
  
  /**
   * Cancel queued transaction
   * @param input Cancel input
   * @returns Timelock result
   */
  cancelTransaction(input: CancelTransactionInput): Promise<TimelockResult>;
  
  /**
   * Get transaction by ID
   * @param txId Transaction ID
   * @returns Transaction or null
   */
  getTransaction(txId: string): Promise<TimelockTransaction | null>;
  
  /**
   * Get transactions by proposal
   * @param proposalId Proposal ID
   * @returns Transactions for proposal
   */
  getTransactionsByProposal(proposalId: string): Promise<TimelockTransaction[]>;
  
  /**
   * Get pending transactions
   * @returns All pending transactions
   */
  getPendingTransactions(): Promise<TimelockTransaction[]>;
  
  /**
   * Get executable transactions
   * @returns Transactions ready for execution
   */
  getExecutableTransactions(): Promise<TimelockTransaction[]>;
  
  /**
   * Get transaction schedule
   * @param txId Transaction ID
   * @returns Schedule info
   */
  getTransactionSchedule(txId: string): Promise<TransactionSchedule | null>;
  
  /**
   * Compute transaction hash (for verification)
   * @param actions Actions
   * @param delay Delay
   * @param salt Salt
   * @returns Hash
   */
  computeTransactionHash(
    actions: ProposalAction[],
    delay: number,
    salt: Uint8Array,
  ): string;
  
  /**
   * Update config (admin only)
   * @param newConfig New configuration
   */
  updateConfig(newConfig: Partial<TimelockConfig>): Promise<void>;
  
  /**
   * Subscribe to timelock events
   * @param listener Event listener
   * @returns Unsubscribe function
   */
  subscribe(listener: DAOEventListener): () => void;
  
  /**
   * Initialize timelock
   */
  initialize(): Promise<void>;
  
  /**
   * Cleanup resources
   */
  destroy(): Promise<void>;
}

// =============================================================================
// TIMELOCK IMPLEMENTATION
// =============================================================================

/**
 * Timelock implementation
 */
export class Timelock implements ITimelock {
  private config: TimelockConfig;
  private initialized: boolean = false;
  private listeners: Set<DAOEventListener> = new Set();
  
  // In-memory storage
  private transactions: Map<string, TimelockTransaction> = new Map();
  private proposalTransactions: Map<string, Set<string>> = new Map();
  
  constructor(config: TimelockConfig) {
    this.config = config;
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Load existing transactions from chain
    
    this.initialized = true;
  }
  
  async destroy(): Promise<void> {
    this.listeners.clear();
    this.transactions.clear();
    this.proposalTransactions.clear();
    this.initialized = false;
  }
  
  async queueTransaction(input: QueueTransactionInput): Promise<TimelockResult> {
    this.ensureInitialized();
    
    try {
      // Validate delay
      const delay = input.delay ?? this.config.minDelay;
      if (delay < this.config.minDelay) {
        return {
          success: false,
          error: new DAOError(
            DAOErrorCode.INVALID_TIMELOCK_DELAY,
            `Delay ${delay} is less than minimum ${this.config.minDelay}`,
          ),
        };
      }
      
      if (delay > this.config.maxDelay) {
        return {
          success: false,
          error: new DAOError(
            DAOErrorCode.INVALID_TIMELOCK_DELAY,
            `Delay ${delay} exceeds maximum ${this.config.maxDelay}`,
          ),
        };
      }
      
      // Generate transaction ID
      const salt = crypto.getRandomValues(new Uint8Array(32));
      const txId = this.computeTransactionHash(input.actions, delay, salt);
      
      // Calculate execution times
      const now = new Date();
      const executeAt = new Date(now.getTime() + delay * 1000);
      const expiresAt = new Date(executeAt.getTime() + this.config.gracePeriod * 1000);
      
      // Create transaction
      const transaction: TimelockTransaction = {
        txId,
        proposalId: input.proposalId,
        actions: input.actions,
        status: 'queued',
        queuedAt: now,
        executeAt,
        expiresAt,
        delay,
        salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
        metadata: input.metadata,
      };
      
      // Store transaction
      this.transactions.set(txId, transaction);
      
      // Track by proposal
      let proposalTxs = this.proposalTransactions.get(input.proposalId);
      if (!proposalTxs) {
        proposalTxs = new Set();
        this.proposalTransactions.set(input.proposalId, proposalTxs);
      }
      proposalTxs.add(txId);
      
      // Emit event
      await this.emit({
        type: 'proposal_queued',
        proposalId: input.proposalId,
        data: {
          txId,
          delay,
          executeAt: executeAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
          actionCount: input.actions.length,
        },
        timestamp: now,
        blockNumber: 0,
        txHash: '',
      });
      
      return {
        success: true,
        transaction,
        txHash: '',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof DAOError ? error : new DAOError(
          DAOErrorCode.UNKNOWN_ERROR,
          String(error),
        ),
      };
    }
  }
  
  async executeTransaction(input: ExecuteTransactionInput): Promise<TimelockResult> {
    this.ensureInitialized();
    
    try {
      const tx = this.transactions.get(input.txId);
      if (!tx) {
        return {
          success: false,
          error: new DAOError(
            DAOErrorCode.TIMELOCK_NOT_FOUND,
            `Transaction ${input.txId} not found`,
          ),
        };
      }
      
      if (tx.status !== 'queued') {
        return {
          success: false,
          error: new DAOError(
            DAOErrorCode.INVALID_TIMELOCK_STATUS,
            `Transaction status is ${tx.status}, expected queued`,
          ),
        };
      }
      
      const now = new Date();
      
      // Check if execution time has passed
      if (now < tx.executeAt) {
        const secondsRemaining = Math.ceil((tx.executeAt.getTime() - now.getTime()) / 1000);
        return {
          success: false,
          error: new DAOError(
            DAOErrorCode.TIMELOCK_NOT_READY,
            `Transaction not ready for execution. ${secondsRemaining} seconds remaining`,
          ),
        };
      }
      
      // Check if not expired
      if (now > tx.expiresAt) {
        // Mark as expired
        tx.status = 'expired';
        this.transactions.set(input.txId, tx);
        
        return {
          success: false,
          error: new DAOError(
            DAOErrorCode.TIMELOCK_EXPIRED,
            `Transaction expired at ${tx.expiresAt.toISOString()}`,
          ),
        };
      }
      
      // Execute actions
      const executedActions: ProposalAction[] = [];
      for (const action of tx.actions) {
        // In real implementation, call the target programs
        executedActions.push(action);
      }
      
      // Update transaction status
      tx.status = 'executed';
      tx.executedAt = now;
      this.transactions.set(input.txId, tx);
      
      // Emit event
      await this.emit({
        type: 'proposal_executed',
        proposalId: tx.proposalId,
        data: {
          txId: input.txId,
          executedActions: executedActions.length,
        },
        timestamp: now,
        blockNumber: 0,
        txHash: '',
      });
      
      return {
        success: true,
        transaction: tx,
        txHash: '',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof DAOError ? error : new DAOError(
          DAOErrorCode.UNKNOWN_ERROR,
          String(error),
        ),
      };
    }
  }
  
  async cancelTransaction(input: CancelTransactionInput): Promise<TimelockResult> {
    this.ensureInitialized();
    
    try {
      const tx = this.transactions.get(input.txId);
      if (!tx) {
        return {
          success: false,
          error: new DAOError(
            DAOErrorCode.TIMELOCK_NOT_FOUND,
            `Transaction ${input.txId} not found`,
          ),
        };
      }
      
      if (tx.status !== 'queued') {
        return {
          success: false,
          error: new DAOError(
            DAOErrorCode.INVALID_TIMELOCK_STATUS,
            `Cannot cancel transaction with status ${tx.status}`,
          ),
        };
      }
      
      // In real implementation, verify guardian/admin signature
      
      // Update status
      tx.status = 'cancelled';
      tx.cancelledAt = new Date();
      tx.cancelReason = input.reason;
      this.transactions.set(input.txId, tx);
      
      // Emit event
      await this.emit({
        type: 'proposal_cancelled',
        proposalId: tx.proposalId,
        data: {
          txId: input.txId,
          reason: input.reason,
        },
        timestamp: new Date(),
        blockNumber: 0,
        txHash: '',
      });
      
      return {
        success: true,
        transaction: tx,
        txHash: '',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof DAOError ? error : new DAOError(
          DAOErrorCode.UNKNOWN_ERROR,
          String(error),
        ),
      };
    }
  }
  
  async getTransaction(txId: string): Promise<TimelockTransaction | null> {
    this.ensureInitialized();
    return this.transactions.get(txId) ?? null;
  }
  
  async getTransactionsByProposal(proposalId: string): Promise<TimelockTransaction[]> {
    this.ensureInitialized();
    
    const txIds = this.proposalTransactions.get(proposalId);
    if (!txIds) return [];
    
    return Array.from(txIds)
      .map(id => this.transactions.get(id))
      .filter((tx): tx is TimelockTransaction => tx !== undefined);
  }
  
  async getPendingTransactions(): Promise<TimelockTransaction[]> {
    this.ensureInitialized();
    
    return Array.from(this.transactions.values())
      .filter(tx => tx.status === 'queued');
  }
  
  async getExecutableTransactions(): Promise<TimelockTransaction[]> {
    this.ensureInitialized();
    
    const now = new Date();
    return Array.from(this.transactions.values())
      .filter(tx => 
        tx.status === 'queued' &&
        now >= tx.executeAt &&
        now <= tx.expiresAt
      );
  }
  
  async getTransactionSchedule(txId: string): Promise<TransactionSchedule | null> {
    this.ensureInitialized();
    
    const tx = this.transactions.get(txId);
    if (!tx) return null;
    
    const now = new Date();
    const secondsUntilExecutable = Math.max(0,
      Math.ceil((tx.executeAt.getTime() - now.getTime()) / 1000)
    );
    
    return {
      txId,
      executeAt: tx.executeAt,
      expiresAt: tx.expiresAt,
      secondsUntilExecutable,
      isExecutable: now >= tx.executeAt && now <= tx.expiresAt,
      isExpired: now > tx.expiresAt,
    };
  }
  
  computeTransactionHash(
    actions: ProposalAction[],
    delay: number,
    salt: Uint8Array,
  ): string {
    // In real implementation, use keccak256 or similar
    const encoder = new TextEncoder();
    const actionData = encoder.encode(JSON.stringify(actions));
    const delayData = new Uint8Array(new BigInt64Array([BigInt(delay)]).buffer);
    
    const combined = new Uint8Array([...actionData, ...delayData, ...salt]);
    
    let hash = BigInt(0);
    for (const byte of combined) {
      hash = (hash * BigInt(31) + BigInt(byte)) % (BigInt(2) ** BigInt(256));
    }
    
    return '0x' + hash.toString(16).padStart(64, '0');
  }
  
  async updateConfig(newConfig: Partial<TimelockConfig>): Promise<void> {
    this.ensureInitialized();
    
    // In real implementation, verify admin signature
    
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }
  
  subscribe(listener: DAOEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================
  
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new DAOError(
        DAOErrorCode.NOT_INITIALIZED,
        'Timelock not initialized',
      );
    }
  }
  
  private async emit(event: DAOEvent): Promise<void> {
    const promises = Array.from(this.listeners).map(listener =>
      Promise.resolve(listener(event)).catch(console.error),
    );
    await Promise.all(promises);
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create timelock instance
 */
export function createTimelock(config: TimelockConfig): ITimelock {
  return new Timelock(config);
}

/**
 * Default timelock configuration
 */
export const DEFAULT_TIMELOCK_CONFIG: TimelockConfig = {
  minDelay: 2 * 24 * 60 * 60, // 2 days
  maxDelay: 30 * 24 * 60 * 60, // 30 days
  gracePeriod: 7 * 24 * 60 * 60, // 7 days
  emergencyDelay: 1 * 24 * 60 * 60, // 1 day
  guardians: [],
  admin: '',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format remaining time
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Ready';
  
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = seconds % 60;
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 && days === 0) parts.push(`${secs}s`);
  
  return parts.join(' ') || '0s';
}

/**
 * Calculate execution window
 */
export function calculateExecutionWindow(
  queuedAt: Date,
  delay: number,
  gracePeriod: number,
): { executeAt: Date; expiresAt: Date } {
  const executeAt = new Date(queuedAt.getTime() + delay * 1000);
  const expiresAt = new Date(executeAt.getTime() + gracePeriod * 1000);
  
  return { executeAt, expiresAt };
}
