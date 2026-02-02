"use client";

/**
 * useTransactionHistory Hook
 *
 * Manages transaction history for PRVCSH operations.
 * Persists to localStorage per wallet.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

// ============================================
// Types
// ============================================

export type TransactionType = "deposit" | "withdraw";
export type TransactionStatus = "pending" | "confirmed" | "failed";

export interface PrivacyTransaction {
  id: string;
  type: TransactionType;
  token: string;
  tokenSymbol: string;
  amount: string;
  timestamp: number;
  status: TransactionStatus;
  txSignature?: string;
  recipient?: string; // For withdrawals
  error?: string;
}

export interface TransactionHistoryState {
  transactions: PrivacyTransaction[];
  isLoading: boolean;
}

export interface UseTransactionHistoryReturn extends TransactionHistoryState {
  /** Add a new transaction */
  addTransaction: (tx: Omit<PrivacyTransaction, "id" | "timestamp">) => string;
  /** Update transaction status */
  updateTransaction: (id: string, updates: Partial<PrivacyTransaction>) => void;
  /** Clear all transactions */
  clearHistory: () => void;
  /** Get recent transactions (last N) */
  getRecent: (count?: number) => PrivacyTransaction[];
}

// ============================================
// Storage Key
// ============================================

const STORAGE_KEY_PREFIX = "prvcsh-txs-";

// ============================================
// Hook Implementation
// ============================================

export function useTransactionHistory(): UseTransactionHistoryReturn {
  const { publicKey, connected } = useWallet();

  const [state, setState] = useState<TransactionHistoryState>({
    transactions: [],
    isLoading: true,
  });

  // Get storage key for current wallet
  const storageKey = useMemo(() => {
    if (!publicKey) return null;
    return `${STORAGE_KEY_PREFIX}${publicKey.toString()}`;
  }, [publicKey]);

  // Load from localStorage
  const loadFromStorage = useCallback((): PrivacyTransaction[] => {
    if (!storageKey || typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      // Sort by timestamp descending
      return parsed.sort((a: PrivacyTransaction, b: PrivacyTransaction) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }, [storageKey]);

  // Save to localStorage
  const saveToStorage = useCallback((transactions: PrivacyTransaction[]) => {
    if (!storageKey || typeof window === "undefined") return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(transactions));
    } catch (error) {
      console.error("Failed to save transaction history:", error);
    }
  }, [storageKey]);

  // Generate unique ID
  const generateId = useCallback(() => {
    return `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add transaction
  const addTransaction = useCallback((tx: Omit<PrivacyTransaction, "id" | "timestamp">): string => {
    const id = generateId();
    const newTx: PrivacyTransaction = {
      ...tx,
      id,
      timestamp: Date.now(),
    };

    setState((prev) => {
      const updated = [newTx, ...prev.transactions];
      saveToStorage(updated);
      return { ...prev, transactions: updated };
    });

    return id;
  }, [generateId, saveToStorage]);

  // Update transaction
  const updateTransaction = useCallback((id: string, updates: Partial<PrivacyTransaction>) => {
    setState((prev) => {
      const updated = prev.transactions.map((tx) =>
        tx.id === id ? { ...tx, ...updates } : tx
      );
      saveToStorage(updated);
      return { ...prev, transactions: updated };
    });
  }, [saveToStorage]);

  // Clear history
  const clearHistory = useCallback(() => {
    setState((prev) => {
      saveToStorage([]);
      return { ...prev, transactions: [] };
    });
  }, [saveToStorage]);

  // Get recent transactions
  const getRecent = useCallback((count = 5): PrivacyTransaction[] => {
    return state.transactions.slice(0, count);
  }, [state.transactions]);

  // Load on wallet connect
  useEffect(() => {
    if (connected && publicKey) {
      const transactions = loadFromStorage();
      setState({ transactions, isLoading: false });
    } else {
      setState({ transactions: [], isLoading: false });
    }
  }, [connected, publicKey, loadFromStorage]);

  return {
    ...state,
    addTransaction,
    updateTransaction,
    clearHistory,
    getRecent,
  };
}

export default useTransactionHistory;
