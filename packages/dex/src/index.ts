/**
 * @fileoverview Privacy DEX - Main Entry Point
 * @description Privacy-preserving decentralized exchange with
 * constant product AMM, anonymous liquidity provision,
 * private swaps, and MEV protection.
 * 
 * @module @prvcsh/dex
 * @version 0.1.0
 * 
 * @example
 * ```typescript
 * import { createPrivacyDEX } from '@prvcsh/dex';
 * 
 * const dex = createPrivacyDEX({
 *   connection: solanaConnection,
 *   programId: 'YOUR_PROGRAM_ID',
 * });
 * 
 * await dex.initialize();
 * 
 * // Create pool
 * const pool = await dex.pools.createPool({
 *   tokenA: 'SOL',
 *   tokenB: 'USDC',
 *   initialAmountA: 1000n * 10n ** 9n,
 *   initialAmountB: 50000n * 10n ** 6n,
 *   config: {
 *     swapFeeBps: 30,
 *   },
 * });
 * 
 * // Get swap quote
 * const route = await dex.router.findBestRoute(
 *   'SOL',
 *   'USDC',
 *   100n * 10n ** 9n,
 * );
 * 
 * // Execute private swap
 * const result = await dex.swaps.privateSwap({
 *   poolAddress: pool.address,
 *   inputToken: 'SOL',
 *   outputToken: 'USDC',
 *   amountIn: 100n * 10n ** 9n,
 *   minAmountOut: 4900n * 10n ** 6n,
 *   proof: generateZKProof(),
 * });
 * ```
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export * from './types';

// =============================================================================
// MODULE EXPORTS
// =============================================================================

export {
  // Pool
  type IPool,
  type CreatePoolInput,
  type CreatePoolResult,
  type PoolQueryOptions,
  PoolManager,
  createPoolManager,
  DEFAULT_POOL_CONFIG,
} from './pool';

export {
  // Swap
  type ISwap,
  type SwapConfig,
  type GetQuoteInput,
  type SwapExecutionResult,
  SwapManager,
  createSwapManager,
  DEFAULT_SWAP_CONFIG,
} from './swap';

export {
  // Liquidity
  type ILiquidity,
  type IPrivateLiquidity,
  type LiquidityConfig,
  type PrivateLiquidityConfig,
  type PositionQueryOptions,
  type AddLiquidityQuote,
  type RemoveLiquidityQuote,
  type PrivatePositionData,
  type AnonymousAddLiquidityInput,
  type AnonymousRemoveLiquidityInput,
  type AnonymousLiquidityResult,
  LiquidityManager,
  PrivateLiquidityManager,
  createLiquidityManager,
  createPrivateLiquidityManager,
  DEFAULT_LIQUIDITY_CONFIG,
  DEFAULT_PRIVATE_LIQUIDITY_CONFIG,
} from './liquidity';

export {
  // Router
  type IRouter,
  type RouterConfig,
  type RouteHop,
  type RouterSwapRoute,
  type RouteQueryOptions,
  type MultiHopSwapInput,
  type MultiHopSwapResult,
  type RouterQuote,
  Router,
  createRouter,
  DEFAULT_ROUTER_CONFIG,
} from './router';

export {
  // Limit Orders
  type ILimitOrderManager,
  type LimitOrderConfig,
  type OrderSide,
  type OrderStatus,
  type OrderType,
  type TimeInForce,
  type CreateOrderInput,
  type LimitOrder,
  type OrderFill,
  type OrderBook,
  type OrderBookLevel,
  type OrderQueryOptions,
  type CancelOrderResult,
  type MatchResult,
  LimitOrderManager,
  createLimitOrderManager,
  DEFAULT_LIMIT_ORDER_CONFIG,
} from './orders';

export {
  // MEV Protection
  type IMEVProtection,
  type MEVProtectionConfig,
  type MEVProtectionStats,
  type MEVProtectionLevel,
  type CommitRevealConfig,
  type PrivateMempoolConfig,
  type OrderingStrategy,
  type TransactionType,
  type CommitStatus,
  type PrivateTransactionStatus,
  type CommitData,
  type EncryptedTransaction,
  type TransactionBatch,
  type BatchExecutionResult,
  type MEVAttackDetection,
  type RevealInput,
  type TransactionData,
  type TransactionRecord,
  // Classes
  MEVProtectionEngine,
  CommitManager,
  PrivateMempool,
  MEVAttackDetector,
  // Factory functions
  createMEVProtectionEngine,
  createCommitManager,
  createPrivateMempool,
  createMEVAttackDetector,
  createEncryptedTransaction,
  // Utilities
  encryptPayload,
  decryptPayload,
  generateNonce,
  generateCommitNonce,
  // Default configs
  DEFAULT_MEV_PROTECTION_CONFIG,
  DEFAULT_COMMIT_REVEAL_CONFIG,
  DEFAULT_PRIVATE_MEMPOOL_CONFIG,
} from './mev';

// =============================================================================
// ZK MODULE EXPORTS
// =============================================================================

export {
  // ZK Types
  type ZKProof,
  type SwapProof,
  type LiquidityProof,
  type MerkleProof,
  type FieldElement,
  type CircuitId,
  ZKError,
  ZKErrorCode,
  
  // ZK System
  type ZKSystem,
  type ZKSystemConfig,
  createZKSystem,
  
  // Prover
  type IProver,
  Prover,
  createProver,
  generateSecretKey,
  
  // Verifier
  type IVerifier,
  Verifier,
  createVerifier,
  
  // Trees
  MerkleTree,
  CommitmentTree,
  NullifierTree,
  createMerkleTree,
  createCommitmentTree,
  createNullifierTree,
  
  // Hash functions
  poseidonHash,
  createCommitment,
  createNullifier,
  FIELD_PRIME,
} from './zk';

// =============================================================================
// PRIVACY DEX TYPES
// =============================================================================

import type { DEXConfig, DEXEvent, DEXEventListener } from './types';
import { type IPool, createPoolManager, DEFAULT_POOL_CONFIG, type PoolManager } from './pool';
import { type ISwap, createSwapManager, DEFAULT_SWAP_CONFIG, type SwapManager } from './swap';
import { type ILiquidity, createLiquidityManager, DEFAULT_LIQUIDITY_CONFIG, type LiquidityManager } from './liquidity';
import { type IRouter, createRouter, DEFAULT_ROUTER_CONFIG, type Router } from './router';

/**
 * Privacy DEX configuration
 */
