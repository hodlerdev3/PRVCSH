/**
 * @fileoverview MEV Protection Module for Privacy DEX
 * @description Implements commit-reveal schemes, private mempool, and fair ordering
 * to protect users from Maximal Extractable Value (MEV) attacks including
 * front-running, sandwich attacks, and unfair ordering.
 * 
 * @module @prvcsh/dex/mev
 * @version 0.1.0
 */

import { poseidonHash, poseidonHashMany } from '../zk/poseidon';

// =============================================================================
// MEV PROTECTION TYPES
// =============================================================================

/**
 * Transaction type for MEV protection
 */
export type TransactionType = 
  | 'swap'
  | 'add_liquidity'
  | 'remove_liquidity'
  | 'limit_order'
  | 'cancel_order';

/**
 * Commit status in commit-reveal scheme
 */
export type CommitStatus = 
  | 'committed'     // Transaction committed, waiting for reveal
  | 'revealed'      // Transaction revealed
  | 'expired'       // Commit expired without reveal
  | 'executed'      // Transaction executed successfully
  | 'failed';       // Transaction execution failed

/**
 * Private transaction status
 */
export type PrivateTransactionStatus = 
  | 'pending'       // Waiting in private mempool
  | 'batched'       // Added to batch
  | 'ordered'       // Fair ordering assigned
  | 'submitted'     // Submitted to chain
  | 'confirmed'     // Confirmed on chain
  | 'failed';       // Failed

/**
 * MEV protection level
 */
export type MEVProtectionLevel = 
  | 'none'          // No protection
  | 'commit_reveal' // Basic commit-reveal
  | 'encrypted'     // Encrypted mempool
  | 'batched'       // Batched execution
  | 'full';         // All protections enabled

/**
 * Ordering strategy for fair transaction ordering
 */
export type OrderingStrategy = 
  | 'fifo'          // First in, first out
  | 'random'        // Random ordering within batch
  | 'fair_random'   // Weighted random based on gas price
  | 'vdf';          // Verifiable delay function ordering

/**
 * Commit data for commit-reveal scheme
 */
export interface CommitData {
  /** Unique commit ID */
  readonly commitId: string;
  
  /** Hash of the transaction */
  readonly commitHash: bigint;
  
  /** Commit timestamp */
  readonly commitTimestamp: Date;
  
  /** Commit expiry timestamp */
  readonly expiryTimestamp: Date;
  
  /** Commit status */
  status: CommitStatus;
  
  /** Block number when committed */
  readonly commitBlock: number;
  
  /** User address (hashed for privacy) */
  readonly userHash: bigint;
  
  /** Transaction type (can be hidden) */
  readonly txType?: TransactionType;
  
  /** Reveal nonce (set after reveal) */
  revealNonce?: bigint;
  
  /** Reveal timestamp */
  revealTimestamp?: Date;
}

/**
 * Encrypted transaction for private mempool
 */
export interface EncryptedTransaction {
  /** Transaction ID */
  readonly id: string;
  
  /** Encrypted payload */
  readonly encryptedPayload: Uint8Array;
  
  /** Encryption nonce */
  readonly nonce: Uint8Array;
  
  /** Ephemeral public key for decryption */
  readonly ephemeralPublicKey: Uint8Array;
  
  /** Commit hash for verification */
  readonly commitHash: bigint;
  
  /** Timestamp when added to mempool */
  readonly timestamp: Date;
  
  /** Expiry timestamp */
  readonly expiryTimestamp: Date;
  
  /** Transaction status */
  status: PrivateTransactionStatus;
  
  /** Priority (gas price or similar) */
  readonly priority: bigint;
  
  /** Sequence number for ordering */
  sequenceNumber?: number;
}

/**
 * Transaction batch for batch execution
 */
export interface TransactionBatch {
  /** Batch ID */
  readonly batchId: string;
  
  /** Batch creation timestamp */
  readonly createdAt: Date;
  
  /** Batch execution timestamp */
  executedAt?: Date;
  
  /** Transactions in batch (ordered) */
  readonly transactions: EncryptedTransaction[];
  
  /** Ordering strategy used */
  readonly orderingStrategy: OrderingStrategy;
  
  /** Random seed for fair ordering (if applicable) */
  readonly randomSeed?: bigint;
  
  /** VDF output (if using VDF ordering) */
  readonly vdfOutput?: bigint;
  
  /** Batch status */
  status: 'pending' | 'ordered' | 'executing' | 'executed' | 'failed';
  
  /** Block number when submitted */
  submittedBlock?: number;
  
  /** Execution results */
  results?: BatchExecutionResult[];
}

/**
 * Batch execution result
 */
export interface BatchExecutionResult {
  /** Transaction ID */
  readonly transactionId: string;
  
  /** Success status */
  readonly success: boolean;
  
  /** Transaction hash on chain */
  readonly txHash?: string;
  
  /** Error message if failed */
  readonly error?: string;
  
  /** Gas used */
  readonly gasUsed?: bigint;
}

/**
 * MEV attack detection result
 */
export interface MEVAttackDetection {
  /** Was attack detected */
  readonly detected: boolean;
  
  /** Attack type */
  readonly attackType?: 'frontrun' | 'sandwich' | 'backrun' | 'arbitrage';
  
  /** Attacker address (if identified) */
  readonly attackerAddress?: string;
  
  /** Victim transaction ID */
  readonly victimTxId?: string;
  
  /** Estimated loss */
  readonly estimatedLoss?: bigint;
  
  /** Detection confidence (0-1) */
  readonly confidence: number;
  
  /** Detection timestamp */
  readonly detectedAt: Date;
}

/**
 * Private mempool configuration
 */
