/**
 * @fileoverview React Hooks for PRVCSH React Native SDK
 * @description Custom hooks for wallet, balance, and transactions.
 * 
 * @module @prvcsh/react-native/hooks
 * @version 0.1.0
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  WalletState,
  BalanceState,
  TransactionState,
  TransactionRecord,
  SolanaNetwork,
} from '../index';
import { WalletManager, createWalletManager, type WalletEvent } from '../wallet';

// =============================================================================
// WALLET HOOKS
// =============================================================================

/**
 * Wallet hook options
 */
export interface UseWalletOptions {
  network?: SolanaNetwork;
  autoConnect?: boolean;
  rpcUrl?: string;
}

/**
 * Wallet hook result
 */
export interface UseWalletResult extends WalletState {
  connect: (walletName?: string) => Promise<string>;
  disconnect: () => Promise<void>;
  signMessage: (message: string | Uint8Array) => Promise<Uint8Array>;
  signTransaction: (transaction: unknown) => Promise<unknown>;
  signAndSendTransaction: (transaction: unknown) => Promise<string>;
}

/**
 * Use wallet hook
 */
export function useWallet(options: UseWalletOptions = {}): UseWalletResult {
  const { network = 'devnet', autoConnect = false, rpcUrl } = options;
  
  const [state, setState] = useState<WalletState>({
    connected: false,
    connecting: false,
    publicKey: null,
    walletName: null,
    error: null,
  });
  
  const managerRef = useRef<WalletManager | null>(null);
  
  // Initialize manager
  useEffect(() => {
    const manager = createWalletManager({
      network,
      autoConnect,
      rpcUrl,
    });
    
    managerRef.current = manager;
    
    // Subscribe to events
    const unsubscribe = manager.subscribe((event: WalletEvent) => {
      setState(manager.getState());
      
      if (event.type === 'error' && event.error) {
        console.error('Wallet error:', event.error);
      }
    });
    
    // Auto-connect if enabled
    if (autoConnect) {
      manager.connect().catch(() => {
        // Ignore auto-connect errors
      });
    }
    
    return () => {
      unsubscribe();
      manager.disconnect().catch(() => {
        // Ignore disconnect errors on cleanup
      });
    };
  }, [network, autoConnect, rpcUrl]);
  
  // Connect
  const connect = useCallback(async (walletName?: string): Promise<string> => {
    if (!managerRef.current) {
      throw new Error('Wallet manager not initialized');
    }
    return managerRef.current.connect(walletName);
  }, []);
  
  // Disconnect
  const disconnect = useCallback(async (): Promise<void> => {
    if (!managerRef.current) {
      throw new Error('Wallet manager not initialized');
    }
    return managerRef.current.disconnect();
  }, []);
  
  // Sign message
  const signMessage = useCallback(async (message: string | Uint8Array): Promise<Uint8Array> => {
    if (!managerRef.current) {
      throw new Error('Wallet manager not initialized');
    }
    return managerRef.current.signMessage(message);
  }, []);
  
  // Sign transaction
  const signTransaction = useCallback(async (transaction: unknown): Promise<unknown> => {
    if (!managerRef.current) {
      throw new Error('Wallet manager not initialized');
    }
    return managerRef.current.signTransaction(transaction);
  }, []);
  
  // Sign and send transaction
  const signAndSendTransaction = useCallback(async (transaction: unknown): Promise<string> => {
    if (!managerRef.current) {
      throw new Error('Wallet manager not initialized');
    }
    return managerRef.current.signAndSendTransaction(transaction);
  }, []);
  
  return {
    ...state,
    connect,
    disconnect,
    signMessage,
    signTransaction,
    signAndSendTransaction,
  };
}

// =============================================================================
// BALANCE HOOKS
// =============================================================================

/**
 * Balance hook options
 */
export interface UseBalanceOptions {
  /** Public key to fetch balance for */
  publicKey: string | null;
  
  /** Refresh interval in ms (0 = disabled) */
  refreshInterval?: number;
  
  /** RPC endpoint */
  rpcUrl?: string;
}

/**
 * Use balance hook
 */
