/**
 * @fileoverview Core type definitions for Privacy DEX
 * @description This module defines the fundamental types for privacy-preserving
 * decentralized exchange including AMM pools, swaps, and liquidity provision.
 * 
 * @module @prvcsh/dex/types
 * @version 0.1.0
 */

// =============================================================================
// TOKEN TYPES
// =============================================================================

/**
 * Token information
 */
export interface Token {
  /** Token mint address */
  readonly mint: string;
  
  /** Token symbol */
  readonly symbol: string;
  
  /** Token name */
  readonly name: string;
  
  /** Token decimals */
  readonly decimals: number;
  
  /** Token logo URI */
  readonly logoUri?: string;
  
  /** Coingecko ID for price feeds */
  readonly coingeckoId?: string;
}

/**
 * Token amount with metadata
 */
export interface TokenAmount {
  /** Token info */
  readonly token: Token;
  
  /** Raw amount (without decimals) */
  readonly amount: bigint;
  
  /** Human-readable amount */
  readonly uiAmount: number;
}

/**
 * Token pair
 */
export interface TokenPair {
  /** Base token (token A) */
  readonly tokenA: Token;
  
  /** Quote token (token B) */
  readonly tokenB: Token;
}

// =============================================================================
// POOL TYPES
// =============================================================================

/**
 * Pool type
 */
export type PoolType = 
  | 'constant-product'  // x * y = k (Uniswap V2 style)
  | 'stable'            // Optimized for stablecoins
  | 'concentrated';     // Concentrated liquidity (Uniswap V3 style)

/**
 * Pool state
 */
export type PoolState =
  | 'active'      // Trading enabled
  | 'paused'      // Trading temporarily disabled
  | 'deprecated'  // Old pool, migration available
  | 'frozen';     // Emergency freeze

/**
 * AMM Pool
 */
export interface Pool {
  /** Pool address */
  readonly address: string;
  
  /** Pool type */
  readonly type: PoolType;
  
  /** Token A info */
  readonly tokenA: Token;
  
  /** Token B info */
  readonly tokenB: Token;
  
  /** Reserve of token A */
  reserveA: bigint;
  
  /** Reserve of token B */
  reserveB: bigint;
  
  /** LP token mint */
  readonly lpMint: string;
  
  /** Total LP token supply */
  lpSupply: bigint;
  
  /** Fee in basis points (100 = 1%) */
  readonly feeBps: number;
  
  /** Protocol fee in basis points */
  readonly protocolFeeBps: number;
  
  /** Pool configuration */
  readonly config: PoolConfig;
  
  /** Pool state */
  state: PoolState;
  
  /** Pool creation timestamp */
  readonly createdAt: Date;
  
  /** Last trade timestamp */
  lastTradeAt?: Date;
  
  /** 24h volume in token A */
  volume24h: bigint;
  
  /** 24h fees collected */
  fees24h: bigint;
  
  /** Total value locked (USD) */
  tvlUsd?: number;
  
  /** Privacy features enabled */
  readonly privacyEnabled: boolean;
}

/**
 * Pool reserves snapshot
 */
export interface PoolReserves {
  /** Pool address */
  readonly poolAddress: string;
  
  /** Reserve A */
  readonly reserveA: bigint;
  
  /** Reserve B */
  readonly reserveB: bigint;
  
  /** LP supply */
  readonly lpSupply: bigint;
  
  /** Snapshot timestamp */
  readonly timestamp: Date;
  
  /** Block number */
  readonly blockNumber: number;
}

/**
 * Pool configuration
 */
export interface PoolConfig {
  /** Pool type */
  readonly type: PoolType;
  
  /** Swap fee in basis points */
  readonly swapFeeBps: number;
  
  /** Fee in basis points (alias) */
  readonly feeBps: number;
  
  /** Protocol fee in basis points */
  readonly protocolFeeBps: number;
  
  /** Enable privacy features */
  readonly privacyEnabled: boolean;
  
  /** Minimum liquidity for first deposit */
  readonly minimumLiquidity: bigint;
  
  /** Maximum price impact allowed (basis points) */
  readonly maxPriceImpactBps: number;
}

/**
 * Pool statistics
 */
export interface PoolStats {
  /** Pool address */
  readonly poolAddress: string;
  
  /** Current price (A in terms of B) */
  readonly price: number;
  
  /** 24h price change percentage */
  readonly priceChange24h: number;
  