export interface PrivateMempoolConfig {
  /** Maximum transactions in mempool */
  readonly maxTransactions: number;
  
  /** Transaction expiry time (ms) */
  readonly transactionExpiry: number;
  
  /** Batch size for execution */
  readonly batchSize: number;
  
  /** Batch interval (ms) */
  readonly batchInterval: number;
  
  /** Ordering strategy */
  readonly orderingStrategy: OrderingStrategy;
  
  /** Minimum priority (gas price) */
  readonly minPriority: bigint;
  
  /** VDF time parameter (if using VDF) */
  readonly vdfTimeParameter?: number;
  
  /** Encryption enabled */
  readonly encryptionEnabled: boolean;
}

/**
 * Commit-reveal configuration
 */
export interface CommitRevealConfig {
  /** Commit phase duration (ms) */
  readonly commitPhaseDuration: number;
  
  /** Reveal phase duration (ms) */
  readonly revealPhaseDuration: number;
  
  /** Maximum commits per user */
  readonly maxCommitsPerUser: number;
  
  /** Commit expiry time (ms) */
  readonly commitExpiry: number;
  
  /** Require reveal within blocks */
  readonly revealBlockWindow: number;
  
  /** Penalty for not revealing (in basis points) */
  readonly noRevealPenaltyBps: number;
}

/**
 * MEV protection configuration
 */
export interface MEVProtectionConfig {
  /** Protection level */
  readonly protectionLevel: MEVProtectionLevel;
  
  /** Commit-reveal config */
  readonly commitReveal: CommitRevealConfig;
  
  /** Private mempool config */
  readonly privateMempool: PrivateMempoolConfig;
  
  /** Enable attack detection */
  readonly enableAttackDetection: boolean;
  
  /** Auto-protect high-value transactions */
  readonly autoProtectThreshold: bigint;
  
  /** Slippage protection (bps) */
  readonly slippageProtectionBps: number;
}

/**
 * Reveal input for commit-reveal
 */
export interface RevealInput {
  /** Commit ID */
  readonly commitId: string;
  
  /** Transaction data */
  readonly transactionData: TransactionData;
  
  /** Random nonce used in commit */
  readonly nonce: bigint;
  
  /** User signature */
  readonly signature: Uint8Array;
}

/**
 * Generic transaction data
 */
export interface TransactionData {
  /** Transaction type */
  readonly type: TransactionType;
  
  /** Pool address (for swap/liquidity) */
  readonly poolAddress?: string;
  
  /** Input token mint */
  readonly inputToken?: string;
  
  /** Output token mint */
  readonly outputToken?: string;
  
  /** Input amount */
  readonly inputAmount?: bigint;
  
  /** Minimum output amount */
  readonly minOutputAmount?: bigint;
  
  /** Maximum input amount */
  readonly maxInputAmount?: bigint;
  
  /** Order ID (for order operations) */
  readonly orderId?: string;
  
  /** Limit price */
  readonly limitPrice?: bigint;
  
  /** Deadline timestamp */
  readonly deadline?: Date;
  
  /** User address */
  readonly userAddress: string;
}

/**
 * MEV protection interface
 */
export interface IMEVProtection {
  // Commit-reveal methods
  createCommit(transactionData: TransactionData, nonce: bigint): Promise<CommitData>;
  revealCommit(input: RevealInput): Promise<boolean>;
  getCommit(commitId: string): CommitData | undefined;
  getCommitsByUser(userHash: bigint): CommitData[];
  expireCommits(): number;
  
  // Private mempool methods
  submitToMempool(encryptedTx: EncryptedTransaction): Promise<string>;
  removeFromMempool(txId: string): boolean;
  getMempoolSize(): number;
  getMempoolTransaction(txId: string): EncryptedTransaction | undefined;
  
  // Batch execution methods
  createBatch(): TransactionBatch;
  executeBatch(batchId: string): Promise<BatchExecutionResult[]>;
  getBatch(batchId: string): TransactionBatch | undefined;
  getPendingBatches(): TransactionBatch[];
  
  // MEV detection methods
  detectAttack(txId: string): MEVAttackDetection;
  getRecentAttacks(limit: number): MEVAttackDetection[];
  
  // Statistics
  getProtectionStats(): MEVProtectionStats;
}

/**
 * MEV protection statistics
 */
export interface MEVProtectionStats {
  /** Total commits */
  readonly totalCommits: number;
  
  /** Total reveals */
  readonly totalReveals: number;
  
  /** Expired commits */
  readonly expiredCommits: number;
  
  /** Total batches executed */
  readonly totalBatches: number;
  
  /** Average batch size */
  readonly avgBatchSize: number;
  
  /** Attacks detected */
  readonly attacksDetected: number;
  
  /** Estimated value protected */
  readonly valueProtected: bigint;
  
  /** Average reveal time (ms) */
  readonly avgRevealTime: number;
}

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default commit-reveal configuration
 */
export const DEFAULT_COMMIT_REVEAL_CONFIG: CommitRevealConfig = {
  commitPhaseDuration: 10_000,     // 10 seconds
  revealPhaseDuration: 30_000,     // 30 seconds
  maxCommitsPerUser: 10,
  commitExpiry: 60_000,            // 1 minute
  revealBlockWindow: 10,
  noRevealPenaltyBps: 100,         // 1%
};

/**
 * Default private mempool configuration
 */
export const DEFAULT_PRIVATE_MEMPOOL_CONFIG: PrivateMempoolConfig = {
  maxTransactions: 1000,
  transactionExpiry: 300_000,      // 5 minutes
  batchSize: 50,
  batchInterval: 400,              // ~1 Solana block
  orderingStrategy: 'fair_random',
  minPriority: 1000n,
  vdfTimeParameter: 100,
  encryptionEnabled: true,
};

