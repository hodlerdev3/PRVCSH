"use client";

/**
 * useWalletBalances Hook
 *
 * Fetches real wallet balances from Solana blockchain.
 * Supports SOL and SPL tokens.
 */

import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { SUPPORTED_TOKENS, NATIVE_SOL_MINT } from "../data/tokens";

// ============================================
// Types
// ============================================

export interface TokenBalance {
  mint: string;
  symbol: string;
  balance: string;
  balanceRaw: bigint;
  decimals: number;
  usdValue?: number;
}

export interface WalletBalancesState {
  /** SOL balance */
  solBalance: string;
  solBalanceRaw: bigint;
  /** Token balances by mint address */
  tokenBalances: Record<string, TokenBalance>;
  /** Public balances (for MixerForm) */
  publicBalances: Record<string, string>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Last refresh timestamp */
  lastRefresh: number | null;
}

export interface UseWalletBalancesReturn extends WalletBalancesState {
  /** Refresh balances manually */
  refresh: () => Promise<void>;
  /** Get balance for a specific token */
  getBalance: (mint: string) => string;
  /** Get max amount for deposit (balance - fee buffer) */
  getMaxDeposit: (mint: string) => string;
}

// ============================================
// Constants
// ============================================

/** Minimum SOL to keep for fees */
const SOL_FEE_BUFFER = 0.01;

/** Token Program ID */
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

/** Token 2022 Program ID */
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

// ============================================
// Hook Implementation
// ============================================

export function useWalletBalances(autoRefresh = true, refreshInterval = 30000): UseWalletBalancesReturn {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const [state, setState] = useState<WalletBalancesState>({
    solBalance: "0",
    solBalanceRaw: 0n,
    tokenBalances: {},
    publicBalances: {},
    isLoading: false,
    error: null,
    lastRefresh: null,
  });

  // Fetch SOL balance
  const fetchSolBalance = useCallback(async (walletPubkey: PublicKey): Promise<{ balance: string; raw: bigint }> => {
    try {
      const lamports = await connection.getBalance(walletPubkey);
      const balance = lamports / LAMPORTS_PER_SOL;
      return {
        balance: balance.toFixed(4),
        raw: BigInt(lamports),
      };
    } catch (error) {
      console.error("Failed to fetch SOL balance:", error);
      return { balance: "0", raw: 0n };
    }
  }, [connection]);

  // Fetch SPL token balances
  const fetchTokenBalances = useCallback(async (walletPubkey: PublicKey): Promise<Record<string, TokenBalance>> => {
    const balances: Record<string, TokenBalance> = {};

    try {
      // Get all token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
        programId: TOKEN_PROGRAM_ID,
      });

      // Also check Token 2022 accounts
      let token2022Accounts;
      try {
        token2022Accounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
          programId: TOKEN_2022_PROGRAM_ID,
        });
      } catch {
        token2022Accounts = { value: [] };
      }

      const allAccounts = [...tokenAccounts.value, ...token2022Accounts.value];

      // Process each token account
      for (const account of allAccounts) {
        const parsedInfo = account.account.data.parsed?.info;
        if (!parsedInfo) continue;

        const mint = parsedInfo.mint as string;
        const tokenAmount = parsedInfo.tokenAmount;

        // Find token info from our supported list
        const tokenInfo = SUPPORTED_TOKENS.find((t) => t.mint === mint);
        if (!tokenInfo) continue;

        const balanceNum = parseFloat(tokenAmount.uiAmountString || "0");

        balances[mint] = {
          mint,
          symbol: tokenInfo.symbol,
          balance: balanceNum.toFixed(tokenInfo.decimals > 4 ? 4 : tokenInfo.decimals),
          balanceRaw: BigInt(tokenAmount.amount || "0"),
          decimals: tokenInfo.decimals,
        };
      }

      return balances;
    } catch (error) {
      console.error("Failed to fetch token balances:", error);
      return {};
    }
  }, [connection]);

  // Main refresh function
  const refresh = useCallback(async () => {
    if (!publicKey || !connected) {
      setState({
        solBalance: "0",
        solBalanceRaw: 0n,
        tokenBalances: {},
        publicBalances: {},
        isLoading: false,
        error: null,
        lastRefresh: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch both in parallel
      const [solResult, tokenBalances] = await Promise.all([
        fetchSolBalance(publicKey),
        fetchTokenBalances(publicKey),
      ]);

      // Build public balances for MixerForm
      const publicBalances: Record<string, string> = {
        [NATIVE_SOL_MINT]: solResult.balance,
      };

      for (const [mint, balance] of Object.entries(tokenBalances)) {
        publicBalances[mint] = balance.balance;
      }

      setState({
        solBalance: solResult.balance,
        solBalanceRaw: solResult.raw,
        tokenBalances,
        publicBalances,
        isLoading: false,
        error: null,
        lastRefresh: Date.now(),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch balances",
      }));
    }
  }, [publicKey, connected, fetchSolBalance, fetchTokenBalances]);

  // Get balance for a specific token
  const getBalance = useCallback((mint: string): string => {
    if (mint === NATIVE_SOL_MINT) {
      return state.solBalance;
    }
    return state.tokenBalances[mint]?.balance ?? "0";
  }, [state.solBalance, state.tokenBalances]);

  // Get max amount for deposit (with fee buffer for SOL)
  const getMaxDeposit = useCallback((mint: string): string => {
    if (mint === NATIVE_SOL_MINT) {
      const balance = parseFloat(state.solBalance);
      const maxDeposit = Math.max(0, balance - SOL_FEE_BUFFER);
      return maxDeposit.toFixed(4);
    }
    return state.tokenBalances[mint]?.balance ?? "0";
  }, [state.solBalance, state.tokenBalances]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (connected && publicKey) {
      refresh();
    }
  }, [connected, publicKey, refresh]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !connected || !publicKey) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, connected, publicKey, refreshInterval, refresh]);

  return {
    ...state,
    refresh,
    getBalance,
    getMaxDeposit,
  };
}

export default useWalletBalances;
