/**
 * @fileoverview PRVCSH Multi-Chain Bridge
 * @description Cross-chain bridge for private token transfers between
 * Solana, Ethereum, and Polygon networks using zero-knowledge proofs.
 * 
 * @module @prvcsh/bridge
 * @version 0.1.0
 * 
 * @example
 * ```typescript
 * import { 
 *   createBridge, 
 *   type BridgeConfig,
 *   type ChainId 
 * } from '@prvcsh/bridge';
 * 
 * const config: BridgeConfig = {
 *   enabledChains: ['solana-devnet', 'ethereum-sepolia'],
 *   defaultSourceChain: 'solana-devnet',
 *   defaultDestChain: 'ethereum-sepolia',
 *   relayerUrl: 'https://relayer.privacy.cash',
 *   fees: {
 *     baseFeePercent: 50,
 *     minFeeUsd: 1,
 *     maxFeeUsd: 100,
 *     relayerFeePercent: 10,
 *   },
 *   timeouts: {
 *     confirmationTimeout: 60000,
 *     relayerTimeout: 30000,
 *     proofTimeout: 120000,
 *     totalTimeout: 300000,
 *   },
 * };
 * 
 * const bridge = createBridge(config);
 * await bridge.initialize();
 * 
 * // Get a quote
 * const quote = await bridge.getQuote({
 *   sourceChain: 'solana-devnet',
 *   destChain: 'ethereum-sepolia',
 *   token: 'SOL',
 *   amount: 1_000_000_000n, // 1 SOL
 * });
 * 
 * // Execute bridge transfer
 * const result = await bridge.bridge({
 *   route: quote.route,
 *   recipient: '0x...',
 * });
 * ```
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Chain types
  ChainId,
  ChainType,
  ChainConfig,
  
  // Token types
  BridgeToken,
  
  // Transaction types
  BridgeTransactionStatus,
  BridgeRoute,
  BridgeTransaction,
  
  // Proof types
  ProofType,
  BridgeProof,
  ProofInput,
  
  // Configuration types
  BridgeConfig,
  BridgeFeeConfig,
  BridgeTimeoutConfig,
  
  // Event types
  BridgeEventType,
  BridgeEvent,
  BridgeEventListener,
  
  // Utility types
  BridgeQuote,
  BridgeOptions,
  BridgeResult,
} from './types';

// =============================================================================
// CONSTANT EXPORTS
// =============================================================================

export {
  SUPPORTED_CHAINS,
  BridgeErrorCode,
  BridgeError,
  isValidChainId,
  isSolanaChain,
  isEVMChain,
  isTestnet,
  getChainConfig,
} from './types';

// =============================================================================
// RELAYER EXPORTS
// =============================================================================

export type {
  RelayerStatus,
  RelayerHealth,
  ChainSyncStatus,
  RelayRequest,
  RelayPriority,
  RelayResponse,
  RelayResult,
  RelayerConfig,
  RetryConfig,
  IRelayer,
} from './relayer';

export {
  BaseRelayer,
  HttpRelayer,
  createRelayer,
  DEFAULT_RELAYER_CONFIG,
} from './relayer';

// =============================================================================
// VERIFIER EXPORTS
// =============================================================================

export type {
  VerificationResult,
  ProofGenerationResult,
  MerkleTree,
  Commitment,
  NullifierRecord,
  CircuitType,
  CircuitConfig,
  VerificationKey,
  VerifierConfig,
  CacheConfig,
  MerkleTreeConfig,
  IVerifier,
} from './verifier';

export {
  BaseVerifier,
  SnarkJSVerifier,
  createVerifier,
  DEFAULT_VERIFIER_CONFIG,
} from './verifier';

// =============================================================================
// LOCKBOX EXPORTS
// =============================================================================

export type {
  LockStatus,
  LockedDeposit,
  LockRequest,
  LockResult,
  UnlockRequest,
  UnlockResult,
  RefundRequest,
  RefundResult,
  LockboxStats,
  LockboxConfig,
  ILockbox,
} from './lockbox';

export {
  BaseLockbox,
  SolanaLockbox,
  EVMLockbox,
  createLockbox,
  DEFAULT_LOCK_DURATIONS,
} from './lockbox';

// =============================================================================
// BRIDGE CLIENT
// =============================================================================

import type {
  ChainId,
  BridgeConfig,
  BridgeRoute,
  BridgeQuote,
  BridgeOptions,
  BridgeResult,
  BridgeTransaction,
  BridgeEventListener,
} from './types';
import { getChainConfig, BridgeError, BridgeErrorCode } from './types';
import type { IRelayer, RelayerConfig } from './relayer';
import { createRelayer, DEFAULT_RELAYER_CONFIG } from './relayer';
import type { IVerifier, VerifierConfig } from './verifier';
import { createVerifier, DEFAULT_VERIFIER_CONFIG } from './verifier';
import type { ILockbox, LockboxConfig } from './lockbox';
import { createLockbox } from './lockbox';

/**
 * Bridge client interface
 */
