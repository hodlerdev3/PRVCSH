/**
 * @fileoverview On-chain Data Aggregator
 * @description Indexes deposits, withdrawals, and pool activity from Solana.
 * 
 * @module @prvcsh/analytics/aggregator
 * @version 0.1.0
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Time range for queries
 */
export type TimeRange = '1h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'all';

/**
 * Aggregation interval
 */
export type AggregationInterval = 'minute' | 'hour' | 'day' | 'week' | 'month';

/**
 * Transaction type
 */
export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'fee';

/**
 * Pool identifier
 */
export type PoolId = 'sol-0.1' | 'sol-1' | 'sol-10' | 'sol-100' | 'usdc-100' | 'usdc-1000';

/**
 * Indexed transaction
 */
export interface IndexedTransaction {
  /** Transaction signature */
  signature: string;
  
  /** Block slot */
  slot: number;
  
  /** Block timestamp */
  timestamp: Date;
  
  /** Transaction type */
  type: TransactionType;
  
  /** Pool ID */
  pool: PoolId;
  
  /** Amount in lamports or smallest unit */
  amount: bigint;
  
  /** Fee in lamports */
  fee: bigint;
  
  /** Commitment (nullifier hash for privacy) */
  commitment?: string;
  
  /** Nullifier (for withdrawals) */
  nullifier?: string;
  
  /** Success status */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Aggregated metrics for a time period
 */
export interface AggregatedMetrics {
  /** Start of period */
  periodStart: Date;
  
  /** End of period */
  periodEnd: Date;
  
  /** Total deposit count */
  depositCount: number;
  
  /** Total deposit volume */
  depositVolume: bigint;
  
  /** Total withdrawal count */
  withdrawalCount: number;
  
  /** Total withdrawal volume */
  withdrawalVolume: bigint;
  
  /** Unique depositors (estimated via commitment count) */
  uniqueDepositors: number;
  
  /** Unique withdrawers (estimated via nullifier count) */
  uniqueWithdrawers: number;
  
  /** Total fees collected */
  totalFees: bigint;
  
  /** Average anonymity set size */
  averageAnonymitySet: number;
}

/**
 * Pool metrics
 */
export interface PoolMetrics {
  /** Pool ID */
  pool: PoolId;
  
  /** Current balance (TVL) */
  tvl: bigint;
  
  /** Number of deposits in pool */
  depositCount: number;
  
  /** Number of pending withdrawals */
  pendingWithdrawals: number;
  
  /** Average time in pool */
  averageTimeInPool: number;
  
  /** 24h volume */
  volume24h: bigint;
  
  /** 7d volume */
  volume7d: bigint;
}

/**
 * Network health metrics
 */
export interface NetworkHealth {
  /** Average proof generation time (ms) */
  avgProofTime: number;
  
  /** Proof success rate */
  proofSuccessRate: number;
  
  /** Transaction success rate */
  txSuccessRate: number;
  
  /** Average confirmation time (slots) */
  avgConfirmationTime: number;
  
  /** Current TPS for PRVCSH */
  privacyCashTps: number;
  
  /** Relayer status */
  relayerStatus: 'healthy' | 'degraded' | 'down';
  
  /** Last update time */
  lastUpdate: Date;
}

/**
 * Aggregator configuration
 */
export interface AggregatorConfig {
  /** Solana RPC endpoint */
  rpcUrl: string;
  
  /** Program ID */
  programId: string;
  
  /** Start slot for historical sync */
  startSlot?: number;
  
  /** Batch size for fetching */
  batchSize?: number;
  
  /** Polling interval in ms */
  pollingInterval?: number;
  
  /** Enable real-time updates */
  enableRealtime?: boolean;
}

// =============================================================================
// DATA AGGREGATOR
// =============================================================================

/**
 * On-chain data aggregator
 */
export class DataAggregator {
  private config: Required<AggregatorConfig>;
  private transactions: Map<string, IndexedTransaction> = new Map();
  private isRunning: boolean = false;
  private lastProcessedSlot: number = 0;
  private listeners: Set<(tx: IndexedTransaction) => void> = new Set();
  
  constructor(config: AggregatorConfig) {
    this.config = {
      startSlot: 0,
      batchSize: 1000,
      pollingInterval: 5000,
      enableRealtime: true,
      ...config,
    };
  }
  
  // =============================================================================
  // LIFECYCLE
  // =============================================================================
  
  /**
   * Start the aggregator
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Start historical sync
    await this.syncHistorical();
    
    // Start real-time updates
    if (this.config.enableRealtime) {
      this.startRealtime();
    }
  }
  
  /**
   * Stop the aggregator
   */
  stop(): void {
    this.isRunning = false;
  }
  
  /**
   * Subscribe to new transactions
   */
  subscribe(handler: (tx: IndexedTransaction) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }
  
  // =============================================================================
  // SYNC
  // =============================================================================
  