/**
 * Default MEV protection configuration
 */
export const DEFAULT_MEV_PROTECTION_CONFIG: MEVProtectionConfig = {
  protectionLevel: 'full',
  commitReveal: DEFAULT_COMMIT_REVEAL_CONFIG,
  privateMempool: DEFAULT_PRIVATE_MEMPOOL_CONFIG,
  enableAttackDetection: true,
  autoProtectThreshold: 10_000_000_000n,  // 10,000 units
  slippageProtectionBps: 50,              // 0.5%
};

// =============================================================================
// COMMIT MANAGER
// =============================================================================

/**
 * Manages commit-reveal scheme for transaction hiding
 */
export class CommitManager {
  private commits: Map<string, CommitData> = new Map();
  private commitsByUser: Map<string, Set<string>> = new Map();
  private readonly config: CommitRevealConfig;
  private currentBlock: number = 0;
  
  constructor(config: Partial<CommitRevealConfig> = {}) {
    this.config = { ...DEFAULT_COMMIT_REVEAL_CONFIG, ...config };
  }
  
  /**
   * Set current block number
   */
  setCurrentBlock(block: number): void {
    this.currentBlock = block;
  }
  
  /**
   * Create a commit for a transaction
   */
  async createCommit(
    transactionData: TransactionData,
    nonce: bigint,
    userHash: bigint
  ): Promise<CommitData> {
    // Check user commit limit
    const userKey = userHash.toString();
    const userCommits = this.commitsByUser.get(userKey) || new Set();
    
    // Filter out expired commits
    const validCommits = new Set<string>();
    for (const commitId of userCommits) {
      const commit = this.commits.get(commitId);
      if (commit && commit.status === 'committed' && commit.expiryTimestamp > new Date()) {
        validCommits.add(commitId);
      }
    }
    
    if (validCommits.size >= this.config.maxCommitsPerUser) {
      throw new Error(`Maximum commits per user (${this.config.maxCommitsPerUser}) exceeded`);
    }
    
    // Generate commit hash
    const txDataHash = this.hashTransactionData(transactionData);
    const commitHash = poseidonHashMany([txDataHash, nonce, userHash]);
    
    // Generate commit ID
    const commitId = `commit_${commitHash.toString(16).slice(0, 16)}_${Date.now()}`;
    
    const now = new Date();
    const commit: CommitData = {
      commitId,
      commitHash,
      commitTimestamp: now,
      expiryTimestamp: new Date(now.getTime() + this.config.commitExpiry),
      status: 'committed',
      commitBlock: this.currentBlock,
      userHash,
      txType: transactionData.type,
    };
    
    this.commits.set(commitId, commit);
    
    // Update user commits
    validCommits.add(commitId);
    this.commitsByUser.set(userKey, validCommits);
    
    return commit;
  }
  
  /**
   * Reveal a committed transaction
   */
  async revealCommit(input: RevealInput): Promise<boolean> {
    const commit = this.commits.get(input.commitId);
    
    if (!commit) {
      throw new Error(`Commit not found: ${input.commitId}`);
    }
    
    if (commit.status !== 'committed') {
      throw new Error(`Invalid commit status: ${commit.status}`);
    }
    
    // Check expiry
    if (new Date() > commit.expiryTimestamp) {
      commit.status = 'expired';
      throw new Error('Commit has expired');
    }
    
    // Check block window
    if (this.currentBlock - commit.commitBlock > this.config.revealBlockWindow) {
      commit.status = 'expired';
      throw new Error('Reveal block window exceeded');
    }
    
    // Verify commit hash matches
    const txDataHash = this.hashTransactionData(input.transactionData);
    const expectedHash = poseidonHashMany([txDataHash, input.nonce, commit.userHash]);
    
    if (expectedHash !== commit.commitHash) {
      throw new Error('Commit hash mismatch - reveal data does not match commit');
    }
    
    // Update commit status
    commit.status = 'revealed';
    commit.revealNonce = input.nonce;
    commit.revealTimestamp = new Date();
    
    return true;
  }
  
  /**
   * Get commit by ID
   */
  getCommit(commitId: string): CommitData | undefined {
    return this.commits.get(commitId);
  }
  
  /**
   * Get all commits by user hash
   */
  getCommitsByUser(userHash: bigint): CommitData[] {
    const userKey = userHash.toString();
    const commitIds = this.commitsByUser.get(userKey);
    
    if (!commitIds) {
      return [];
    }
    
    return Array.from(commitIds)
      .map(id => this.commits.get(id))
      .filter((c): c is CommitData => c !== undefined);
  }
  
  /**
   * Expire old commits
   */
  expireCommits(): number {
    const now = new Date();
    let expiredCount = 0;
    
    for (const commit of this.commits.values()) {
      if (commit.status === 'committed' && commit.expiryTimestamp <= now) {
        commit.status = 'expired';
        expiredCount++;
      }
    }
    
    return expiredCount;
  }
  
  /**
   * Mark commit as executed
   */
  markExecuted(commitId: string): void {
    const commit = this.commits.get(commitId);
    if (commit && commit.status === 'revealed') {
      commit.status = 'executed';
    }
  }
  
  /**
   * Mark commit as failed
   */
  markFailed(commitId: string): void {
    const commit = this.commits.get(commitId);
    if (commit) {
      commit.status = 'failed';
    }
  }
  