export interface PrivacyDEXConfig {
  /** DEX program ID */
  readonly programId: string;
  
  /** Fee authority address */
  readonly feeAuthority?: string;
  
  /** Pool configuration */
  readonly pool?: Partial<typeof DEFAULT_POOL_CONFIG>;
  
  /** Swap configuration */
  readonly swap?: Partial<typeof DEFAULT_SWAP_CONFIG>;
  
  /** Liquidity configuration */
  readonly liquidity?: Partial<typeof DEFAULT_LIQUIDITY_CONFIG>;
  
  /** Router configuration */
  readonly router?: Partial<typeof DEFAULT_ROUTER_CONFIG>;
  
  /** Enable privacy features */
  readonly privacyEnabled?: boolean;
  
  /** Enable MEV protection */
  readonly mevProtectionEnabled?: boolean;
}

/**
 * Privacy DEX instance
 */
export interface PrivacyDEX {
  /** Pool manager */
  readonly pools: IPool;
  
  /** Swap manager */
  readonly swaps: ISwap;
  
  /** Liquidity manager */
  readonly liquidity: ILiquidity;
  
  /** Router */
  readonly router: IRouter;
  
  /** DEX configuration */
  readonly config: DEXConfig;
  
  /**
   * Initialize DEX
   */
  initialize(): Promise<void>;
  
  /**
   * Check if initialized
   */
  isInitialized(): boolean;
  
  /**
   * Subscribe to all DEX events
   * @param listener Event listener
   * @returns Unsubscribe function
   */
  subscribe(listener: DEXEventListener): () => void;
  
  /**
   * Cleanup resources
   */
  destroy(): Promise<void>;
}

// =============================================================================
// PRIVACY DEX IMPLEMENTATION
// =============================================================================

/**
 * Privacy DEX implementation
 */
class PrivacyDEXImpl implements PrivacyDEX {
  readonly pools: IPool;
  readonly swaps: ISwap;
  readonly liquidity: ILiquidity;
  readonly router: IRouter;
  readonly config: DEXConfig;
  
