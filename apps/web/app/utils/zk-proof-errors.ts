/**
 * ZK Proof Error Handling Utilities
 * 
 * Provides comprehensive error handling for zero-knowledge proof operations:
 * - Error classification (timeout, invalid proof, circuit errors)
 * - User-friendly error messages
 * - Proof state management
 * - Recovery and retry logic
 */

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ZKProofErrorCode =
  | 'PROOF_GENERATION_FAILED'
  | 'PROOF_GENERATION_TIMEOUT'
  | 'PROOF_VERIFICATION_FAILED'
  | 'PROOF_INVALID'
  | 'CIRCUIT_NOT_FOUND'
  | 'CIRCUIT_LOAD_FAILED'
  | 'WASM_LOAD_FAILED'
  | 'WITNESS_GENERATION_FAILED'
  | 'INPUT_VALIDATION_FAILED'
  | 'MERKLE_PROOF_FAILED'
  | 'COMMITMENT_MISMATCH'
  | 'NULLIFIER_ALREADY_USED'
  | 'RELAYER_UNAVAILABLE'
  | 'RELAYER_REJECTED'
  | 'MEMORY_EXCEEDED'
  | 'BROWSER_NOT_SUPPORTED'
  | 'UNKNOWN';

export type ZKProofStage =
  | 'idle'
  | 'loading_circuit'
  | 'generating_witness'
  | 'generating_proof'
  | 'verifying'
  | 'submitting'
  | 'complete'
  | 'error';

export type ZKProofErrorSeverity = 'warning' | 'error' | 'critical';

export interface ZKProofError {
  /** Error code for programmatic handling */
  code: ZKProofErrorCode;
  /** User-friendly error message */
  message: string;
  /** Detailed description */
  description: string;
  /** Original error object */
  originalError?: Error;
  /** Stage where error occurred */
  stage: ZKProofStage;
  /** Error severity */
  severity: ZKProofErrorSeverity;
  /** Whether retry is possible */
  retryable: boolean;
  /** Suggested action */
  action: ZKProofErrorAction;
  /** Timestamp */
  timestamp: number;
  /** Duration until error (ms) */
  duration?: number;
}

export type ZKProofErrorAction =
  | 'retry'
  | 'reload_page'
  | 'check_inputs'
  | 'use_different_browser'
  | 'reduce_amount'
  | 'wait_and_retry'
  | 'contact_support'
  | 'none';

export interface ZKProofErrorInfo {
  title: string;
  message: string;
  action: string;
  actionLabel: string;
  severity: ZKProofErrorSeverity;
  retryable: boolean;
  suggestedAction: ZKProofErrorAction;
}

// ============================================================================
// ZK PROOF ERROR CONSTANTS
// ============================================================================

/**
 * Default proof generation timeout (in milliseconds)
 */
export const PROOF_GENERATION_TIMEOUT = 120000; // 2 minutes

/**
 * Stage timeout limits (in milliseconds)
 */
export const STAGE_TIMEOUTS: Record<ZKProofStage, number> = {
  idle: 0,
  loading_circuit: 30000,      // 30 seconds
  generating_witness: 30000,   // 30 seconds
  generating_proof: 90000,     // 90 seconds (most intensive)
  verifying: 15000,            // 15 seconds
  submitting: 30000,           // 30 seconds
  complete: 0,
  error: 0,
};

/**
 * Comprehensive ZK proof error information
 */