  /**
   * Sync historical transactions
   */
  private async syncHistorical(): Promise<void> {
    let currentSlot = this.config.startSlot;
    
    while (this.isRunning) {
      try {
        const transactions = await this.fetchTransactions(
          currentSlot,
          currentSlot + this.config.batchSize
        );
        
        if (transactions.length === 0) {
          break;
        }
        
        for (const tx of transactions) {
          this.indexTransaction(tx);
        }
        
        currentSlot += this.config.batchSize;
        this.lastProcessedSlot = currentSlot;
        
      } catch (error) {
        console.error('[DataAggregator] Historical sync error:', error);
        await this.delay(5000);
      }
    }
  }
  
  /**
   * Start real-time updates
   */
  private startRealtime(): void {
    const poll = async () => {
      if (!this.isRunning) return;
      
      try {
        const latestSlot = await this.getLatestSlot();
        
        if (latestSlot > this.lastProcessedSlot) {
          const transactions = await this.fetchTransactions(
            this.lastProcessedSlot,
            latestSlot
          );
          
          for (const tx of transactions) {
            this.indexTransaction(tx);
            this.notifyListeners(tx);
          }
          
          this.lastProcessedSlot = latestSlot;
        }
      } catch (error) {
        console.error('[DataAggregator] Realtime update error:', error);
      }
      
      setTimeout(poll, this.config.pollingInterval);
    };
    
    poll();
  }
  
  // =============================================================================
  // QUERIES
  // =============================================================================
  
  /**
   * Get aggregated metrics for time range
   */
  getMetrics(range: TimeRange, pool?: PoolId): AggregatedMetrics {
    const now = new Date();
    const periodStart = this.getRangeStart(range, now);
    
    const filtered = this.getTransactionsInRange(periodStart, now, pool);
    
    return this.aggregateTransactions(filtered, periodStart, now);
  }
  
  /**
   * Get time series data
   */
  getTimeSeries(
    range: TimeRange,
    interval: AggregationInterval,
    metric: 'volume' | 'count' | 'fees' | 'tvl'
  ): Array<{ timestamp: Date; value: number }> {
    const now = new Date();
    const periodStart = this.getRangeStart(range, now);
    
    const intervals = this.generateIntervals(periodStart, now, interval);
    
    return intervals.map((intervalStart, index) => {
      const intervalEnd = intervals[index + 1] ?? now;
      const transactions = this.getTransactionsInRange(intervalStart, intervalEnd);
      
      let value: number;
      switch (metric) {
        case 'volume':
          value = Number(this.sumVolume(transactions)) / 1e9;
          break;
        case 'count':
          value = transactions.length;
          break;
        case 'fees':
          value = Number(this.sumFees(transactions)) / 1e9;
          break;
        case 'tvl':
          value = Number(this.calculateTVL(intervalEnd)) / 1e9;
          break;
      }
      
      return { timestamp: intervalStart, value };
    });
  }
  
  /**
   * Get pool metrics
   */
  getPoolMetrics(pool: PoolId): PoolMetrics {
    const poolTxs = Array.from(this.transactions.values())
      .filter(tx => tx.pool === pool);
    
    const deposits = poolTxs.filter(tx => tx.type === 'deposit');
    const withdrawals = poolTxs.filter(tx => tx.type === 'withdrawal');
    
    const now = new Date();
    const day = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const volume24h = this.sumVolume(poolTxs.filter(tx => tx.timestamp >= day));
    const volume7d = this.sumVolume(poolTxs.filter(tx => tx.timestamp >= week));
    
    const tvl = deposits.reduce((sum, tx) => sum + tx.amount, 0n) -
                withdrawals.reduce((sum, tx) => sum + tx.amount, 0n);
    
    return {
      pool,
      tvl,
      depositCount: deposits.length,
      pendingWithdrawals: 0, // Would need on-chain state
      averageTimeInPool: this.calculateAverageTimeInPool(poolTxs),
      volume24h,
      volume7d,
    };
  }
  
  /**
   * Get all pool metrics
   */
  getAllPoolMetrics(): PoolMetrics[] {
    const pools: PoolId[] = ['sol-0.1', 'sol-1', 'sol-10', 'sol-100', 'usdc-100', 'usdc-1000'];
    return pools.map(pool => this.getPoolMetrics(pool));
  }
  
  /**
   * Get network health
   */
  getNetworkHealth(): NetworkHealth {
    const recentTxs = Array.from(this.transactions.values())
      .filter(tx => tx.timestamp >= new Date(Date.now() - 60 * 60 * 1000));
    
    const successfulTxs = recentTxs.filter(tx => tx.success);
    
    return {
      avgProofTime: 1500, // Would come from proof service
      proofSuccessRate: 0.98,
      txSuccessRate: recentTxs.length > 0
        ? successfulTxs.length / recentTxs.length
        : 1,
      avgConfirmationTime: 2,
      privacyCashTps: recentTxs.length / 3600,
      relayerStatus: 'healthy',
      lastUpdate: new Date(),
    };
  }
  
