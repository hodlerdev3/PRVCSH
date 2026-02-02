/**
 * Wallet Error Handling Utilities
 * 
 * Provides comprehensive wallet error handling with:
 * - Error classification (connection, signing, transaction)
 * - User-friendly error messages
 * - Recovery suggestions
 * - Integration with wallet adapters
 */

'use client';

import { useState, useCallback, useMemo } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type WalletErrorCode =
  | 'WALLET_NOT_FOUND'
  | 'WALLET_NOT_CONNECTED'
  | 'WALLET_CONNECTION_FAILED'
  | 'WALLET_DISCONNECTED'
  | 'USER_REJECTED'
  | 'SIGNING_FAILED'
  | 'TRANSACTION_FAILED'
  | 'TRANSACTION_TIMEOUT'
  | 'TRANSACTION_CANCELLED'
  | 'INSUFFICIENT_FUNDS'
  | 'INVALID_ADDRESS'
  | 'NETWORK_MISMATCH'
  | 'UNSUPPORTED_WALLET'
  | 'POPUP_BLOCKED'
  | 'SESSION_EXPIRED'
  | 'UNKNOWN';

export type WalletErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface WalletError {
  /** Error code for programmatic handling */
  code: WalletErrorCode;
  /** User-friendly error message */
  message: string;
  /** Detailed description */
  description: string;
  /** Original error object */
  originalError?: Error;
  /** Wallet name (if applicable) */
  walletName?: string;
  /** Transaction signature (if applicable) */
  signature?: string;
  /** Suggested recovery action */
  action: WalletErrorAction;
  /** Error severity */
  severity: WalletErrorSeverity;
  /** Whether the error is recoverable */
  recoverable: boolean;
  /** Timestamp */
  timestamp: number;
}

export type WalletErrorAction =
  | 'install_wallet'
  | 'connect_wallet'
  | 'reconnect'
  | 'retry'
  | 'try_different_wallet'
  | 'check_balance'
  | 'check_address'
  | 'switch_network'
  | 'enable_popups'
  | 'refresh_session'
  | 'contact_support'
  | 'none';

export interface WalletErrorInfo {
  title: string;
  message: string;
  action: string;
  actionLabel: string;
  severity: WalletErrorSeverity;
  recoverable: boolean;
  suggestedAction: WalletErrorAction;
}

// ============================================================================
// WALLET ERROR CONSTANTS
// ============================================================================

/**
 * Comprehensive wallet error information
 */