  /** 24h volume */
  readonly volume24h: bigint;
  
  /** 7d volume */
  readonly volume7d: bigint;
  
  /** 24h fees */
  readonly fees24h: bigint;
  
  /** APR for LPs */
  readonly apr: number;
  
  /** Total value locked */
  readonly tvl: bigint;
  
  /** Total trades */
  readonly totalTrades: number;
  
  /** Unique traders */
  readonly uniqueTraders: number;
}

// =============================================================================
// SWAP TYPES
// =============================================================================

/**
 * Swap direction
 */
export type SwapDirection = 'a-to-b' | 'b-to-a';

/**
 * Swap type
 */
export type SwapType =
  | 'exact-in'   // Exact input amount, variable output
  | 'exact-out'; // Variable input, exact output amount

/**
 * Swap quote
 */
export interface SwapQuote {
  /** Input token */
  readonly inputToken: Token;
  
  /** Output token */
  readonly outputToken: Token;
  
  /** Input amount */
  readonly inputAmount: bigint;
  
  /** Output amount (before slippage) */
  readonly outputAmount: bigint;
  
  /** Minimum output (after slippage) */
  readonly minimumOutput: bigint;
  
  /** Price impact in basis points */
  readonly priceImpactBps: number;
  
  /** Fee amount */
  readonly feeAmount: bigint;
  
  /** Route through pools */
  readonly route: SwapRoute;
  
  /** Quote validity (seconds) */
  readonly validFor: number;
  
  /** Quote timestamp */
  readonly quotedAt: Date;
}

/**
 * Swap route (for multi-hop swaps)
 */
export interface SwapRoute {
  /** Route path (pool addresses) */
  readonly path: string[];
  
  /** Token path */
  readonly tokens: Token[];
  
  /** Number of hops */
  readonly hops: number;
  
  /** Total fee in basis points */
  readonly totalFeeBps: number;
}

/**
 * Swap input
 */
export interface SwapInput {
  /** Pool address */
  readonly poolAddress: string;
  
  /** Swap type */
  readonly swapType: SwapType;
  
  /** Input token mint */
  readonly inputMint: string;
  
  /** Output token mint */
  readonly outputMint: string;
  
  /** Amount (input for exact-in, output for exact-out) */
  readonly amount: bigint;
  
  /** Slippage tolerance in basis points */
  readonly slippageBps: number;
  
  /** ZK proof for private swap */
  readonly proof?: SwapProof;
  
  /** Deadline timestamp */
  readonly deadline: Date;
}

/**
 * Swap proof for private swaps
 */
export interface SwapProof {
  /** ZK proof data */
  readonly proof: Uint8Array;
  
  /** Public inputs */
  readonly publicInputs: string[];
  
  /** Nullifier (prevents double-spending) */
  readonly nullifier: string;
  
  /** Merkle root of token commitments */
  readonly merkleRoot: string;
  
  /** Commitment to swap details */
  readonly swapCommitment: string;
}

/**
 * Swap proof input (for generating proof)
 */
export interface SwapProofInput {
  /** User secret */
  readonly secret: Uint8Array;
  
  /** Random nonce */
  readonly nonce: Uint8Array;
  
  /** Input token amount */
  readonly inputAmount: bigint;
  
  /** Output token amount (expected) */
  readonly outputAmount: bigint;
  
  /** Pool address */
  readonly poolAddress: string;
  
  /** Merkle path */
  readonly merklePath: string[];
  
  /** Path indices */
  readonly pathIndices: number[];
}

/**
 * Swap result
 */
export interface SwapResult {
  /** Success status */
  readonly success: boolean;
  
  /** Actual input amount */
  readonly inputAmount?: bigint;
  
  /** Actual output amount */
  readonly outputAmount?: bigint;
  
  /** Fee paid */
  readonly feePaid?: bigint;
  
  /** Transaction hash */
  readonly txHash?: string;
  
  /** Error (if failed) */
  readonly error?: DEXError;
}

// =============================================================================
// LIQUIDITY TYPES
// =============================================================================

/**
 * Liquidity position
 */
export interface LiquidityPosition {
  /** Position ID */
  readonly positionId: string;
  
  /** Pool address */
  readonly poolAddress: string;
  
  /** Owner commitment (for privacy) */
  readonly ownerCommitment: string;
  
  /** LP token amount */
  lpAmount: bigint;
  
  /** Share of pool (basis points) */
  poolShare: number;
  
