/**
 * @fileoverview PRVCSH React Hooks
 * @description React hooks for PRVCSH SDK integration.
 * 
 * @module @prvcsh/payments/react
 * @version 0.1.0
 * 
 * @example
 * ```tsx
 * import { PRVCSHProvider, usePayment, useInvoice } from '@prvcsh/payments/react';
 * 
 * // Wrap your app with the provider
 * function App() {
 *   return (
 *     <PRVCSHProvider apiKey="pk_test_xxx">
 *       <PaymentPage />
 *     </PRVCSHProvider>
 *   );
 * }
 * 
 * // Use hooks in components
 * function PaymentPage() {
 *   const { createPayment, payment, loading, error } = usePayment();
 *   
 *   const handlePay = async () => {
 *     await createPayment({
 *       amount: 1000000n,
 *       currency: 'USDC',
 *     });
 *   };
 *   
 *   return (
 *     <button onClick={handlePay} disabled={loading}>
 *       {loading ? 'Processing...' : 'Pay $1.00'}
 *     </button>
 *   );
 * }
 * ```
 */

import type {
  Payment,
  Invoice,
  Refund,
  PaymentLink,
  PaymentStatus,
  Currency,
} from '../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Provider configuration
 */
export interface PRVCSHProviderConfig {
  /** Public API key */
  apiKey: string;
  
  /** API base URL */
  baseUrl?: string;
  
  /** Enable debug mode */
  debug?: boolean;
}

/**
 * Payment creation input
 */
export interface CreatePaymentOptions {
  amount: bigint;
  currency: Currency;
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * Hook state
 */
export interface HookState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Payment hook result
 */
export interface UsePaymentResult extends HookState<Payment> {
  createPayment: (options: CreatePaymentOptions) => Promise<Payment>;
  confirmPayment: (paymentId: string, txSignature: string) => Promise<Payment>;
  cancelPayment: (paymentId: string) => Promise<Payment>;
  reset: () => void;
}

/**
 * Payments list hook result
 */
export interface UsePaymentsResult extends HookState<Payment[]> {
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

/**
 * Payment status hook result
 */
export interface UsePaymentStatusResult {
  status: PaymentStatus | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Checkout session
 */
export interface CheckoutSession {
  paymentId: string;
  checkoutUrl: string;
  expiresAt: Date;
}

/**
 * Checkout hook result
 */
export interface UseCheckoutResult extends HookState<CheckoutSession> {
  startCheckout: (options: CreatePaymentOptions) => Promise<CheckoutSession>;
  redirectToCheckout: () => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

/**
 * PRVCSH context value
 */
export interface PRVCSHContextValue {
  apiKey: string;
  baseUrl: string;
  isTestMode: boolean;
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
}

/**
 * Context state
 */
interface ContextState {
  config: PRVCSHProviderConfig | null;
}

// Global context (React-independent implementation)
const contextState: ContextState = {
  config: null,
};

/**
 * Initialize context
 */
export function initializeContext(config: PRVCSHProviderConfig): void {
  contextState.config = config;
}

/**
 * Get context
 */
export function getContext(): PRVCSHContextValue {
  if (!contextState.config) {
    throw new Error('PRVCSH not initialized. Call initializeContext first.');
  }
  
  const config = contextState.config;
  const baseUrl = config.baseUrl ?? 'https://api.privacycash.app';
  
  return {
    apiKey: config.apiKey,
    baseUrl,
    isTestMode: config.apiKey.startsWith('pk_test_'),
    request: async <T>(path: string, options?: RequestInit): Promise<T> => {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.apiKey,
          ...options?.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return response.json();
    },
  };
}

// =============================================================================
// HOOK IMPLEMENTATIONS (Framework-agnostic state)
// =============================================================================

/**
 * Create hook state
 */
export function createHookState<T>(): HookState<T> {
  return {
    data: null,
    loading: false,
    error: null,
  };
}

/**
 * Payment hook implementation
 */
export class PaymentHookImpl {
  private state: HookState<Payment> = createHookState();
  private listeners: Set<() => void> = new Set();
  
  getState(): HookState<Payment> {
    return this.state;
  }
  
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
  
  private setState(updates: Partial<HookState<Payment>>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }
  
  async createPayment(options: CreatePaymentOptions): Promise<Payment> {
    const ctx = getContext();
    
    this.setState({ loading: true, error: null });
    
    try {
      const payment = await ctx.request<Payment>('/v1/payments', {
        method: 'POST',
        body: JSON.stringify({
          amount: options.amount.toString(),
          currency: options.currency,
          description: options.description,
          metadata: options.metadata,
        }),
      });
      
      this.setState({ data: payment, loading: false });
      return payment;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.setState({ error: err, loading: false });
      throw err;
    }
  }
  