export const ZK_PROOF_ERROR_INFO: Record<ZKProofErrorCode, ZKProofErrorInfo> = {
  PROOF_GENERATION_FAILED: {
    title: 'Proof Generation Failed',
    message: 'Unable to generate the zero-knowledge proof.',
    action: 'This may be due to browser limitations. Try refreshing or using a different browser.',
    actionLabel: 'Retry',
    severity: 'error',
    retryable: true,
    suggestedAction: 'retry',
  },
  PROOF_GENERATION_TIMEOUT: {
    title: 'Proof Generation Timeout',
    message: 'The proof is taking longer than expected to generate.',
    action: 'This can happen with complex proofs. Please try again.',
    actionLabel: 'Retry',
    severity: 'warning',
    retryable: true,
    suggestedAction: 'retry',
  },
  PROOF_VERIFICATION_FAILED: {
    title: 'Proof Verification Failed',
    message: 'The generated proof could not be verified.',
    action: 'The proof may be corrupted. Please regenerate it.',
    actionLabel: 'Regenerate',
    severity: 'error',
    retryable: true,
    suggestedAction: 'retry',
  },
  PROOF_INVALID: {
    title: 'Invalid Proof',
    message: 'The proof is invalid or has been tampered with.',
    action: 'Please generate a new proof from scratch.',
    actionLabel: 'Start Over',
    severity: 'error',
    retryable: true,
    suggestedAction: 'retry',
  },
  CIRCUIT_NOT_FOUND: {
    title: 'Circuit Not Found',
    message: 'The ZK circuit files could not be found.',
    action: 'Please refresh the page to reload the circuit files.',
    actionLabel: 'Refresh',
    severity: 'critical',
    retryable: true,
    suggestedAction: 'reload_page',
  },
  CIRCUIT_LOAD_FAILED: {
    title: 'Circuit Load Failed',
    message: 'Failed to load the ZK circuit.',
    action: 'There may be a network issue. Please try again.',
    actionLabel: 'Retry',
    severity: 'error',
    retryable: true,
    suggestedAction: 'retry',
  },
  WASM_LOAD_FAILED: {
    title: 'WASM Load Failed',
    message: 'Failed to load the WebAssembly module.',
    action: 'Your browser may not fully support WASM. Try a different browser.',
    actionLabel: 'Try Different Browser',
    severity: 'critical',
    retryable: false,
    suggestedAction: 'use_different_browser',
  },
  WITNESS_GENERATION_FAILED: {
    title: 'Witness Generation Failed',
    message: 'Failed to generate the witness for the proof.',
    action: 'Please check your inputs and try again.',
    actionLabel: 'Check Inputs',
    severity: 'error',
    retryable: true,
    suggestedAction: 'check_inputs',
  },
  INPUT_VALIDATION_FAILED: {
    title: 'Invalid Inputs',
    message: 'The provided inputs are invalid for proof generation.',
    action: 'Please verify the amount and addresses are correct.',
    actionLabel: 'Fix Inputs',
    severity: 'warning',
    retryable: true,
    suggestedAction: 'check_inputs',
  },
  MERKLE_PROOF_FAILED: {
    title: 'Merkle Proof Failed',
    message: 'Failed to generate the Merkle proof.',
    action: 'The deposit may not be in the pool yet. Please wait and try again.',
    actionLabel: 'Wait & Retry',
    severity: 'warning',
    retryable: true,
    suggestedAction: 'wait_and_retry',
  },
  COMMITMENT_MISMATCH: {
    title: 'Commitment Mismatch',
    message: 'The commitment does not match the expected value.',
    action: 'Please check your note secret or try a different deposit.',
    actionLabel: 'Check Inputs',
    severity: 'error',
    retryable: true,
    suggestedAction: 'check_inputs',
  },
  NULLIFIER_ALREADY_USED: {
    title: 'Already Withdrawn',
    message: 'This deposit has already been withdrawn.',
    action: 'Each deposit can only be withdrawn once.',
    actionLabel: 'Close',
    severity: 'warning',
    retryable: false,
    suggestedAction: 'none',
  },
  RELAYER_UNAVAILABLE: {
    title: 'Relayer Unavailable',
    message: 'The relayer service is temporarily unavailable.',
    action: 'Please try again in a few moments.',
    actionLabel: 'Retry Later',
    severity: 'warning',
    retryable: true,
    suggestedAction: 'wait_and_retry',
  },
  RELAYER_REJECTED: {
    title: 'Relayer Rejected',
    message: 'The relayer rejected the transaction.',
    action: 'The proof may be invalid or the relayer is congested.',
    actionLabel: 'Retry',
    severity: 'error',
    retryable: true,
    suggestedAction: 'retry',
  },
  MEMORY_EXCEEDED: {
    title: 'Memory Limit Exceeded',
    message: 'The proof generation ran out of memory.',
    action: 'Try closing other tabs or using a device with more memory.',
    actionLabel: 'Retry',
    severity: 'error',
    retryable: true,
    suggestedAction: 'retry',
  },
  BROWSER_NOT_SUPPORTED: {
    title: 'Browser Not Supported',
    message: 'Your browser does not support the required features.',
    action: 'Please use Chrome, Firefox, or Edge for best compatibility.',
    actionLabel: 'Learn More',
    severity: 'critical',
    retryable: false,
    suggestedAction: 'use_different_browser',
  },
  UNKNOWN: {
    title: 'Proof Error',
    message: 'An unexpected error occurred during proof generation.',
    action: 'Please try again or contact support if the issue persists.',
    actionLabel: 'Retry',
    severity: 'error',
    retryable: true,
    suggestedAction: 'retry',
  },
};

/**
 * Human-readable stage names
 */