  private _initialized: boolean = false;
  private listeners: Set<DEXEventListener> = new Set();
  private unsubscribers: Array<() => void> = [];
  
  constructor(inputConfig: PrivacyDEXConfig) {
    // Build internal config - matches DEXConfig from types
    this.config = {
      name: 'Privacy DEX',
      programId: inputConfig.programId,
      feeAuthority: inputConfig.feeAuthority ?? '',
      defaultFeeBps: 30,
      protocolFeePercent: 10,
      minPoolLiquidity: BigInt(1000),
      maxPriceImpactBps: 1000,
      privacyEnabled: inputConfig.privacyEnabled ?? true,
      commitRevealWindow: 300,
      supportedTokens: [],
    };
    
    // Create managers
    this.pools = createPoolManager({
      swapFeeBps: inputConfig.pool?.swapFeeBps ?? 30,
      protocolFeeBps: inputConfig.pool?.protocolFeeBps ?? 5,
      minimumLiquidity: inputConfig.pool?.minimumLiquidity ?? BigInt(1000),
    });
    
    this.swaps = createSwapManager(this.pools as PoolManager, {
      maxSlippageBps: inputConfig.swap?.maxSlippageBps ?? 500,
      maxPriceImpactBps: inputConfig.swap?.maxPriceImpactBps ?? 1000,
      commitRevealWindow: inputConfig.swap?.commitRevealWindow ?? 300,
    });
    
    this.liquidity = createLiquidityManager(this.pools, {
      minimumLiquidity: inputConfig.liquidity?.minimumLiquidity,
      maxSlippageBps: inputConfig.liquidity?.maxSlippageBps,
      privacyEnabled: inputConfig.liquidity?.privacyEnabled,
    });
    
    this.router = createRouter(
      this.pools,
      this.swaps as SwapManager,
      {
        maxHops: inputConfig.router?.maxHops,
        maxPriceImpactPerHopBps: inputConfig.router?.maxPriceImpactPerHopBps,
        maxTotalPriceImpactBps: inputConfig.router?.maxTotalPriceImpactBps,
        privacyEnabled: inputConfig.router?.privacyEnabled,
      },
    );
  }
  
  async initialize(): Promise<void> {
    if (this._initialized) return;
    
    // Initialize all managers
    await Promise.all([
      (this.pools as PoolManager).initialize(),
      (this.swaps as SwapManager).initialize(),
      (this.liquidity as LiquidityManager).initialize(),
      (this.router as Router).initialize(),
    ]);
    
    // Subscribe to all module events
    const forwardEvent = (event: DEXEvent) => {
      for (const listener of this.listeners) {
        Promise.resolve(listener(event)).catch(console.error);
      }
    };
    
    this.unsubscribers.push(
      (this.pools as PoolManager).subscribe(forwardEvent),
      (this.swaps as SwapManager).subscribe(forwardEvent),
      (this.liquidity as LiquidityManager).subscribe(forwardEvent),
      (this.router as Router).subscribe(forwardEvent),
    );
    
    this._initialized = true;
  }
  
  isInitialized(): boolean {
    return this._initialized;
  }
  
  subscribe(listener: DEXEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  async destroy(): Promise<void> {
    // Unsubscribe from all modules
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.unsubscribers = [];
    
    // Clear listeners
    this.listeners.clear();
    
    // Destroy all managers
    await Promise.all([
      (this.pools as PoolManager).destroy(),
      (this.swaps as SwapManager).destroy(),
      (this.liquidity as LiquidityManager).destroy(),
      (this.router as Router).destroy(),
    ]);
    
    this._initialized = false;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create Privacy DEX instance
 * 
 * @param config DEX configuration
 * @returns Privacy DEX instance
 * 
 * @example
 * ```typescript
 * const dex = createPrivacyDEX({
 *   connection: new Connection('https://api.mainnet-beta.solana.com'),
 *   programId: 'PrivacyDEX111111111111111111111111111111111',
 *   privacyEnabled: true,
 *   mevProtectionEnabled: true,
 * });
 * 
 * await dex.initialize();
 * ```
 */
export function createPrivacyDEX(config: PrivacyDEXConfig): PrivacyDEX {
  return new PrivacyDEXImpl(config);
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default createPrivacyDEX;
