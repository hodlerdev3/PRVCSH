/**
 * @fileoverview Limit Orders module for Privacy DEX
 * @description Conditional swap execution with privacy-preserving limit orders.
 * Orders are stored off-chain and executed when price conditions are met.
 * 
 * @module @prvcsh/dex/orders
 * @version 0.1.0
 */

import {
  DEXError,
  DEXErrorCode,
  type Token,
  type Pool,
  type DEXEvent,
  type DEXEventListener,
  type SwapProof,
  calculateOutputAmount,
} from '../types';
import { type IPool } from '../pool';
import { type ISwap } from '../swap';

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
  | 'pending'
  | 'partially-filled'
  | 'filled'
  | 'cancelled'
  | 'expired';

/**
 * Order type
 */
export type OrderType = 
  | 'limit'
  | 'stop-loss'
  | 'take-profit'
  | 'trailing-stop';

/**
 * Time in force (order validity)
 */
export type TimeInForce = 
  | 'GTC'    // Good Till Cancelled
  | 'IOC'    // Immediate Or Cancel
  | 'FOK'    // Fill Or Kill
  | 'GTD';   // Good Till Date

/**
 * Limit order configuration
 */
export interface LimitOrderConfig {
  /** Maximum active orders per user */
  readonly maxOrdersPerUser: number;
  
  /** Minimum order size (in base token) */
  readonly minOrderSize: bigint;
  
  /** Maximum order size (in base token) */
  readonly maxOrderSize: bigint;
  
  /** Order expiry (seconds, 0 = no expiry) */
  readonly defaultExpirySeconds: number;
  
  /** Enable privacy mode */
  readonly privacyEnabled: boolean;
  
  /** Maker fee (basis points) */
  readonly makerFeeBps: number;
  
  /** Taker fee (basis points) */
  readonly takerFeeBps: number;
  
  /** Minimum price tick (basis points) */
  readonly minPriceTickBps: number;
}

/**
 * Limit order input
 */
export interface CreateOrderInput {
  /** Pool address */
  readonly poolAddress: string;
  
  /** Order side */
  readonly side: OrderSide;
  
  /** Order type */
  readonly orderType: OrderType;
  
  /** Input token mint */
  readonly inputTokenMint: string;
  
  /** Output token mint */
  readonly outputTokenMint: string;
  
  /** Input amount */
  readonly inputAmount: bigint;
  
  /** Limit price (output per input, scaled by 1e9) */
  readonly limitPrice: bigint;
  
  /** Stop price (for stop-loss/take-profit orders) */
  readonly stopPrice?: bigint;
  
  /** Trailing delta (basis points, for trailing-stop) */
  readonly trailingDeltaBps?: number;
  
  /** Time in force */
  readonly timeInForce: TimeInForce;
  
  /** Expiry timestamp */
  readonly expiresAt?: Date;
  
  /** Owner commitment (for privacy) */
  readonly ownerCommitment?: string;
  
  /** ZK proof for private orders */
  readonly proof?: SwapProof;
}

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
  
  /** Order type */
  readonly orderType: OrderType;
  
  /** Input token mint */
  readonly inputTokenMint: string;
  
  /** Output token mint */
  readonly outputTokenMint: string;
  
  /** Original input amount */
  readonly inputAmount: bigint;
  
  /** Filled input amount */
  readonly filledInputAmount: bigint;
  
  /** Remaining input amount */
  readonly remainingInputAmount: bigint;
  
  /** Limit price */
  readonly limitPrice: bigint;
  
  /** Stop price (if applicable) */
  readonly stopPrice?: bigint;
  
  /** Trailing delta (if applicable) */
  readonly trailingDeltaBps?: number;
  
  /** Current trailing price (for trailing-stop) */
  readonly trailingPrice?: bigint;
  
  /** Time in force */
  readonly timeInForce: TimeInForce;
  
  /** Order status */
  readonly status: OrderStatus;
  
  /** Average fill price */
  readonly avgFillPrice: bigint;
  
  /** Total output received */
  readonly outputReceived: bigint;
  
  /** Total fees paid */
  readonly feesPaid: bigint;
  
  /** Owner commitment (for privacy) */
  readonly ownerCommitment: string;
  
  /** Created timestamp */
  readonly createdAt: Date;
  
  /** Updated timestamp */
  readonly updatedAt: Date;
  
  /** Expiry timestamp */
  readonly expiresAt?: Date;
  
  /** Fill history */
  readonly fills: OrderFill[];
}