export function useBalance(options: UseBalanceOptions): BalanceState {
  const { publicKey, refreshInterval = 30000, rpcUrl } = options;
  
  const [state, setState] = useState<BalanceState>({
    sol: 0,
    tokens: {},
    loading: false,
    error: null,
    lastUpdated: null,
  });
  
  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setState((prev) => ({ ...prev, sol: 0, tokens: {}, loading: false }));
      return;
    }
    
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      // In real implementation, fetch from RPC
      // For now, return mock data
      const mockBalance = {
        sol: 1.5,
        tokens: {
          USDC: { amount: 100, decimals: 6 },
          USDT: { amount: 50, decimals: 6 },
        },
      };
      
      setState({
        sol: mockBalance.sol,
        tokens: mockBalance.tokens,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, [publicKey, rpcUrl]);
  
  // Initial fetch
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);
  
  // Refresh interval
  useEffect(() => {
    if (refreshInterval <= 0 || !publicKey) {
      return;
    }
    
    const interval = setInterval(fetchBalance, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchBalance, refreshInterval, publicKey]);
  
  return state;
}

// =============================================================================
// TRANSACTION HOOKS
// =============================================================================

/**
 * Transaction hook options
 */
export interface UseTransactionOptions {
  /** Public key */
  publicKey: string | null;
  
  /** Page size */
  pageSize?: number;
  
  /** RPC endpoint */
  rpcUrl?: string;
}

/**
 * Use transactions hook
 */
