/**
 * PRVCSH SDK Type Definitions
 */

// ============================================
// Configuration Types
// ============================================

export interface PRVCSHConfig {
  /** Solana RPC URL */
  rpcUrl: string;
  /** Network: 'mainnet-beta' | 'devnet' | 'testnet' */
  network: SolanaNetwork;
  /** Relayer URL for transaction submission */
  relayerUrl: string;
  /** Optional: Custom program IDs */
  programIds?: {
    mixer?: string;
    verifier?: string;
  };
}

export type SolanaNetwork = "mainnet-beta" | "devnet" | "testnet";

// ============================================
// State Types
// ============================================

export interface PRVCSHState {
  /** Whether the SDK is initialized */
  isInitialized: boolean;
  /** Whether encryption is set up */
  isEncryptionReady: boolean;
  /** Currently connected wallet address */
  walletAddress: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Current error if any */
  error: PRVCSHError | null;
}

// ============================================
// Token Types
// ============================================

export type SupportedToken = "SOL" | "USDC" | "USDT" | "ZEC" | "ORE" | "STORE";

export interface TokenInfo {
  symbol: SupportedToken;
  name: string;
  decimals: number;
  mint: string | null; // null for SOL
  icon: string;
  color: string;
}

// ============================================
// Transaction Types
// ============================================

export interface DepositParams {
  /** Token to deposit */
  token: SupportedToken;
  /** Amount in human-readable format (e.g., "1.5") */
  amount: string;
}

export interface WithdrawParams {
  /** Token to withdraw */
  token: SupportedToken;
  /** Amount in human-readable format */
  amount: string;
  /** Recipient wallet address */
  recipient: string;
}

export interface TransactionResult {
  /** Transaction success status */
  success: boolean;
  /** Transaction signature */
  signature: string | null;
  /** Error message if failed */
  error?: string;
  /** Block time */
  blockTime?: number;
  /** Confirmation status */
  confirmationStatus?: "processed" | "confirmed" | "finalized";
}

// ============================================
// Balance Types
// ============================================

export interface PrivateBalance {
  /** Token symbol */
  token: SupportedToken;
  /** Balance in human-readable format */
  amount: string;
  /** Balance in lamports/smallest unit */
  amountRaw: bigint;
  /** USD value (if available) */
  usdValue?: number;
}

// ============================================
// ZK Proof Types
// ============================================

export type ZKProofStep = "idle" | "setup" | "generating" | "verifying" | "complete" | "error";

export interface ZKProofStatus {
  /** Current step in proof generation */
  step: ZKProofStep;
  /** Progress percentage (0-100) */
  progress: number;
  /** Step description for UI */
  message: string;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
}

// ============================================
// Error Types
// ============================================

export type PRVCSHErrorCode =
  | "WALLET_NOT_CONNECTED"
  | "ENCRYPTION_NOT_INITIALIZED"
  | "INSUFFICIENT_BALANCE"
  | "INVALID_AMOUNT"
  | "INVALID_RECIPIENT"
  | "PROOF_GENERATION_FAILED"
  | "PROOF_VERIFICATION_FAILED"
  | "TRANSACTION_FAILED"
  | "NETWORK_ERROR"
  | "WASM_LOAD_FAILED"
  | "UNKNOWN_ERROR";

export interface PRVCSHError {
  code: PRVCSHErrorCode;
  message: string;
  details?: unknown;
}

// ============================================
// Hook Return Types
// ============================================

export interface UsePRVCSHReturn {
  /** Current state */
  state: PRVCSHState;
  /** Initialize encryption with wallet signature */
  initializeEncryption: () => Promise<void>;
  /** Deposit tokens */
  deposit: (params: DepositParams) => Promise<TransactionResult>;
  /** Withdraw tokens */
  withdraw: (params: WithdrawParams) => Promise<TransactionResult>;
  /** Get private balance for a token */
  getPrivateBalance: (token: SupportedToken) => Promise<PrivateBalance>;
  /** Get all private balances */
  getAllPrivateBalances: () => Promise<PrivateBalance[]>;
  /** Current ZK proof status */
  proofStatus: ZKProofStatus;
  /** Clear cached data */
  clearCache: () => void;
}