/**
 * Order fill record
 */
export interface OrderFill {
  /** Fill ID */
  readonly fillId: string;
  
  /** Input amount filled */
  readonly inputAmount: bigint;
  
  /** Output amount received */
  readonly outputAmount: bigint;
  
  /** Fill price */
  readonly price: bigint;
  
  /** Fee amount */
  readonly fee: bigint;
  
  /** Fill timestamp */
  readonly timestamp: Date;
  
  /** Transaction hash */
  readonly txHash: string;
}

/**
 * Order book level
 */
export interface OrderBookLevel {
  /** Price level */
  readonly price: bigint;
  
  /** Total size at this level */
  readonly size: bigint;
  
  /** Number of orders at this level */
  readonly orderCount: number;
}

/**
 * Order book
 */
export interface OrderBook {
  /** Pool address */
  readonly poolAddress: string;
  
  /** Base token (token A) */
  readonly baseToken: Token;
  
  /** Quote token (token B) */
  readonly quoteToken: Token;
  
  /** Bid levels (buy orders) */
  readonly bids: OrderBookLevel[];
  
  /** Ask levels (sell orders) */
  readonly asks: OrderBookLevel[];
  
  /** Best bid price */
  readonly bestBid: bigint;
  
  /** Best ask price */
  readonly bestAsk: bigint;
  
  /** Spread (basis points) */
  readonly spreadBps: number;
  
  /** Last update timestamp */
  readonly updatedAt: Date;
}

/**
 * Order query options
 */
export interface OrderQueryOptions {
  /** Filter by pool */
  readonly poolAddress?: string;
  
  /** Filter by owner commitment */
  readonly ownerCommitment?: string;
  
  /** Filter by status */
  readonly status?: OrderStatus[];
  
  /** Filter by side */
  readonly side?: OrderSide;
  
  /** Include expired orders */
  readonly includeExpired?: boolean;
  
  /** Limit */
  readonly limit?: number;
  
  /** Offset */
  readonly offset?: number;
}

/**
 * Cancel order result
 */
export interface CancelOrderResult {
  /** Success status */
  readonly success: boolean;
  
  /** Order ID */
  readonly orderId?: string;
  
  /** Refunded amount */
  readonly refundedAmount?: bigint;
  
  /** Error if failed */
  readonly error?: DEXError;
}

/**
 * Match result
 */
export interface MatchResult {
  /** Number of orders matched */
  readonly matchedOrders: number;
  
  /** Total input matched */
  readonly totalInputMatched: bigint;
  
  /** Total output generated */
  readonly totalOutputGenerated: bigint;
  
  /** Fills created */
  readonly fills: OrderFill[];
}

// =============================================================================
// LIMIT ORDER INTERFACE
// =============================================================================

/**
 * Limit order manager interface
 */
export interface ILimitOrderManager {
  /**
   * Create a new limit order
   */
  createOrder(input: CreateOrderInput): Promise<LimitOrder>;
  
  /**
   * Cancel an order
   */
  cancelOrder(orderId: string, proof?: SwapProof): Promise<CancelOrderResult>;
  
  /**
   * Get order by ID
   */
  getOrder(orderId: string): Promise<LimitOrder | null>;
  
  /**
   * Get orders with filters
   */
  getOrders(options?: OrderQueryOptions): Promise<LimitOrder[]>;
  
  /**
   * Get order book for a pool
   */
  getOrderBook(poolAddress: string, depth?: number): Promise<OrderBook>;
  
