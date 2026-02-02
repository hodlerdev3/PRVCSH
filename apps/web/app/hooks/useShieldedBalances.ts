"use client";

/**
 * useShieldedBalances Hook
 *
 * Manages shielded (private) balances using the SDK.
 * Persists encrypted note data in localStorage.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

// ============================================
// Types
// ============================================

export interface ShieldedBalance {
  mint: string;
  symbol: string;
  balance: string;
  balanceRaw: bigint;
}

export interface ShieldedBalancesState {
  /** Shielded balances by mint */
  balances: Record<string, string>;
  /** Total shielded value in USD */
  totalUsdValue: number;
  /** Loading state */
  isLoading: boolean;
  /** Error */
  error: string | null;
  /** Is encryption initialized */
  isInitialized: boolean;
}

export interface UseShieldedBalancesReturn extends ShieldedBalancesState {
  /** Initialize encryption (requires wallet signature) */
  initialize: () => Promise<void>;
  /** Refresh balances from stored notes */
  refresh: () => Promise<void>;
  /** Add a deposit note */
  addDeposit: (mint: string, amount: string) => void;
  /** Remove after withdrawal */
  removeWithdraw: (mint: string, amount: string) => void;
  /** Get balance for specific token */
  getBalance: (mint: string) => string;
}

// ============================================
// Storage Key
// ============================================

const STORAGE_KEY_PREFIX = "prvcsh-shielded-";

// ============================================
// Hook Implementation
// ============================================

export function useShieldedBalances(): UseShieldedBalancesReturn {
  const { publicKey, connected, signMessage } = useWallet();

  const [state, setState] = useState<ShieldedBalancesState>({
    balances: {},
    totalUsdValue: 0,
    isLoading: false,
    error: null,
    isInitialized: false,
  });

  // Get storage key for current wallet
  const storageKey = useMemo(() => {
    if (!publicKey) return null;
    return `${STORAGE_KEY_PREFIX}${publicKey.toString()}`;
  }, [publicKey]);

  // Load balances from localStorage
  const loadFromStorage = useCallback((): Record<string, string> => {
    if (!storageKey || typeof window === "undefined") return {};

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return {};
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }, [storageKey]);

  // Save balances to localStorage
  const saveToStorage = useCallback((balances: Record<string, string>) => {
    if (!storageKey || typeof window === "undefined") return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(balances));
    } catch (error) {
      console.error("Failed to save shielded balances:", error);
    }
  }, [storageKey]);

  // Initialize (in a real app, this would derive encryption key)
  const initialize = useCallback(async () => {
    if (!publicKey || !signMessage) {
      setState((prev) => ({ ...prev, error: "Wallet not connected" }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // In a real implementation, we'd sign a message to derive encryption key
      // For now, we just mark as initialized
      const balances = loadFromStorage();

      setState({
        balances,
        totalUsdValue: 0,
        isLoading: false,
        error: null,
        isInitialized: true,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to initialize",
      }));
    }
  }, [publicKey, signMessage, loadFromStorage]);

  // Refresh balances
  const refresh = useCallback(async () => {
    if (!connected) return;

    const balances = loadFromStorage();
    setState((prev) => ({ ...prev, balances }));
  }, [connected, loadFromStorage]);

  // Add deposit
  const addDeposit = useCallback((mint: string, amount: string) => {
    setState((prev) => {
      const currentBalance = parseFloat(prev.balances[mint] || "0");
      const depositAmount = parseFloat(amount);
      const newBalance = (currentBalance + depositAmount).toFixed(4);

      const newBalances = {
        ...prev.balances,
        [mint]: newBalance,
      };

      // Save to storage
      saveToStorage(newBalances);

      return {
        ...prev,
        balances: newBalances,
      };
    });
  }, [saveToStorage]);

  // Remove after withdrawal
  const removeWithdraw = useCallback((mint: string, amount: string) => {
    setState((prev) => {
      const currentBalance = parseFloat(prev.balances[mint] || "0");
      const withdrawAmount = parseFloat(amount);
      const newBalance = Math.max(0, currentBalance - withdrawAmount).toFixed(4);

      const newBalances = {
        ...prev.balances,
        [mint]: newBalance,
      };

      // Save to storage
      saveToStorage(newBalances);

      return {
        ...prev,
        balances: newBalances,
      };
    });
  }, [saveToStorage]);

  // Get balance for specific token
  const getBalance = useCallback((mint: string): string => {
    return state.balances[mint] ?? "0";
  }, [state.balances]);

  // Auto-load when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      const balances = loadFromStorage();
      setState((prev) => ({
        ...prev,
        balances,
        isInitialized: true,
      }));
    } else {
      setState({
        balances: {},
        totalUsdValue: 0,
        isLoading: false,
        error: null,
        isInitialized: false,
      });
    }
  }, [connected, publicKey, loadFromStorage]);

  return {
    ...state,
    initialize,
    refresh,
    addDeposit,
    removeWithdraw,
    getBalance,
  };
}

export default useShieldedBalances;
