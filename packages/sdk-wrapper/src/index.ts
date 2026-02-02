/**
 * @prvcsh/sdk-wrapper
 * Browser-compatible wrapper for PRVCSH SDK
 *
 * This package provides a browser-friendly interface for interacting
 * with the PRVCSH protocol, including ZK proof generation,
 * deposit/withdraw operations, and balance management.
 */

// ============================================
// Core Client
// ============================================
export { PRVCSHBrowser } from "./client/PRVCSHBrowser";

// ============================================
// Hooks
// ============================================
export { usePRVCSH } from "./hooks/usePRVCSH";

// ============================================
// Types
// ============================================
export type {
  PRVCSHConfig,
  PRVCSHState,
  DepositParams,
  WithdrawParams,
  TransactionResult,
  PrivateBalance,
  SupportedToken,
  TokenInfo,
  ZKProofStatus,
  PRVCSHError,
} from "./types";

// ============================================
// Utils
// ============================================
export { formatAmount, parseAmount, truncateAddress } from "./utils";

// ============================================
// Constants
// ============================================
export { SUPPORTED_TOKENS, NETWORK_CONFIG } from "./constants";
