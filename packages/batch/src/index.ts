/**
 * @fileoverview Batch Processing Package
 * @description Aggregate and batch multiple PRVCSH operations for efficiency.
 * 
 * @module @prvcsh/batch
 * @version 0.1.0
 * 
 * @example
 * ```typescript
 * import { BatchProcessor, BatchQueue, ScheduledTransactions } from '@prvcsh/batch';
 * 
 * // Create processor
 * const processor = new BatchProcessor({
 *   maxBatchSize: 10,
 *   maxWaitTime: 30000,
 *   gasStrategy: 'economic',
 * });
 * 
 * // Add operations
 * processor.addDeposit({ amount: 1_000_000_000n, pool: 'sol-1' });
 * processor.addDeposit({ amount: 1_000_000_000n, pool: 'sol-1' });
 * 
 * // Execute batch
 * const result = await processor.executeBatch();
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Pool identifier
 */
export type PoolId = 'sol-0.1' | 'sol-1' | 'sol-10' | 'sol-100' | 'usdc-100' | 'usdc-1000';

/**
 * Operation type
 */
export type OperationType = 'deposit' | 'withdrawal' | 'transfer';

/**
 * Operation priority
 */
export type OperationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Gas optimization strategy
 */
export type GasStrategy = 'economic' | 'balanced' | 'fast';

/**
 * Operation status
 */
export type OperationStatus = 
  | 'pending'
  | 'queued'
  | 'batched'
  | 'processing'
  | 'confirming'
  | 'completed'
  | 'failed'
  | 'retrying';

/**
 * Base operation interface
 */
export interface BaseOperation {
  /** Unique operation ID */
  id: string;
  
  /** Operation type */
  type: OperationType;
  
  /** Target pool */
  pool: PoolId;
  
  /** Amount in smallest unit */
  amount: bigint;
  
  /** Priority level */
  priority: OperationPriority;
  
  /** Current status */
  status: OperationStatus;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Scheduled execution time */
  scheduledAt?: Date;
  
  /** Callback on completion */
  onComplete?: (result: OperationResult) => void;
  
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Deposit operation
 */
export interface DepositOperation extends BaseOperation {
  type: 'deposit';
  
  /** Sender public key */
  sender: string;
  
  /** Generated commitment */
  commitment?: string;
  
  /** Deposit note (encrypted) */
  note?: string;
}

/**
 * Withdrawal operation
 */
export interface WithdrawalOperation extends BaseOperation {
  type: 'withdrawal';
  
  /** Recipient address */
  recipient: string;
  
  /** Nullifier hash */
  nullifier: string;
  
  /** ZK proof */
  proof: Uint8Array;
  
  /** Relayer fee */
  relayerFee: bigint;
}

/**
 * Transfer operation (shielded)
 */
export interface TransferOperation extends BaseOperation {
  type: 'transfer';
  
  /** Source nullifier */
  sourceNullifier: string;
  
  /** Destination commitment */
  destCommitment: string;
  
  /** ZK proof */
  proof: Uint8Array;
}

/**
 * Any operation
 */
export type Operation = DepositOperation | WithdrawalOperation | TransferOperation;

/**
 * Operation result
 */
export interface OperationResult {
  /** Operation ID */
  operationId: string;
  
  /** Success status */
  success: boolean;
  
  /** Transaction signature */
  signature?: string;
  
  /** Error message */
  error?: string;
  
  /** Gas used */
  gasUsed?: bigint;
  
  /** Actual fee */
  fee?: bigint;
  
  /** Confirmation slot */
  slot?: number;
  
  /** Processing time in ms */
  processingTime?: number;
}

/**
 * Batch result
 */
export interface BatchResult {
  /** Batch ID */
  batchId: string;
  
  /** All results */
  results: OperationResult[];
  
  /** Success count */
  successCount: number;
  
  /** Failure count */
  failureCount: number;
  
  /** Total gas used */
  totalGasUsed: bigint;
  
  /** Total fees */
  totalFees: bigint;
  
  /** Combined transaction signatures */
  signatures: string[];
  
  /** Start time */
  startedAt: Date;
  
  /** End time */
  completedAt: Date;
}

/**
 * Batch processor configuration
 */
export interface BatchProcessorConfig {
  /** Maximum batch size */
  maxBatchSize?: number;
  
  /** Maximum wait time before executing (ms) */
  maxWaitTime?: number;
  
  /** Minimum batch size to execute */
  minBatchSize?: number;
  
  /** Gas optimization strategy */
  gasStrategy?: GasStrategy;
  