  async confirmPayment(paymentId: string, txSignature: string): Promise<Payment> {
    const ctx = getContext();
    
    this.setState({ loading: true, error: null });
    
    try {
      const payment = await ctx.request<Payment>(`/v1/payments/${paymentId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ transactionSignature: txSignature }),
      });
      
      this.setState({ data: payment, loading: false });
      return payment;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.setState({ error: err, loading: false });
      throw err;
    }
  }
  
  async cancelPayment(paymentId: string): Promise<Payment> {
    const ctx = getContext();
    
    this.setState({ loading: true, error: null });
    
    try {
      const payment = await ctx.request<Payment>(`/v1/payments/${paymentId}/cancel`, {
        method: 'POST',
      });
      
      this.setState({ data: payment, loading: false });
      return payment;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.setState({ error: err, loading: false });
      throw err;
    }
  }
  
  reset(): void {
    this.setState({ data: null, loading: false, error: null });
  }
}

/**
 * Checkout hook implementation
 */
export class CheckoutHookImpl {
  private state: HookState<CheckoutSession> = createHookState();
  private listeners: Set<() => void> = new Set();
  
  getState(): HookState<CheckoutSession> {
    return this.state;
  }
  
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
  
  private setState(updates: Partial<HookState<CheckoutSession>>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }
  
  async startCheckout(options: CreatePaymentOptions): Promise<CheckoutSession> {
    const ctx = getContext();
    
    this.setState({ loading: true, error: null });
    
    try {
      const session = await ctx.request<CheckoutSession>('/v1/checkout/sessions', {
        method: 'POST',
        body: JSON.stringify({
          amount: options.amount.toString(),
          currency: options.currency,
          description: options.description,
          metadata: options.metadata,
        }),
      });
      
      this.setState({ data: session, loading: false });
      return session;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.setState({ error: err, loading: false });
      throw err;
    }
  }
  
  redirectToCheckout(): void {
    if (this.state.data?.checkoutUrl) {
      if (typeof window !== 'undefined') {
        window.location.href = this.state.data.checkoutUrl;
      }
    }
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create payment hook instance
 */
export function createPaymentHook(): PaymentHookImpl {
  return new PaymentHookImpl();
}

/**
 * Create checkout hook instance
 */
export function createCheckoutHook(): CheckoutHookImpl {
  return new CheckoutHookImpl();
}

// =============================================================================
// REACT INTEGRATION (Pseudo-implementation for documentation)
// =============================================================================

/**
 * React Provider component interface
 * 
 * @example
 * ```tsx
 * // In your app entry point
 * import { PRVCSHProvider } from '@prvcsh/payments/react';
 * 
 * function App() {
 *   return (
 *     <PRVCSHProvider apiKey="pk_test_xxx">
 *       <YourApp />
 *     </PRVCSHProvider>
 *   );
 * }
 * ```
 */
export interface PRVCSHProviderProps {
  apiKey: string;
  baseUrl?: string;
  debug?: boolean;
  children: unknown;
}

/**
 * usePayment hook interface
 * 
 * @example
 * ```tsx
 * function PayButton() {
 *   const { createPayment, loading, error } = usePayment();
 *   
 *   return (
 *     <button 
 *       onClick={() => createPayment({ amount: 100n, currency: 'USDC' })}
 *       disabled={loading}
 *     >
 *       Pay
 *     </button>
 *   );
 * }
 * ```
 */
export type UsePayment = () => UsePaymentResult;

/**
 * useCheckout hook interface
 * 
 * @example
 * ```tsx
 * function CheckoutButton() {
 *   const { startCheckout, redirectToCheckout, loading } = useCheckout();
 *   
 *   const handleClick = async () => {
 *     await startCheckout({ amount: 100n, currency: 'USDC' });
 *     redirectToCheckout();
 *   };
 *   
 *   return <button onClick={handleClick}>Checkout</button>;
 * }
 * ```
 */
export type UseCheckout = () => UseCheckoutResult;

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Format amount for display
 */
export function formatAmount(amount: bigint, currency: Currency): string {
  const decimals = currency === 'SOL' ? 9 : 6;
  const divisor = BigInt(10 ** decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalStr.replace(/0+$/, '') || '0';
  
  return `${integerPart}.${trimmedFractional.slice(0, 2)}`;
}

/**
 * Parse amount from string
 */
export function parseAmount(value: string, currency: Currency): bigint {
  const decimals = currency === 'SOL' ? 9 : 6;
  const [integerPart, fractionalPart = ''] = value.split('.');
  
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  const combined = integerPart + paddedFractional;
  
  return BigInt(combined);
}

/**
 * Currency symbols
 */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  SOL: 'SOL',
  USDC: '$',
  USDT: '$',
  PRIVACY: 'PRIV',
};

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

/**
 * Format currency display
 */
export function formatCurrency(amount: bigint, currency: Currency): string {
  const symbol = getCurrencySymbol(currency);
  const formatted = formatAmount(amount, currency);
  
  if (symbol === '$') {
    return `$${formatted}`;
  }
  
  return `${formatted} ${symbol}`;
}