  /**
   * Check and execute orders that can be filled
   */
  matchOrders(poolAddress: string): Promise<MatchResult>;
  
  /**
   * Update trailing stop prices
   */
  updateTrailingStops(poolAddress: string): Promise<void>;
  
  /**
   * Expire old orders
   */
  expireOrders(): Promise<number>;
  
  /**
   * Get current market price
   */
  getMarketPrice(poolAddress: string): Promise<bigint>;
  
  /**
   * Subscribe to order events
   */
  subscribe(listener: DEXEventListener): () => void;
  
  /**
   * Initialize order manager
   */
  initialize(): Promise<void>;
  
  /**
   * Cleanup
   */
  destroy(): Promise<void>;
}

// =============================================================================
// LIMIT ORDER IMPLEMENTATION
// =============================================================================

/**
 * Limit order manager implementation
 */
export class LimitOrderManager implements ILimitOrderManager {
  private config: LimitOrderConfig;
  private poolManager: IPool;
  private swapManager: ISwap;
  private initialized: boolean = false;
  private listeners: Set<DEXEventListener> = new Set();
  
  // Order storage
  private orders: Map<string, LimitOrder> = new Map();
  private ordersByPool: Map<string, Set<string>> = new Map();
  private ordersByOwner: Map<string, Set<string>> = new Map();
  
  // Order book indices
  private buyOrders: Map<string, Map<bigint, Set<string>>> = new Map(); // pool -> price -> orderIds
  private sellOrders: Map<string, Map<bigint, Set<string>>> = new Map(); // pool -> price -> orderIds
  
  constructor(
    poolManager: IPool,
    swapManager: ISwap,
    config?: Partial<LimitOrderConfig>,
  ) {
    this.poolManager = poolManager;
    this.swapManager = swapManager;
    this.config = {
      maxOrdersPerUser: config?.maxOrdersPerUser ?? 100,
      minOrderSize: config?.minOrderSize ?? BigInt(1000),
      maxOrderSize: config?.maxOrderSize ?? BigInt(1e18),
      defaultExpirySeconds: config?.defaultExpirySeconds ?? 7 * 24 * 60 * 60, // 7 days
      privacyEnabled: config?.privacyEnabled ?? true,
      makerFeeBps: config?.makerFeeBps ?? 10, // 0.1%
      takerFeeBps: config?.takerFeeBps ?? 30, // 0.3%
      minPriceTickBps: config?.minPriceTickBps ?? 1, // 0.01%
    };
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }
  
  async destroy(): Promise<void> {
    this.listeners.clear();
    this.orders.clear();
    this.ordersByPool.clear();
    this.ordersByOwner.clear();
    this.buyOrders.clear();
    this.sellOrders.clear();
    this.initialized = false;
  }
  
