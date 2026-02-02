/**
 * @fileoverview Wallet Management for React Native
 * @description Wallet connection and management utilities.
 * 
 * @module @prvcsh/react-native/wallet
 * @version 0.1.0
 */

import type { WalletState, SolanaNetwork } from './index';

// =============================================================================
// WALLET TYPES
// =============================================================================

/**
 * Wallet adapter interface
 */
export interface WalletAdapter {
  /** Wallet name */
  name: string;
  
  /** Wallet icon URL */
  icon: string;
  
  /** Is installed */
  installed: boolean;
  
  /** Connect */
  connect: () => Promise<string>;
  
  /** Disconnect */
  disconnect: () => Promise<void>;
  
  /** Sign message */
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  
  /** Sign transaction */
  signTransaction: (transaction: unknown) => Promise<unknown>;
  
  /** Sign and send transaction */
  signAndSendTransaction: (transaction: unknown) => Promise<string>;
}

/**
 * Wallet info
 */
export interface WalletInfo {
  name: string;
  icon: string;
  url: string;
  deepLink?: string;
  installed: boolean;
}

/**
 * Supported wallets
 */
export const SUPPORTED_WALLETS: WalletInfo[] = [
  {
    name: 'Phantom',
    icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons/phantom.svg',
    url: 'https://phantom.app',
    deepLink: 'phantom://',
    installed: false,
  },
  {
    name: 'Solflare',
    icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons/solflare.svg',
    url: 'https://solflare.com',
    deepLink: 'solflare://',
    installed: false,
  },
  {
    name: 'Glow',
    icon: 'https://glow.app/icons/glow-icon.svg',
    url: 'https://glow.app',
    deepLink: 'glow://',
    installed: false,
  },
];

// =============================================================================
// WALLET MANAGER
// =============================================================================

/**
 * Wallet connection event
 */
export interface WalletEvent {
  type: 'connect' | 'disconnect' | 'error' | 'accountChange';
  publicKey?: string;
  error?: Error;
}

/**
 * Wallet event handler
 */
export type WalletEventHandler = (event: WalletEvent) => void;

/**
 * Wallet manager configuration
 */
export interface WalletManagerConfig {
  /** Solana network */
  network: SolanaNetwork;
  
  /** Auto-connect on init */
  autoConnect: boolean;
  
  /** RPC endpoint */
  rpcUrl?: string;
}

/**
 * Wallet manager
 */
export class WalletManager {
  private config: WalletManagerConfig;
  private state: WalletState;
  private eventHandlers: Set<WalletEventHandler> = new Set();
  private adapter: WalletAdapter | null = null;
  
  constructor(config: WalletManagerConfig) {
    this.config = config;
    this.state = {
      connected: false,
      connecting: false,
      publicKey: null,
      walletName: null,
      error: null,
    };
  }
  
  /**
   * Get current state
   */
  getState(): WalletState {
    return { ...this.state };
  }
  
  /**
   * Subscribe to events
   */
  subscribe(handler: WalletEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }
  
  /**
   * Emit event
   */
  private emit(event: WalletEvent): void {
    for (const handler of this.eventHandlers) {
      handler(event);
    }
  }
  
  /**
   * Update state
   */
  private setState(updates: Partial<WalletState>): void {
    this.state = { ...this.state, ...updates };
  }
  
  /**
   * Connect to wallet
   */
  async connect(walletName?: string): Promise<string> {
    if (this.state.connecting) {
      throw new Error('Already connecting');
    }
    
    this.setState({ connecting: true, error: null });
    
    try {
      // Create adapter based on wallet name
      this.adapter = this.createAdapter(walletName ?? 'Phantom');
      
      // Connect
      const publicKey = await this.adapter.connect();
      
      this.setState({
        connected: true,
        connecting: false,
        publicKey,
        walletName: this.adapter.name,
      });
      
      this.emit({ type: 'connect', publicKey });
      
      return publicKey;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      this.setState({
        connecting: false,
        error: err,
      });
      
      this.emit({ type: 'error', error: err });
      
      throw err;
    }
  }
  
  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    if (this.adapter) {
      await this.adapter.disconnect();
    }
    
