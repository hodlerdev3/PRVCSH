"use client";

/**
 * Solana Wallet Provider
 *
 * Sets up Solana wallet adapter with ConnectionProvider and WalletProvider.
 * Supports Phantom, Solflare, and other popular wallets.
 */

import { type ReactNode, useMemo, useCallback } from "react";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
  LedgerWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";

// ============================================
// Types
// ============================================

export interface SolanaProviderProps {
  children: ReactNode;
  /** Network to connect to (default: devnet) */
  network?: WalletAdapterNetwork;
  /** Custom RPC endpoint URL */
  endpoint?: string;
  /** Auto-connect to last used wallet */
  autoConnect?: boolean;
}

// ============================================
// Component
// ============================================

export function SolanaProvider({
  children,
  network = WalletAdapterNetwork.Devnet,
  endpoint: customEndpoint,
  autoConnect = true,
}: SolanaProviderProps) {
  // Use custom endpoint or default cluster URL
  const endpoint = useMemo(() => {
    if (customEndpoint) return customEndpoint;

    // Check for environment variable
    if (typeof window !== "undefined") {
      const envEndpoint = process.env.NEXT_PUBLIC_RPC_URL;
      if (envEndpoint) return envEndpoint;
    }

    return clusterApiUrl(network);
  }, [network, customEndpoint]);

  // Initialize wallet adapters
  // Note: @solana/wallet-adapter-wallets includes many adapters
  // We explicitly list the most popular ones for clarity
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new CoinbaseWalletAdapter(),
      new LedgerWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    [network]
  );

  // Error handler for wallet operations
  const onError = useCallback((error: WalletError) => {
    console.error("[Wallet Error]", error);

    // You can add toast notifications here
    // toast.error(error.message);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={autoConnect}
        onError={onError}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default SolanaProvider;
