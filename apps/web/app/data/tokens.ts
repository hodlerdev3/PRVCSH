/**
 * Token List Data
 *
 * Supported tokens with metadata for PRVCSH.
 * Icons from Solana token list and CoinGecko.
 */

import { TokenInfo } from "../components/TokenSelector";

// ============================================
// Token Constants
// ============================================

/** Native SOL mint address (wrapped) */
export const NATIVE_SOL_MINT = "So11111111111111111111111111111111111111112";

/** USDC mint address (mainnet) */
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/** USDT mint address (mainnet) */
export const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

/** ZEC (Zcash wrapped) mint address */
export const ZEC_MINT = "3vAs4D1WE6Na4tCgt4BApgFfENbm8WY7q4cSPD1yM4Cg";

/** ORE mint address */
export const ORE_MINT = "oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp";

/** STORE mint address */
export const STORE_MINT = "5D1fNXzvv5NjV1ysZjA2uEDfuBondreNpMYVMqKAx6qx";

// ============================================
// Token Data
// ============================================

/**
 * Default supported tokens for PRVCSH
 */
export const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    mint: NATIVE_SOL_MINT,
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  {
    mint: USDC_MINT,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  {
    mint: USDT_MINT,
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
  },
  {
    mint: ZEC_MINT,
    symbol: "ZEC",
    name: "Zcash",
    decimals: 8,
    icon: "https://assets.coingecko.com/coins/images/486/large/circle-zcash-color.png",
  },
  {
    mint: ORE_MINT,
    symbol: "ORE",
    name: "Ore",
    decimals: 11,
    icon: "https://ore.supply/icon.png",
  },
  {
    mint: STORE_MINT,
    symbol: "STORE",
    name: "Store Protocol",
    decimals: 9,
    icon: "https://store.network/logo.png",
  },
];

/**
 * Token pool amounts for mixer (determines selectable denominations)
 */
export const TOKEN_POOL_AMOUNTS: Record<string, number[]> = {
  SOL: [0.1, 0.5, 1, 5, 10, 50, 100],
  USDC: [10, 50, 100, 500, 1000, 5000, 10000],
  USDT: [10, 50, 100, 500, 1000, 5000, 10000],
  ZEC: [0.1, 0.5, 1, 5, 10],
  ORE: [100, 500, 1000, 5000, 10000],
  STORE: [100, 500, 1000, 5000, 10000],
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get token info by mint address
 */
export function getTokenByMint(mint: string): TokenInfo | undefined {
  return SUPPORTED_TOKENS.find((t) => t.mint === mint);
}

/**
 * Get token info by symbol
 */
export function getTokenBySymbol(symbol: string): TokenInfo | undefined {
  return SUPPORTED_TOKENS.find(
    (t) => t.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

/**
 * Check if token is supported
 */
export function isTokenSupported(mint: string): boolean {
  return SUPPORTED_TOKENS.some((t) => t.mint === mint);
}

/**
 * Get pool amounts for a token
 */
export function getPoolAmounts(symbol: string): number[] {
  return TOKEN_POOL_AMOUNTS[symbol.toUpperCase()] ?? [];
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(
  amount: number | string,
  decimals: number,
  maxDecimals?: number
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0";

  const displayDecimals = maxDecimals ?? Math.min(decimals, 6);

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  }).format(num);
}

/**
 * Convert lamports to token amount
 */
export function lamportsToAmount(lamports: bigint | number, decimals: number): number {
  const lamportsNum = typeof lamports === "bigint" ? Number(lamports) : lamports;
  return lamportsNum / Math.pow(10, decimals);
}

/**
 * Convert token amount to lamports
 */
export function amountToLamports(amount: number | string, decimals: number): bigint {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return BigInt(Math.floor(num * Math.pow(10, decimals)));
}

/**
 * Get USD value for a token amount
 * Note: In production, fetch prices from an API
 */
export async function getTokenUsdValue(
  symbol: string,
  amount: number
): Promise<number | null> {
  // Placeholder prices - in production, fetch from CoinGecko/Jupiter API
  const mockPrices: Record<string, number> = {
    SOL: 150.0,
    USDC: 1.0,
    USDT: 1.0,
    ZEC: 35.0,
    ORE: 0.01,
    STORE: 0.005,
  };

  const price = mockPrices[symbol.toUpperCase()];
  if (!price) return null;

  return amount * price;
}

// ============================================
// Token Icons (Fallback Base64 for offline)
// ============================================

export const TOKEN_ICON_FALLBACKS: Record<string, string> = {
  SOL: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzE0RjE5NSIvPjwvc3ZnPg==",
  USDC: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzI3NzVDQSIvPjwvc3ZnPg==",
  USDT: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzUwQUY5NSIvPjwvc3ZnPg==",
};

export default SUPPORTED_TOKENS;