  async createOrder(input: CreateOrderInput): Promise<LimitOrder> {
    this.ensureInitialized();
    
    // Validate pool
    const pool = await this.poolManager.getPool(input.poolAddress);
    if (!pool) {
      throw new DEXError(DEXErrorCode.POOL_NOT_FOUND, `Pool ${input.poolAddress} not found`);
    }
    
    // Validate order size
    if (input.inputAmount < this.config.minOrderSize) {
      throw new DEXError(
        DEXErrorCode.INVALID_INPUT,
        `Order size ${input.inputAmount} below minimum ${this.config.minOrderSize}`,
      );
    }
    
    if (input.inputAmount > this.config.maxOrderSize) {
      throw new DEXError(
        DEXErrorCode.INVALID_INPUT,
        `Order size ${input.inputAmount} above maximum ${this.config.maxOrderSize}`,
      );
    }
    
    // Validate price
    if (input.limitPrice <= BigInt(0)) {
      throw new DEXError(DEXErrorCode.INVALID_INPUT, 'Limit price must be positive');
    }
    
    // Check max orders per user
    const ownerKey = input.ownerCommitment ?? 'anonymous';
    const ownerOrders = this.ordersByOwner.get(ownerKey);
    if (ownerOrders && ownerOrders.size >= this.config.maxOrdersPerUser) {
      throw new DEXError(
        DEXErrorCode.INVALID_INPUT,
        `Maximum orders (${this.config.maxOrdersPerUser}) reached`,
      );
    }
    
    // Generate order ID
    const orderId = this.generateOrderId();
    
    // Calculate expiry
    const expiresAt = input.expiresAt ?? (
      this.config.defaultExpirySeconds > 0
        ? new Date(Date.now() + this.config.defaultExpirySeconds * 1000)
        : undefined
    );
    
    // Create order
    const now = new Date();
    const order: LimitOrder = {
      orderId,
      poolAddress: input.poolAddress,
      side: input.side,
      orderType: input.orderType,
      inputTokenMint: input.inputTokenMint,
      outputTokenMint: input.outputTokenMint,
      inputAmount: input.inputAmount,
      filledInputAmount: BigInt(0),
      remainingInputAmount: input.inputAmount,
      limitPrice: input.limitPrice,
      stopPrice: input.stopPrice,
      trailingDeltaBps: input.trailingDeltaBps,
      trailingPrice: input.orderType === 'trailing-stop' ? await this.getMarketPrice(input.poolAddress) : undefined,
      timeInForce: input.timeInForce,
      status: 'pending',
      avgFillPrice: BigInt(0),
      outputReceived: BigInt(0),
      feesPaid: BigInt(0),
      ownerCommitment: input.ownerCommitment ?? '',
      createdAt: now,
      updatedAt: now,
      expiresAt,
      fills: [],
    };
    
    // Store order
    this.orders.set(orderId, order);
    
    // Update pool index
    let poolOrders = this.ordersByPool.get(input.poolAddress);
    if (!poolOrders) {
      poolOrders = new Set();
      this.ordersByPool.set(input.poolAddress, poolOrders);
    }
    poolOrders.add(orderId);
    
    // Update owner index
    let userOrders = this.ordersByOwner.get(ownerKey);
    if (!userOrders) {
      userOrders = new Set();
      this.ordersByOwner.set(ownerKey, userOrders);
    }
    userOrders.add(orderId);
    
    // Update order book index
    this.addToOrderBook(order);
    
    // Emit event
    await this.emit({
      type: 'order_created',
      poolAddress: input.poolAddress,
      data: {
        orderId,
        side: input.side,
        orderType: input.orderType,
        inputAmount: input.inputAmount.toString(),
        limitPrice: input.limitPrice.toString(),
      },
      timestamp: now,
      blockNumber: 0,
      txHash: '',
    });
    
    // For IOC/FOK, attempt immediate matching
    if (input.timeInForce === 'IOC' || input.timeInForce === 'FOK') {
      const matchResult = await this.tryMatchOrder(order);
      
      if (input.timeInForce === 'FOK' && matchResult.matchedOrders === 0) {
        // Cancel order if FOK and not filled
        await this.cancelOrderInternal(orderId);
        throw new DEXError(DEXErrorCode.SWAP_FAILED, 'FOK order could not be filled');
      }
      
      if (input.timeInForce === 'IOC') {
        // Cancel remaining for IOC
        const updatedOrder = this.orders.get(orderId);
        if (updatedOrder && updatedOrder.remainingInputAmount > BigInt(0)) {
          await this.cancelOrderInternal(orderId);
        }
      }
    }
    
    return this.orders.get(orderId) ?? order;
  }
  
  async cancelOrder(orderId: string, _proof?: SwapProof): Promise<CancelOrderResult> {
    this.ensureInitialized();
    
    const order = this.orders.get(orderId);
    if (!order) {
      return {
        success: false,
        error: new DEXError(DEXErrorCode.ORDER_NOT_FOUND, `Order ${orderId} not found`),
      };
    }
    
    if (order.status === 'filled' || order.status === 'cancelled') {
      return {
        success: false,
        error: new DEXError(DEXErrorCode.ORDER_NOT_FOUND, `Order ${orderId} already ${order.status}`),
      };
    }
    
    await this.cancelOrderInternal(orderId);
    
    return {
      success: true,
      orderId,
      refundedAmount: order.remainingInputAmount,
    };
  }
  