  /** Enable automatic execution */
  autoExecute?: boolean;
  
  /** Retry failed operations */
  retryEnabled?: boolean;
  
  /** Maximum retry attempts */
  maxRetries?: number;
  
  /** Retry delay base (ms) */
  retryDelayBase?: number;
  
  /** RPC endpoint */
  rpcUrl?: string;
  
  /** Program ID */
  programId?: string;
}

// =============================================================================
// BATCH QUEUE
// =============================================================================

/**
 * Priority queue for operations
 */
export class BatchQueue<T extends BaseOperation> {
  private queues: Map<OperationPriority, T[]> = new Map([
    ['urgent', []],
    ['high', []],
    ['normal', []],
    ['low', []],
  ]);
  
  private size: number = 0;
  
  /**
   * Add operation to queue
   */
  enqueue(operation: T): void {
    const queue = this.queues.get(operation.priority);
    if (queue) {
      queue.push(operation);
      this.size++;
    }
  }
  
  /**
   * Get next operation
   */
  dequeue(): T | undefined {
    for (const priority of ['urgent', 'high', 'normal', 'low'] as OperationPriority[]) {
      const queue = this.queues.get(priority);
      if (queue && queue.length > 0) {
        this.size--;
        return queue.shift();
      }
    }
    return undefined;
  }
  
  /**
   * Dequeue multiple operations
   */
  dequeueMany(count: number): T[] {
    const operations: T[] = [];
    while (operations.length < count && this.size > 0) {
      const op = this.dequeue();
      if (op) {
        operations.push(op);
      }
    }
    return operations;
  }
  
  /**
   * Peek at next operation
   */
  peek(): T | undefined {
    for (const priority of ['urgent', 'high', 'normal', 'low'] as OperationPriority[]) {
      const queue = this.queues.get(priority);
      if (queue && queue.length > 0) {
        return queue[0];
      }
    }
    return undefined;
  }
  
  /**
   * Get queue size
   */
  getSize(): number {
    return this.size;
  }
  
  /**
   * Check if empty
   */
  isEmpty(): boolean {
    return this.size === 0;
  }
  
  /**
   * Get all operations by pool
   */
  getByPool(pool: PoolId): T[] {
    const all: T[] = [];
    for (const queue of this.queues.values()) {
      all.push(...queue.filter(op => op.pool === pool));
    }
    return all;
  }
  
  /**
   * Remove operation by ID
   */
  remove(id: string): T | undefined {
    for (const queue of this.queues.values()) {
      const index = queue.findIndex(op => op.id === id);
      if (index !== -1) {
        this.size--;
        return queue.splice(index, 1)[0];
      }
    }
    return undefined;
  }
  
  /**
   * Clear all operations
   */
  clear(): void {
    for (const queue of this.queues.values()) {
      queue.length = 0;
    }
    this.size = 0;
  }
}

// =============================================================================
// BATCH PROCESSOR
// =============================================================================

/**
 * Batch processor for PRVCSH operations
 */
export class BatchProcessor {
  private config: Required<BatchProcessorConfig>;
  private depositQueue: BatchQueue<DepositOperation>;
  private withdrawalQueue: BatchQueue<WithdrawalOperation>;
  private transferQueue: BatchQueue<TransferOperation>;
  private processing: boolean = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private retryMap: Map<string, number> = new Map();
  private listeners: Set<(result: BatchResult) => void> = new Set();
  
  constructor(config: BatchProcessorConfig = {}) {
    this.config = {
      maxBatchSize: 10,
      maxWaitTime: 30000,
      minBatchSize: 2,
      gasStrategy: 'balanced',
      autoExecute: true,
      retryEnabled: true,
      maxRetries: 3,
      retryDelayBase: 1000,
      rpcUrl: 'https://api.devnet.solana.com',
      programId: '',
      ...config,
    };
    
    this.depositQueue = new BatchQueue();
    this.withdrawalQueue = new BatchQueue();
    this.transferQueue = new BatchQueue();
  }
  
  // =============================================================================
  // ADD OPERATIONS
  // =============================================================================
  
  /**
   * Add deposit to batch
   */
  addDeposit(params: {
    sender: string;
    amount: bigint;
    pool: PoolId;
    priority?: OperationPriority;
    scheduledAt?: Date;
    onComplete?: (result: OperationResult) => void;
    onError?: (error: Error) => void;
  }): string {
    const operation: DepositOperation = {
      id: this.generateId('dep'),
      type: 'deposit',
      pool: params.pool,
      amount: params.amount,
      sender: params.sender,
      priority: params.priority ?? 'normal',
      status: 'pending',
      createdAt: new Date(),
      scheduledAt: params.scheduledAt,
      onComplete: params.onComplete,
      onError: params.onError,
    };
    
    operation.status = 'queued';
    this.depositQueue.enqueue(operation);
    this.checkAutoExecute();
    
    return operation.id;
  }
  