  /**
   * Hash transaction data
   */
  private hashTransactionData(data: TransactionData): bigint {
    const typeHash = BigInt(
      data.type === 'swap' ? 1 :
      data.type === 'add_liquidity' ? 2 :
      data.type === 'remove_liquidity' ? 3 :
      data.type === 'limit_order' ? 4 : 5
    );
    
    const poolHash = data.poolAddress 
      ? this.stringToHash(data.poolAddress)
      : 0n;
    
    const inputHash = data.inputAmount || 0n;
    const outputHash = data.minOutputAmount || 0n;
    const addressHash = this.stringToHash(data.userAddress);
    
    return poseidonHashMany([typeHash, poolHash, inputHash, outputHash, addressHash]);
  }
  
  /**
   * Convert string to hash value
   */
  private stringToHash(str: string): bigint {
    // Use TextEncoder for browser/node compatibility
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    let hash = 0n;
    for (let i = 0; i < Math.min(bytes.length, 16); i++) {
      hash = (hash << 8n) | BigInt(bytes[i]);
    }
    return poseidonHash([hash]);
  }
  
  /**
   * Get commit statistics
   */
  getStats(): { total: number; committed: number; revealed: number; expired: number; executed: number } {
    let committed = 0;
    let revealed = 0;
    let expired = 0;
    let executed = 0;
    
    for (const commit of this.commits.values()) {
      switch (commit.status) {
        case 'committed': committed++; break;
        case 'revealed': revealed++; break;
        case 'expired': expired++; break;
        case 'executed': executed++; break;
      }
    }
    
    return {
      total: this.commits.size,
      committed,
      revealed,
      expired,
      executed,
    };
  }
  
  /**
   * Clear expired commits older than given age
   */
  clearOldCommits(maxAgeMs: number): number {
    const cutoff = new Date(Date.now() - maxAgeMs);
    let cleared = 0;
    
    for (const [commitId, commit] of this.commits.entries()) {
      if ((commit.status === 'expired' || commit.status === 'executed' || commit.status === 'failed') 
          && commit.commitTimestamp < cutoff) {
        this.commits.delete(commitId);
        
        // Remove from user commits
        const userKey = commit.userHash.toString();
        const userCommits = this.commitsByUser.get(userKey);
        if (userCommits) {
          userCommits.delete(commitId);
          if (userCommits.size === 0) {
            this.commitsByUser.delete(userKey);
          }
        }
        
        cleared++;
      }
    }
    
    return cleared;
  }
}

// =============================================================================
// PRIVATE MEMPOOL
// =============================================================================

/**
 * Private mempool for encrypted transaction ordering
 */
export class PrivateMempool {
  private transactions: Map<string, EncryptedTransaction> = new Map();
  private pendingBatches: Map<string, TransactionBatch> = new Map();
  private sequenceCounter: number = 0;
  private readonly config: PrivateMempoolConfig;
  private lastBatchTime: Date = new Date();
  
  constructor(config: Partial<PrivateMempoolConfig> = {}) {
    this.config = { ...DEFAULT_PRIVATE_MEMPOOL_CONFIG, ...config };
  }
  
  /**
   * Submit encrypted transaction to mempool
   */
  async submit(encryptedTx: EncryptedTransaction): Promise<string> {
    // Check capacity
    if (this.transactions.size >= this.config.maxTransactions) {
      // Remove oldest expired transactions
      this.removeExpired();
      
      if (this.transactions.size >= this.config.maxTransactions) {
        throw new Error('Mempool is full');
      }
    }
    
    // Check minimum priority
    if (encryptedTx.priority < this.config.minPriority) {
      throw new Error(`Priority ${encryptedTx.priority} below minimum ${this.config.minPriority}`);
    }
    
    // Assign sequence number
    const txWithSequence: EncryptedTransaction = {
      ...encryptedTx,
      sequenceNumber: this.sequenceCounter++,
    };
    
    this.transactions.set(encryptedTx.id, txWithSequence);
    
    return encryptedTx.id;
  }
  
  /**
   * Remove transaction from mempool
   */
  remove(txId: string): boolean {
    return this.transactions.delete(txId);
  }
  
  /**
   * Get transaction by ID
   */
  get(txId: string): EncryptedTransaction | undefined {
    return this.transactions.get(txId);
  }
  
  /**
   * Get mempool size
   */
  size(): number {
    return this.transactions.size;
  }
  
  /**
   * Remove expired transactions
   */
  removeExpired(): number {
    const now = new Date();
    let removed = 0;
    
    for (const [txId, tx] of this.transactions.entries()) {
      if (tx.expiryTimestamp <= now) {
        this.transactions.delete(txId);
        removed++;
      }
    }
    
    return removed;
  }
  
  /**
   * Create a batch from pending transactions
   */
  createBatch(randomSeed?: bigint): TransactionBatch {
    // Get pending transactions sorted by sequence
    const pending = Array.from(this.transactions.values())
      .filter(tx => tx.status === 'pending')
      .slice(0, this.config.batchSize);
    
    if (pending.length === 0) {
      throw new Error('No pending transactions to batch');
    }
    
    // Apply ordering strategy
    const ordered = this.applyOrdering(pending, randomSeed);
    
    // Update transaction statuses
    for (const tx of ordered) {
      tx.status = 'batched';
    }
    
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    
    const batch: TransactionBatch = {
      batchId,
      createdAt: new Date(),
      transactions: ordered,
      orderingStrategy: this.config.orderingStrategy,
      randomSeed,
      status: 'ordered',
    };
    
    this.pendingBatches.set(batchId, batch);
    this.lastBatchTime = new Date();
    
    return batch;
  }
  
