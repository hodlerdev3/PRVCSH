/**
 * @fileoverview Router module for Privacy DEX
 * @description Multi-hop routing with path optimization
 * and privacy-preserving route execution.
 * 
 * @module @prvcsh/dex/router
 * @version 0.1.0
 */

import {
  DEXError,
  DEXErrorCode,
  calculateOutputAmount,
  calculatePriceImpact,
  type Pool,
  type SwapProof,
  type DEXEvent,
  type DEXEventListener,
} from '../types';
import { type IPool } from '../pool';
import { type ISwap } from '../swap';

// =============================================================================
// ROUTER TYPES
// =============================================================================

/**
 * Router configuration
 */
export interface RouterConfig {
  /** Maximum number of hops */
  readonly maxHops: number;
  
  /** Maximum price impact per hop (basis points) */
  readonly maxPriceImpactPerHopBps: number;
  
  /** Maximum total price impact (basis points) */
  readonly maxTotalPriceImpactBps: number;
  
  /** Enable split routes */
  readonly enableSplitRoutes: boolean;
  
  /** Maximum routes to consider */
  readonly maxRoutesToConsider: number;
  
  /** Route cache TTL (seconds) */
  readonly routeCacheTtl: number;
  
  /** Enable privacy mode */
  readonly privacyEnabled: boolean;
}

/**
 * Route hop
 */
export interface RouteHop {
  /** Pool address */
  readonly poolAddress: string;
  
  /** Input token mint */
  readonly inputTokenMint: string;
  
  /** Output token mint */
  readonly outputTokenMint: string;
  
  /** Input amount */
  readonly inputAmount: bigint;
  
  /** Expected output amount */
  readonly expectedOutput: bigint;
  
  /** Price impact (basis points) */
  readonly priceImpactBps: number;
  
  /** Fee amount */
  readonly feeAmount: bigint;
}

/**
 * Router swap route (internal representation)
 */
export interface RouterSwapRoute {
  /** Route hops */
  readonly hops: RouteHop[];
  
  /** Total input amount */
  readonly inputAmount: bigint;
  
  /** Input token mint */
  readonly inputTokenMint: string;
  
  /** Expected output amount */
  readonly expectedOutput: bigint;
  
  /** Output token mint */
  readonly outputTokenMint: string;
  
  /** Total price impact (basis points) */
  readonly totalPriceImpactBps: number;
  
  /** Total fees */
  readonly totalFees: bigint;
  
  /** Route score (higher is better) */
  readonly score: number;
  
  /** Estimated gas cost */
  readonly estimatedGas: bigint;
}

/**
 * Route query options
 */
export interface RouteQueryOptions {
  /** Maximum hops to consider */
  readonly maxHops?: number;
  
  /** Maximum price impact (basis points) */
  readonly maxPriceImpactBps?: number;
  
  /** Include low liquidity pools */
  readonly includeLowLiquidity?: boolean;
  
  /** Preferred pools */
  readonly preferredPools?: string[];
  
  /** Excluded pools */
  readonly excludedPools?: string[];
}

/**
 * Multi-hop swap input
 */
export interface MultiHopSwapInput {
  /** Swap route */
  readonly route: RouterSwapRoute;
  
  /** Minimum output amount */
  readonly minAmountOut: bigint;
  
  /** Deadline */
  readonly deadline: Date;
  
  /** Recipient address */
  readonly recipient?: string;
  
  /** ZK proof for private swap */
  readonly proof?: SwapProof;
}

/**
 * Multi-hop swap result
 */
export interface MultiHopSwapResult {
  /** Success status */
  readonly success: boolean;
  
  /** Input amount */
  readonly inputAmount?: bigint;
  
  /** Output amount */
  readonly outputAmount?: bigint;
  
  /** Executed hops */
  readonly hops?: RouteHop[];
  
  /** Transaction hash */
  readonly txHash?: string;
  
  /** Error if failed */
  readonly error?: DEXError;
}

/**
 * Router quote result
 */
export interface RouterQuote {
  /** Input token mint */
  readonly inputTokenMint: string;
  
