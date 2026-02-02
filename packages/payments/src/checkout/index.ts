/**
 * @fileoverview Payment Checkout UI Components
 * @description Hosted payment page components for PRVCSH.
 * 
 * @module @prvcsh/payments/checkout
 * @version 0.1.0
 */

import type { Payment, PaymentStatus, Currency } from '../types';

// =============================================================================
// CHECKOUT TYPES
// =============================================================================

/**
 * Checkout theme
 */
export interface CheckoutTheme {
  /** Primary color */
  primaryColor: string;
  
  /** Background color */
  backgroundColor: string;
  
  /** Text color */
  textColor: string;
  
  /** Secondary text color */
  secondaryTextColor: string;
  
  /** Border color */
  borderColor: string;
  
  /** Error color */
  errorColor: string;
  
  /** Success color */
  successColor: string;
  
  /** Font family */
  fontFamily: string;
  
  /** Border radius */
  borderRadius: string;
  
  /** Box shadow */
  boxShadow: string;
}

/**
 * Default light theme
 */
export const LIGHT_THEME: CheckoutTheme = {
  primaryColor: '#6366f1',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  secondaryTextColor: '#6b7280',
  borderColor: '#e5e7eb',
  errorColor: '#ef4444',
  successColor: '#22c55e',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

/**
 * Default dark theme
 */
export const DARK_THEME: CheckoutTheme = {
  primaryColor: '#818cf8',
  backgroundColor: '#1f2937',
  textColor: '#f9fafb',
  secondaryTextColor: '#9ca3af',
  borderColor: '#374151',
  errorColor: '#f87171',
  successColor: '#4ade80',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
};

/**
 * Checkout configuration
 */
export interface CheckoutConfig {
  /** Payment ID */
  paymentId: string;
  
  /** Merchant name */
  merchantName: string;
  
  /** Merchant logo URL */
  merchantLogo?: string;
  
  /** Amount in smallest unit */
  amount: bigint;
  
  /** Currency */
  currency: Currency;
  
  /** Description */
  description?: string;
  
  /** Success URL */
  successUrl?: string;
  
  /** Cancel URL */
  cancelUrl?: string;
  
  /** Theme */
  theme?: Partial<CheckoutTheme>;
  
  /** Show QR code */
  showQRCode?: boolean;
  
  /** Expires at */
  expiresAt?: Date;
  
  /** Locale */
  locale?: string;
  
  /** Allowed payment methods */
  allowedMethods?: PaymentMethod[];
}

/**
 * Payment method
 */
export type PaymentMethod = 
  | 'wallet'       // Direct wallet connection
  | 'qr'           // QR code scan
  | 'link'         // Payment link
  | 'privacy';     // PRVCSH token

/**
 * Checkout state
 */
export interface CheckoutState {
  /** Current step */
  step: CheckoutStep;
  
  /** Selected payment method */
  selectedMethod?: PaymentMethod;
  
  /** Wallet address */
  walletAddress?: string;
  
  /** Payment status */
  paymentStatus: PaymentStatus;
  
  /** Error message */
  error?: string;
  
  /** Loading state */
  loading: boolean;
  
  /** Transaction signature */
  transactionSignature?: string;
  
  /** Time remaining (seconds) */
  timeRemaining?: number;
}

/**
 * Checkout step
 */
export type CheckoutStep = 
  | 'method'       // Select payment method
  | 'wallet'       // Connect wallet
  | 'confirm'      // Confirm payment
  | 'processing'   // Processing payment
  | 'success'      // Payment successful
  | 'failed'       // Payment failed
  | 'expired';     // Payment expired

/**
 * Checkout event
 */
export interface CheckoutEvent {
  type: CheckoutEventType;
  data?: unknown;
  timestamp: Date;
}

/**
 * Checkout event types
 */
export type CheckoutEventType = 
  | 'checkout.started'
  | 'method.selected'
  | 'wallet.connected'
  | 'payment.initiated'
  | 'payment.confirmed'
  | 'payment.failed'
  | 'checkout.cancelled'
  | 'checkout.expired';

/**
 * Checkout callback handlers
 */
export interface CheckoutCallbacks {
  onSuccess?: (payment: Payment) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  onEvent?: (event: CheckoutEvent) => void;
}

// =============================================================================
// CHECKOUT MANAGER
// =============================================================================

/**
 * Checkout manager
 */
export class CheckoutManager {
  private config: CheckoutConfig;
  private state: CheckoutState;
  private callbacks: CheckoutCallbacks;
  private theme: CheckoutTheme;
  private countdownTimer?: ReturnType<typeof setInterval>;
  private eventListeners: Set<(event: CheckoutEvent) => void> = new Set();
  
  constructor(config: CheckoutConfig, callbacks: CheckoutCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
    this.theme = { ...LIGHT_THEME, ...config.theme };
    
    this.state = {
      step: 'method',
      paymentStatus: 'pending',
      loading: false,
    };
    
    // Start countdown if expiration set
    if (config.expiresAt) {
      this.startCountdown();
    }
    
    this.emit('checkout.started');
  }
  
  /**
   * Get current state
   */
  getState(): CheckoutState {
    return { ...this.state };
  }
  
  /**
   * Get theme
   */
  getTheme(): CheckoutTheme {
    return { ...this.theme };
  }
  
  /**
   * Set theme
   */
  setTheme(theme: Partial<CheckoutTheme>): void {
    this.theme = { ...this.theme, ...theme };
  }
  
  /**
   * Select payment method
   */
  selectMethod(method: PaymentMethod): void {
    this.state.selectedMethod = method;
    this.state.step = method === 'wallet' ? 'wallet' : 'confirm';
    this.emit('method.selected', { method });
  }
  
  /**
   * Connect wallet
   */
  async connectWallet(address: string): Promise<void> {
    this.state.walletAddress = address;
    this.state.step = 'confirm';
    this.emit('wallet.connected', { address });
  }
  
  /**
   * Initiate payment
   */
  async initiatePayment(): Promise<void> {
    this.state.loading = true;
    this.state.step = 'processing';
    this.emit('payment.initiated');
    
    // Payment would be processed here
    // This is a placeholder for the actual payment flow
  }
  
  /**
   * Confirm payment with transaction signature
   */
  async confirmPayment(transactionSignature: string): Promise<void> {
    this.state.transactionSignature = transactionSignature;
    this.state.paymentStatus = 'completed';
    this.state.step = 'success';
    this.state.loading = false;
    
    this.emit('payment.confirmed', { transactionSignature });
    
    // Notify success callback
    if (this.callbacks.onSuccess) {
      const payment: Payment = {
        id: this.config.paymentId,
        merchantId: '',
        amount: this.config.amount,
        currency: this.config.currency,
        status: 'completed',
        method: 'checkout',
        description: this.config.description,
        customerWallet: this.state.walletAddress,
        txHash: transactionSignature,
        isPrivate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: this.config.expiresAt ?? new Date(Date.now() + 30 * 60 * 1000),
        completedAt: new Date(),
      };
      this.callbacks.onSuccess(payment);
    }
    
    // Redirect to success URL
    if (this.config.successUrl && typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = this.config.successUrl!;
      }, 2000);
    }
  }
  
  /**
   * Handle payment failure
   */
  handleFailure(error: string): void {
    this.state.error = error;
    this.state.paymentStatus = 'failed';
    this.state.step = 'failed';
    this.state.loading = false;
    
    this.emit('payment.failed', { error });
    
    if (this.callbacks.onError) {
      this.callbacks.onError(new Error(error));
    }
  }
  
  /**
   * Cancel checkout
   */
  cancel(): void {
    this.stopCountdown();
    this.emit('checkout.cancelled');
    
    if (this.callbacks.onCancel) {
      this.callbacks.onCancel();
    }
    
    if (this.config.cancelUrl && typeof window !== 'undefined') {
      window.location.href = this.config.cancelUrl;
    }
  }
  
  /**
   * Retry payment
   */
  retry(): void {
    this.state = {
      step: 'method',
      paymentStatus: 'pending',
      loading: false,
      selectedMethod: undefined,
      walletAddress: undefined,
      error: undefined,
      transactionSignature: undefined,
    };
    
    this.emit('checkout.started');
  }
  
  /**
   * Subscribe to events
   */
  on(handler: (event: CheckoutEvent) => void): () => void {
    this.eventListeners.add(handler);
    return () => this.eventListeners.delete(handler);
  }
  
  /**
   * Emit event
   */
  private emit(type: CheckoutEventType, data?: unknown): void {
    const event: CheckoutEvent = {
      type,
      data,
      timestamp: new Date(),
    };
    
    for (const listener of this.eventListeners) {
      listener(event);
    }
    
    if (this.callbacks.onEvent) {
      this.callbacks.onEvent(event);
    }
  }
  
  /**
   * Start countdown timer
   */
  private startCountdown(): void {
    if (!this.config.expiresAt) return;
    
    this.countdownTimer = setInterval(() => {
      const now = Date.now();
      const expiry = this.config.expiresAt!.getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      
      this.state.timeRemaining = remaining;
      
      if (remaining === 0) {
        this.handleExpiration();
      }
    }, 1000);
  }
  
  /**
   * Stop countdown timer
   */
  private stopCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }
  }
  
  /**
   * Handle expiration
   */
  private handleExpiration(): void {
    this.stopCountdown();
    this.state.paymentStatus = 'expired';
    this.state.step = 'expired';
    this.state.loading = false;
    
    this.emit('checkout.expired');
    
    if (this.callbacks.onError) {
      this.callbacks.onError(new Error('Payment expired'));
    }
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    this.stopCountdown();
    this.eventListeners.clear();
  }
}

