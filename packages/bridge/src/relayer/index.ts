/**
 * @fileoverview Relayer module for PRVCSH Multi-Chain Bridge
 * @description The Relayer is responsible for monitoring source chain events,
 * generating proofs, and submitting transactions to the destination chain.
 * 
 * @module @prvcsh/bridge/relayer
 * @version 0.1.0
 */

import {
  BridgeError,
  BridgeErrorCode,
  type ChainId,
  type ChainConfig,
  type BridgeTransaction,
  type BridgeTransactionStatus,
  type BridgeProof,
  type BridgeEvent,
  type BridgeEventListener,
} from '../types';

// =============================================================================
// RELAYER TYPES
// =============================================================================

/**
 * Relayer status
 */
export type RelayerStatus = 
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'syncing'
  | 'active'
  | 'paused'
  | 'error';

/**
 * Relayer health information
 */
export interface RelayerHealth {
  /** Current status */
  readonly status: RelayerStatus;
  
  /** Uptime in seconds */
  readonly uptime: number;
  
  /** Last heartbeat timestamp */
  readonly lastHeartbeat: Date;
  
  /** Total transactions processed */
  readonly totalProcessed: number;
  
  /** Pending transactions */
  readonly pendingCount: number;
  
  /** Failed transactions (last 24h) */
  readonly failedCount24h: number;
  
  /** Average processing time (seconds) */
  readonly avgProcessingTime: number;
  
  /** Current gas prices per chain */
  readonly gasPrices: Partial<Record<ChainId, bigint>>;
  
  /** Chain sync status */
  readonly chainSyncStatus: Partial<Record<ChainId, ChainSyncStatus>>;
}

/**
 * Chain sync status
 */
export interface ChainSyncStatus {
  /** Current block number */
  readonly currentBlock: number;
  
  /** Synced block number */
  readonly syncedBlock: number;
  
  /** Blocks behind */
  readonly blocksBehind: number;
  
  /** Is fully synced */
  readonly isSynced: boolean;
  
  /** Last sync timestamp */
  readonly lastSync: Date;
}

/**
 * Relay request
 */
export interface RelayRequest {
  /** Transaction ID */
  readonly transactionId: string;
  
  /** Source chain */
  readonly sourceChain: ChainId;
  
  /** Destination chain */
  readonly destChain: ChainId;
  
  /** Source transaction hash */
  readonly sourceTxHash: string;
  
  /** Commitment hash */
  readonly commitment: string;
  
  /** Proof data */
  readonly proof: BridgeProof;
  
  /** Recipient on destination chain */
  readonly recipient: string;
  
  /** Amount to transfer */
  readonly amount: bigint;
  
  /** Token address/mint */
  readonly token: string;
  
  /** Requested priority (higher = faster) */
  readonly priority: RelayPriority;
  
  /** Maximum fee willing to pay */
  readonly maxFee: bigint;
  
  /** Request timestamp */
  readonly createdAt: Date;
  
  /** Request expiry */
  readonly expiresAt: Date;
}

/**
 * Relay priority levels
 */
export type RelayPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Relay response
 */
export interface RelayResponse {
  /** Request accepted */
  readonly accepted: boolean;
  
  /** Request ID (for tracking) */
  readonly requestId?: string;
  
  /** Estimated processing time (seconds) */
  readonly estimatedTime?: number;
  
  /** Queue position */
  readonly queuePosition?: number;
  
  /** Rejection reason (if not accepted) */
  readonly rejectionReason?: string;
}

/**
 * Relay result
 */
export interface RelayResult {
  /** Success status */
  readonly success: boolean;
  
  /** Destination transaction hash */
  readonly destTxHash?: string;
  
  /** Block number */
  readonly blockNumber?: number;
  
  /** Gas used */
  readonly gasUsed?: bigint;
  
  /** Actual fee paid */
  readonly feePaid?: bigint;
  
  /** Error if failed */
  readonly error?: BridgeError;
}

// =============================================================================
// RELAYER CONFIGURATION
// =============================================================================

/**
 * Relayer configuration
 */
export interface RelayerConfig {
  /** Relayer endpoint URL */
  readonly url: string;
  
  /** WebSocket endpoint for real-time updates */
  readonly wsUrl?: string;
  
  /** API key for authentication */
  readonly apiKey?: string;
  
  /** Request timeout (ms) */
  readonly timeout: number;
  
  /** Retry configuration */
  readonly retry: RetryConfig;
  
  /** Chains to monitor */
  readonly chains: readonly ChainId[];
  