export interface IBridge {
  /**
   * Initialize the bridge
   */
  initialize(): Promise<void>;
  
  /**
   * Get a quote for bridging
   */
  getQuote(route: BridgeRoute): Promise<BridgeQuote>;
  
  /**
   * Execute a bridge transfer
   */
  bridge(
    route: BridgeRoute,
    options?: BridgeOptions,
  ): Promise<BridgeResult>;
  
  /**
   * Get transaction status
   */
  getTransaction(transactionId: string): Promise<BridgeTransaction | null>;
  
  /**
   * Get all transactions for a sender
   */
  getTransactions(sender: string): Promise<BridgeTransaction[]>;
  
  /**
   * Subscribe to bridge events
   */
  subscribe(listener: BridgeEventListener): () => void;
  
  /**
   * Destroy the bridge client
   */
  destroy(): Promise<void>;
}

/**
 * Bridge client implementation
 */
export class Bridge implements IBridge {
  private config: BridgeConfig;
  private relayer: IRelayer;
  private verifier: IVerifier;
  private lockboxes: Map<ChainId, ILockbox> = new Map();
  private initialized: boolean = false;
  private listeners: Set<BridgeEventListener> = new Set();
  
  constructor(config: BridgeConfig) {
    this.config = config;
    
    // Create relayer
    const relayerConfig: RelayerConfig = {
      ...DEFAULT_RELAYER_CONFIG,
      url: config.relayerUrl,
      wsUrl: config.wsUrl,
      apiKey: config.apiKey,
      chains: config.enabledChains,
    };
    this.relayer = createRelayer(relayerConfig);
    
    // Create verifier (circuits would be configured separately)
    const verifierConfig: VerifierConfig = {
      ...DEFAULT_VERIFIER_CONFIG,
      circuits: {} as VerifierConfig['circuits'], // Would be loaded from config
    };
    this.verifier = createVerifier(verifierConfig);
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Initialize relayer
    await this.relayer.connect();
    
    // Initialize verifier
    await this.verifier.initialize();
    
    // Initialize lockboxes for each chain
    for (const chainId of this.config.enabledChains) {
      const chainConfig = getChainConfig(chainId);
      
      const lockboxConfig: LockboxConfig = {
        chain: chainConfig,
        address: chainConfig.lockboxAddress,
        tokens: [],
        minLockAmount: {},
        maxLockAmount: {},
        defaultLockDuration: 3600,
        minLockDuration: 600,
        maxLockDuration: 86400,
        confirmations: chainConfig.confirmations,
      };
      
      const lockbox = createLockbox(lockboxConfig);
      await lockbox.initialize();
      this.lockboxes.set(chainId, lockbox);
    }
    
    this.initialized = true;
  }
  
  async getQuote(route: BridgeRoute): Promise<BridgeQuote> {
    this.ensureInitialized();
    
    // Calculate fees
    const amountNum = Number(route.amount);
    const baseFee = BigInt(
      Math.floor(amountNum * this.config.fees.baseFeePercent / 10000)
    );
    const relayerFee = BigInt(
      Math.floor(amountNum * this.config.fees.relayerFeePercent / 10000)
    );
    const totalFee = baseFee + relayerFee;
    
    // Get estimated time from relayer
    const estimatedTime = await this.relayer.getEstimatedTime(
      route.sourceChain,
      route.destChain,
      'normal',
    );
    
    return {
      route,
      destAmount: route.amount - totalFee,
      bridgeFee: baseFee,
      relayerFee,
      totalFee,
      feePercent: (this.config.fees.baseFeePercent + this.config.fees.relayerFeePercent) / 100,
      estimatedTime,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minute expiry
      quoteId: this.generateQuoteId(),
    };
  }
  
