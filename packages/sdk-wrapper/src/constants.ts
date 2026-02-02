/**
 * PRVCSH SDK Constants
 */

import { type TokenInfo, type SupportedToken, type SolanaNetwork } from "./types";

// ============================================
// Supported Tokens Configuration
// ============================================

export const SUPPORTED_TOKENS: Record<SupportedToken, TokenInfo> = {
  SOL: {
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    mint: null,
    icon: "/tokens/sol.svg",
    color: "#9945FF",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    icon: "/tokens/usdc.svg",
    color: "#2775CA",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    icon: "/tokens/usdt.svg",
    color: "#26A17B",
  },
  ZEC: {
    symbol: "ZEC",
    name: "Zcash",
    decimals: 8,
    mint: "ZECxrNF3s9qH8M5mQGZqHTRYa7dU3gLvpbLmEz9YmLq",
    icon: "/tokens/zec.svg",
    color: "#F4B728",
  },
  ORE: {
    symbol: "ORE",
    name: "Ore",
    decimals: 9,
    mint: "oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp",
    icon: "/tokens/ore.svg",
    color: "#CD7F32",
  },
  STORE: {
    symbol: "STORE",
    name: "Store Token",
    decimals: 9,
    mint: "5BKTP1cWao5dhr4tkaMVgWmtFLsKXkz2LhsWJvVAp9Vn",
    icon: "/tokens/store.svg",
    color: "#00D4AA",
  },
};

// ============================================
// Network Configuration
// ============================================

export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  relayerUrl: string;
  explorerUrl: string;
}

export const NETWORK_CONFIG: Record<SolanaNetwork, NetworkConfig> = {
  "mainnet-beta": {
    name: "Mainnet",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    relayerUrl: "https://relayer.privacycash.io",
    explorerUrl: "https://solscan.io",
  },
  devnet: {
    name: "Devnet",
    rpcUrl: "https://api.devnet.solana.com",
    relayerUrl: "https://relayer-devnet.privacycash.io",
    explorerUrl: "https://solscan.io/?cluster=devnet",
  },
  testnet: {
    name: "Testnet",
    rpcUrl: "https://api.testnet.solana.com",
    relayerUrl: "https://relayer-testnet.privacycash.io",
    explorerUrl: "https://solscan.io/?cluster=testnet",
  },
};

// ============================================
// ZK Proof Constants
// ============================================

export const ZK_PROOF_CONSTANTS = {
  /** Maximum time for proof generation in milliseconds */
  MAX_PROOF_TIME_MS: 60000,
  /** Circuit files path */
  CIRCUIT_PATH: "/circuit2",
  /** WASM hasher path */
  WASM_HASHER_PATH: "/hasher_bg.wasm",
};

// ============================================
// UI Messages
// ============================================

export const ZK_PROOF_MESSAGES: Record<string, string> = {
  idle: "Ready to generate proof",
  setup: "Initializing ZK circuit...",
  generating: "Generating zero-knowledge proof...",
  verifying: "Verifying proof with relayer...",
  complete: "Proof verified successfully!",
  error: "Proof generation failed",
};