export const STAGE_NAMES: Record<ZKProofStage, string> = {
  idle: 'Ready',
  loading_circuit: 'Loading Circuit',
  generating_witness: 'Generating Witness',
  generating_proof: 'Generating Proof',
  verifying: 'Verifying',
  submitting: 'Submitting',
  complete: 'Complete',
  error: 'Error',
};

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

/**
 * Error message patterns for classification
 */
const ZK_ERROR_PATTERNS: Array<{ pattern: RegExp; code: ZKProofErrorCode }> = [
  // Timeout errors
  { pattern: /timeout|timed out|took too long/i, code: 'PROOF_GENERATION_TIMEOUT' },
  
  // Circuit errors
  { pattern: /circuit not found|circuit.*missing/i, code: 'CIRCUIT_NOT_FOUND' },
  { pattern: /circuit.*load|load.*circuit|failed to load circuit/i, code: 'CIRCUIT_LOAD_FAILED' },
  
  // WASM errors
  { pattern: /wasm|webassembly|instantiate.*module/i, code: 'WASM_LOAD_FAILED' },
  
  // Witness errors
  { pattern: /witness|calculateWitness/i, code: 'WITNESS_GENERATION_FAILED' },
  
  // Proof errors
  { pattern: /proof generation|generate.*proof|groth16.*prove/i, code: 'PROOF_GENERATION_FAILED' },
  { pattern: /verification failed|verify.*failed|invalid proof/i, code: 'PROOF_VERIFICATION_FAILED' },
  { pattern: /proof.*invalid|invalid.*proof/i, code: 'PROOF_INVALID' },
  
  // Input errors
  { pattern: /invalid input|input.*validation|constraint.*not.*satisfied/i, code: 'INPUT_VALIDATION_FAILED' },
  
  // Merkle errors
  { pattern: /merkle|root.*mismatch|not in tree/i, code: 'MERKLE_PROOF_FAILED' },
  
  // Commitment errors
  { pattern: /commitment.*mismatch|invalid commitment/i, code: 'COMMITMENT_MISMATCH' },
  
  // Nullifier errors
  { pattern: /nullifier.*used|already withdrawn|double spend/i, code: 'NULLIFIER_ALREADY_USED' },
  
  // Relayer errors
  { pattern: /relayer.*unavailable|relayer.*down/i, code: 'RELAYER_UNAVAILABLE' },
  { pattern: /relayer.*reject|rejected by relayer/i, code: 'RELAYER_REJECTED' },
  
  // Memory errors
  { pattern: /out of memory|memory.*exceeded|heap/i, code: 'MEMORY_EXCEEDED' },
  
  // Browser support
  { pattern: /not supported|unsupported.*browser/i, code: 'BROWSER_NOT_SUPPORTED' },
];

/**
 * Classify a ZK proof error into a specific error code
 */
export function classifyZKProofError(error: unknown): ZKProofErrorCode {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();
    const combinedMessage = `${name} ${message}`;

    // Check against known patterns
    for (const { pattern, code } of ZK_ERROR_PATTERNS) {
      if (pattern.test(combinedMessage)) {
        return code;
      }
    }

    // Check for specific error types
    if (name.includes('timeout')) {
      return 'PROOF_GENERATION_TIMEOUT';
    }

    if (name.includes('memory') || name.includes('oom')) {
      return 'MEMORY_EXCEEDED';
    }
  }

  return 'UNKNOWN';
}

/**
 * Create a ZKProofError from any error
 */
export function createZKProofError(
  error: unknown,
  stage: ZKProofStage = 'generating_proof',
  duration?: number
): ZKProofError {
  const code = classifyZKProofError(error);
  const errorInfo = ZK_PROOF_ERROR_INFO[code];

  return {
    code,
    message: errorInfo.title,
    description: errorInfo.message,
    originalError: error instanceof Error ? error : new Error(String(error)),
    stage,
    severity: errorInfo.severity,
    retryable: errorInfo.retryable,
    action: errorInfo.suggestedAction,
    timestamp: Date.now(),
    duration,
  };
}

/**
 * Check if an error is a timeout
 */
export function isTimeoutError(error: unknown): boolean {
  return classifyZKProofError(error) === 'PROOF_GENERATION_TIMEOUT';
}

/**
 * Check if an error is retryable
 */
export function isRetryableZKError(error: unknown): boolean {
  const code = classifyZKProofError(error);
  return ZK_PROOF_ERROR_INFO[code].retryable;
}

// ============================================================================
// ZK PROOF STATE HOOK
// ============================================================================