export function useTransactions(options: UseTransactionOptions): TransactionState & {
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
} {
  const { publicKey, pageSize = 20, rpcUrl } = options;
  
  const [state, setState] = useState<TransactionState>({
    transactions: [],
    pending: [],
    loading: false,
    error: null,
    hasMore: true,
  });
  
  const beforeSignatureRef = useRef<string | undefined>();
  
  // Fetch transactions
  const fetchTransactions = useCallback(async (refresh = false) => {
    if (!publicKey) {
      setState((prev) => ({
        ...prev,
        transactions: [],
        pending: [],
        loading: false,
      }));
      return;
    }
    
    if (refresh) {
      beforeSignatureRef.current = undefined;
    }
    
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      // In real implementation, fetch from RPC
      // For now, return mock data
      const mockTransactions: TransactionRecord[] = [
        {
          signature: 'mock-sig-1',
          timestamp: new Date(Date.now() - 3600000),
          type: 'payment',
          status: 'confirmed',
          amount: 0.5,
          from: publicKey,
          to: 'recipient-address',
        },
        {
          signature: 'mock-sig-2',
          timestamp: new Date(Date.now() - 7200000),
          type: 'received',
          status: 'confirmed',
          amount: 1.0,
          from: 'sender-address',
          to: publicKey,
        },
      ];
      
      setState((prev) => ({
        transactions: refresh
          ? mockTransactions
          : [...prev.transactions, ...mockTransactions],
        pending: prev.pending,
        loading: false,
        error: null,
        hasMore: mockTransactions.length >= pageSize,
      }));
      
      if (mockTransactions.length > 0) {
        beforeSignatureRef.current = mockTransactions[mockTransactions.length - 1].signature;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, [publicKey, pageSize, rpcUrl]);
  
  // Initial fetch
  useEffect(() => {
    fetchTransactions(true);
  }, [fetchTransactions]);
  
  // Load more
  const loadMore = useCallback(async () => {
    if (!state.loading && state.hasMore) {
      await fetchTransactions(false);
    }
  }, [state.loading, state.hasMore, fetchTransactions]);
  
  // Refresh
  const refresh = useCallback(async () => {
    await fetchTransactions(true);
  }, [fetchTransactions]);
  
  return {
    ...state,
    loadMore,
    refresh,
  };
}

// =============================================================================
// SEND TRANSACTION HOOK
// =============================================================================

/**
 * Send transaction options
 */
export interface UseSendOptions {
  /** RPC endpoint */
  rpcUrl?: string;
  
  /** Commitment level */
  commitment?: 'processed' | 'confirmed' | 'finalized';
}

/**
 * Send result
 */
export interface SendResult {
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
}

/**
 * Use send hook
 */
export function useSend(options: UseSendOptions = {}): {
  send: (params: {
    to: string;
    amount: number;
    token?: string;
  }) => Promise<SendResult>;
  sending: boolean;
  error: Error | null;
} {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const send = useCallback(async (params: {
    to: string;
    amount: number;
    token?: string;
  }): Promise<SendResult> => {
    setSending(true);
    setError(null);
    
    try {
      // In real implementation, create and send transaction
      // For now, return mock result
      const mockSignature = `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setSending(false);
      
      return {
        signature: mockSignature,
        status: 'confirmed',
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setSending(false);
      throw error;
    }
  }, []);
  
  return { send, sending, error };
}

// =============================================================================
// PAYMENT HOOKS
// =============================================================================

/**
 * Payment request
 */
export interface PaymentRequest {
  to: string;
  amount: number;
  token?: string;
  reference?: string;
  memo?: string;
}

/**
 * Payment result
 */
export interface PaymentResult {
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmedAt?: Date;
}

/**
 * Use payment hook
 */
export function usePayment(): {
  pay: (request: PaymentRequest) => Promise<PaymentResult>;
  paying: boolean;
  error: Error | null;
} {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const pay = useCallback(async (request: PaymentRequest): Promise<PaymentResult> => {
    setPaying(true);
    setError(null);
    
    try {
      // In real implementation, process payment
      // For now, return mock result
      const mockSignature = `payment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setPaying(false);
      
      return {
        signature: mockSignature,
        status: 'confirmed',
        confirmedAt: new Date(),
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setPaying(false);
      throw error;
    }
  }, []);
  
  return { pay, paying, error };
}

// =============================================================================
// QR CODE HOOKS
// =============================================================================

/**
 * Solana Pay URL data
 */
export interface SolanaPayData {
  recipient: string;
  amount?: number;
  token?: string;
  reference?: string[];
  label?: string;
  message?: string;
  memo?: string;
}

/**
 * Parse Solana Pay URL
 */
export function parseSolanaPayUrl(url: string): SolanaPayData | null {
  try {
    const parsed = new URL(url);
    
    if (parsed.protocol !== 'solana:') {
      return null;
    }
    
    const recipient = parsed.pathname;
    const params = parsed.searchParams;
    
    return {
      recipient,
      amount: params.has('amount') ? parseFloat(params.get('amount')!) : undefined,
      token: params.get('spl-token') ?? undefined,
      reference: params.getAll('reference'),
      label: params.get('label') ?? undefined,
      message: params.get('message') ?? undefined,
      memo: params.get('memo') ?? undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Create Solana Pay URL
 */
export function createSolanaPayUrl(data: SolanaPayData): string {
  const url = new URL(`solana:${data.recipient}`);
  
  if (data.amount !== undefined) {
    url.searchParams.set('amount', data.amount.toString());
  }
  
  if (data.token) {
    url.searchParams.set('spl-token', data.token);
  }
  
  if (data.reference) {
    for (const ref of data.reference) {
      url.searchParams.append('reference', ref);
    }
  }
  
  if (data.label) {
    url.searchParams.set('label', data.label);
  }
  
  if (data.message) {
    url.searchParams.set('message', data.message);
  }
  
  if (data.memo) {
    url.searchParams.set('memo', data.memo);
  }
  
  return url.toString();
}

/**
 * Use QR scanner hook result
 */
export interface UseQRScannerResult {
  scanning: boolean;
  start: () => void;
  stop: () => void;
  data: SolanaPayData | null;
  error: Error | null;
}

/**
 * Use QR scanner hook
 * Note: Actual scanning requires camera permissions and native module
 */
export function useQRScanner(): UseQRScannerResult {
  const [scanning, setScanning] = useState(false);
  const [data, setData] = useState<SolanaPayData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const start = useCallback(() => {
    setScanning(true);
    setData(null);
    setError(null);
  }, []);
  
  const stop = useCallback(() => {
    setScanning(false);
  }, []);
  
  return { scanning, start, stop, data, error };
}

// =============================================================================
// NETWORK HOOKS
// =============================================================================

/**
 * Use network hook
 */
export function useNetwork(): {
  network: SolanaNetwork;
  setNetwork: (network: SolanaNetwork) => void;
  rpcUrl: string;
} {
  const [network, setNetwork] = useState<SolanaNetwork>('devnet');
  
  const rpcUrl = useMemo(() => {
    switch (network) {
      case 'mainnet-beta':
        return 'https://api.mainnet-beta.solana.com';
      case 'testnet':
        return 'https://api.testnet.solana.com';
      case 'devnet':
      default:
        return 'https://api.devnet.solana.com';
    }
  }, [network]);
  
  return { network, setNetwork, rpcUrl };
}

// =============================================================================
// AIRDROP HOOK (Devnet only)
// =============================================================================

/**
 * Use airdrop hook (devnet only)
 */
export function useAirdrop(): {
  airdrop: (publicKey: string, amount?: number) => Promise<string>;
  loading: boolean;
  error: Error | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const airdrop = useCallback(async (publicKey: string, amount = 1): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      // In real implementation, request airdrop from devnet
      // For now, return mock signature
      const mockSignature = `airdrop-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      setLoading(false);
      return mockSignature;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setLoading(false);
      throw error;
    }
  }, []);
  
  return { airdrop, loading, error };
}