  async getOrder(orderId: string): Promise<LimitOrder | null> {
    this.ensureInitialized();
    return this.orders.get(orderId) ?? null;
  }
  
  async getOrders(options?: OrderQueryOptions): Promise<LimitOrder[]> {
    this.ensureInitialized();
    
    let orders = Array.from(this.orders.values());
    
    // Filter by pool
    if (options?.poolAddress) {
      orders = orders.filter(o => o.poolAddress === options.poolAddress);
    }
    
    // Filter by owner
    if (options?.ownerCommitment) {
      orders = orders.filter(o => o.ownerCommitment === options.ownerCommitment);
    }
    
    // Filter by status
    if (options?.status && options.status.length > 0) {
      orders = orders.filter(o => options.status!.includes(o.status));
    }
    
    // Filter by side
    if (options?.side) {
      orders = orders.filter(o => o.side === options.side);
    }
    
    // Filter expired
    if (!options?.includeExpired) {
      const now = new Date();
      orders = orders.filter(o => !o.expiresAt || o.expiresAt > now);
    }
    
    // Sort by creation time
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Pagination
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 100;
    
    return orders.slice(offset, offset + limit);
  }
  
  async getOrderBook(poolAddress: string, depth: number = 20): Promise<OrderBook> {
    this.ensureInitialized();
    
    const pool = await this.poolManager.getPool(poolAddress);
    if (!pool) {
      throw new DEXError(DEXErrorCode.POOL_NOT_FOUND, `Pool ${poolAddress} not found`);
    }
    
    // Get buy orders (bids)
    const bids = this.aggregateOrderBookSide(poolAddress, 'buy', depth);
    
    // Get sell orders (asks)
    const asks = this.aggregateOrderBookSide(poolAddress, 'sell', depth);
    
    // Calculate best prices and spread
    const bestBid = bids.length > 0 ? bids[0].price : BigInt(0);
    const bestAsk = asks.length > 0 ? asks[0].price : BigInt(0);
    
    let spreadBps = 0;
    if (bestBid > BigInt(0) && bestAsk > BigInt(0)) {
      spreadBps = Number(((bestAsk - bestBid) * BigInt(10000)) / bestAsk);
    }
    
    return {
      poolAddress,
      baseToken: pool.tokenA,
      quoteToken: pool.tokenB,
      bids,
      asks,
      bestBid,
      bestAsk,
      spreadBps,
      updatedAt: new Date(),
    };
  }
  
  async matchOrders(poolAddress: string): Promise<MatchResult> {
    this.ensureInitialized();
    
    const pool = await this.poolManager.getPool(poolAddress);
    if (!pool) {
      throw new DEXError(DEXErrorCode.POOL_NOT_FOUND, `Pool ${poolAddress} not found`);
    }
    
    const currentPrice = await this.getMarketPrice(poolAddress);
    const fills: OrderFill[] = [];
    let matchedOrders = 0;
    let totalInputMatched = BigInt(0);
    let totalOutputGenerated = BigInt(0);
    
    // Get pending orders for this pool
    const poolOrders = this.ordersByPool.get(poolAddress);
    if (!poolOrders) {
      return { matchedOrders: 0, totalInputMatched: BigInt(0), totalOutputGenerated: BigInt(0), fills: [] };
    }
    
    for (const orderId of poolOrders) {
      const order = this.orders.get(orderId);
      if (!order || order.status !== 'pending') continue;
      
      // Check if order can be filled
      const canFill = this.canFillOrder(order, currentPrice);
      if (!canFill) continue;
      
      // Execute fill
      const fill = await this.executeOrderFill(order, pool, currentPrice);
      if (fill) {
        fills.push(fill);
        matchedOrders++;
        totalInputMatched += fill.inputAmount;
        totalOutputGenerated += fill.outputAmount;
      }
    }
    
    return {
      matchedOrders,
      totalInputMatched,
      totalOutputGenerated,
      fills,
    };
  }
  