  /** Token A deposited */
  readonly depositedA: bigint;
  
  /** Token B deposited */
  readonly depositedB: bigint;
  
  /** Current value of token A */
  currentValueA: bigint;
  
  /** Current value of token B */
  currentValueB: bigint;
  
  /** Unclaimed fees in token A */
  unclaimedFeesA: bigint;
  
  /** Unclaimed fees in token B */
  unclaimedFeesB: bigint;
  
  /** Created timestamp */
  readonly createdAt: Date;
  
  /** Last updated */
  updatedAt: Date;
}

/**
 * Add liquidity input
 */
export interface AddLiquidityInput {
  /** Pool address */
  readonly poolAddress: string;
  
  /** Amount of token A */
  readonly amountA: bigint;
  
  /** Amount of token B */
  readonly amountB: bigint;
  
  /** Minimum LP tokens to receive */
  readonly minLpAmount: bigint;
  
  /** Slippage tolerance in basis points */
  readonly slippageBps: number;
  
  /** ZK proof for anonymous liquidity */
  readonly proof?: LiquidityProof;
  
  /** Deadline */
  readonly deadline: Date;
}

/**
 * Remove liquidity input
 */
export interface RemoveLiquidityInput {
  /** Pool address */
  readonly poolAddress: string;
  
  /** LP token amount to burn */
  readonly lpAmount: bigint;
  
  /** Minimum token A to receive */
  readonly minAmountA: bigint;
  
  /** Minimum token B to receive */
  readonly minAmountB: bigint;
  
  /** ZK proof for anonymous withdrawal */
  readonly proof?: LiquidityProof;
  
  /** Deadline */
  readonly deadline: Date;
}

/**
 * Liquidity proof for private LP operations
 */
export interface LiquidityProof {
  /** ZK proof data */
  readonly proof: Uint8Array;
  
  /** Public inputs */
  readonly publicInputs: string[];
  
  /** Nullifier (for withdrawals) */
  readonly nullifier?: string;
  
  /** Position commitment */
  readonly positionCommitment: string;
  
  /** Merkle root */
  readonly merkleRoot: string;
}

/**
 * Liquidity result
 */
export interface LiquidityResult {
  /** Success status */
  readonly success: boolean;
  
  /** LP tokens minted/burned */
  readonly lpAmount?: bigint;
  
  /** Token A amount */
  readonly amountA?: bigint;
  
  /** Token B amount */
  readonly amountB?: bigint;
  
  /** Position ID (for new positions) */
  readonly positionId?: string;
  
  /** Transaction hash */
  readonly txHash?: string;
  
  /** Error (if failed) */
  readonly error?: DEXError;
}

// =============================================================================
// LIMIT ORDER TYPES
// =============================================================================

/**
 * Order side
 */
export type OrderSide = 'buy' | 'sell';

/**
 * Order status
 */
export type OrderStatus =
  | 'open'       // Active, waiting for fill
  | 'partial'    // Partially filled
  | 'filled'     // Completely filled
  | 'cancelled'  // Cancelled by user
  | 'expired';   // Expired

/**
 * Limit order
 */
export interface LimitOrder {
  /** Order ID */
  readonly orderId: string;
  
  /** Pool address */
  readonly poolAddress: string;
  
  /** Order side */
  readonly side: OrderSide;
  
  /** Input token */
  readonly inputToken: Token;
  
  /** Output token */
  readonly outputToken: Token;
  
  /** Input amount */
  readonly inputAmount: bigint;
  
  /** Limit price (output per input) */
  readonly limitPrice: bigint;
  
  /** Filled amount */
  filledAmount: bigint;
  
  /** Status */
  status: OrderStatus;
  
  /** Owner commitment (for privacy) */
  readonly ownerCommitment: string;
  
  /** Created timestamp */
  readonly createdAt: Date;
  
  /** Expiry timestamp */
  readonly expiresAt: Date;
  
  /** Last fill timestamp */
  lastFilledAt?: Date;
}

/**
 * Create limit order input
 */
export interface CreateLimitOrderInput {
  /** Pool address */
  readonly poolAddress: string;
  
  /** Order side */
  readonly side: OrderSide;
  
  /** Input amount */
  readonly inputAmount: bigint;
  
  /** Limit price */
  readonly limitPrice: bigint;
  
  /** Expiry duration (seconds) */
  readonly expiryDuration: number;
  
  /** ZK proof */
  readonly proof?: SwapProof;
}