  /** Minimum confirmations per chain */
  readonly confirmations: Partial<Record<ChainId, number>>;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  readonly maxRetries: number;
  
  /** Initial delay (ms) */
  readonly initialDelay: number;
  
  /** Maximum delay (ms) */
  readonly maxDelay: number;
  
  /** Backoff multiplier */
  readonly backoffMultiplier: number;
  
  /** Retryable error codes */
  readonly retryableCodes: readonly BridgeErrorCode[];
}

// =============================================================================
// RELAYER INTERFACE
// =============================================================================

/**
 * Relayer interface for cross-chain message relaying
 */
export interface IRelayer {
  /**
   * Get relayer health status
   */
  getHealth(): Promise<RelayerHealth>;
  
  /**
   * Submit a relay request
   * @param request The relay request
   * @returns Relay response
   */
  submitRequest(request: RelayRequest): Promise<RelayResponse>;
  
  /**
   * Get relay status by transaction ID
   * @param transactionId The transaction ID
   * @returns Current relay status
   */
  getStatus(transactionId: string): Promise<RelayResult | null>;
  
  /**
   * Cancel a pending relay request
   * @param transactionId The transaction ID
   * @returns Success status
   */
  cancelRequest(transactionId: string): Promise<boolean>;
  
  /**
   * Subscribe to relay events
   * @param listener Event listener
   * @returns Unsubscribe function
   */
  subscribe(listener: BridgeEventListener): () => void;
  
  /**
   * Get pending requests count
   */
  getPendingCount(): Promise<number>;
  
  /**
   * Get estimated processing time for a route
   * @param sourceChain Source chain
   * @param destChain Destination chain
   * @param priority Priority level
   */
  getEstimatedTime(
    sourceChain: ChainId,
    destChain: ChainId,
    priority: RelayPriority,
  ): Promise<number>;
  
  /**
   * Connect to relayer service
   */
  connect(): Promise<void>;
  
  /**
   * Disconnect from relayer service
   */
  disconnect(): Promise<void>;
}

// =============================================================================
// ABSTRACT RELAYER IMPLEMENTATION
// =============================================================================

/**
 * Abstract base class for relayer implementations
 */
export abstract class BaseRelayer implements IRelayer {
  protected config: RelayerConfig;
  protected relayerStatus: RelayerStatus = 'idle';
  protected listeners: Set<BridgeEventListener> = new Set();
  
  constructor(config: RelayerConfig) {
    this.config = config;
  }
  
  /**
   * Get current relayer status
   */
  getRelayerStatus(): RelayerStatus {
    return this.relayerStatus;
  }
  