    this.setState({
      connected: false,
      connecting: false,
      publicKey: null,
      walletName: null,
    });
    
    this.adapter = null;
    
    this.emit({ type: 'disconnect' });
  }
  
  /**
   * Sign message
   */
  async signMessage(message: string | Uint8Array): Promise<Uint8Array> {
    if (!this.adapter) {
      throw new Error('Wallet not connected');
    }
    
    const messageBytes = typeof message === 'string'
      ? new TextEncoder().encode(message)
      : message;
    
    return this.adapter.signMessage(messageBytes);
  }
  
  /**
   * Sign transaction
   */
  async signTransaction(transaction: unknown): Promise<unknown> {
    if (!this.adapter) {
      throw new Error('Wallet not connected');
    }
    
    return this.adapter.signTransaction(transaction);
  }
  
  /**
   * Sign and send transaction
   */
  async signAndSendTransaction(transaction: unknown): Promise<string> {
    if (!this.adapter) {
      throw new Error('Wallet not connected');
    }
    
    return this.adapter.signAndSendTransaction(transaction);
  }
  
  /**
   * Create wallet adapter
   */
  private createAdapter(walletName: string): WalletAdapter {
    // This would use platform-specific adapters in real implementation
    // For now, return a mock adapter
    return new MockWalletAdapter(walletName, this.config);
  }
  
  /**
   * Get available wallets
   */
  getAvailableWallets(): WalletInfo[] {
    // In real implementation, check which wallets are installed
    return SUPPORTED_WALLETS.map((wallet) => ({
      ...wallet,
      installed: this.checkWalletInstalled(wallet.name),
    }));
  }
  
  /**
   * Check if wallet is installed
   */
  private checkWalletInstalled(_walletName: string): boolean {
    // Platform-specific check would go here
    return false;
  }
}

// =============================================================================
// MOCK WALLET ADAPTER
// =============================================================================

/**
 * Mock wallet adapter for development
 */
class MockWalletAdapter implements WalletAdapter {
  name: string;
  icon: string = '';
  installed: boolean = true;
  
  private publicKey: string | null = null;
  
  constructor(name: string, _config: WalletManagerConfig) {
    this.name = name;
  }
  
  async connect(): Promise<string> {
    // Generate mock public key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.publicKey = result;
    return result;
  }
  
  async disconnect(): Promise<void> {
    this.publicKey = null;
  }
  
  async signMessage(_message: Uint8Array): Promise<Uint8Array> {
    // Return mock signature
    const signature = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      signature[i] = Math.floor(Math.random() * 256);
    }
    return signature;
  }
  
  async signTransaction(transaction: unknown): Promise<unknown> {
    // Return signed transaction
    return transaction;
  }
  
  async signAndSendTransaction(_transaction: unknown): Promise<string> {
    // Return mock signature
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 88; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create wallet manager
 */
export function createWalletManager(config: WalletManagerConfig): WalletManager {
  return new WalletManager(config);
}

/**
 * Deep link handler
 */
export function handleDeepLink(url: string): {
  action?: string;
  publicKey?: string;
  signature?: string;
} | null {
  try {
    const parsed = new URL(url);
    const params = parsed.searchParams;
    
    return {
      action: params.get('action') ?? undefined,
      publicKey: params.get('publicKey') ?? undefined,
      signature: params.get('signature') ?? undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Create deep link for wallet connection
 */
export function createConnectDeepLink(
  walletName: string,
  appUrl: string,
  cluster: SolanaNetwork
): string {
  const wallet = SUPPORTED_WALLETS.find((w) => w.name === walletName);
  if (!wallet?.deepLink) {
    throw new Error(`Wallet ${walletName} does not support deep links`);
  }
  
  const params = new URLSearchParams({
    app_url: appUrl,
    cluster,
  });
  
  return `${wallet.deepLink}connect?${params.toString()}`;
}
