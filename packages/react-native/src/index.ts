/**
 * @fileoverview PRVCSH React Native SDK
 * @description React Native wrapper for PRVCSH SDK.
 * 
 * @module @prvcsh/react-native
 * @version 0.1.0
 * 
 * @example
 * ```tsx
 * import { PRVCSHProvider, usePRVCSH, useWallet } from '@prvcsh/react-native';
 * 
 * function App() {
 *   return (
 *     <PRVCSHProvider
 *       network="mainnet-beta"
 *       config={{ autoConnect: true }}
 *     >
 *       <WalletScreen />
 *     </PRVCSHProvider>
 *   );
 * }
 * 
 * function WalletScreen() {
 *   const { balance, deposit, withdraw } = usePRVCSH();
 *   const { connect, connected, publicKey } = useWallet();
 *   
 *   return (
 *     <View>
 *       <Text>Balance: {balance}</Text>
 *       <Button onPress={() => deposit(1000000n)} title="Deposit" />
 *     </View>
 *   );
 * }
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Solana network
 */
export type SolanaNetwork = 
  | 'mainnet-beta'
  | 'devnet'
  | 'testnet'
  | 'localnet';

/**
 * SDK configuration
 */
export interface PRVCSHConfig {
  /** Auto-connect on mount */
  autoConnect?: boolean;
  
  /** RPC endpoint URL (overrides network default) */
  rpcUrl?: string;
  
  /** Commitment level */
  commitment?: 'processed' | 'confirmed' | 'finalized';
  
  /** Enable debug logging */
  debug?: boolean;
  
  /** API key for analytics */
  apiKey?: string;
}

/**
 * Wallet state
 */
export interface WalletState {
  /** Connection status */
  connected: boolean;
  
  /** Connecting status */
  connecting: boolean;
  
  /** Public key */
  publicKey: string | null;
  
  /** Wallet name */
  walletName: string | null;
  
  /** Error */
  error: Error | null;
}

/**
 * Balance state
 */
export interface BalanceState {
  /** SOL balance (lamports) */
  sol: bigint;
  
  /** USDC balance (6 decimals) */
  usdc: bigint;
  
  /** USDT balance (6 decimals) */
  usdt: bigint;
  
  /** PRIVACY token balance */
  privacy: bigint;
  
  /** Shielded balances */
  shielded: {
    sol: bigint;
    usdc: bigint;
    usdt: bigint;
    privacy: bigint;
  };
  
  /** Loading state */
  loading: boolean;
  
  /** Last update */
  lastUpdate: Date | null;
}

/**
 * Transaction state
 */
export interface TransactionState {
  /** Pending transactions */
  pending: PendingTransaction[];
  
  /** Recent transactions */
  history: TransactionRecord[];
  
  /** Loading state */
  loading: boolean;
}

/**
 * Pending transaction
 */
export interface PendingTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'shield' | 'unshield';
  amount: bigint;
  currency: 'SOL' | 'USDC' | 'USDT' | 'PRIVACY';
  status: 'signing' | 'confirming' | 'processing';
  createdAt: Date;
}

/**
 * Transaction record
 */
export interface TransactionRecord {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'shield' | 'unshield';
  amount: bigint;
  currency: 'SOL' | 'USDC' | 'USDT' | 'PRIVACY';
  status: 'completed' | 'failed';
  signature?: string;
  fee?: bigint;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * PRVCSH context value
 */
export interface PRVCSHContextValue {
  /** Network */
  network: SolanaNetwork;
  
  /** Configuration */
  config: PRVCSHConfig;
  
  /** Wallet state */
  wallet: WalletState;
  
  /** Balance state */
  balance: BalanceState;
  
  /** Transaction state */
  transactions: TransactionState;
  
  /** Connect wallet */
  connect: (walletName?: string) => Promise<void>;
  
  /** Disconnect wallet */
  disconnect: () => Promise<void>;
  
  /** Deposit to shielded pool */
  deposit: (amount: bigint, currency?: Currency) => Promise<string>;
  
  /** Withdraw from shielded pool */
  withdraw: (amount: bigint, recipient: string, currency?: Currency) => Promise<string>;
  
  /** Transfer (shielded) */
  transfer: (amount: bigint, recipient: string, currency?: Currency) => Promise<string>;
  
  /** Shield tokens */
  shield: (amount: bigint, currency?: Currency) => Promise<string>;
  
  /** Unshield tokens */
  unshield: (amount: bigint, currency?: Currency) => Promise<string>;
  
  /** Refresh balances */
  refreshBalance: () => Promise<void>;
  
  /** Refresh transactions */
  refreshTransactions: () => Promise<void>;
}

/**
 * Currency type
 */
export type Currency = 'SOL' | 'USDC' | 'USDT' | 'PRIVACY';

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: PRVCSHConfig = {
  autoConnect: false,
  commitment: 'confirmed',
  debug: false,
};

/**
 * Network RPC endpoints
 */
export const NETWORK_ENDPOINTS: Record<SolanaNetwork, string> = {
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  'devnet': 'https://api.devnet.solana.com',
  'testnet': 'https://api.testnet.solana.com',
  'localnet': 'http://localhost:8899',
};

/**
 * Default wallet state
 */
export const DEFAULT_WALLET_STATE: WalletState = {
  connected: false,
  connecting: false,
  publicKey: null,
  walletName: null,
  error: null,
};

/**
 * Default balance state
 */
export const DEFAULT_BALANCE_STATE: BalanceState = {
  sol: 0n,
  usdc: 0n,
  usdt: 0n,
  privacy: 0n,
  shielded: {
    sol: 0n,
    usdc: 0n,
    usdt: 0n,
    privacy: 0n,
  },
  loading: false,
  lastUpdate: null,
};

/**
 * Default transaction state
 */
export const DEFAULT_TRANSACTION_STATE: TransactionState = {
  pending: [],
  history: [],
  loading: false,
};

// =============================================================================
// CONTEXT
// =============================================================================

/**
 * PRVCSH context (placeholder for React context)
 */
let _context: PRVCSHContextValue | null = null;

/**
 * Set context (internal use)
 */
export function _setContext(ctx: PRVCSHContextValue): void {
  _context = ctx;
}

/**
 * Get context (internal use)
 */
export function _getContext(): PRVCSHContextValue | null {
  return _context;
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Format lamports to SOL
 */
export function formatSOL(lamports: bigint): string {
  const sol = Number(lamports) / 1e9;
  return sol.toFixed(4);
}

/**
 * Format token amount (6 decimals)
 */
export function formatToken(amount: bigint, decimals: number = 6): string {
  const divisor = 10 ** decimals;
  const value = Number(amount) / divisor;
  return value.toFixed(2);
}

/**
 * Parse SOL to lamports
 */
export function parseSOL(sol: string | number): bigint {
  return BigInt(Math.floor(Number(sol) * 1e9));
}

/**
 * Parse token amount
 */
export function parseToken(amount: string | number, decimals: number = 6): bigint {
  const multiplier = 10 ** decimals;
  return BigInt(Math.floor(Number(amount) * multiplier));
}

/**
 * Shorten address
 */
export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = 'tx'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${timestamp}${random}`;
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

export * from './wallet';
export * from './hooks';
export * from './components';
export * from './biometric';
export * from './storage';
export * from './notifications';
export * from './qr';