export const WALLET_ERROR_INFO: Record<WalletErrorCode, WalletErrorInfo> = {
  WALLET_NOT_FOUND: {
    title: 'Wallet Not Found',
    message: 'The wallet extension is not installed in your browser.',
    action: 'Please install a Solana wallet like Phantom, Solflare, or Backpack.',
    actionLabel: 'Install Wallet',
    severity: 'warning',
    recoverable: true,
    suggestedAction: 'install_wallet',
  },
  WALLET_NOT_CONNECTED: {
    title: 'Wallet Not Connected',
    message: 'Please connect your wallet to continue.',
    action: 'Click the connect button to link your wallet.',
    actionLabel: 'Connect Wallet',
    severity: 'info',
    recoverable: true,
    suggestedAction: 'connect_wallet',
  },
  WALLET_CONNECTION_FAILED: {
    title: 'Connection Failed',
    message: 'Unable to connect to your wallet.',
    action: 'Please check if your wallet is unlocked and try again.',
    actionLabel: 'Try Again',
    severity: 'error',
    recoverable: true,
    suggestedAction: 'reconnect',
  },
  WALLET_DISCONNECTED: {
    title: 'Wallet Disconnected',
    message: 'Your wallet has been disconnected.',
    action: 'Please reconnect your wallet to continue.',
    actionLabel: 'Reconnect',
    severity: 'warning',
    recoverable: true,
    suggestedAction: 'reconnect',
  },
  USER_REJECTED: {
    title: 'Request Rejected',
    message: 'You declined the request in your wallet.',
    action: 'If this was a mistake, please try again and approve the request.',
    actionLabel: 'Try Again',
    severity: 'info',
    recoverable: true,
    suggestedAction: 'retry',
  },
  SIGNING_FAILED: {
    title: 'Signing Failed',
    message: 'Unable to sign the message or transaction.',
    action: 'Please make sure your wallet is unlocked and try again.',
    actionLabel: 'Try Again',
    severity: 'error',
    recoverable: true,
    suggestedAction: 'retry',
  },
  TRANSACTION_FAILED: {
    title: 'Transaction Failed',
    message: 'The transaction could not be completed.',
    action: 'This may be due to network congestion or insufficient funds.',
    actionLabel: 'Retry Transaction',
    severity: 'error',
    recoverable: true,
    suggestedAction: 'retry',
  },
  TRANSACTION_TIMEOUT: {
    title: 'Transaction Timeout',
    message: 'The transaction took too long to confirm.',
    action: 'The network may be congested. Please try again.',
    actionLabel: 'Retry',
    severity: 'warning',
    recoverable: true,
    suggestedAction: 'retry',
  },
  TRANSACTION_CANCELLED: {
    title: 'Transaction Cancelled',
    message: 'The transaction was cancelled.',
    action: 'You can try again when ready.',
    actionLabel: 'Start Over',
    severity: 'info',
    recoverable: true,
    suggestedAction: 'none',
  },
  INSUFFICIENT_FUNDS: {
    title: 'Insufficient Funds',
    message: 'Your wallet does not have enough balance for this transaction.',
    action: 'Please add more SOL to your wallet and try again.',
    actionLabel: 'Check Balance',
    severity: 'warning',
    recoverable: true,
    suggestedAction: 'check_balance',
  },
  INVALID_ADDRESS: {
    title: 'Invalid Address',
    message: 'The provided address is not a valid Solana address.',
    action: 'Please check the address and try again.',
    actionLabel: 'Fix Address',
    severity: 'error',
    recoverable: true,
    suggestedAction: 'check_address',
  },
  NETWORK_MISMATCH: {
    title: 'Network Mismatch',
    message: 'Your wallet is connected to a different network.',
    action: 'Please switch to the correct network in your wallet settings.',
    actionLabel: 'Switch Network',
    severity: 'warning',
    recoverable: true,
    suggestedAction: 'switch_network',
  },
  UNSUPPORTED_WALLET: {
    title: 'Unsupported Wallet',
    message: 'This wallet is not supported.',
    action: 'Please use a supported wallet like Phantom, Solflare, or Backpack.',
    actionLabel: 'Choose Different Wallet',
    severity: 'warning',
    recoverable: true,
    suggestedAction: 'try_different_wallet',
  },
  POPUP_BLOCKED: {
    title: 'Popup Blocked',
    message: 'Your browser blocked the wallet popup.',
    action: 'Please enable popups for this site and try again.',
    actionLabel: 'Enable Popups',
    severity: 'warning',
    recoverable: true,
    suggestedAction: 'enable_popups',
  },
  SESSION_EXPIRED: {
    title: 'Session Expired',
    message: 'Your wallet session has expired.',
    action: 'Please reconnect your wallet to continue.',
    actionLabel: 'Reconnect',
    severity: 'warning',
    recoverable: true,
    suggestedAction: 'refresh_session',
  },
  UNKNOWN: {
    title: 'Wallet Error',
    message: 'An unexpected wallet error occurred.',
    action: 'Please try again or contact support if the issue persists.',
    actionLabel: 'Try Again',
    severity: 'error',
    recoverable: true,
    suggestedAction: 'retry',
  },
};

/**
 * Wallet names for display
 */
export const WALLET_NAMES: Record<string, string> = {
  phantom: 'Phantom',
  solflare: 'Solflare',
  backpack: 'Backpack',
  trust: 'Trust Wallet',
  ledger: 'Ledger',
  torus: 'Torus',
  coinbase: 'Coinbase Wallet',
  slope: 'Slope',
  exodus: 'Exodus',
  default: 'Wallet',
};

/**
 * Wallet install URLs
 */
export const WALLET_INSTALL_URLS: Record<string, string> = {
  phantom: 'https://phantom.app/',
  solflare: 'https://solflare.com/',
  backpack: 'https://backpack.app/',
  trust: 'https://trustwallet.com/',
  ledger: 'https://www.ledger.com/',
};

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

/**
 * Error message patterns for classification
 */
const ERROR_PATTERNS: Array<{ pattern: RegExp; code: WalletErrorCode }> = [
  // User rejected
  { pattern: /user rejected|user denied|user cancelled|rejected by user/i, code: 'USER_REJECTED' },
  { pattern: /user cancel/i, code: 'USER_REJECTED' },
  
  // Wallet not found/installed
  { pattern: /wallet not found|not installed|no wallet/i, code: 'WALLET_NOT_FOUND' },
  { pattern: /wallet adapter not found/i, code: 'WALLET_NOT_FOUND' },
  
  // Connection issues
  { pattern: /not connected|wallet disconnected|connection closed/i, code: 'WALLET_DISCONNECTED' },
  { pattern: /failed to connect|connection failed|could not connect/i, code: 'WALLET_CONNECTION_FAILED' },
  
  // Signing issues
  { pattern: /signing failed|sign failed|failed to sign/i, code: 'SIGNING_FAILED' },
  
  // Transaction issues
  { pattern: /insufficient.*funds|not enough.*balance|insufficient balance/i, code: 'INSUFFICIENT_FUNDS' },
  { pattern: /invalid.*address|invalid.*public.*key/i, code: 'INVALID_ADDRESS' },
  { pattern: /timeout|timed out|request timeout/i, code: 'TRANSACTION_TIMEOUT' },
  { pattern: /transaction failed|simulation failed|blockhash not found/i, code: 'TRANSACTION_FAILED' },
  
  // Network issues
  { pattern: /network mismatch|wrong network|different network/i, code: 'NETWORK_MISMATCH' },
  
  // Popup issues
  { pattern: /popup.*blocked|blocked.*popup/i, code: 'POPUP_BLOCKED' },
  
  // Session issues
  { pattern: /session.*expired|expired.*session|unauthorized/i, code: 'SESSION_EXPIRED' },
];