  /** Output token mint */
  readonly outputTokenMint: string;
  
  /** Input amount */
  readonly amountIn: bigint;
  
  /** Output amount */
  readonly amountOut: bigint;
  
  /** Price impact (basis points) */
  readonly priceImpactBps: number;
  
  /** Total fee */
  readonly fee: bigint;
  
  /** Route pool addresses */
  readonly route: string[];
  
  /** Quote expiry */
  readonly expiresAt: Date;
}

// =============================================================================
// ROUTER INTERFACE
// =============================================================================

/**
 * Router interface
 */
export interface IRouter {
  findBestRoute(
    inputTokenMint: string,
    outputTokenMint: string,
    inputAmount: bigint,
    options?: RouteQueryOptions,
  ): Promise<RouterSwapRoute | null>;
  
  findAllRoutes(
    inputTokenMint: string,
    outputTokenMint: string,
    inputAmount: bigint,
    options?: RouteQueryOptions,
  ): Promise<RouterSwapRoute[]>;
  
  executeSwap(input: MultiHopSwapInput): Promise<MultiHopSwapResult>;
  
  executePrivateSwap(input: MultiHopSwapInput): Promise<MultiHopSwapResult>;
  
  getRouteQuote(route: RouterSwapRoute): Promise<RouterQuote>;
  
  validateRoute(route: RouterSwapRoute): Promise<boolean>;
  
  getTokenGraph(): Promise<Map<string, Set<string>>>;
  
  subscribe(listener: DEXEventListener): () => void;
  
  initialize(): Promise<void>;
  
  destroy(): Promise<void>;
}

// =============================================================================
// ROUTER IMPLEMENTATION
// =============================================================================

/**
 * Router implementation
 */
export class Router implements IRouter {
  private config: RouterConfig;
  private poolManager: IPool;
  private swapManager: ISwap;
  private initialized: boolean = false;
  private listeners: Set<DEXEventListener> = new Set();
  
  private tokenGraph: Map<string, Set<string>> = new Map();
  private poolsByPair: Map<string, Pool[]> = new Map();
  private routeCache: Map<string, { route: RouterSwapRoute; expiry: number }> = new Map();
  
  constructor(
    poolManager: IPool,
    swapManager: ISwap,
    config?: Partial<RouterConfig>,
  ) {
    this.poolManager = poolManager;
    this.swapManager = swapManager;
    this.config = {
      maxHops: config?.maxHops ?? 3,
      maxPriceImpactPerHopBps: config?.maxPriceImpactPerHopBps ?? 500,
      maxTotalPriceImpactBps: config?.maxTotalPriceImpactBps ?? 1000,
      enableSplitRoutes: config?.enableSplitRoutes ?? false,
      maxRoutesToConsider: config?.maxRoutesToConsider ?? 10,
      routeCacheTtl: config?.routeCacheTtl ?? 30,
      privacyEnabled: config?.privacyEnabled ?? true,
    };
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.buildTokenGraph();
    this.initialized = true;
  }
  
  async destroy(): Promise<void> {
    this.listeners.clear();
    this.tokenGraph.clear();
    this.poolsByPair.clear();
    this.routeCache.clear();
    this.initialized = false;
  }
  
  async findBestRoute(
    inputTokenMint: string,
    outputTokenMint: string,
    inputAmount: bigint,
    options?: RouteQueryOptions,
  ): Promise<RouterSwapRoute | null> {
    this.ensureInitialized();
    
    const cacheKey = this.getCacheKey(inputTokenMint, outputTokenMint, inputAmount);
    const cached = this.routeCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.route;
    }
    
    const routes = await this.findAllRoutes(inputTokenMint, outputTokenMint, inputAmount, options);
    
    if (routes.length === 0) return null;
    
    const bestRoute = routes[0];
    
    this.routeCache.set(cacheKey, {
      route: bestRoute,
      expiry: Date.now() + this.config.routeCacheTtl * 1000,
    });
    
