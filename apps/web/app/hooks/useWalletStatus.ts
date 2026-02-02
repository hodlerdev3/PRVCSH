"use client";

/**
 * useWalletStatus Hook
 *
 * Provides convenient wallet status information.
 */

import { useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

// ============================================
// Types
// ============================================

export type WalletStatusType =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "error";

export interface WalletStatus {
  /** Current status type */
  status: WalletStatusType;
  /** Whether wallet is connected */
  isConnected: boolean;
  /** Whether wallet is currently connecting */
  isConnecting: boolean;
  /** Whether wallet is currently disconnecting */
  isDisconnecting: boolean;
  /** Whether any wallet operation is in progress */
  isLoading: boolean;
  /** Wallet address (null if not connected) */
  address: string | null;
  /** Wallet display name */
  walletName: string | null;
  /** Wallet icon URL */
  walletIcon: string | null;
  /** Whether RPC connection is established */
  isRpcConnected: boolean;
  /** Current error if any */
  error: Error | null;
}

// ============================================
// Hook
// ============================================

/**
 * Hook for accessing wallet connection status
 *
 * @example
 * ```tsx
 * const { status, isConnected, address } = useWalletStatus();
 *
 * if (status === 'connecting') {
 *   return <Spinner />;
 * }
 * ```
 */
export function useWalletStatus(): WalletStatus {
  const {
    wallet,
    publicKey,
    connecting,
    connected,
    disconnecting,
  } = useWallet();
  const { connection } = useConnection();

  return useMemo(() => {
    // Determine status
    let status: WalletStatusType = "disconnected";
    let error: Error | null = null;

    if (connecting) {
      status = "connecting";
    } else if (disconnecting) {
      status = "disconnecting";
    } else if (connected && publicKey) {
      status = "connected";
    }

    // Check RPC connection (basic check)
    const isRpcConnected = !!connection;

    return {
      status,
      isConnected: connected && !!publicKey,
      isConnecting: connecting,
      isDisconnecting: disconnecting,
      isLoading: connecting || disconnecting,
      address: publicKey?.toBase58() ?? null,
      walletName: wallet?.adapter.name ?? null,
      walletIcon: wallet?.adapter.icon ?? null,
      isRpcConnected,
      error,
    };
  }, [wallet, publicKey, connecting, connected, disconnecting, connection]);
}

export default useWalletStatus;
