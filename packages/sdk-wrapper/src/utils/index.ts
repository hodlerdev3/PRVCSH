/**
 * PRVCSH SDK Utility Functions
 */

import { SUPPORTED_TOKENS } from "../constants";
import { type SupportedToken } from "../types";

// ============================================
// Amount Formatting
// ============================================

/**
 * Format a raw amount (lamports) to human-readable format
 */
export function formatAmount(
  amountRaw: bigint | string | number,
  token: SupportedToken,
  options?: {
    maxDecimals?: number;
    showSymbol?: boolean;
  }
): string {
  const { maxDecimals = 4, showSymbol = false } = options ?? {};
  const tokenInfo = SUPPORTED_TOKENS[token];
  const decimals = tokenInfo.decimals;

  const raw = typeof amountRaw === "bigint" ? amountRaw : BigInt(amountRaw);
  const divisor = BigInt(10 ** decimals);
  const integerPart = raw / divisor;
  const fractionalPart = raw % divisor;

  // Format fractional part with proper padding
  let fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  fractionalStr = fractionalStr.slice(0, maxDecimals);

  // Remove trailing zeros
  fractionalStr = fractionalStr.replace(/0+$/, "");

  const formatted = fractionalStr ? `${integerPart}.${fractionalStr}` : integerPart.toString();

  return showSymbol ? `${formatted} ${token}` : formatted;
}

/**
 * Parse a human-readable amount to raw (lamports)
 */
export function parseAmount(amount: string, token: SupportedToken): bigint {
  const tokenInfo = SUPPORTED_TOKENS[token];
  const decimals = tokenInfo.decimals;

  // Remove any commas and whitespace
  const cleanAmount = amount.replace(/[,\s]/g, "");

  // Validate input
  if (!/^\d*\.?\d*$/.test(cleanAmount) || cleanAmount === "") {
    throw new Error(`Invalid amount: ${amount}`);
  }

  const [integerPart = "0", fractionalPart = ""] = cleanAmount.split(".");

  // Pad or truncate fractional part to match decimals
  const paddedFractional = fractionalPart.padEnd(decimals, "0").slice(0, decimals);

  const rawString = integerPart + paddedFractional;
  return BigInt(rawString);
}

// ============================================
// Address Formatting
// ============================================

/**
 * Truncate a Solana address for display (e.g., "0xAb...Cd")
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 3) {
    return address;
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Validate a Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  // Base58 characters only, 32-44 characters long
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

// ============================================
// Token Helpers
// ============================================

/**
 * Get token info by symbol
 */
export function getTokenInfo(token: SupportedToken) {
  return SUPPORTED_TOKENS[token];
}

/**
 * Get token by mint address
 */
export function getTokenByMint(mint: string): SupportedToken | null {
  const entry = Object.entries(SUPPORTED_TOKENS).find(([_, info]) => info.mint === mint);
  return entry ? (entry[0] as SupportedToken) : null;
}

/**
 * Get all supported token symbols
 */
export function getSupportedTokenSymbols(): SupportedToken[] {
  return Object.keys(SUPPORTED_TOKENS) as SupportedToken[];
}

// ============================================
// Export utility index
// ============================================

// WASM Loader
export {
  loadHasher,
  loadCircuitFiles,
  preloadAll,
  clearWasmCache,
  getWasmCacheStatus,
  supportsWasm,
  supportsWasmSimd,
  getEstimatedDownloadSize,
  ESTIMATED_FILE_SIZES,
  WasmLoadError,
  WasmTimeoutError,
  WasmNetworkError,
  type WasmLoadResult,
  type WasmLoaderConfig,
  type WasmLoadStatus,
  type WasmLoaderState,
  type CircuitFiles,
  type HasherModule,
} from "./wasm-loader";

export { formatAmount as default };