  /**
   * Get unique user count (approximate via nullifiers)
   */
  getUniqueUserCount(range: TimeRange): number {
    const now = new Date();
    const periodStart = this.getRangeStart(range, now);
    
    const transactions = this.getTransactionsInRange(periodStart, now);
    const nullifiers = new Set(transactions.map(tx => tx.nullifier).filter(Boolean));
    const commitments = new Set(transactions.map(tx => tx.commitment).filter(Boolean));
    
    return Math.max(nullifiers.size, commitments.size);
  }
  
  /**
   * Get total value locked
   */
  getTotalTVL(): bigint {
    const allPools = this.getAllPoolMetrics();
    return allPools.reduce((sum, pool) => sum + pool.tvl, 0n);
  }
  
  // =============================================================================
  // PRIVATE HELPERS
  // =============================================================================
  
  private async fetchTransactions(
    _startSlot: number,
    _endSlot: number
  ): Promise<IndexedTransaction[]> {
    // In real implementation, fetch from RPC
    // Would use getSignaturesForAddress + getTransaction
    return [];
  }
  
  private async getLatestSlot(): Promise<number> {
    // In real implementation, fetch from RPC
    return this.lastProcessedSlot + 10;
  }
  
  private indexTransaction(tx: IndexedTransaction): void {
    this.transactions.set(tx.signature, tx);
  }
  
  private notifyListeners(tx: IndexedTransaction): void {
    for (const listener of this.listeners) {
      try {
        listener(tx);
      } catch (error) {
        console.error('[DataAggregator] Listener error:', error);
      }
    }
  }
  
  private getTransactionsInRange(
    start: Date,
    end: Date,
    pool?: PoolId
  ): IndexedTransaction[] {
    return Array.from(this.transactions.values())
      .filter(tx => 
        tx.timestamp >= start && 
        tx.timestamp <= end &&
        (!pool || tx.pool === pool)
      );
  }
  
  private aggregateTransactions(
    transactions: IndexedTransaction[],
    periodStart: Date,
    periodEnd: Date
  ): AggregatedMetrics {
    const deposits = transactions.filter(tx => tx.type === 'deposit');
    const withdrawals = transactions.filter(tx => tx.type === 'withdrawal');
    
    return {
      periodStart,
      periodEnd,
      depositCount: deposits.length,
      depositVolume: this.sumVolume(deposits),
      withdrawalCount: withdrawals.length,
      withdrawalVolume: this.sumVolume(withdrawals),
      uniqueDepositors: new Set(deposits.map(tx => tx.commitment)).size,
      uniqueWithdrawers: new Set(withdrawals.map(tx => tx.nullifier)).size,
      totalFees: this.sumFees(transactions),
      averageAnonymitySet: this.calculateAverageAnonymitySet(transactions),
    };
  }
  
  private sumVolume(transactions: IndexedTransaction[]): bigint {
    return transactions.reduce((sum, tx) => sum + tx.amount, 0n);
  }
  
  private sumFees(transactions: IndexedTransaction[]): bigint {
    return transactions.reduce((sum, tx) => sum + tx.fee, 0n);
  }
  
  private calculateTVL(asOf: Date): bigint {
    const txsBeforeDate = Array.from(this.transactions.values())
      .filter(tx => tx.timestamp <= asOf);
    
    const deposits = txsBeforeDate.filter(tx => tx.type === 'deposit');
    const withdrawals = txsBeforeDate.filter(tx => tx.type === 'withdrawal');
    
    return this.sumVolume(deposits) - this.sumVolume(withdrawals);
  }
  
  private calculateAverageAnonymitySet(_transactions: IndexedTransaction[]): number {
    // Simplified calculation - would need pool-specific logic
    return 50;
  }
  
  private calculateAverageTimeInPool(_transactions: IndexedTransaction[]): number {
    // Simplified - would need to match deposits/withdrawals
    return 24 * 60 * 60 * 1000; // 24 hours in ms
  }
  
  private getRangeStart(range: TimeRange, now: Date): Date {
    const ms = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
      'all': now.getTime(), // Beginning of time
    };
    
    if (range === 'all') {
      return new Date(0);
    }
    
    return new Date(now.getTime() - ms[range]);
  }
  
  private generateIntervals(
    start: Date,
    end: Date,
    interval: AggregationInterval
  ): Date[] {
    const intervals: Date[] = [];
    let current = new Date(start);
    
    while (current < end) {
      intervals.push(new Date(current));
      
      switch (interval) {
        case 'minute':
          current.setMinutes(current.getMinutes() + 1);
          break;
        case 'hour':
          current.setHours(current.getHours() + 1);
          break;
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }
    
    return intervals;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create data aggregator
 */
export function createDataAggregator(config: AggregatorConfig): DataAggregator {
  return new DataAggregator(config);
}