  async bridge(
    route: BridgeRoute,
    options?: BridgeOptions,
  ): Promise<BridgeResult> {
    this.ensureInitialized();
    
    try {
      // Get lockbox for source chain
      const sourceLockbox = this.lockboxes.get(route.sourceChain);
      if (!sourceLockbox) {
        throw new BridgeError(
          BridgeErrorCode.UNSUPPORTED_CHAIN,
          `Source chain not enabled: ${route.sourceChain}`,
        );
      }
      
      // Generate commitment
      const secret = crypto.getRandomValues(new Uint8Array(32));
      const nonce = crypto.getRandomValues(new Uint8Array(32));
      const commitment = await this.verifier.computeCommitment(secret, nonce);
      
      // Lock tokens on source chain
      const lockResult = await sourceLockbox.lock({
        token: route.token,
        amount: route.amount,
        destChain: route.destChain,
        recipient: options?.recipient || '', // Would come from wallet
        commitment,
        lockDuration: 3600, // 1 hour
      });
      
      if (!lockResult.success || !lockResult.deposit) {
        return {
          success: false,
          error: lockResult.error,
        };
      }
      
      // Create bridge transaction record
      const transaction: BridgeTransaction = {
        id: lockResult.deposit.id,
        route,
        status: 'source_confirming',
        sourceTxHash: lockResult.txHash,
        sender: lockResult.deposit.sender,
        recipient: lockResult.deposit.recipient,
        commitment,
        nullifier: '', // Generated during withdrawal
        createdAt: new Date(),
        fee: BigInt(0), // From quote
        relayerFee: BigInt(0),
        estimatedTime: 0,
      };
      
      return {
        success: true,
        transaction,
      };
    } catch (error) {
      return {
        success: false,
        error: error as BridgeError,
      };
    }
  }
  
  async getTransaction(transactionId: string): Promise<BridgeTransaction | null> {
    this.ensureInitialized();
    
    // Check relayer for status
    const relayResult = await this.relayer.getStatus(transactionId);
    if (!relayResult) return null;
    
    // Would reconstruct full transaction from various sources
    return null;
  }
  
  async getTransactions(sender: string): Promise<BridgeTransaction[]> {
    this.ensureInitialized();
    
    // Query all lockboxes for sender's deposits
    const transactions: BridgeTransaction[] = [];
    
    for (const lockbox of this.lockboxes.values()) {
      const deposits = await lockbox.getDepositsBySender(sender);
      // Convert deposits to transactions
    }
    
    return transactions;
  }
  
  subscribe(listener: BridgeEventListener): () => void {
    this.listeners.add(listener);
    
    // Also subscribe to relayer events
    const unsubRelayer = this.relayer.subscribe(listener);
    
    return () => {
      this.listeners.delete(listener);
      unsubRelayer();
    };
  }
  
  async destroy(): Promise<void> {
    await this.relayer.disconnect();
    await this.verifier.destroy();
    
    for (const lockbox of this.lockboxes.values()) {
      await lockbox.destroy();
    }
    
    this.lockboxes.clear();
    this.listeners.clear();
    this.initialized = false;
  }
  
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Bridge not initialized. Call initialize() first.');
    }
  }
  
  private generateQuoteId(): string {
    return `quote-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

/**
 * Create a bridge client
 */
export function createBridge(config: BridgeConfig): IBridge {
  return new Bridge(config);
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

/**
 * Default bridge configuration for development
 */
export const DEFAULT_BRIDGE_CONFIG: Omit<BridgeConfig, 'relayerUrl'> = {
  enabledChains: ['solana-devnet', 'ethereum-sepolia', 'polygon-mumbai'],
  defaultSourceChain: 'solana-devnet',
  defaultDestChain: 'ethereum-sepolia',
  fees: {
    baseFeePercent: 50, // 0.5%
    minFeeUsd: 1,
    maxFeeUsd: 100,
    relayerFeePercent: 10, // 0.1%
  },
  timeouts: {
    confirmationTimeout: 60000,
    relayerTimeout: 30000,
    proofTimeout: 120000,
    totalTimeout: 300000,
  },
  debug: false,
};