  async updateTrailingStops(poolAddress: string): Promise<void> {
    this.ensureInitialized();
    
    const currentPrice = await this.getMarketPrice(poolAddress);
    const poolOrders = this.ordersByPool.get(poolAddress);
    if (!poolOrders) return;
    
    for (const orderId of poolOrders) {
      const order = this.orders.get(orderId);
      if (!order || order.orderType !== 'trailing-stop' || order.status !== 'pending') continue;
      
      const delta = order.trailingDeltaBps ?? 0;
      
      if (order.side === 'sell') {
        // For sell trailing stop, track highest price
        const newTrailingPrice = (currentPrice * BigInt(10000 - delta)) / BigInt(10000);
        if (!order.trailingPrice || newTrailingPrice > order.trailingPrice) {
          const updatedOrder: LimitOrder = {
            ...order,
            trailingPrice: newTrailingPrice,
            updatedAt: new Date(),
          };
          this.orders.set(orderId, updatedOrder);
        }
      } else {
        // For buy trailing stop, track lowest price
        const newTrailingPrice = (currentPrice * BigInt(10000 + delta)) / BigInt(10000);
        if (!order.trailingPrice || newTrailingPrice < order.trailingPrice) {
          const updatedOrder: LimitOrder = {
            ...order,
            trailingPrice: newTrailingPrice,
            updatedAt: new Date(),
          };
          this.orders.set(orderId, updatedOrder);
        }
      }
    }
  }
  
  async expireOrders(): Promise<number> {
    this.ensureInitialized();
    
    const now = new Date();
    let expiredCount = 0;
    
    for (const [orderId, order] of this.orders) {
      if (order.status !== 'pending') continue;
      if (!order.expiresAt) continue;
      
      if (order.expiresAt <= now) {
        const updatedOrder: LimitOrder = {
          ...order,
          status: 'expired',
          updatedAt: now,
        };
        this.orders.set(orderId, updatedOrder);
        this.removeFromOrderBook(order);
        expiredCount++;
        
        await this.emit({
          type: 'order_cancelled',
          poolAddress: order.poolAddress,
          data: {
            orderId,
            reason: 'expired',
          },
          timestamp: now,
          blockNumber: 0,
          txHash: '',
        });
      }
    }
    
    return expiredCount;
  }
  
  async getMarketPrice(poolAddress: string): Promise<bigint> {
    const pool = await this.poolManager.getPool(poolAddress);
    if (!pool) {
      throw new DEXError(DEXErrorCode.POOL_NOT_FOUND, `Pool ${poolAddress} not found`);
    }
    
    // Price = reserveB / reserveA (scaled by 1e9)
    if (pool.reserveA <= BigInt(0)) return BigInt(0);
    
    return (pool.reserveB * BigInt(1e9)) / pool.reserveA;
  }
  