// =============================================================================
// MEV PROTECTION TYPES
// =============================================================================

/**
 * Commit-reveal state
 */
export type CommitRevealState =
  | 'committed'  // Hash committed, waiting for reveal
  | 'revealed'   // Revealed and executed
  | 'expired'    // Not revealed in time
  | 'cancelled'; // User cancelled

/**
 * Swap commitment (for MEV protection)
 */
export interface SwapCommitment {
  /** Commitment hash */
  readonly commitmentHash: string;
  
  /** Pool address (public) */
  readonly poolAddress: string;
  
  /** Committed at */
  readonly committedAt: Date;
  
  /** Reveal deadline */
  readonly revealDeadline: Date;
  
  /** State */
  state: CommitRevealState;
  
  /** Block when committed */
  readonly commitBlock: number;
}

/**
 * Commit swap input
 */
export interface CommitSwapInput {
  /** Swap details hash */
  readonly swapHash: string;
  
  /** Pool address */
  readonly poolAddress: string;
  
  /** Reveal window (seconds) */
  readonly revealWindow: number;
}

/**
 * Reveal swap input
 */
export interface RevealSwapInput {
  /** Commitment hash */
  readonly commitmentHash: string;
  
  /** Full swap input */
  readonly swap: SwapInput;
  
  /** Salt used for commitment */
  readonly salt: Uint8Array;
}

// =============================================================================
// DEX CONFIGURATION
// =============================================================================

/**
 * DEX configuration
 */
export interface DEXConfig {
  /** DEX name */
  readonly name: string;
  
  /** DEX program ID */
  readonly programId: string;
  
  /** Fee authority */
  readonly feeAuthority: string;
  
  /** Default pool fee (basis points) */
  readonly defaultFeeBps: number;
  
  /** Protocol fee percentage of pool fee */
  readonly protocolFeePercent: number;
  
  /** Minimum pool liquidity */
  readonly minPoolLiquidity: bigint;
  
  /** Maximum price impact (basis points) */
  readonly maxPriceImpactBps: number;
  
  /** Privacy mode enabled */
  readonly privacyEnabled: boolean;
  
  /** Commit-reveal window (seconds) */
  readonly commitRevealWindow: number;
  
  /** Supported tokens */
  readonly supportedTokens: Token[];
}

/**
 * DEX statistics
 */
export interface DEXStats {
  /** Total pools */
  readonly totalPools: number;
  
  /** Active pools */
  readonly activePools: number;
  
  /** Total value locked (all pools) */
  readonly totalTvl: bigint;
  
  /** 24h volume */
  readonly volume24h: bigint;
  
  /** 24h fees */
  readonly fees24h: bigint;
  
  /** Total trades */
  readonly totalTrades: number;
  
  /** Unique traders */
  readonly uniqueTraders: number;
  
  /** Private swaps count */
  readonly privateSwaps: number;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

/**
 * DEX event types
 */
export type DEXEventType =
  | 'pool_created'
  | 'swap_executed'
  | 'liquidity_added'
  | 'liquidity_removed'
  | 'order_created'
  | 'order_filled'
  | 'order_cancelled'
  | 'swap_committed'
  | 'swap_revealed';

/**
 * DEX event
 */
export interface DEXEvent {
  /** Event type */
  readonly type: DEXEventType;
  
  /** Pool address */
  readonly poolAddress?: string;
  
  /** Event data */
  readonly data: Record<string, unknown>;
  
  /** Timestamp */
  readonly timestamp: Date;
  
  /** Block number */
  readonly blockNumber: number;
  
  /** Transaction hash */
  readonly txHash: string;
}

/**
 * Event listener type
 */
export type DEXEventListener = (event: DEXEvent) => void | Promise<void>;

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * DEX error codes
 */
export enum DEXErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INVALID_CONFIG = 'INVALID_CONFIG',
  INVALID_INPUT = 'INVALID_INPUT',
  NOT_INITIALIZED = 'NOT_INITIALIZED',
  
  // Pool errors
  POOL_NOT_FOUND = 'POOL_NOT_FOUND',
  POOL_PAUSED = 'POOL_PAUSED',
  POOL_FROZEN = 'POOL_FROZEN',
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  INVALID_POOL_TYPE = 'INVALID_POOL_TYPE',
  