  /**
   * Add withdrawal to batch
   */
  addWithdrawal(params: {
    recipient: string;
    amount: bigint;
    pool: PoolId;
    nullifier: string;
    proof: Uint8Array;
    relayerFee?: bigint;
    priority?: OperationPriority;
    onComplete?: (result: OperationResult) => void;
    onError?: (error: Error) => void;
  }): string {
    const operation: WithdrawalOperation = {
      id: this.generateId('wit'),
      type: 'withdrawal',
      pool: params.pool,
      amount: params.amount,
      recipient: params.recipient,
      nullifier: params.nullifier,
      proof: params.proof,
      relayerFee: params.relayerFee ?? 0n,
      priority: params.priority ?? 'normal',
      status: 'pending',
      createdAt: new Date(),
      onComplete: params.onComplete,
      onError: params.onError,
    };
    
    operation.status = 'queued';
    this.withdrawalQueue.enqueue(operation);
    this.checkAutoExecute();
    
    return operation.id;
  }
  
  /**
   * Add transfer to batch
   */
  addTransfer(params: {
    amount: bigint;
    pool: PoolId;
    sourceNullifier: string;
    destCommitment: string;
    proof: Uint8Array;
    priority?: OperationPriority;
    onComplete?: (result: OperationResult) => void;
    onError?: (error: Error) => void;
  }): string {
    const operation: TransferOperation = {
      id: this.generateId('txf'),
      type: 'transfer',
      pool: params.pool,
      amount: params.amount,
      sourceNullifier: params.sourceNullifier,
      destCommitment: params.destCommitment,
      proof: params.proof,
      priority: params.priority ?? 'normal',
      status: 'pending',
      createdAt: new Date(),
      onComplete: params.onComplete,
      onError: params.onError,
    };
    
    operation.status = 'queued';
    this.transferQueue.enqueue(operation);
    this.checkAutoExecute();
    
    return operation.id;
  }
  
  // =============================================================================
  // EXECUTION
  // =============================================================================
  
  /**
   * Execute pending batch
   */
  async executeBatch(): Promise<BatchResult> {
    if (this.processing) {
      throw new Error('Batch already processing');
    }
    
    this.processing = true;
    const startTime = new Date();
    const batchId = this.generateId('batch');
    
    try {
      // Collect operations
      const deposits = this.depositQueue.dequeueMany(this.config.maxBatchSize);
      const withdrawals = this.withdrawalQueue.dequeueMany(this.config.maxBatchSize - deposits.length);
      const transfers = this.transferQueue.dequeueMany(
        this.config.maxBatchSize - deposits.length - withdrawals.length
      );
      
      // Update status
      [...deposits, ...withdrawals, ...transfers].forEach(op => {
        op.status = 'batched';
      });
      
      // Group by pool for efficiency
      const results: OperationResult[] = [];
      const signatures: string[] = [];
      let totalGasUsed = 0n;
      let totalFees = 0n;
      
      // Process deposits by pool
      const depositsByPool = this.groupByPool(deposits);
      for (const [pool, poolDeposits] of depositsByPool) {
        const poolResults = await this.processBatchDeposits(pool, poolDeposits);
        results.push(...poolResults.results);
        signatures.push(...poolResults.signatures);
        totalGasUsed += poolResults.gasUsed;
        totalFees += poolResults.fees;
      }
      
      // Process withdrawals by pool
      const withdrawalsByPool = this.groupByPool(withdrawals);
      for (const [pool, poolWithdrawals] of withdrawalsByPool) {
        const poolResults = await this.processBatchWithdrawals(pool, poolWithdrawals);
        results.push(...poolResults.results);
        signatures.push(...poolResults.signatures);
        totalGasUsed += poolResults.gasUsed;
        totalFees += poolResults.fees;
      }
      
      // Process transfers by pool
      const transfersByPool = this.groupByPool(transfers);
      for (const [pool, poolTransfers] of transfersByPool) {
        const poolResults = await this.processBatchTransfers(pool, poolTransfers);
        results.push(...poolResults.results);
        signatures.push(...poolResults.signatures);
        totalGasUsed += poolResults.gasUsed;
        totalFees += poolResults.fees;
      }
      
      // Handle callbacks
      for (const result of results) {
        const operation = [...deposits, ...withdrawals, ...transfers]
          .find(op => op.id === result.operationId);
        
        if (operation) {
          if (result.success) {
            operation.status = 'completed';
            operation.onComplete?.(result);
          } else {
            operation.status = 'failed';
            operation.onError?.(new Error(result.error));
            
            // Retry if enabled
            if (this.config.retryEnabled) {
              await this.handleRetry(operation);
            }
          }
        }
      }
      
      const batchResult: BatchResult = {
        batchId,
        results,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length,
        totalGasUsed,
        totalFees,
        signatures,
        startedAt: startTime,
        completedAt: new Date(),
      };
      
      // Notify listeners
      this.notifyListeners(batchResult);
      
      return batchResult;
    } finally {
      this.processing = false;
    }
  }
  