export interface ZKProofState {
  /** Current stage */
  stage: ZKProofStage;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current error (if any) */
  error: ZKProofError | null;
  /** Start time of current operation */
  startTime: number | null;
  /** Elapsed time in ms */
  elapsedTime: number;
  /** Is currently processing */
  isProcessing: boolean;
  /** Retry count */
  retryCount: number;
}

export interface UseZKProofStateOptions {
  /** Custom timeout (ms) */
  timeout?: number;
  /** Max retries */
  maxRetries?: number;
  /** On stage change callback */
  onStageChange?: (stage: ZKProofStage) => void;
  /** On error callback */
  onError?: (error: ZKProofError) => void;
  /** On complete callback */
  onComplete?: () => void;
}

export interface UseZKProofStateReturn extends ZKProofState {
  /** Set current stage */
  setStage: (stage: ZKProofStage) => void;
  /** Set progress percentage */
  setProgress: (progress: number) => void;
  /** Handle error */
  handleError: (error: unknown) => void;
  /** Clear error */
  clearError: () => void;
  /** Reset state */
  reset: () => void;
  /** Start processing */
  start: () => void;
  /** Complete processing */
  complete: () => void;
  /** Increment retry count */
  incrementRetry: () => boolean;
  /** Get stage info */
  getStageInfo: () => { name: string; timeout: number };
}

/**
 * Hook for managing ZK proof state
 */
export function useZKProofState(
  options: UseZKProofStateOptions = {}
): UseZKProofStateReturn {
  const {
    timeout = PROOF_GENERATION_TIMEOUT,
    maxRetries = 3,
    onStageChange,
    onError,
    onComplete,
  } = options;

  const [state, setState] = useState<ZKProofState>({
    stage: 'idle',
    progress: 0,
    error: null,
    startTime: null,
    elapsedTime: 0,
    isProcessing: false,
    retryCount: 0,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Update elapsed time
  useEffect(() => {
    if (state.isProcessing && state.startTime) {
      intervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          elapsedTime: Date.now() - (prev.startTime || Date.now()),
        }));
      }, 100);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    return undefined;
  }, [state.isProcessing, state.startTime]);

  // Stage timeout
  useEffect(() => {
    if (state.isProcessing && state.stage !== 'complete' && state.stage !== 'error') {
      const stageTimeout = STAGE_TIMEOUTS[state.stage] || timeout;

      if (stageTimeout > 0) {
        timeoutRef.current = setTimeout(() => {
          const timeoutError = createZKProofError(
            new Error(`${STAGE_NAMES[state.stage]} timed out`),
            state.stage,
            state.elapsedTime
          );
          setState((prev) => ({
            ...prev,
            stage: 'error',
            error: timeoutError,
            isProcessing: false,
          }));
          onError?.(timeoutError);
        }, stageTimeout);

        return () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
      }
    }
    return undefined;
  }, [state.isProcessing, state.stage, state.elapsedTime, timeout, onError]);

  const setStage = useCallback((stage: ZKProofStage) => {
    setState((prev) => ({
      ...prev,
      stage,
      progress: getStageProgress(stage),
    }));
    onStageChange?.(stage);
  }, [onStageChange]);

  const setProgress = useCallback((progress: number) => {
    setState((prev) => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
    }));
  }, []);

  const handleError = useCallback((error: unknown) => {
    const zkError = createZKProofError(error, state.stage, state.elapsedTime);
    setState((prev) => ({
      ...prev,
      stage: 'error',
      error: zkError,
      isProcessing: false,
    }));
    onError?.(zkError);
  }, [state.stage, state.elapsedTime, onError]);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setState({
      stage: 'idle',
      progress: 0,
      error: null,
      startTime: null,
      elapsedTime: 0,
      isProcessing: false,
      retryCount: 0,
    });
  }, []);

  const start = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setState((prev) => ({
      ...prev,
      stage: 'loading_circuit',
      progress: 0,
      error: null,
      startTime: Date.now(),
      elapsedTime: 0,
      isProcessing: true,
    }));
    onStageChange?.('loading_circuit');
  }, [onStageChange]);

  const complete = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setState((prev) => ({
      ...prev,
      stage: 'complete',
      progress: 100,
      isProcessing: false,
    }));
    onStageChange?.('complete');
    onComplete?.();
  }, [onStageChange, onComplete]);

  const incrementRetry = useCallback((): boolean => {
    const canRetry = state.retryCount < maxRetries;
    
    if (canRetry) {
      setState((prev) => ({
        ...prev,
        retryCount: prev.retryCount + 1,
        error: null,
      }));
    }

    return canRetry;
  }, [state.retryCount, maxRetries]);

  const getStageInfo = useCallback(() => {
    return {
      name: STAGE_NAMES[state.stage],
      timeout: STAGE_TIMEOUTS[state.stage],
    };
  }, [state.stage]);

  return useMemo(
    () => ({
      ...state,
      setStage,
      setProgress,
      handleError,
      clearError,
      reset,
      start,
      complete,
      incrementRetry,
      getStageInfo,
    }),
    [state, setStage, setProgress, handleError, clearError, reset, start, complete, incrementRetry, getStageInfo]
  );
}

