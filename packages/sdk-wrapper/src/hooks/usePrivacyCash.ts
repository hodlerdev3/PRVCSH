/**
 * usePRVCSH React Hook
 *
 * Provides a convenient React interface for the PRVCSH SDK.
 */

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { PRVCSHBrowser } from "../client/PRVCSHBrowser";
import {
  type PRVCSHConfig,
  type PRVCSHState,
  type DepositParams,
  type WithdrawParams,
  type TransactionResult,
  type PrivateBalance,
  type SupportedToken,
  type ZKProofStatus,
  type UsePRVCSHReturn,
} from "../types";
import { ZK_PROOF_MESSAGES } from "../constants";

interface UsePRVCSHOptions {
  config: PRVCSHConfig;
  walletAddress?: string | null;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
  autoInitialize?: boolean;
}

/**
 * React hook for interacting with PRVCSH SDK
 *
 * @example
 * ```tsx
 * const { state, deposit, withdraw, getPrivateBalance } = usePRVCSH({
 *   config: {
 *     rpcUrl: 'https://api.devnet.solana.com',
 *     network: 'devnet',
 *     relayerUrl: 'https://relayer-devnet.privacycash.io'
 *   },
 *   walletAddress: wallet.publicKey?.toString(),
 *   signMessage: wallet.signMessage,
 * });
 * ```
 */
export function usePRVCSH({
  config,
  walletAddress,
  signMessage,
  autoInitialize = true,
}: UsePRVCSHOptions): UsePRVCSHReturn {
  // Create client instance
  const client = useMemo(() => new PRVCSHBrowser(config), [config]);

  // State
  const [state, setState] = useState<PRVCSHState>({
    isInitialized: false,
    isEncryptionReady: false,
    walletAddress: null,
    isLoading: false,
    error: null,
  });

  const [proofStatus, setProofStatus] = useState<ZKProofStatus>({
    step: "idle",
    progress: 0,
    message: ZK_PROOF_MESSAGES.idle ?? "",
  });

  // Sync state from client
  const syncState = useCallback(() => {
    setState(client.state);
    setProofStatus(client.proofStatus);
  }, [client]);

  // Initialize encryption
  const initializeEncryption = useCallback(async () => {
    if (!walletAddress || !signMessage) {
      setState((prev) => ({
        ...prev,
        error: {
          code: "WALLET_NOT_CONNECTED",
          message: "Wallet not connected or signMessage not available",
        },
      }));
      return;
    }

    try {
      await client.initializeEncryption(walletAddress, signMessage);
      syncState();
    } catch (_error) {
      syncState();
    }
  }, [client, walletAddress, signMessage, syncState]);

  // Auto-initialize when wallet connects
  useEffect(() => {
    if (autoInitialize && walletAddress && signMessage && !state.isEncryptionReady) {
      // Don't auto-initialize - let user trigger it
      // This is a privacy-sensitive operation
    }
  }, [autoInitialize, walletAddress, signMessage, state.isEncryptionReady]);

  // Reset state when wallet disconnects
  useEffect(() => {
    if (!walletAddress && state.isEncryptionReady) {
      setState({
        isInitialized: false,
        isEncryptionReady: false,
        walletAddress: null,
        isLoading: false,
        error: null,
      });
    }
  }, [walletAddress, state.isEncryptionReady]);

  // Deposit
  const deposit = useCallback(
    async (params: DepositParams): Promise<TransactionResult> => {
      const result = await client.deposit(params);
      syncState();
      return result;
    },
    [client, syncState]
  );

  // Withdraw
  const withdraw = useCallback(
    async (params: WithdrawParams): Promise<TransactionResult> => {
      const result = await client.withdraw(params);
      syncState();
      return result;
    },
    [client, syncState]
  );

  // Get private balance
  const getPrivateBalance = useCallback(
    async (token: SupportedToken): Promise<PrivateBalance> => {
      return client.getPrivateBalance(token);
    },
    [client]
  );

  // Get all private balances
  const getAllPrivateBalances = useCallback(async (): Promise<PrivateBalance[]> => {
    return client.getAllPrivateBalances();
  }, [client]);

  // Clear cache
  const clearCache = useCallback(() => {
    client.clearCache();
  }, [client]);

  return {
    state,
    initializeEncryption,
    deposit,
    withdraw,
    getPrivateBalance,
    getAllPrivateBalances,
    proofStatus,
    clearCache,
  };
}

// Also export as default
export default usePRVCSH;