// =============================================================================
// HTML RENDERER
// =============================================================================

/**
 * Checkout HTML renderer
 */
export class CheckoutRenderer {
  private manager: CheckoutManager;
  private container: HTMLElement | null = null;
  
  constructor(manager: CheckoutManager) {
    this.manager = manager;
  }
  
  /**
   * Mount to container
   */
  mount(container: HTMLElement | string): void {
    if (typeof container === 'string') {
      this.container = document.getElementById(container);
    } else {
      this.container = container;
    }
    
    if (!this.container) {
      throw new Error('Container not found');
    }
    
    this.render();
    
    // Re-render on state changes
    this.manager.on(() => this.render());
  }
  
  /**
   * Unmount
   */
  unmount(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
  
  /**
   * Render checkout
   */
  private render(): void {
    if (!this.container) return;
    
    const state = this.manager.getState();
    const theme = this.manager.getTheme();
    
    this.container.innerHTML = this.generateHTML(state, theme);
    this.attachEventListeners();
  }
  
  /**
   * Generate HTML
   */
  private generateHTML(state: CheckoutState, theme: CheckoutTheme): string {
    return `
      <div class="pc-checkout" style="${this.getContainerStyles(theme)}">
        <div class="pc-checkout-card" style="${this.getCardStyles(theme)}">
          ${this.renderHeader(theme)}
          ${this.renderContent(state, theme)}
          ${this.renderFooter(state, theme)}
        </div>
      </div>
    `;
  }
  
  /**
   * Render header
   */
  private renderHeader(theme: CheckoutTheme): string {
    return `
      <div class="pc-checkout-header" style="padding: 24px; border-bottom: 1px solid ${theme.borderColor};">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; background: ${theme.primaryColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <div style="font-size: 18px; font-weight: 600; color: ${theme.textColor};">PRVCSH</div>
            <div style="font-size: 14px; color: ${theme.secondaryTextColor};">Secure Payment</div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render content based on step
   */
  private renderContent(state: CheckoutState, theme: CheckoutTheme): string {
    switch (state.step) {
      case 'method':
        return this.renderMethodSelection(theme);
      case 'wallet':
        return this.renderWalletConnect(theme);
      case 'confirm':
        return this.renderConfirmation(state, theme);
      case 'processing':
        return this.renderProcessing(theme);
      case 'success':
        return this.renderSuccess(state, theme);
      case 'failed':
        return this.renderFailed(state, theme);
      case 'expired':
        return this.renderExpired(theme);
      default:
        return '';
    }
  }
  
  /**
   * Render method selection
   */
  private renderMethodSelection(theme: CheckoutTheme): string {
    return `
      <div class="pc-checkout-content" style="padding: 24px;">
        <div style="margin-bottom: 24px;">
          <div style="font-size: 24px; font-weight: 700; color: ${theme.textColor}; margin-bottom: 4px;">
            Select Payment Method
          </div>
          <div style="font-size: 14px; color: ${theme.secondaryTextColor};">
            Choose how you'd like to pay
          </div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button class="pc-method-btn" data-method="wallet" style="${this.getMethodButtonStyles(theme)}">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; background: #9945FF; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              </div>
              <div style="text-align: left;">
                <div style="font-weight: 600;">Solana Wallet</div>
                <div style="font-size: 12px; color: ${theme.secondaryTextColor};">Phantom, Solflare, etc.</div>
              </div>
            </div>
          </button>
          
          <button class="pc-method-btn" data-method="qr" style="${this.getMethodButtonStyles(theme)}">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; background: #14F195; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm8 2h2v4h-2zm4-4h2v2h-2zm-4 0h2v2h-2zm4 4h2v4h-2zm0-4h4v2h-4v-2zm2 4h2v2h-2z"/>
                </svg>
              </div>
              <div style="text-align: left;">
                <div style="font-weight: 600;">Scan QR Code</div>
                <div style="font-size: 12px; color: ${theme.secondaryTextColor};">Pay with mobile wallet</div>
              </div>
            </div>
          </button>
          
          <button class="pc-method-btn" data-method="privacy" style="${this.getMethodButtonStyles(theme)}">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; background: ${theme.primaryColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
              </div>
              <div style="text-align: left;">
                <div style="font-weight: 600;">Privacy Token</div>
                <div style="font-size: 12px; color: ${theme.secondaryTextColor};">Pay with PRIVACY token</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Render wallet connect
   */
  private renderWalletConnect(theme: CheckoutTheme): string {
    return `
      <div class="pc-checkout-content" style="padding: 24px; text-align: center;">
        <div style="margin-bottom: 24px;">
          <div style="width: 80px; height: 80px; background: ${theme.primaryColor}20; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="${theme.primaryColor}">
              <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9z"/>
            </svg>
          </div>
          <div style="font-size: 20px; font-weight: 600; color: ${theme.textColor}; margin-bottom: 8px;">
            Connect Your Wallet
          </div>
          <div style="font-size: 14px; color: ${theme.secondaryTextColor};">
            Connect your Solana wallet to continue
          </div>
        </div>
        
        <button id="pc-connect-wallet" style="${this.getPrimaryButtonStyles(theme)}">
          Connect Wallet
        </button>
        
        <button class="pc-back-btn" style="${this.getSecondaryButtonStyles(theme)}">
          ← Back
        </button>
      </div>
    `;
  }
  
  /**
   * Render confirmation
   */
  private renderConfirmation(state: CheckoutState, theme: CheckoutTheme): string {
    return `
      <div class="pc-checkout-content" style="padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 14px; color: ${theme.secondaryTextColor}; margin-bottom: 8px;">
            Amount to Pay
          </div>
          <div style="font-size: 36px; font-weight: 700; color: ${theme.textColor};">
            ${this.formatAmount()} ${this.getCurrency()}
          </div>
        </div>
        
        ${state.walletAddress ? `
          <div style="background: ${theme.borderColor}20; padding: 12px; border-radius: 8px; margin-bottom: 24px;">
            <div style="font-size: 12px; color: ${theme.secondaryTextColor}; margin-bottom: 4px;">
              Paying from
            </div>
            <div style="font-size: 14px; font-family: monospace; color: ${theme.textColor};">
              ${state.walletAddress.slice(0, 8)}...${state.walletAddress.slice(-8)}
            </div>
          </div>
        ` : ''}
        
        <button id="pc-confirm-payment" style="${this.getPrimaryButtonStyles(theme)}">
          Confirm & Pay
        </button>
        
        <button class="pc-back-btn" style="${this.getSecondaryButtonStyles(theme)}">
          ← Back
        </button>
      </div>
    `;
  }
  
  /**
   * Render processing
   */
  private renderProcessing(theme: CheckoutTheme): string {
    return `
      <div class="pc-checkout-content" style="padding: 48px 24px; text-align: center;">
        <div style="margin-bottom: 24px;">
          <div class="pc-spinner" style="width: 60px; height: 60px; border: 4px solid ${theme.borderColor}; border-top-color: ${theme.primaryColor}; border-radius: 50%; margin: 0 auto; animation: spin 1s linear infinite;"></div>
        </div>
        <div style="font-size: 20px; font-weight: 600; color: ${theme.textColor}; margin-bottom: 8px;">
          Processing Payment
        </div>
        <div style="font-size: 14px; color: ${theme.secondaryTextColor};">
          Please confirm the transaction in your wallet
        </div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;
  }
  
  /**
   * Render success
   */
  private renderSuccess(state: CheckoutState, theme: CheckoutTheme): string {
    return `
      <div class="pc-checkout-content" style="padding: 48px 24px; text-align: center;">
        <div style="width: 80px; height: 80px; background: ${theme.successColor}20; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="${theme.successColor}">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
        <div style="font-size: 24px; font-weight: 700; color: ${theme.successColor}; margin-bottom: 8px;">
          Payment Successful!
        </div>
        <div style="font-size: 14px; color: ${theme.secondaryTextColor}; margin-bottom: 24px;">
          Your payment has been processed successfully
        </div>
        ${state.transactionSignature ? `
          <div style="background: ${theme.borderColor}20; padding: 12px; border-radius: 8px;">
            <div style="font-size: 12px; color: ${theme.secondaryTextColor}; margin-bottom: 4px;">
              Transaction ID
            </div>
            <a href="https://solscan.io/tx/${state.transactionSignature}" target="_blank" style="font-size: 12px; font-family: monospace; color: ${theme.primaryColor}; text-decoration: none;">
              ${state.transactionSignature.slice(0, 16)}...${state.transactionSignature.slice(-16)}
            </a>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  /**
   * Render failed
   */
  private renderFailed(state: CheckoutState, theme: CheckoutTheme): string {
    return `
      <div class="pc-checkout-content" style="padding: 48px 24px; text-align: center;">
        <div style="width: 80px; height: 80px; background: ${theme.errorColor}20; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="${theme.errorColor}">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </div>
        <div style="font-size: 24px; font-weight: 700; color: ${theme.errorColor}; margin-bottom: 8px;">
          Payment Failed
        </div>
        <div style="font-size: 14px; color: ${theme.secondaryTextColor}; margin-bottom: 24px;">
          ${state.error ?? 'Something went wrong'}
        </div>
        <button id="pc-retry" style="${this.getPrimaryButtonStyles(theme)}">
          Try Again
        </button>
      </div>
    `;
  }
  
  /**
   * Render expired
   */
  private renderExpired(theme: CheckoutTheme): string {
    return `
      <div class="pc-checkout-content" style="padding: 48px 24px; text-align: center;">
        <div style="width: 80px; height: 80px; background: ${theme.errorColor}20; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="${theme.errorColor}">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
        </div>
        <div style="font-size: 24px; font-weight: 700; color: ${theme.errorColor}; margin-bottom: 8px;">
          Payment Expired
        </div>
        <div style="font-size: 14px; color: ${theme.secondaryTextColor}; margin-bottom: 24px;">
          This payment link has expired
        </div>
      </div>
    `;
  }
  
  /**
   * Render footer
   */
  private renderFooter(state: CheckoutState, theme: CheckoutTheme): string {
    return `
      <div class="pc-checkout-footer" style="padding: 16px 24px; border-top: 1px solid ${theme.borderColor}; text-align: center;">
        <div style="font-size: 12px; color: ${theme.secondaryTextColor};">
          Secured by <strong style="color: ${theme.textColor};">PRVCSH</strong>
          ${state.timeRemaining !== undefined && state.timeRemaining > 0 ? `
            <span style="margin-left: 8px;">• Expires in ${this.formatTime(state.timeRemaining)}</span>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.container) return;
    
    // Method selection buttons
    const methodButtons = this.container.querySelectorAll('.pc-method-btn');
    methodButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const method = (e.currentTarget as HTMLElement).dataset.method as PaymentMethod;
        this.manager.selectMethod(method);
      });
    });
    
    // Connect wallet button
    const connectBtn = this.container.querySelector('#pc-connect-wallet');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => {
        // Simulate wallet connection
        this.manager.connectWallet('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
      });
    }
    
    // Confirm payment button
    const confirmBtn = this.container.querySelector('#pc-confirm-payment');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        this.manager.initiatePayment();
        // Simulate payment completion
        setTimeout(() => {
          this.manager.confirmPayment('5wHu1qwD7q3xT...example...signature');
        }, 2000);
      });
    }
    
    // Retry button
    const retryBtn = this.container.querySelector('#pc-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.manager.retry();
      });
    }
    
    // Back buttons
    const backButtons = this.container.querySelectorAll('.pc-back-btn');
    backButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.manager.retry();
      });
    });
  }
  
  // Style helpers
  private getContainerStyles(theme: CheckoutTheme): string {
    return `
      font-family: ${theme.fontFamily};
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    `;
  }
  
  private getCardStyles(theme: CheckoutTheme): string {
    return `
      width: 100%;
      max-width: 420px;
      background: ${theme.backgroundColor};
      border-radius: ${theme.borderRadius};
      box-shadow: ${theme.boxShadow};
      overflow: hidden;
    `;
  }
  
  private getMethodButtonStyles(theme: CheckoutTheme): string {
    return `
      width: 100%;
      padding: 16px;
      background: ${theme.backgroundColor};
      border: 1px solid ${theme.borderColor};
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      color: ${theme.textColor};
    `;
  }
  
  private getPrimaryButtonStyles(theme: CheckoutTheme): string {
    return `
      width: 100%;
      padding: 16px;
      background: ${theme.primaryColor};
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    `;
  }
  
  private getSecondaryButtonStyles(theme: CheckoutTheme): string {
    return `
      width: 100%;
      padding: 12px;
      background: transparent;
      color: ${theme.secondaryTextColor};
      border: none;
      font-size: 14px;
      cursor: pointer;
      margin-top: 12px;
    `;
  }
  
  private formatAmount(): string {
    // This would use the actual config
    return '10.00';
  }
  
  private getCurrency(): string {
    return 'USDC';
  }
  
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create checkout manager
 */
export function createCheckoutManager(
  config: CheckoutConfig,
  callbacks?: CheckoutCallbacks
): CheckoutManager {
  return new CheckoutManager(config, callbacks);
}

/**
 * Create checkout renderer
 */
export function createCheckoutRenderer(manager: CheckoutManager): CheckoutRenderer {
  return new CheckoutRenderer(manager);
}

/**
 * Create and mount checkout
 */
export function mountCheckout(
  container: HTMLElement | string,
  config: CheckoutConfig,
  callbacks?: CheckoutCallbacks
): { manager: CheckoutManager; renderer: CheckoutRenderer } {
  const manager = createCheckoutManager(config, callbacks);
  const renderer = createCheckoutRenderer(manager);
  renderer.mount(container);
  
  return { manager, renderer };
}

/**
 * All checkout steps
 */
export const CHECKOUT_STEPS: CheckoutStep[] = [
  'method',
  'wallet',
  'confirm',
  'processing',
  'success',
  'failed',
  'expired',
];

/**
 * All payment methods
 */
export const PAYMENT_METHODS: PaymentMethod[] = [
  'wallet',
  'qr',
  'link',
  'privacy',
];