  /**
   * Apply ordering strategy to transactions
   */
  private applyOrdering(
    transactions: EncryptedTransaction[],
    randomSeed?: bigint
  ): EncryptedTransaction[] {
    switch (this.config.orderingStrategy) {
      case 'fifo':
        return transactions.sort((a, b) => 
          (a.sequenceNumber || 0) - (b.sequenceNumber || 0)
        );
        
      case 'random':
        return this.shuffleArray(transactions, randomSeed);
        
      case 'fair_random':
        return this.fairRandomOrdering(transactions, randomSeed);
        
      case 'vdf':
        // VDF ordering would be applied separately
        return transactions.sort((a, b) => 
          (a.sequenceNumber || 0) - (b.sequenceNumber || 0)
        );
        
      default:
        return transactions;
    }
  }
  
  /**
   * Fisher-Yates shuffle with deterministic seed
   */
  private shuffleArray<T>(array: T[], seed?: bigint): T[] {
    const shuffled = [...array];
    let seedValue = seed || BigInt(Date.now());
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Simple LCG for deterministic randomness
      seedValue = (seedValue * 1103515245n + 12345n) % (2n ** 31n);
      const j = Number(seedValue % BigInt(i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }
  
  /**
   * Fair random ordering weighted by priority
   */
  private fairRandomOrdering(
    transactions: EncryptedTransaction[],
    seed?: bigint
  ): EncryptedTransaction[] {
    const result: EncryptedTransaction[] = [];
    const remaining = [...transactions];
    let seedValue = seed || BigInt(Date.now());
    
    while (remaining.length > 0) {
      // Calculate total priority
      const totalPriority = remaining.reduce((sum, tx) => sum + tx.priority, 0n);
      
      // Generate random value
      seedValue = (seedValue * 1103515245n + 12345n) % (2n ** 31n);
      const randomValue = seedValue % totalPriority;
      
      // Select transaction based on weighted random
      let cumulative = 0n;
      let selectedIdx = 0;
      
      for (let i = 0; i < remaining.length; i++) {
        cumulative += remaining[i].priority;
        if (cumulative > randomValue) {
          selectedIdx = i;
          break;
        }
      }
      
      result.push(remaining[selectedIdx]);
      remaining.splice(selectedIdx, 1);
    }
    
    return result;
  }
  
  /**
   * Get batch by ID
   */
  getBatch(batchId: string): TransactionBatch | undefined {
    return this.pendingBatches.get(batchId);
  }
  
  /**
   * Get all pending batches
   */
  getPendingBatches(): TransactionBatch[] {
    return Array.from(this.pendingBatches.values())
      .filter(b => b.status === 'pending' || b.status === 'ordered');
  }
  
  /**
   * Mark batch as executing
   */
  markBatchExecuting(batchId: string): void {
    const batch = this.pendingBatches.get(batchId);
    if (batch && batch.status === 'ordered') {
      batch.status = 'executing';
    }
  }
  
  /**
   * Mark batch as executed
   */
  markBatchExecuted(batchId: string, results: BatchExecutionResult[]): void {
    const batch = this.pendingBatches.get(batchId);
    if (batch) {
      batch.status = 'executed';
      batch.executedAt = new Date();
      batch.results = results;
      
      // Remove executed transactions from mempool
      for (const tx of batch.transactions) {
        this.transactions.delete(tx.id);
      }
    }
  }
  
  /**
   * Should create new batch based on time/size
   */
  shouldCreateBatch(): boolean {
    const timeSinceLastBatch = Date.now() - this.lastBatchTime.getTime();
    const pendingCount = Array.from(this.transactions.values())
      .filter(tx => tx.status === 'pending').length;
    
    return (timeSinceLastBatch >= this.config.batchInterval && pendingCount > 0)
      || pendingCount >= this.config.batchSize;
  }
  
  /**
   * Get mempool statistics
   */
  getStats(): { 
    size: number; 
    pending: number; 
    batched: number; 
    batchesPending: number;
    avgPriority: bigint;
  } {
    let pending = 0;
    let batched = 0;
    let totalPriority = 0n;
    
    for (const tx of this.transactions.values()) {
      if (tx.status === 'pending') pending++;
      else if (tx.status === 'batched') batched++;
      totalPriority += tx.priority;
    }
    
    return {
      size: this.transactions.size,
      pending,
      batched,
      batchesPending: this.pendingBatches.size,
      avgPriority: this.transactions.size > 0 
        ? totalPriority / BigInt(this.transactions.size) 
        : 0n,
    };
  }
}

// =============================================================================
// MEV ATTACK DETECTOR
// =============================================================================

/**
 * Detects potential MEV attacks
 */
export class MEVAttackDetector {
  private recentTransactions: Map<string, TransactionRecord> = new Map();
  private detectedAttacks: MEVAttackDetection[] = [];
  private readonly windowMs: number = 10_000; // 10 second window
  
  /**
   * Record a transaction for analysis
   */
  recordTransaction(record: TransactionRecord): void {
    this.recentTransactions.set(record.txId, record);
    this.cleanOldTransactions();
  }
  
  /**
   * Analyze for potential MEV attacks
   */
  analyze(txId: string): MEVAttackDetection {
    const tx = this.recentTransactions.get(txId);
    
    if (!tx) {
      return {
        detected: false,
        confidence: 0,
        detectedAt: new Date(),
      };
    }
    
    // Check for sandwich attack
    const sandwichResult = this.detectSandwich(tx);
    if (sandwichResult.detected) {
      this.detectedAttacks.push(sandwichResult);
      return sandwichResult;
    }
    
    // Check for frontrun
    const frontrunResult = this.detectFrontrun(tx);
    if (frontrunResult.detected) {
      this.detectedAttacks.push(frontrunResult);
      return frontrunResult;
    }
    
    // Check for backrun
    const backrunResult = this.detectBackrun(tx);
    if (backrunResult.detected) {
      this.detectedAttacks.push(backrunResult);
      return backrunResult;
    }
    
    return {
      detected: false,
      confidence: 0,
      detectedAt: new Date(),
    };
  }
  
  /**
   * Detect sandwich attack pattern
   */
  private detectSandwich(victimTx: TransactionRecord): MEVAttackDetection {
    const txList = Array.from(this.recentTransactions.values())
      .filter(tx => tx.poolAddress === victimTx.poolAddress)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const victimIdx = txList.findIndex(tx => tx.txId === victimTx.txId);
    
    if (victimIdx < 1 || victimIdx >= txList.length - 1) {
      return { detected: false, confidence: 0, detectedAt: new Date() };
    }
    
    const frontTx = txList[victimIdx - 1];
    const backTx = txList[victimIdx + 1];
    
    // Check if front and back are from same address (attacker)
    if (frontTx.userAddress !== backTx.userAddress) {
      return { detected: false, confidence: 0, detectedAt: new Date() };
    }
    
    // Check if front is buy and back is sell (or vice versa)
    const isSandwich = (
      frontTx.isBuy !== backTx.isBuy &&
      frontTx.isBuy === victimTx.isBuy
    );
    
    if (!isSandwich) {
      return { detected: false, confidence: 0, detectedAt: new Date() };
    }
    
    // Calculate estimated loss
    const estimatedLoss = this.estimateSandwichLoss(frontTx, victimTx, backTx);
    
    return {
      detected: true,
      attackType: 'sandwich',
      attackerAddress: frontTx.userAddress,
      victimTxId: victimTx.txId,
      estimatedLoss,
      confidence: 0.85,
      detectedAt: new Date(),
    };
  }
  
  /**
   * Detect frontrun attack pattern
   */
  private detectFrontrun(victimTx: TransactionRecord): MEVAttackDetection {
    const recentTxs = Array.from(this.recentTransactions.values())
      .filter(tx => 
        tx.poolAddress === victimTx.poolAddress &&
        tx.timestamp < victimTx.timestamp &&
        tx.timestamp.getTime() > victimTx.timestamp.getTime() - 2000 // Within 2 seconds before
      );
    
    for (const potentialFrontrun of recentTxs) {
      // Check if same direction and significantly larger
      if (potentialFrontrun.isBuy === victimTx.isBuy &&
          potentialFrontrun.amount > victimTx.amount * 5n) {
        
        return {
          detected: true,
          attackType: 'frontrun',
          attackerAddress: potentialFrontrun.userAddress,
          victimTxId: victimTx.txId,
          estimatedLoss: this.estimateFrontrunLoss(potentialFrontrun, victimTx),
          confidence: 0.7,
          detectedAt: new Date(),
        };
      }
    }
    
    return { detected: false, confidence: 0, detectedAt: new Date() };
  }
  
  /**
   * Detect backrun attack pattern
   */
  private detectBackrun(victimTx: TransactionRecord): MEVAttackDetection {
    const recentTxs = Array.from(this.recentTransactions.values())
      .filter(tx => 
        tx.poolAddress === victimTx.poolAddress &&
        tx.timestamp > victimTx.timestamp &&
        tx.timestamp.getTime() < victimTx.timestamp.getTime() + 2000 // Within 2 seconds after
      );
    
    for (const potentialBackrun of recentTxs) {
      // Check if opposite direction (arbitrage)
      if (potentialBackrun.isBuy !== victimTx.isBuy &&
          potentialBackrun.amount > victimTx.amount * 2n) {
        
        return {
          detected: true,
          attackType: 'backrun',
          attackerAddress: potentialBackrun.userAddress,
          victimTxId: victimTx.txId,
          confidence: 0.6,
          detectedAt: new Date(),
        };
      }
    }
    
    return { detected: false, confidence: 0, detectedAt: new Date() };
  }
  
  /**
   * Estimate loss from sandwich attack
   */
  private estimateSandwichLoss(
    frontTx: TransactionRecord,
    victimTx: TransactionRecord,
    _backTx: TransactionRecord
  ): bigint {
    // Simplified estimation based on price impact
    const priceImpact = (frontTx.amount * 100n) / (victimTx.amount + frontTx.amount);
    return (victimTx.amount * priceImpact) / 10000n;
  }
  
  /**
   * Estimate loss from frontrun attack
   */
  private estimateFrontrunLoss(
    frontrunTx: TransactionRecord,
    victimTx: TransactionRecord
  ): bigint {
    // Simplified estimation
    const priceImpact = (frontrunTx.amount * 50n) / (victimTx.amount + frontrunTx.amount);
    return (victimTx.amount * priceImpact) / 10000n;
  }
  
  /**
   * Clean old transactions outside window
   */
  private cleanOldTransactions(): void {
    const cutoff = Date.now() - this.windowMs;
    
    for (const [txId, tx] of this.recentTransactions.entries()) {
      if (tx.timestamp.getTime() < cutoff) {
        this.recentTransactions.delete(txId);
      }
    }
  }
  
  /**
   * Get recent attacks
   */
  getRecentAttacks(limit: number = 10): MEVAttackDetection[] {
    return this.detectedAttacks
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, limit);
  }
  
  /**
   * Get attack statistics
   */
  getStats(): { 
    totalDetected: number; 
    byType: Record<string, number>;
    totalLoss: bigint;
  } {
    const byType: Record<string, number> = {
      sandwich: 0,
      frontrun: 0,
      backrun: 0,
      arbitrage: 0,
    };
    
    let totalLoss = 0n;
    
    for (const attack of this.detectedAttacks) {
      if (attack.attackType) {
        byType[attack.attackType]++;
      }
      if (attack.estimatedLoss) {
        totalLoss += attack.estimatedLoss;
      }
    }
    
    return {
      totalDetected: this.detectedAttacks.length,
      byType,
      totalLoss,
    };
  }
}

/**
 * Transaction record for MEV analysis
 */
export interface TransactionRecord {
  /** Transaction ID */
  readonly txId: string;
  