  // Swap errors
  SWAP_FAILED = 'SWAP_FAILED',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  PRICE_IMPACT_TOO_HIGH = 'PRICE_IMPACT_TOO_HIGH',
  INVALID_SWAP_PROOF = 'INVALID_SWAP_PROOF',
  SWAP_DEADLINE_EXCEEDED = 'SWAP_DEADLINE_EXCEEDED',
  DEADLINE_EXCEEDED = 'DEADLINE_EXCEEDED',
  NULLIFIER_ALREADY_USED = 'NULLIFIER_ALREADY_USED',
  
  // Router errors
  ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',
  ROUTE_INVALID = 'ROUTE_INVALID',
  
  // Liquidity errors
  LIQUIDITY_FAILED = 'LIQUIDITY_FAILED',
  INVALID_LIQUIDITY_PROOF = 'INVALID_LIQUIDITY_PROOF',
  INSUFFICIENT_LP_TOKENS = 'INSUFFICIENT_LP_TOKENS',
  POSITION_NOT_FOUND = 'POSITION_NOT_FOUND',
  
  // Order errors
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  ORDER_EXPIRED = 'ORDER_EXPIRED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  INVALID_LIMIT_PRICE = 'INVALID_LIMIT_PRICE',
  
  // MEV protection errors
  COMMITMENT_NOT_FOUND = 'COMMITMENT_NOT_FOUND',
  COMMITMENT_EXPIRED = 'COMMITMENT_EXPIRED',
  INVALID_REVEAL = 'INVALID_REVEAL',
  
  // Permission errors
  NOT_AUTHORIZED = 'NOT_AUTHORIZED',
}

/**
 * DEX error
 */
