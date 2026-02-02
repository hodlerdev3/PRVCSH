"use client";

/**
 * useMixer Hook
 *
 * Main hook for deposit/withdraw operations.
 * Integrates with wallet, balances, and transaction history.
 */

import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import type { TokenInfo } from "../components/TokenSelector";
import { NATIVE_SOL_MINT } from "../data/tokens";
import { useShieldedBalances } from "./useShieldedBalances";
import { useTransactionHistory, type TransactionStatus } from "./useTransactionHistory";

// ============================================
// Types
// ============================================

export type MixerOperationStatus = "idle" | "preparing" | "signing" | "confirming" | "success" | "error";

export interface MixerState {
  status: MixerOperationStatus;
  progress: number;
  message: string;
  error: string | null;
}

export interface UseMixerReturn {
  state: MixerState;
  /** Deposit tokens into privacy pool */
  deposit: (token: TokenInfo, amount: string) => Promise<string | null>;
  /** Withdraw tokens from privacy pool */
  withdraw: (token: TokenInfo, amount: string, recipient: string) => Promise<string | null>;
  /** Reset state */
  reset: () => void;
}

// ============================================
// Pool Address (placeholder - in production this would be the mixer contract)
// ============================================

const MIXER_POOL_ADDRESS = new PublicKey("11111111111111111111111111111111"); // Placeholder

// ============================================
// Hook Implementation
// ============================================

export function useMixer(): UseMixerReturn {
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const { addDeposit, removeWithdraw } = useShieldedBalances();
  const { addTransaction, updateTransaction } = useTransactionHistory();

  const [state, setState] = useState<MixerState>({
    status: "idle",
    progress: 0,
    message: "",
    error: null,
  });

  // Update state helper
  const updateState = useCallback((updates: Partial<MixerState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      status: "idle",
      progress: 0,
      message: "",
      error: null,
    });
  }, []);

  // Simulate delay for demo
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Deposit implementation
  const deposit = useCallback(async (token: TokenInfo, amount: string): Promise<string | null> => {
    if (!publicKey || !signTransaction) {
      updateState({ status: "error", error: "Wallet not connected" });
      return null;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      updateState({ status: "error", error: "Invalid amount" });
      return null;
    }

    // Add pending transaction
    const txId = addTransaction({
      type: "deposit",
      token: token.mint,
      tokenSymbol: token.symbol,
      amount,
      status: "pending",
    });

    try {
      // Step 1: Preparing
      updateState({ status: "preparing", progress: 10, message: "Preparing transaction..." });
      await delay(500);

      // Step 2: Creating transaction
      updateState({ status: "preparing", progress: 30, message: "Creating deposit transaction..." });

      let signature: string;

      if (token.mint === NATIVE_SOL_MINT) {
        // SOL deposit - create transfer transaction
        const lamports = Math.floor(amountNum * LAMPORTS_PER_SOL);

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: MIXER_POOL_ADDRESS,
            lamports,
          })
        );

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        // Step 3: Signing
        updateState({ status: "signing", progress: 50, message: "Please sign the transaction..." });

        // Send transaction
        signature = await sendTransaction(transaction, connection);

        // Step 4: Confirming
        updateState({ status: "confirming", progress: 70, message: "Confirming transaction..." });

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        });

        if (confirmation.value.err) {
          throw new Error("Transaction failed");
        }
      } else {
        // SPL Token deposit (simplified - in production use proper token transfer)
        // For now, simulate the transaction
        updateState({ status: "signing", progress: 50, message: "Please sign the transaction..." });
        await delay(1000);
        signature = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        updateState({ status: "confirming", progress: 70, message: "Confirming transaction..." });
        await delay(1500);
      }

      // Step 5: Success
      updateState({ status: "success", progress: 100, message: "Deposit successful!" });

      // Update shielded balance
      addDeposit(token.mint, amount);

      // Update transaction status
      updateTransaction(txId, {
        status: "confirmed" as TransactionStatus,
        txSignature: signature,
      });

      return signature;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Deposit failed";
      updateState({ status: "error", progress: 0, error: errorMessage });

      // Update transaction as failed
      updateTransaction(txId, {
        status: "failed" as TransactionStatus,
        error: errorMessage,
      });

      return null;
    }
  }, [publicKey, signTransaction, sendTransaction, connection, addTransaction, updateTransaction, addDeposit, updateState]);

  // Withdraw implementation
  const withdraw = useCallback(async (token: TokenInfo, amount: string, recipient: string): Promise<string | null> => {
    if (!publicKey) {
      updateState({ status: "error", error: "Wallet not connected" });
      return null;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      updateState({ status: "error", error: "Invalid amount" });
      return null;
    }

    // Validate recipient
    try {
      new PublicKey(recipient);
    } catch {
      updateState({ status: "error", error: "Invalid recipient address" });
      return null;
    }

    // Add pending transaction
    const txId = addTransaction({
      type: "withdraw",
      token: token.mint,
      tokenSymbol: token.symbol,
      amount,
      status: "pending",
      recipient,
    });

    try {
      // Step 1: Preparing ZK Proof
      updateState({ status: "preparing", progress: 10, message: "Generating zero-knowledge proof..." });
      await delay(1000);

      // Step 2: Computing proof (simulated)
      updateState({ status: "preparing", progress: 30, message: "Computing proof circuits..." });
      await delay(2000);

      // Step 3: Verifying proof
      updateState({ status: "preparing", progress: 50, message: "Verifying proof locally..." });
      await delay(1000);

      // Step 4: Submitting to relayer (simulated)
      updateState({ status: "confirming", progress: 70, message: "Submitting to relayer..." });
      await delay(1500);

      // Generate mock signature
      const signature = `withdraw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Step 5: Waiting for confirmation
      updateState({ status: "confirming", progress: 90, message: "Waiting for confirmation..." });
      await delay(1000);

      // Step 6: Success
      updateState({ status: "success", progress: 100, message: "Withdrawal successful!" });

      // Update shielded balance
      removeWithdraw(token.mint, amount);

      // Update transaction status
      updateTransaction(txId, {
        status: "confirmed" as TransactionStatus,
        txSignature: signature,
      });

      return signature;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Withdrawal failed";
      updateState({ status: "error", progress: 0, error: errorMessage });

      // Update transaction as failed
      updateTransaction(txId, {
        status: "failed" as TransactionStatus,
        error: errorMessage,
      });

      return null;
    }
  }, [publicKey, addTransaction, updateTransaction, removeWithdraw, updateState]);

  return {
    state,
    deposit,
    withdraw,
    reset,
  };
}

export default useMixer;