  /** Pool address */
  readonly poolAddress: string;
  
  /** User address */
  readonly userAddress: string;
  
  /** Is buy transaction */
  readonly isBuy: boolean;
  
  /** Transaction amount */
  readonly amount: bigint;
  
  /** Timestamp */
  readonly timestamp: Date;
  
  /** Block number */
  readonly blockNumber: number;
  
  /** Gas price */
  readonly gasPrice?: bigint;
}

// =============================================================================
// MEV PROTECTION ENGINE
// =============================================================================

/**
 * Main MEV protection engine combining all protection mechanisms
 */
export class MEVProtectionEngine implements IMEVProtection {
  private readonly commitManager: CommitManager;
  private readonly privateMempool: PrivateMempool;
  private readonly attackDetector: MEVAttackDetector;
  private readonly config: MEVProtectionConfig;
  
  // Statistics
  private totalCommits: number = 0;
  private totalReveals: number = 0;
  private totalBatchesExecuted: number = 0;
  private totalValueProtected: bigint = 0n;
  private revealTimes: number[] = [];
  
  constructor(config: Partial<MEVProtectionConfig> = {}) {
    this.config = { ...DEFAULT_MEV_PROTECTION_CONFIG, ...config };
    this.commitManager = new CommitManager(this.config.commitReveal);
    this.privateMempool = new PrivateMempool(this.config.privateMempool);
    this.attackDetector = new MEVAttackDetector();
  }
  