    return bestRoute;
  }
  
  async findAllRoutes(
    inputTokenMint: string,
    outputTokenMint: string,
    inputAmount: bigint,
    options?: RouteQueryOptions,
  ): Promise<RouterSwapRoute[]> {
    this.ensureInitialized();
    
    const maxHops = options?.maxHops ?? this.config.maxHops;
    const maxPriceImpact = options?.maxPriceImpactBps ?? this.config.maxTotalPriceImpactBps;
    const excludedPools = new Set(options?.excludedPools ?? []);
    const preferredPools = new Set(options?.preferredPools ?? []);
    
    const routes: RouterSwapRoute[] = [];
    const visited = new Set<string>();
    
    await this.findRoutesRecursive(
      inputTokenMint,
      outputTokenMint,
      inputAmount,
      [],
      visited,
      maxHops,
      maxPriceImpact,
      excludedPools,
      preferredPools,
      routes,
    );
    
    routes.sort((a, b) => b.score - a.score);
    
    return routes.slice(0, this.config.maxRoutesToConsider);
  }
  
  async executeSwap(input: MultiHopSwapInput): Promise<MultiHopSwapResult> {
    this.ensureInitialized();
    
    try {
      if (new Date() > input.deadline) {
        return {
          success: false,
          error: new DEXError(DEXErrorCode.DEADLINE_EXCEEDED, 'Deadline exceeded'),
        };
      }
      
      const isValid = await this.validateRoute(input.route);
      if (!isValid) {
        return {
          success: false,
          error: new DEXError(DEXErrorCode.ROUTE_INVALID, 'Route is no longer valid'),
        };
      }
      
      let currentAmount = input.route.inputAmount;
      const executedHops: RouteHop[] = [];
      
      for (const hop of input.route.hops) {
        const swapResult = await this.swapManager.swap({
          poolAddress: hop.poolAddress,
          swapType: 'exact-in',
          inputMint: hop.inputTokenMint,
          outputMint: hop.outputTokenMint,
          amount: currentAmount,
          slippageBps: 100,
          deadline: input.deadline,
        });
        
        if (!swapResult.success) {
          return {
            success: false,
            error: swapResult.error ?? new DEXError(DEXErrorCode.SWAP_FAILED, 'Hop failed'),
          };
        }
        
        currentAmount = swapResult.outputAmount ?? BigInt(0);
        executedHops.push({
          ...hop,
          inputAmount: hop.inputAmount,
          expectedOutput: currentAmount,
        });
      }
      
      if (currentAmount < input.minAmountOut) {
        return {
          success: false,
          error: new DEXError(
            DEXErrorCode.SLIPPAGE_EXCEEDED,
            `Output ${currentAmount} below minimum ${input.minAmountOut}`,
          ),
        };
      }
      
      await this.emit({
        type: 'swap_executed',
        poolAddress: input.route.hops[0].poolAddress,
        data: {
          inputTokenMint: input.route.inputTokenMint,
          outputTokenMint: input.route.outputTokenMint,
          inputAmount: input.route.inputAmount.toString(),
          outputAmount: currentAmount.toString(),
          hops: executedHops.length,
        },
        timestamp: new Date(),
        blockNumber: 0,
        txHash: '',
      });
      
      return {
        success: true,
        inputAmount: input.route.inputAmount,
        outputAmount: currentAmount,
        hops: executedHops,
        txHash: '',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof DEXError ? error : new DEXError(DEXErrorCode.SWAP_FAILED, String(error)),
      };
    }
  }
  
  async executePrivateSwap(input: MultiHopSwapInput): Promise<MultiHopSwapResult> {
    this.ensureInitialized();
    
    if (!input.proof) {
      return {
        success: false,
        error: new DEXError(DEXErrorCode.INVALID_SWAP_PROOF, 'Proof required for private swap'),
      };
    }
    
    const isValidProof = await this.swapManager.verifySwapProof(input.proof);
    if (!isValidProof) {
      return {
        success: false,
        error: new DEXError(DEXErrorCode.INVALID_SWAP_PROOF, 'Invalid swap proof'),
      };
    }
    
    return this.executeSwap(input);
  }
  
  async getRouteQuote(route: RouterSwapRoute): Promise<RouterQuote> {
    this.ensureInitialized();
    
    let currentAmount = route.inputAmount;
    let totalFees = BigInt(0);
    let totalPriceImpact = 0;
    
    for (const hop of route.hops) {
      const pool = await this.poolManager.getPool(hop.poolAddress);
      if (!pool) {
        throw new DEXError(DEXErrorCode.POOL_NOT_FOUND, `Pool ${hop.poolAddress} not found`);
      }
      
      const isAToB = hop.inputTokenMint === pool.tokenA.mint;
      const reserveIn = isAToB ? pool.reserveA : pool.reserveB;
      const reserveOut = isAToB ? pool.reserveB : pool.reserveA;
      
      const output = calculateOutputAmount(currentAmount, reserveIn, reserveOut, pool.config.swapFeeBps);
      const priceImpact = calculatePriceImpact(currentAmount, output, reserveIn, reserveOut);
      
      totalFees += (currentAmount * BigInt(pool.config.swapFeeBps)) / BigInt(10000);
      totalPriceImpact += priceImpact;
      currentAmount = output;
    }
    
    return {
      inputTokenMint: route.inputTokenMint,
      outputTokenMint: route.outputTokenMint,
      amountIn: route.inputAmount,
      amountOut: currentAmount,
      priceImpactBps: totalPriceImpact,
      fee: totalFees,
      route: route.hops.map(h => h.poolAddress),
      expiresAt: new Date(Date.now() + 30000),
    };
  }
  
  async validateRoute(route: RouterSwapRoute): Promise<boolean> {
    try {
      for (const hop of route.hops) {
        const pool = await this.poolManager.getPool(hop.poolAddress);
        if (!pool || pool.state !== 'active') {
          return false;
        }
      }
      
      const quote = await this.getRouteQuote(route);
      if (quote.priceImpactBps > this.config.maxTotalPriceImpactBps) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  async getTokenGraph(): Promise<Map<string, Set<string>>> {
    this.ensureInitialized();
    return new Map(this.tokenGraph);
  }
  
  subscribe(listener: DEXEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  // Private methods
  
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new DEXError(DEXErrorCode.NOT_INITIALIZED, 'Router not initialized');
    }
  }
  
  private async buildTokenGraph(): Promise<void> {
    const pools = await this.poolManager.getPools({});
    
    for (const pool of pools) {
      const tokenAMint = pool.tokenA.mint;
      const tokenBMint = pool.tokenB.mint;
      
      if (!this.tokenGraph.has(tokenAMint)) {
        this.tokenGraph.set(tokenAMint, new Set());
      }
      if (!this.tokenGraph.has(tokenBMint)) {
        this.tokenGraph.set(tokenBMint, new Set());
      }
      
      this.tokenGraph.get(tokenAMint)!.add(tokenBMint);
      this.tokenGraph.get(tokenBMint)!.add(tokenAMint);
      
      const pairKey = this.getPairKey(tokenAMint, tokenBMint);
      if (!this.poolsByPair.has(pairKey)) {
        this.poolsByPair.set(pairKey, []);
      }
      this.poolsByPair.get(pairKey)!.push(pool);
    }
  }
  
  private async findRoutesRecursive(
    currentTokenMint: string,
    targetTokenMint: string,
    currentAmount: bigint,
    currentHops: RouteHop[],
    visited: Set<string>,
    maxHops: number,
    maxPriceImpact: number,
    excludedPools: Set<string>,
    preferredPools: Set<string>,
    routes: RouterSwapRoute[],
  ): Promise<void> {
    if (currentTokenMint === targetTokenMint && currentHops.length > 0) {
      const totalPriceImpact = currentHops.reduce((sum, hop) => sum + hop.priceImpactBps, 0);
      
      if (totalPriceImpact <= maxPriceImpact) {
        const route = this.buildRoute(currentHops, preferredPools);
        routes.push(route);
      }
      return;
    }
    
    if (currentHops.length >= maxHops) return;
    
    visited.add(currentTokenMint);
    
    const neighbors = this.tokenGraph.get(currentTokenMint);
    if (!neighbors) {
      visited.delete(currentTokenMint);
      return;
    }
    
    for (const nextTokenMint of neighbors) {
      if (visited.has(nextTokenMint)) continue;
      
      const pairKey = this.getPairKey(currentTokenMint, nextTokenMint);
      const pools = this.poolsByPair.get(pairKey) ?? [];
      
      for (const pool of pools) {
        if (excludedPools.has(pool.address)) continue;
        if (pool.state !== 'active') continue;
        
        const isAToB = currentTokenMint === pool.tokenA.mint;
        const reserveIn = isAToB ? pool.reserveA : pool.reserveB;
        const reserveOut = isAToB ? pool.reserveB : pool.reserveA;
        
        const output = calculateOutputAmount(currentAmount, reserveIn, reserveOut, pool.config.swapFeeBps);
        const priceImpact = calculatePriceImpact(currentAmount, output, reserveIn, reserveOut);
        
        if (priceImpact > this.config.maxPriceImpactPerHopBps) continue;
        
        const fee = (currentAmount * BigInt(pool.config.swapFeeBps)) / BigInt(10000);
        
        const hop: RouteHop = {
          poolAddress: pool.address,
          inputTokenMint: currentTokenMint,
          outputTokenMint: nextTokenMint,
          inputAmount: currentAmount,
          expectedOutput: output,
          priceImpactBps: priceImpact,
          feeAmount: fee,
        };
        
        await this.findRoutesRecursive(
          nextTokenMint,
          targetTokenMint,
          output,
          [...currentHops, hop],
          visited,
          maxHops,
          maxPriceImpact,
          excludedPools,
          preferredPools,
          routes,
        );
      }
    }
    
    visited.delete(currentTokenMint);
  }
  
  private buildRoute(hops: RouteHop[], preferredPools: Set<string>): RouterSwapRoute {
    const totalPriceImpact = hops.reduce((sum, hop) => sum + hop.priceImpactBps, 0);
    const totalFees = hops.reduce((sum, hop) => sum + hop.feeAmount, BigInt(0));
    
    let score = 10000;
    score -= hops.length * 100;
    score -= totalPriceImpact;
    
    for (const hop of hops) {
      if (preferredPools.has(hop.poolAddress)) {
        score += 50;
      }
    }
    
    const outputAmount = hops[hops.length - 1].expectedOutput;
    score += Number(outputAmount / BigInt(1000000));
    
    const estimatedGas = BigInt(100000) * BigInt(hops.length);
    
    return {
      hops,
      inputAmount: hops[0].inputAmount,
      inputTokenMint: hops[0].inputTokenMint,
      expectedOutput: hops[hops.length - 1].expectedOutput,
      outputTokenMint: hops[hops.length - 1].outputTokenMint,
      totalPriceImpactBps: totalPriceImpact,
      totalFees,
      score,
      estimatedGas,
    };
  }
  
  private getPairKey(tokenAMint: string, tokenBMint: string): string {
    return tokenAMint < tokenBMint ? `${tokenAMint}-${tokenBMint}` : `${tokenBMint}-${tokenAMint}`;
  }
  
  private getCacheKey(inputTokenMint: string, outputTokenMint: string, amount: bigint): string {
    return `${inputTokenMint}-${outputTokenMint}-${amount.toString()}`;
  }
  
  private async emit(event: DEXEvent): Promise<void> {
    const promises = Array.from(this.listeners).map(listener =>
      Promise.resolve(listener(event)).catch(console.error),
    );
    await Promise.all(promises);
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createRouter(
  poolManager: IPool,
  swapManager: ISwap,
  config?: Partial<RouterConfig>,
): IRouter {
  return new Router(poolManager, swapManager, config);
}

export const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  maxHops: 3,
  maxPriceImpactPerHopBps: 500,
  maxTotalPriceImpactBps: 1000,
  enableSplitRoutes: false,
  maxRoutesToConsider: 10,
  routeCacheTtl: 30,
  privacyEnabled: true,
};