  /**
   * Subscribe to relay events
   */
  subscribe(listener: BridgeEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Emit an event to all listeners
   */
  protected async emit(event: BridgeEvent): Promise<void> {
    const promises = Array.from(this.listeners).map(listener =>
      Promise.resolve(listener(event)).catch(console.error),
    );
    await Promise.all(promises);
  }
  
  /**
   * Retry an operation with exponential backoff
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    _context: string,
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.config.retry.initialDelay;
    
    for (let attempt = 0; attempt <= this.config.retry.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.config.retry.maxRetries) {
          break;
        }
        
        // Check if error is retryable
        if (error instanceof BridgeError) {
          if (!this.config.retry.retryableCodes.includes(error.code as BridgeErrorCode)) {
            throw error;
          }
        }
        
        // Wait before retrying
        await this.sleep(delay);
        delay = Math.min(
          delay * this.config.retry.backoffMultiplier,
          this.config.retry.maxDelay,
        );
      }
    }
    
    throw lastError;
  }
  
  /**
   * Sleep for specified milliseconds
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Abstract methods to be implemented by subclasses
  abstract getHealth(): Promise<RelayerHealth>;
  abstract submitRequest(request: RelayRequest): Promise<RelayResponse>;
  abstract getStatus(transactionId: string): Promise<RelayResult | null>;
  abstract cancelRequest(transactionId: string): Promise<boolean>;
  abstract getPendingCount(): Promise<number>;
  abstract getEstimatedTime(
    sourceChain: ChainId,
    destChain: ChainId,
    priority: RelayPriority,
  ): Promise<number>;
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
}

// =============================================================================
// HTTP RELAYER IMPLEMENTATION
// =============================================================================

/**
 * HTTP-based relayer client implementation
 */
export class HttpRelayer extends BaseRelayer {
  private abortController: AbortController | null = null;
  
  constructor(config: RelayerConfig) {
    super(config);
  }
  
  async connect(): Promise<void> {
    this.relayerStatus = 'connecting';
    this.abortController = new AbortController();
    
    try {
      // Verify connection by checking health
      const health = await this.getHealth();
      if (health.status === 'active' || health.status === 'syncing') {
        this.relayerStatus = 'connected';
      } else {
        this.relayerStatus = 'error';
      }
    } catch (error) {
      this.relayerStatus = 'error';
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    this.abortController?.abort();
    this.abortController = null;
    this.relayerStatus = 'idle';
  }
  
  async getHealth(): Promise<RelayerHealth> {
    const response = await this.fetch<RelayerHealth>('/health');
    return response;
  }
  
  async submitRequest(request: RelayRequest): Promise<RelayResponse> {
    return this.withRetry(
      () => this.fetch<RelayResponse>('/relay', {
        method: 'POST',
        body: JSON.stringify(this.serializeRequest(request)),
      }),
      'submitRequest',
    );
  }
  
  // Fix: Renamed to avoid conflict with BaseRelayer.getStatus()
  async getStatus(transactionId: string): Promise<RelayResult | null> {
    try {
      return await this.fetch<RelayResult>(`/relay/${transactionId}`);
    } catch (error) {
      if (error instanceof BridgeError && error.code === BridgeErrorCode.UNKNOWN_ERROR) {
        return null;
      }
      throw error;
    }
  }
  
  async cancelRequest(transactionId: string): Promise<boolean> {
    try {
      await this.fetch(`/relay/${transactionId}`, {
        method: 'DELETE',
      });
      return true;
    } catch {
      return false;
    }
  }
  
  async getPendingCount(): Promise<number> {
    const response = await this.fetch<{ count: number }>('/relay/pending');
    return response.count;
  }
  
  async getEstimatedTime(
    sourceChain: ChainId,
    destChain: ChainId,
    priority: RelayPriority,
  ): Promise<number> {
    const response = await this.fetch<{ estimatedTime: number }>(
      `/estimate?source=${sourceChain}&dest=${destChain}&priority=${priority}`,
    );
    return response.estimatedTime;
  }
  
  /**
   * Make HTTP request to relayer
   */
  private async fetch<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.config.url}${path}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
      signal: this.abortController?.signal,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
      throw new BridgeError(
        (errorData.code as BridgeErrorCode) || BridgeErrorCode.RELAYER_UNAVAILABLE,
        (errorData.message as string) || `Relayer request failed: ${response.statusText}`,
        errorData,
      );
    }
    
    return response.json() as Promise<T>;
  }
  
  /**
   * Serialize request for JSON transmission
   */
  private serializeRequest(request: RelayRequest): Record<string, unknown> {
    return {
      transactionId: request.transactionId,
      sourceChain: request.sourceChain,
      destChain: request.destChain,
      sourceTxHash: request.sourceTxHash,
      commitment: request.commitment,
      proof: {
        type: request.proof.type,
        proof: Array.from(request.proof.proof),
        publicInputs: request.proof.publicInputs,
        merkleRoot: request.proof.merkleRoot,
        commitment: request.proof.commitment,
        nullifier: request.proof.nullifier,
        targetChain: request.proof.targetChain,
        generatedAt: request.proof.generatedAt.toISOString(),
      },
      recipient: request.recipient,
      amount: request.amount.toString(),
      token: request.token,
      priority: request.priority,
      maxFee: request.maxFee.toString(),
      createdAt: request.createdAt.toISOString(),
      expiresAt: request.expiresAt.toISOString(),
    };
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a relayer instance
 */
export function createRelayer(config: RelayerConfig): IRelayer {
  return new HttpRelayer(config);
}

/**
 * Default relayer configuration
 */
export const DEFAULT_RELAYER_CONFIG: Omit<RelayerConfig, 'url' | 'chains'> = {
  timeout: 30000,
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableCodes: [
      BridgeErrorCode.RPC_ERROR,
      BridgeErrorCode.RELAYER_TIMEOUT,
      BridgeErrorCode.CHAIN_UNAVAILABLE,
    ],
  },
  confirmations: {
    'solana': 31,
    'solana-devnet': 31,
    'ethereum': 12,
    'ethereum-sepolia': 6,
    'polygon': 128,
    'polygon-mumbai': 32,
  },
};

// Re-export types for external use
export type {
  ChainId,
  ChainConfig,
  BridgeTransaction,
  BridgeTransactionStatus,
  BridgeProof,
  BridgeEvent,
  BridgeEventListener,
};

export { BridgeError, BridgeErrorCode };