/**
 * Classify a wallet error into a specific error code
 */
export function classifyWalletError(error: unknown): WalletErrorCode {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();
    const combinedMessage = `${name} ${message}`;

    // Check against known patterns
    for (const { pattern, code } of ERROR_PATTERNS) {
      if (pattern.test(combinedMessage)) {
        return code;
      }
    }

    // Check for Solana-specific error codes
    if ('code' in error) {
      const errorCode = (error as Error & { code: number | string }).code;
      
      // WalletError codes from @solana/wallet-adapter-base
      switch (errorCode) {
        case 4001: // User rejected
          return 'USER_REJECTED';
        case 4100: // Unauthorized
          return 'SESSION_EXPIRED';
        case 4200: // Unsupported method
          return 'UNSUPPORTED_WALLET';
        case 4900: // Disconnected
          return 'WALLET_DISCONNECTED';
        case 4901: // Chain disconnected
          return 'NETWORK_MISMATCH';
      }
    }
  }

  return 'UNKNOWN';
}

/**
 * Create a WalletError from any error
 */
export function createWalletError(
  error: unknown,
  walletName?: string,
  signature?: string
): WalletError {
  const code = classifyWalletError(error);
  const errorInfo = WALLET_ERROR_INFO[code];

  return {
    code,
    message: errorInfo.title,
    description: errorInfo.message,
    originalError: error instanceof Error ? error : new Error(String(error)),
    walletName,
    signature,
    action: errorInfo.suggestedAction,
    severity: errorInfo.severity,
    recoverable: errorInfo.recoverable,
    timestamp: Date.now(),
  };
}

/**
 * Check if an error is a user rejection
 */
export function isUserRejection(error: unknown): boolean {
  return classifyWalletError(error) === 'USER_REJECTED';
}

/**
 * Check if an error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  const code = classifyWalletError(error);
  return WALLET_ERROR_INFO[code].recoverable;
}

// ============================================================================
// WALLET ERROR HOOK
// ============================================================================

export interface UseWalletErrorReturn {
  /** Current error */
  error: WalletError | null;
  /** Error info for display */
  errorInfo: WalletErrorInfo | null;
  /** Set error from any error */
  setError: (error: unknown, walletName?: string) => void;
  /** Clear current error */
  clearError: () => void;
  /** Handle wallet error with callback */
  handleError: (error: unknown, walletName?: string) => WalletError;
  /** Check if there's an active error */
  hasError: boolean;
}

/**
 * Hook for managing wallet errors
 */