  /**
   * Force execute regardless of batch size
   */
  async forceExecute(): Promise<BatchResult> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    return this.executeBatch();
  }
  
  // =============================================================================
  // SCHEDULED TRANSACTIONS
  // =============================================================================
  
  /**
   * Schedule operation for future execution
   */
  schedule(
    operation: Omit<DepositOperation, 'id' | 'status' | 'createdAt'> & { 
      scheduledAt: Date;
      type: 'deposit';
    }
  ): string;
  schedule(
    operation: Omit<WithdrawalOperation, 'id' | 'status' | 'createdAt'> & { 
      scheduledAt: Date;
      type: 'withdrawal';
    }
  ): string;
  schedule(operation: any): string {
    const id = this.generateId('sch');
    const fullOperation = {
      ...operation,
      id,
      status: 'pending' as OperationStatus,
      createdAt: new Date(),
    };
    
    // Calculate delay
    const delay = operation.scheduledAt.getTime() - Date.now();
    
    if (delay <= 0) {
      // Execute immediately
      if (operation.type === 'deposit') {
        this.depositQueue.enqueue(fullOperation as DepositOperation);
      } else if (operation.type === 'withdrawal') {
        this.withdrawalQueue.enqueue(fullOperation as WithdrawalOperation);
      }
    } else {
      // Schedule for future
      setTimeout(() => {
        if (operation.type === 'deposit') {
          this.depositQueue.enqueue(fullOperation as DepositOperation);
        } else if (operation.type === 'withdrawal') {
          this.withdrawalQueue.enqueue(fullOperation as WithdrawalOperation);
        }
        this.checkAutoExecute();
      }, delay);
    }
    
    return id;
  }
  
  // =============================================================================
  // RETRY MECHANISM
  // =============================================================================
  
  private async handleRetry(operation: Operation): Promise<void> {
    const retryCount = this.retryMap.get(operation.id) ?? 0;
    
    if (retryCount >= this.config.maxRetries) {
      console.error(`[BatchProcessor] Max retries reached for ${operation.id}`);
      return;
    }
    
    this.retryMap.set(operation.id, retryCount + 1);
    operation.status = 'retrying';
    
    // Exponential backoff
    const delay = this.config.retryDelayBase * Math.pow(2, retryCount);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Re-queue with higher priority
    const higherPriority: OperationPriority = 
      operation.priority === 'low' ? 'normal' :
      operation.priority === 'normal' ? 'high' : 'urgent';
    
    operation.priority = higherPriority;
    operation.status = 'queued';
    
    switch (operation.type) {
      case 'deposit':
        this.depositQueue.enqueue(operation);
        break;
      case 'withdrawal':
        this.withdrawalQueue.enqueue(operation);
        break;
      case 'transfer':
        this.transferQueue.enqueue(operation);
        break;
    }
  }
  
  // =============================================================================
  // GAS OPTIMIZATION
  // =============================================================================
  
  /**
   * Calculate optimal gas based on strategy
   */
  private calculateGas(operationCount: number): bigint {
    const baseGas = 5000n;
    const perOpGas = 2000n;
    
    const totalGas = baseGas + (perOpGas * BigInt(operationCount));
    
    switch (this.config.gasStrategy) {
      case 'economic':
        // Wait for lower gas, use minimum
        return totalGas;
      case 'fast':
        // Pay premium for faster confirmation
        return totalGas * 150n / 100n;
      case 'balanced':
      default:
        // Moderate gas premium
        return totalGas * 120n / 100n;
    }
  }
  
  // =============================================================================
  // HELPERS
  // =============================================================================
  