/**
 * Get default progress for a stage
 */
function getStageProgress(stage: ZKProofStage): number {
  switch (stage) {
    case 'idle':
      return 0;
    case 'loading_circuit':
      return 10;
    case 'generating_witness':
      return 25;
    case 'generating_proof':
      return 50;
    case 'verifying':
      return 80;
    case 'submitting':
      return 90;
    case 'complete':
      return 100;
    case 'error':
      return 0;
    default:
      return 0;
  }
}

// ============================================================================
// BROWSER COMPATIBILITY
// ============================================================================

/**
 * Check if browser supports required features for ZK proofs
 */
export function checkZKBrowserSupport(): {
  supported: boolean;
  features: Record<string, boolean>;
  issues: string[];
} {
  const features: Record<string, boolean> = {
    webAssembly: typeof WebAssembly !== 'undefined',
    bigInt: typeof BigInt !== 'undefined',
    webCrypto: typeof crypto !== 'undefined' && !!crypto.subtle,
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    webWorkers: typeof Worker !== 'undefined',
  };

  const issues: string[] = [];

  if (!features.webAssembly) {
    issues.push('WebAssembly is not supported. Please use a modern browser.');
  }

  if (!features.bigInt) {
    issues.push('BigInt is not supported. Please update your browser.');
  }

  if (!features.webCrypto) {
    issues.push('Web Crypto API is not available. HTTPS may be required.');
  }

  if (!features.sharedArrayBuffer) {
    issues.push('SharedArrayBuffer is not available. Some features may be slower.');
  }

  const supported = Boolean(features.webAssembly && features.bigInt);

  return { supported, features, issues };
}

/**
 * Get recommended browser message
 */
export function getRecommendedBrowserMessage(): string {
  return 'For best performance, use the latest version of Chrome, Firefox, or Edge.';
}

// ============================================================================
// ERROR DISPLAY HELPERS
// ============================================================================

/**
 * Get stage icon
 */
export function getStageIcon(stage: ZKProofStage): string {
  switch (stage) {
    case 'idle':
      return '⏸️';
    case 'loading_circuit':
      return '📥';
    case 'generating_witness':
      return '🔧';
    case 'generating_proof':
      return '🔐';
    case 'verifying':
      return '✅';
    case 'submitting':
      return '📤';
    case 'complete':
      return '🎉';
    case 'error':
      return '❌';
    default:
      return '❓';
  }
}

/**
 * Get stage color class
 */
export function getStageColorClass(stage: ZKProofStage): string {
  switch (stage) {
    case 'idle':
      return 'text-neutral-400';
    case 'loading_circuit':
    case 'generating_witness':
    case 'generating_proof':
      return 'text-cyan-400';
    case 'verifying':
    case 'submitting':
      return 'text-yellow-400';
    case 'complete':
      return 'text-green-400';
    case 'error':
      return 'text-red-400';
    default:
      return 'text-neutral-400';
  }
}

/**
 * Format elapsed time for display
 */
export function formatElapsedTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Get estimated time remaining
 */
export function getEstimatedTimeRemaining(
  stage: ZKProofStage,
  elapsedTime: number
): string {
  const stageProgress = getStageProgress(stage);
  
  if (stageProgress >= 100) return 'Complete';
  if (stageProgress === 0) return 'Calculating...';

  // Estimate total time based on current progress
  const estimatedTotal = (elapsedTime / stageProgress) * 100;
  const remaining = Math.max(0, estimatedTotal - elapsedTime);

  return formatElapsedTime(remaining);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Hooks
  useZKProofState,
  
  // Error handling
  classifyZKProofError,
  createZKProofError,
  isTimeoutError,
  isRetryableZKError,
  
  // Browser support
  checkZKBrowserSupport,
  getRecommendedBrowserMessage,
  
  // Display helpers
  getStageIcon,
  getStageColorClass,
  formatElapsedTime,
  getEstimatedTimeRemaining,
  
  // Constants
  PROOF_GENERATION_TIMEOUT,
  STAGE_TIMEOUTS,
  ZK_PROOF_ERROR_INFO,
  STAGE_NAMES,
};