  /**
   * Set current block number for commit-reveal timing
   */
  setCurrentBlock(block: number): void {
    this.commitManager.setCurrentBlock(block);
  }
  
  // ===== COMMIT-REVEAL METHODS =====
  
  /**
   * Create a commit for a transaction
   */
  async createCommit(
    transactionData: TransactionData,
    nonce: bigint
  ): Promise<CommitData> {
    const userHash = this.stringToAddressHash(transactionData.userAddress);
    const commit = await this.commitManager.createCommit(transactionData, nonce, userHash);
    this.totalCommits++;
    
    // Auto-protect high-value transactions
    if (transactionData.inputAmount && transactionData.inputAmount >= this.config.autoProtectThreshold) {
      this.totalValueProtected += transactionData.inputAmount;
    }
    
    return commit;
  }
  
  /**
   * Reveal a committed transaction
   */
  async revealCommit(input: RevealInput): Promise<boolean> {
    const commit = this.commitManager.getCommit(input.commitId);
    
    if (!commit) {
      throw new Error(`Commit not found: ${input.commitId}`);
    }
    
    const result = await this.commitManager.revealCommit(input);
    
    if (result) {
      this.totalReveals++;
      
      // Track reveal time
      if (commit.commitTimestamp) {
        const revealTime = Date.now() - commit.commitTimestamp.getTime();
        this.revealTimes.push(revealTime);
        
        // Keep only last 100 reveal times
        if (this.revealTimes.length > 100) {
          this.revealTimes.shift();
        }
      }
    }
    
    return result;
  }
  
  /**
   * Get commit by ID
   */
  getCommit(commitId: string): CommitData | undefined {
    return this.commitManager.getCommit(commitId);
  }
  
  /**
   * Get all commits by user
   */
  getCommitsByUser(userHash: bigint): CommitData[] {
    return this.commitManager.getCommitsByUser(userHash);
  }
  
  /**
   * Expire old commits
   */
  expireCommits(): number {
    return this.commitManager.expireCommits();
  }
  
  /**
   * Mark commit as executed
   */
  markCommitExecuted(commitId: string): void {
    this.commitManager.markExecuted(commitId);
  }
  
  /**
   * Mark commit as failed
   */
  markCommitFailed(commitId: string): void {
    this.commitManager.markFailed(commitId);
  }
  
  // ===== PRIVATE MEMPOOL METHODS =====
  
  /**
   * Submit encrypted transaction to mempool
   */
  async submitToMempool(encryptedTx: EncryptedTransaction): Promise<string> {
    return this.privateMempool.submit(encryptedTx);
  }
  
  /**
   * Remove transaction from mempool
   */
  removeFromMempool(txId: string): boolean {
    return this.privateMempool.remove(txId);
  }
  
  /**
   * Get mempool size
   */
  getMempoolSize(): number {
    return this.privateMempool.size();
  }
  
  /**
   * Get transaction from mempool
   */
  getMempoolTransaction(txId: string): EncryptedTransaction | undefined {
    return this.privateMempool.get(txId);
  }
  
  // ===== BATCH EXECUTION METHODS =====
  
  /**
   * Create a new batch
   */
  createBatch(): TransactionBatch {
    // Generate random seed from current time + entropy
    const randomSeed = poseidonHashMany([
      BigInt(Date.now()),
      BigInt(Math.floor(Math.random() * 1000000)),
    ]);
    
    return this.privateMempool.createBatch(randomSeed);
  }
  