  private checkAutoExecute(): void {
    if (!this.config.autoExecute) return;
    
    const totalSize = 
      this.depositQueue.getSize() + 
      this.withdrawalQueue.getSize() + 
      this.transferQueue.getSize();
    
    // Execute if max batch size reached
    if (totalSize >= this.config.maxBatchSize) {
      this.executeBatch().catch(console.error);
      return;
    }
    
    // Start timer if not already running
    if (!this.timer && totalSize >= this.config.minBatchSize) {
      this.timer = setTimeout(() => {
        this.timer = null;
        if (!this.processing) {
          this.executeBatch().catch(console.error);
        }
      }, this.config.maxWaitTime);
    }
  }
  
  private groupByPool<T extends BaseOperation>(operations: T[]): Map<PoolId, T[]> {
    const groups = new Map<PoolId, T[]>();
    for (const op of operations) {
      const existing = groups.get(op.pool) ?? [];
      existing.push(op);
      groups.set(op.pool, existing);
    }
    return groups;
  }
  
  private async processBatchDeposits(
    _pool: PoolId,
    deposits: DepositOperation[]
  ): Promise<{ results: OperationResult[]; signatures: string[]; gasUsed: bigint; fees: bigint }> {
    // Mock implementation - would call Solana program
    const results = deposits.map(dep => ({
      operationId: dep.id,
      success: Math.random() > 0.1, // 90% success rate for mock
      signature: `sig_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      gasUsed: 5000n,
      fee: 5000n,
      processingTime: 500 + Math.random() * 1000,
    }));
    
    return {
      results,
      signatures: results.filter(r => r.success).map(r => r.signature!),
      gasUsed: this.calculateGas(deposits.length),
      fees: BigInt(deposits.length) * 5000n,
    };
  }
  
  private async processBatchWithdrawals(
    _pool: PoolId,
    withdrawals: WithdrawalOperation[]
  ): Promise<{ results: OperationResult[]; signatures: string[]; gasUsed: bigint; fees: bigint }> {
    // Mock implementation
    const results = withdrawals.map(wit => ({
      operationId: wit.id,
      success: Math.random() > 0.15,
      signature: `sig_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      gasUsed: 8000n,
      fee: wit.relayerFee,
      processingTime: 800 + Math.random() * 1500,
    }));
    
    return {
      results,
      signatures: results.filter(r => r.success).map(r => r.signature!),
      gasUsed: this.calculateGas(withdrawals.length) * 2n,
      fees: withdrawals.reduce((sum, w) => sum + w.relayerFee, 0n),
    };
  }
  
  private async processBatchTransfers(
    _pool: PoolId,
    transfers: TransferOperation[]
  ): Promise<{ results: OperationResult[]; signatures: string[]; gasUsed: bigint; fees: bigint }> {
    // Mock implementation
    const results = transfers.map(txf => ({
      operationId: txf.id,
      success: Math.random() > 0.1,
      signature: `sig_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      gasUsed: 6000n,
      fee: 6000n,
      processingTime: 600 + Math.random() * 1200,
    }));
    
    return {
      results,
      signatures: results.filter(r => r.success).map(r => r.signature!),
      gasUsed: this.calculateGas(transfers.length),
      fees: BigInt(transfers.length) * 6000n,
    };
  }
  
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
  
  /**
   * Subscribe to batch completion
   */
  onBatchComplete(handler: (result: BatchResult) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }
  
  private notifyListeners(result: BatchResult): void {
    for (const listener of this.listeners) {
      try {
        listener(result);
      } catch (error) {
        console.error('[BatchProcessor] Listener error:', error);
      }
    }
  }
  
  /**
   * Get queue status
   */
  getStatus(): {
    deposits: number;
    withdrawals: number;
    transfers: number;
    total: number;
    processing: boolean;
  } {
    return {
      deposits: this.depositQueue.getSize(),
      withdrawals: this.withdrawalQueue.getSize(),
      transfers: this.transferQueue.getSize(),
      total: this.depositQueue.getSize() + this.withdrawalQueue.getSize() + this.transferQueue.getSize(),
      processing: this.processing,
    };
  }
  
  /**
   * Cancel pending operation
   */
  cancel(operationId: string): boolean {
    if (this.depositQueue.remove(operationId)) return true;
    if (this.withdrawalQueue.remove(operationId)) return true;
    if (this.transferQueue.remove(operationId)) return true;
    return false;
  }
  
  /**
   * Clear all pending operations
   */
  clear(): void {
    this.depositQueue.clear();
    this.withdrawalQueue.clear();
    this.transferQueue.clear();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create batch processor
 */
export function createBatchProcessor(config?: BatchProcessorConfig): BatchProcessor {
  return new BatchProcessor(config);
}