export function useWalletError(): UseWalletErrorReturn {
  const [error, setErrorState] = useState<WalletError | null>(null);

  const setError = useCallback((err: unknown, walletName?: string) => {
    const walletError = createWalletError(err, walletName);
    setErrorState(walletError);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const handleError = useCallback((err: unknown, walletName?: string): WalletError => {
    const walletError = createWalletError(err, walletName);
    setErrorState(walletError);
    return walletError;
  }, []);

  const errorInfo = useMemo(() => {
    if (!error) return null;
    return WALLET_ERROR_INFO[error.code];
  }, [error]);

  return useMemo(
    () => ({
      error,
      errorInfo,
      setError,
      clearError,
      handleError,
      hasError: error !== null,
    }),
    [error, errorInfo, setError, clearError, handleError]
  );
}

// ============================================================================
// TRANSACTION ERROR UTILITIES
// ============================================================================

export interface TransactionErrorInfo {
  /** Error code */
  code: WalletErrorCode;
  /** Error message */
  message: string;
  /** Transaction signature */
  signature?: string;
  /** Logs from simulation */
  logs?: string[];
  /** Is simulation error */
  isSimulationError: boolean;
}

/**
 * Parse transaction error for detailed info
 */
export function parseTransactionError(error: unknown): TransactionErrorInfo {
  const code = classifyWalletError(error);
  let signature: string | undefined;
  let logs: string[] | undefined;
  let isSimulationError = false;

  if (error instanceof Error) {
    // Extract signature if present
    const sigMatch = error.message.match(/signature[:\s]+([A-Za-z0-9]{88})/i);
    if (sigMatch) {
      signature = sigMatch[1];
    }

    // Check for simulation errors
    if (error.message.includes('simulation') || error.message.includes('simulate')) {
      isSimulationError = true;
    }

    // Extract logs if present
    if ('logs' in error && Array.isArray((error as Error & { logs: unknown }).logs)) {
      logs = (error as Error & { logs: string[] }).logs;
    }
  }

  return {
    code,
    message: WALLET_ERROR_INFO[code].message,
    signature,
    logs,
    isSimulationError,
  };
}

/**
 * Get explorer URL for a failed transaction
 */
export function getFailedTxExplorerUrl(
  signature: string,
  network: 'mainnet-beta' | 'devnet' | 'testnet' = 'devnet'
): string {
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
  return `https://solscan.io/tx/${signature}${cluster}`;
}

// ============================================================================
// WALLET CONNECTION ERROR HANDLING
// ============================================================================

export interface WalletConnectionState {
  /** Connection status */
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  /** Last connection error */
  error: WalletError | null;
  /** Connection attempt count */
  attempts: number;
  /** Time of last connection attempt */
  lastAttempt: number | null;
}

/**
 * Initial connection state
 */
export const INITIAL_CONNECTION_STATE: WalletConnectionState = {
  status: 'disconnected',
  error: null,
  attempts: 0,
  lastAttempt: null,
};

/**
 * Connection attempt limits
 */
export const CONNECTION_LIMITS = {
  maxAttempts: 3,
  attemptCooldown: 5000, // 5 seconds between attempts
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Check if can attempt connection
 */
export function canAttemptConnection(state: WalletConnectionState): boolean {
  if (state.status === 'connecting') return false;
  if (state.attempts >= CONNECTION_LIMITS.maxAttempts) {
    // Check if cooldown has passed
    if (state.lastAttempt) {
      const elapsed = Date.now() - state.lastAttempt;
      if (elapsed < CONNECTION_LIMITS.attemptCooldown * state.attempts) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Get time until next connection attempt
 */
export function getTimeUntilNextAttempt(state: WalletConnectionState): number {
  if (state.status !== 'error' || !state.lastAttempt) return 0;
  
  const cooldown = CONNECTION_LIMITS.attemptCooldown * state.attempts;
  const elapsed = Date.now() - state.lastAttempt;
  return Math.max(0, cooldown - elapsed);
}

// ============================================================================
// ERROR RECOVERY ACTIONS
// ============================================================================

/**
 * Open wallet install page
 */
export function openWalletInstallPage(walletName: string): void {
  const normalizedName = walletName.toLowerCase();
  const url = WALLET_INSTALL_URLS[normalizedName] || 'https://phantom.app/';
  
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Get wallet display name
 */
export function getWalletDisplayName(walletName?: string): string {
  if (!walletName) return 'Wallet';
  return WALLET_NAMES[walletName.toLowerCase()] || walletName;
}

/**
 * Format wallet address for display
 */
export function formatWalletAddress(
  address: string,
  startChars: number = 4,
  endChars: number = 4
): string {
  if (!address || address.length < startChars + endChars + 3) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

// ============================================================================
// ERROR DISPLAY HELPERS
// ============================================================================

/**
 * Get error icon based on severity
 */
export function getErrorIcon(severity: WalletErrorSeverity): string {
  switch (severity) {
    case 'info':
      return 'ℹ️';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    case 'critical':
      return '🚨';
    default:
      return '❓';
  }
}

/**
 * Get error color class based on severity
 */
export function getErrorColorClass(severity: WalletErrorSeverity): string {
  switch (severity) {
    case 'info':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    case 'warning':
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    case 'error':
      return 'text-red-400 bg-red-500/10 border-red-500/30';
    case 'critical':
      return 'text-red-500 bg-red-600/20 border-red-500/50';
    default:
      return 'text-neutral-400 bg-neutral-500/10 border-neutral-500/30';
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Hooks
  useWalletError,
  
  // Error handling
  classifyWalletError,
  createWalletError,
  isUserRejection,
  isRecoverableError,
  
  // Transaction errors
  parseTransactionError,
  getFailedTxExplorerUrl,
  
  // Connection state
  canAttemptConnection,
  getTimeUntilNextAttempt,
  INITIAL_CONNECTION_STATE,
  CONNECTION_LIMITS,
  
  // Recovery actions
  openWalletInstallPage,
  getWalletDisplayName,
  formatWalletAddress,
  
  // Display helpers
  getErrorIcon,
  getErrorColorClass,
  
  // Constants
  WALLET_ERROR_INFO,
  WALLET_NAMES,
  WALLET_INSTALL_URLS,
};