  /**
   * Execute a batch
   */
  async executeBatch(batchId: string): Promise<BatchExecutionResult[]> {
    const batch = this.privateMempool.getBatch(batchId);
    
    if (!batch) {
      throw new Error(`Batch not found: ${batchId}`);
    }
    
    this.privateMempool.markBatchExecuting(batchId);
    
    // Execute each transaction in batch order
    const results: BatchExecutionResult[] = [];
    
    for (const tx of batch.transactions) {
      try {
        // In real implementation, this would:
        // 1. Decrypt the transaction
        // 2. Execute it on chain
        // 3. Return the result
        
        results.push({
          transactionId: tx.id,
          success: true,
          txHash: `0x${tx.id.slice(-16)}`,
          gasUsed: 200000n,
        });
      } catch (error) {
        results.push({
          transactionId: tx.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    this.privateMempool.markBatchExecuted(batchId, results);
    this.totalBatchesExecuted++;
    
    return results;
  }
  
  /**
   * Get batch by ID
   */
  getBatch(batchId: string): TransactionBatch | undefined {
    return this.privateMempool.getBatch(batchId);
  }
  
  /**
   * Get pending batches
   */
  getPendingBatches(): TransactionBatch[] {
    return this.privateMempool.getPendingBatches();
  }
  
  /**
   * Check if should create batch
   */
  shouldCreateBatch(): boolean {
    return this.privateMempool.shouldCreateBatch();
  }
  
  // ===== MEV DETECTION METHODS =====
  
  /**
   * Record transaction for analysis
   */
  recordTransaction(record: TransactionRecord): void {
    if (this.config.enableAttackDetection) {
      this.attackDetector.recordTransaction(record);
    }
  }
  
  /**
   * Detect MEV attack
   */
  detectAttack(txId: string): MEVAttackDetection {
    return this.attackDetector.analyze(txId);
  }
  
  /**
   * Get recent attacks
   */
  getRecentAttacks(limit: number): MEVAttackDetection[] {
    return this.attackDetector.getRecentAttacks(limit);
  }
  
  // ===== STATISTICS =====
  
  /**
   * Get protection statistics
   */
  getProtectionStats(): MEVProtectionStats {
    const commitStats = this.commitManager.getStats();
    const mempoolStats = this.privateMempool.getStats();
    const attackStats = this.attackDetector.getStats();
    
    const avgRevealTime = this.revealTimes.length > 0
      ? this.revealTimes.reduce((a, b) => a + b, 0) / this.revealTimes.length
      : 0;
    
    return {
      totalCommits: this.totalCommits,
      totalReveals: this.totalReveals,
      expiredCommits: commitStats.expired,
      totalBatches: this.totalBatchesExecuted,
      avgBatchSize: this.totalBatchesExecuted > 0
        ? mempoolStats.size / this.totalBatchesExecuted
        : 0,
      attacksDetected: attackStats.totalDetected,
      valueProtected: this.totalValueProtected,
      avgRevealTime,
    };
  }
  
  /**
   * Get configuration
   */
  getConfig(): MEVProtectionConfig {
    return this.config;
  }
  
  /**
   * Clean up old data
   */
  cleanup(maxAgeMs: number = 3600_000): void {
    this.commitManager.clearOldCommits(maxAgeMs);
    this.privateMempool.removeExpired();
  }
  
  /**
   * Convert string to address hash value
   */
  private stringToAddressHash(str: string): bigint {
    // Use TextEncoder for browser/node compatibility
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    let hash = 0n;
    for (let i = 0; i < Math.min(bytes.length, 16); i++) {
      hash = (hash << 8n) | BigInt(bytes[i]);
    }
    return poseidonHash([hash]);
  }
}

// =============================================================================
// ENCRYPTION UTILITIES
// =============================================================================

/**
 * Simple XOR encryption for transaction payload
 * In production, use proper encryption like ChaCha20-Poly1305
 */
export function encryptPayload(
  payload: Uint8Array,
  key: Uint8Array
): Uint8Array {
  const encrypted = new Uint8Array(payload.length);
  for (let i = 0; i < payload.length; i++) {
    encrypted[i] = payload[i] ^ key[i % key.length];
  }
  return encrypted;
}

/**
 * Decrypt XOR encrypted payload
 */
export function decryptPayload(
  encrypted: Uint8Array,
  key: Uint8Array
): Uint8Array {
  // XOR encryption is symmetric
  return encryptPayload(encrypted, key);
}

/**
 * Generate random nonce
 */
export function generateNonce(): Uint8Array {
  const nonce = new Uint8Array(24);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(nonce);
  } else {
    for (let i = 0; i < nonce.length; i++) {
      nonce[i] = Math.floor(Math.random() * 256);
    }
  }
  return nonce;
}

/**
 * Generate commit nonce (bigint)
 */
export function generateCommitNonce(): bigint {
  const bytes = generateNonce();
  let value = 0n;
  for (let i = 0; i < 16; i++) {
    value = (value << 8n) | BigInt(bytes[i]);
  }
  return value;
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create MEV protection engine with default config
 */
export function createMEVProtectionEngine(
  config?: Partial<MEVProtectionConfig>
): MEVProtectionEngine {
  return new MEVProtectionEngine(config);
}

/**
 * Create commit manager
 */
export function createCommitManager(
  config?: Partial<CommitRevealConfig>
): CommitManager {
  return new CommitManager(config);
}

/**
 * Create private mempool
 */
export function createPrivateMempool(
  config?: Partial<PrivateMempoolConfig>
): PrivateMempool {
  return new PrivateMempool(config);
}

/**
 * Create MEV attack detector
 */
export function createMEVAttackDetector(): MEVAttackDetector {
  return new MEVAttackDetector();
}

/**
 * Create encrypted transaction for mempool
 */
export function createEncryptedTransaction(
  id: string,
  payload: Uint8Array,
  encryptionKey: Uint8Array,
  commitHash: bigint,
  priority: bigint = 10000n,
  expiryMs: number = 300_000
): EncryptedTransaction {
  const nonce = generateNonce();
  const encryptedPayload = encryptPayload(payload, encryptionKey);
  
  return {
    id,
    encryptedPayload,
    nonce,
    ephemeralPublicKey: nonce, // Simplified - in production use proper key exchange
    commitHash,
    timestamp: new Date(),
    expiryTimestamp: new Date(Date.now() + expiryMs),
    status: 'pending',
    priority,
  };
}