export class DEXError extends Error {
  constructor(
    public readonly code: DEXErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DEXError';
  }
  
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate output amount using constant product formula
 * x * y = k
 * (x + dx) * (y - dy) = k
 * dy = y * dx / (x + dx)
 * 
 * @param inputAmount Amount of input token
 * @param inputReserve Reserve of input token
 * @param outputReserve Reserve of output token
 * @param feeBps Fee in basis points
 * @returns Output amount
 */
export function calculateOutputAmount(
  inputAmount: bigint,
  inputReserve: bigint,
  outputReserve: bigint,
  feeBps: number = 30,
): bigint {
  if (inputAmount <= BigInt(0)) return BigInt(0);
  if (inputReserve <= BigInt(0) || outputReserve <= BigInt(0)) return BigInt(0);
  
  // Apply fee to input
  const inputWithFee = inputAmount * BigInt(10000 - feeBps);
  
  // Calculate output: dy = y * dx / (x + dx)
  const numerator = inputWithFee * outputReserve;
  const denominator = inputReserve * BigInt(10000) + inputWithFee;
  
  return numerator / denominator;
}

/**
 * Calculate input amount for desired output
 * 
 * @param outputAmount Desired output amount
 * @param inputReserve Reserve of input token
 * @param outputReserve Reserve of output token
 * @param feeBps Fee in basis points
 * @returns Required input amount
 */
export function calculateInputAmount(
  outputAmount: bigint,
  inputReserve: bigint,
  outputReserve: bigint,
  feeBps: number = 30,
): bigint {
  if (outputAmount <= BigInt(0)) return BigInt(0);
  if (outputAmount >= outputReserve) return BigInt(-1); // Insufficient liquidity
  
  // dx = x * dy / (y - dy) * (1 + fee)
  const numerator = inputReserve * outputAmount * BigInt(10000);
  const denominator = (outputReserve - outputAmount) * BigInt(10000 - feeBps);
  
  // Add 1 to round up
  return numerator / denominator + BigInt(1);
}

/**
 * Calculate price impact in basis points
 * 
 * @param inputAmount Input amount
 * @param outputAmount Output amount
 * @param inputReserve Input reserve
 * @param outputReserve Output reserve
 * @returns Price impact in basis points
 */
export function calculatePriceImpact(
  inputAmount: bigint,
  outputAmount: bigint,
  inputReserve: bigint,
  outputReserve: bigint,
): number {
  if (inputReserve <= BigInt(0) || outputReserve <= BigInt(0)) return 10000;
  
  // Spot price before swap
  const spotPrice = (outputReserve * BigInt(1e18)) / inputReserve;
  
  // Execution price
  const executionPrice = (outputAmount * BigInt(1e18)) / inputAmount;
  
  // Price impact = (spotPrice - executionPrice) / spotPrice * 10000
  if (spotPrice <= BigInt(0)) return 10000;
  
  const impact = ((spotPrice - executionPrice) * BigInt(10000)) / spotPrice;
  
  return Number(impact);
}

/**
 * Calculate LP tokens for initial deposit
 * 
 * @param amountA Amount of token A
 * @param amountB Amount of token B
 * @returns LP tokens to mint
 */
export function calculateInitialLpTokens(
  amountA: bigint,
  amountB: bigint,
): bigint {
  // sqrt(amountA * amountB)
  const product = amountA * amountB;
  return sqrt(product);
}

/**
 * Calculate LP tokens for subsequent deposits
 * 
 * @param amountA Amount of token A deposited
 * @param reserveA Current reserve of token A
 * @param lpSupply Current LP token supply
 * @returns LP tokens to mint
 */
export function calculateLpTokens(
  amountA: bigint,
  reserveA: bigint,
  lpSupply: bigint,
): bigint {
  if (reserveA <= BigInt(0) || lpSupply <= BigInt(0)) return BigInt(0);
  return (amountA * lpSupply) / reserveA;
}

/**
 * Calculate token amounts for LP withdrawal
 * 
 * @param lpAmount LP tokens to burn
 * @param reserveA Current reserve of token A
 * @param reserveB Current reserve of token B
 * @param lpSupply Total LP supply
 * @returns [amountA, amountB]
 */
export function calculateWithdrawAmounts(
  lpAmount: bigint,
  reserveA: bigint,
  reserveB: bigint,
  lpSupply: bigint,
): [bigint, bigint] {
  if (lpSupply <= BigInt(0)) return [BigInt(0), BigInt(0)];
  
  const amountA = (lpAmount * reserveA) / lpSupply;
  const amountB = (lpAmount * reserveB) / lpSupply;
  
  return [amountA, amountB];
}

/**
 * Calculate optimal deposit amounts to match pool ratio
 * 
 * @param desiredA Desired amount of token A
 * @param desiredB Desired amount of token B
 * @param reserveA Current reserve of token A
 * @param reserveB Current reserve of token B
 * @returns [optimalA, optimalB]
 */
export function calculateOptimalDeposit(
  desiredA: bigint,
  desiredB: bigint,
  reserveA: bigint,
  reserveB: bigint,
): [bigint, bigint] {
  if (reserveA <= BigInt(0) || reserveB <= BigInt(0)) {
    return [desiredA, desiredB];
  }
  
  // Calculate optimal B for given A
  const optimalB = (desiredA * reserveB) / reserveA;
  
  if (optimalB <= desiredB) {
    return [desiredA, optimalB];
  }
  
  // Calculate optimal A for given B
  const optimalA = (desiredB * reserveA) / reserveB;
  return [optimalA, desiredB];
}

/**
 * Calculate pool share in basis points
 * 
 * @param lpAmount User's LP tokens
 * @param lpSupply Total LP supply
 * @returns Pool share in basis points
 */
export function calculatePoolShare(
  lpAmount: bigint,
  lpSupply: bigint,
): number {
  if (lpSupply <= BigInt(0)) return 0;
  return Number((lpAmount * BigInt(10000)) / lpSupply);
}

/**
 * BigInt square root using Newton's method
 */
function sqrt(value: bigint): bigint {
  if (value < BigInt(0)) throw new Error('Square root of negative number');
  if (value < BigInt(2)) return value;
  
  let x = value;
  let y = (x + BigInt(1)) / BigInt(2);
  
  while (y < x) {
    x = y;
    y = (x + value / x) / BigInt(2);
  }
  
  return x;
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  precision: number = 6,
): string {
  const divisor = BigInt(10 ** decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const truncatedFractional = fractionalStr.slice(0, precision);
  
  if (BigInt(truncatedFractional) === BigInt(0)) {
    return wholePart.toString();
  }
  
  // Remove trailing zeros
  const trimmed = truncatedFractional.replace(/0+$/, '');
  return `${wholePart}.${trimmed}`;
}

/**
 * Parse token amount from string
 */
export function parseTokenAmount(
  amount: string,
  decimals: number,
): bigint {
  const [wholePart, fractionalPart = ''] = amount.split('.');
  
  const paddedFractional = fractionalPart.slice(0, decimals).padEnd(decimals, '0');
  
  const wholeValue = BigInt(wholePart || '0') * BigInt(10 ** decimals);
  const fractionalValue = BigInt(paddedFractional);
  
  return wholeValue + fractionalValue;
}