  subscribe(listener: DEXEventListener): () => void {
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
      throw new DEXError(DEXErrorCode.NOT_INITIALIZED, 'Order manager not initialized');
    }
  }
  
  private generateOrderId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `ord-${timestamp}-${random}`;
  }
  
  private addToOrderBook(order: LimitOrder): void {
    const orderMap = order.side === 'buy' ? this.buyOrders : this.sellOrders;
    
    let priceMap = orderMap.get(order.poolAddress);
    if (!priceMap) {
      priceMap = new Map();
      orderMap.set(order.poolAddress, priceMap);
    }
    
    let ordersAtPrice = priceMap.get(order.limitPrice);
    if (!ordersAtPrice) {
      ordersAtPrice = new Set();
      priceMap.set(order.limitPrice, ordersAtPrice);
    }
    
    ordersAtPrice.add(order.orderId);
  }
  
  private removeFromOrderBook(order: LimitOrder): void {
    const orderMap = order.side === 'buy' ? this.buyOrders : this.sellOrders;
    const priceMap = orderMap.get(order.poolAddress);
    if (!priceMap) return;
    
    const ordersAtPrice = priceMap.get(order.limitPrice);
    if (ordersAtPrice) {
      ordersAtPrice.delete(order.orderId);
      if (ordersAtPrice.size === 0) {
        priceMap.delete(order.limitPrice);
      }
    }
  }
  
  private aggregateOrderBookSide(
    poolAddress: string,
    side: OrderSide,
    depth: number,
  ): OrderBookLevel[] {
    const orderMap = side === 'buy' ? this.buyOrders : this.sellOrders;
    const priceMap = orderMap.get(poolAddress);
    if (!priceMap) return [];
    
    const levels: OrderBookLevel[] = [];
    const prices = Array.from(priceMap.keys());
    
    // Sort prices (descending for bids, ascending for asks)
    if (side === 'buy') {
      prices.sort((a, b) => Number(b - a));
    } else {
      prices.sort((a, b) => Number(a - b));
    }
    
    for (const price of prices.slice(0, depth)) {
      const orderIds = priceMap.get(price);
      if (!orderIds) continue;
      
      let totalSize = BigInt(0);
      let orderCount = 0;
      
      for (const orderId of orderIds) {
        const order = this.orders.get(orderId);
        if (order && order.status === 'pending') {
          totalSize += order.remainingInputAmount;
          orderCount++;
        }
      }
      
      if (orderCount > 0) {
        levels.push({ price, size: totalSize, orderCount });
      }
    }
    
    return levels;
  }
  
  private canFillOrder(order: LimitOrder, currentPrice: bigint): boolean {
    // Check expiry
    if (order.expiresAt && order.expiresAt <= new Date()) {
      return false;
    }
    
    switch (order.orderType) {
      case 'limit':
        // Buy order fills if price <= limit price
        // Sell order fills if price >= limit price
        if (order.side === 'buy') {
          return currentPrice <= order.limitPrice;
        } else {
          return currentPrice >= order.limitPrice;
        }
        
      case 'stop-loss':
        // Sell stop-loss triggers if price <= stop price
        // Buy stop-loss triggers if price >= stop price
        if (!order.stopPrice) return false;
        if (order.side === 'sell') {
          return currentPrice <= order.stopPrice;
        } else {
          return currentPrice >= order.stopPrice;
        }
        
      case 'take-profit':
        // Sell take-profit triggers if price >= stop price
        // Buy take-profit triggers if price <= stop price
        if (!order.stopPrice) return false;
        if (order.side === 'sell') {
          return currentPrice >= order.stopPrice;
        } else {
          return currentPrice <= order.stopPrice;
        }
        
      case 'trailing-stop':
        // Triggers if price crosses trailing price
        if (!order.trailingPrice) return false;
        if (order.side === 'sell') {
          return currentPrice <= order.trailingPrice;
        } else {
          return currentPrice >= order.trailingPrice;
        }
        
      default:
        return false;
    }
  }
  
  private async executeOrderFill(
    order: LimitOrder,
    pool: Pool,
    price: bigint,
  ): Promise<OrderFill | null> {
    try {
      const isAToB = order.inputTokenMint === pool.tokenA.mint;
      const reserveIn = isAToB ? pool.reserveA : pool.reserveB;
      const reserveOut = isAToB ? pool.reserveB : pool.reserveA;
      
      // Calculate output amount
      const outputAmount = calculateOutputAmount(
        order.remainingInputAmount,
        reserveIn,
        reserveOut,
        pool.config.swapFeeBps,
      );
      
      // Calculate fee
      const fee = (order.remainingInputAmount * BigInt(this.config.takerFeeBps)) / BigInt(10000);
      
      // Execute swap through swap manager
      const swapResult = await this.swapManager.swap({
        poolAddress: order.poolAddress,
        swapType: 'exact-in',
        inputMint: order.inputTokenMint,
        outputMint: order.outputTokenMint,
        amount: order.remainingInputAmount,
        slippageBps: 100, // 1%
        deadline: new Date(Date.now() + 60000), // 1 minute
      });
      
      if (!swapResult.success) {
        return null;
      }
      
      // Create fill record
      const fill: OrderFill = {
        fillId: `fill-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        inputAmount: order.remainingInputAmount,
        outputAmount,
        price,
        fee,
        timestamp: new Date(),
        txHash: swapResult.txHash ?? '',
      };
      
      // Update order
      const updatedOrder: LimitOrder = {
        ...order,
        filledInputAmount: order.filledInputAmount + order.remainingInputAmount,
        remainingInputAmount: BigInt(0),
        status: 'filled',
        avgFillPrice: price,
        outputReceived: order.outputReceived + outputAmount,
        feesPaid: order.feesPaid + fee,
        updatedAt: new Date(),
        fills: [...order.fills, fill],
      };
      
      this.orders.set(order.orderId, updatedOrder);
      this.removeFromOrderBook(order);
      
      // Emit event
      await this.emit({
        type: 'order_filled',
        poolAddress: order.poolAddress,
        data: {
          orderId: order.orderId,
          fillId: fill.fillId,
          inputAmount: fill.inputAmount.toString(),
          outputAmount: fill.outputAmount.toString(),
          price: fill.price.toString(),
        },
        timestamp: fill.timestamp,
        blockNumber: 0,
        txHash: fill.txHash,
      });
      
      return fill;
    } catch (error) {
      console.error('Failed to execute order fill:', error);
      return null;
    }
  }
  
  private async tryMatchOrder(order: LimitOrder): Promise<MatchResult> {
    const pool = await this.poolManager.getPool(order.poolAddress);
    if (!pool) {
      return { matchedOrders: 0, totalInputMatched: BigInt(0), totalOutputGenerated: BigInt(0), fills: [] };
    }
    
    const currentPrice = await this.getMarketPrice(order.poolAddress);
    const canFill = this.canFillOrder(order, currentPrice);
    
    if (!canFill) {
      return { matchedOrders: 0, totalInputMatched: BigInt(0), totalOutputGenerated: BigInt(0), fills: [] };
    }
    
    const fill = await this.executeOrderFill(order, pool, currentPrice);
    if (!fill) {
      return { matchedOrders: 0, totalInputMatched: BigInt(0), totalOutputGenerated: BigInt(0), fills: [] };
    }
    
    return {
      matchedOrders: 1,
      totalInputMatched: fill.inputAmount,
      totalOutputGenerated: fill.outputAmount,
      fills: [fill],
    };
  }
  
  private async cancelOrderInternal(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) return;
    
    const updatedOrder: LimitOrder = {
      ...order,
      status: 'cancelled',
      updatedAt: new Date(),
    };
    
    this.orders.set(orderId, updatedOrder);
    this.removeFromOrderBook(order);
    
    await this.emit({
      type: 'order_cancelled',
      poolAddress: order.poolAddress,
      data: {
        orderId,
        reason: 'user_cancelled',
        refundedAmount: order.remainingInputAmount.toString(),
      },
      timestamp: new Date(),
      blockNumber: 0,
      txHash: '',
    });
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

/**
 * Create limit order manager
 */
export function createLimitOrderManager(
  poolManager: IPool,
  swapManager: ISwap,
  config?: Partial<LimitOrderConfig>,
): ILimitOrderManager {
  return new LimitOrderManager(poolManager, swapManager, config);
}

/**
 * Default limit order configuration
 */
export const DEFAULT_LIMIT_ORDER_CONFIG: LimitOrderConfig = {
  maxOrdersPerUser: 100,
  minOrderSize: BigInt(1000),
  maxOrderSize: BigInt(1e18),
  defaultExpirySeconds: 7 * 24 * 60 * 60, // 7 days
  privacyEnabled: true,
  makerFeeBps: 10, // 0.1%
  takerFeeBps: 30, // 0.3%
  minPriceTickBps: 1, // 0.01%
};
