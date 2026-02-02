/**
 * Network Error Handling Utilities
 * 
 * Provides robust network error handling with:
 * - Automatic retry with exponential backoff
 * - Multiple RPC endpoint fallback
 * - Connection state management
 * - User-friendly error messages
 */

'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type NetworkStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface RPCEndpoint {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** RPC URL */
  url: string;
  /** WebSocket URL (optional) */
  wsUrl?: string;
  /** Network type */
  network: 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';
  /** Priority (lower = higher priority) */
  priority: number;
  /** Whether this is a fallback endpoint */
  isFallback?: boolean;
  /** Rate limit (requests per second) */
  rateLimit?: number;
  /** Health check interval (ms) */
  healthCheckInterval?: number;
}

export interface NetworkError {
  /** Error code */
  code: NetworkErrorCode;
  /** Error message */
  message: string;
  /** Original error */
  originalError?: Error;
  /** RPC endpoint that failed */
  endpoint?: string;
  /** Whether retry is possible */
  retryable: boolean;
  /** Suggested action */
  action?: NetworkErrorAction;
  /** Timestamp */
  timestamp: number;
}

export type NetworkErrorCode =
  | 'NETWORK_OFFLINE'
  | 'RPC_UNAVAILABLE'
  | 'RPC_RATE_LIMITED'
  | 'RPC_TIMEOUT'
  | 'RPC_ERROR'
  | 'CONNECTION_REFUSED'
  | 'DNS_LOOKUP_FAILED'
  | 'SSL_ERROR'
  | 'UNKNOWN';

export type NetworkErrorAction =
  | 'retry'
  | 'switch_rpc'
  | 'check_connection'
  | 'wait'
  | 'contact_support';

export interface RetryConfig {
  /** Maximum number of retries */
  maxRetries: number;
  /** Initial delay in ms */
  initialDelay: number;
  /** Maximum delay in ms */
  maxDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Add jitter to prevent thundering herd */
  jitter: boolean;
  /** Retry on these error codes */
  retryOnCodes: NetworkErrorCode[];
}

export interface NetworkState {
  /** Current status */
  status: NetworkStatus;
  /** Current RPC endpoint */
  currentEndpoint: RPCEndpoint | null;
  /** Last successful connection time */
  lastConnected: number | null;
  /** Current error (if any) */
  error: NetworkError | null;
  /** Retry attempt count */
  retryCount: number;
  /** Whether currently retrying */
  isRetrying: boolean;
  /** Online status (browser) */
  isOnline: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default RPC endpoints for each network
 */
export const DEFAULT_RPC_ENDPOINTS: RPCEndpoint[] = [
  // Mainnet
  {
    id: 'helius-mainnet',
    name: 'Helius',
    url: 'https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY',
    network: 'mainnet-beta',
    priority: 1,
    rateLimit: 50,
  },
  {
    id: 'quicknode-mainnet',
    name: 'QuickNode',
    url: 'https://solana-mainnet.core.chainstack.com/YOUR_KEY',
    network: 'mainnet-beta',
    priority: 2,
    isFallback: true,
    rateLimit: 25,
  },
  {
    id: 'solana-mainnet',
    name: 'Solana Public',
    url: 'https://api.mainnet-beta.solana.com',
    network: 'mainnet-beta',
    priority: 10,
    isFallback: true,
    rateLimit: 10,
  },
  // Devnet
  {
    id: 'helius-devnet',
    name: 'Helius Devnet',
    url: 'https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY',
    network: 'devnet',
    priority: 1,
    rateLimit: 50,
  },
  {
    id: 'solana-devnet',
    name: 'Solana Devnet',
    url: 'https://api.devnet.solana.com',
    network: 'devnet',
    priority: 2,
    isFallback: true,
    rateLimit: 10,
  },
  // Testnet
  {
    id: 'solana-testnet',
    name: 'Solana Testnet',
    url: 'https://api.testnet.solana.com',
    network: 'testnet',
    priority: 1,
    rateLimit: 10,
  },
];

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryOnCodes: [
    'RPC_UNAVAILABLE',
    'RPC_RATE_LIMITED',
    'RPC_TIMEOUT',
    'CONNECTION_REFUSED',
  ],
};

/**
 * Network error messages for users
 */
export const NETWORK_ERROR_MESSAGES: Record<NetworkErrorCode, { title: string; message: string; action: string }> = {
  NETWORK_OFFLINE: {
    title: 'No Internet Connection',
    message: 'Please check your internet connection and try again.',
    action: 'Check your WiFi or mobile data settings.',
  },
  RPC_UNAVAILABLE: {
    title: 'Server Unavailable',
    message: 'The Solana network is temporarily unavailable.',
    action: 'We\'re automatically trying other servers.',
  },
  RPC_RATE_LIMITED: {
    title: 'Too Many Requests',
    message: 'Please wait a moment before trying again.',
    action: 'Requests will resume automatically.',
  },
  RPC_TIMEOUT: {
    title: 'Request Timeout',
    message: 'The server took too long to respond.',
    action: 'Retrying with a different server.',
  },
  RPC_ERROR: {
    title: 'Server Error',
    message: 'The server returned an error.',
    action: 'Please try again or contact support.',
  },
  CONNECTION_REFUSED: {
    title: 'Connection Refused',
    message: 'Unable to connect to the server.',
    action: 'We\'re automatically trying other servers.',
  },
  DNS_LOOKUP_FAILED: {
    title: 'DNS Error',
    message: 'Unable to resolve server address.',
    action: 'Check your internet connection.',
  },
  SSL_ERROR: {
    title: 'Security Error',
    message: 'Unable to establish a secure connection.',
    action: 'Please try again later.',
  },
  UNKNOWN: {
    title: 'Connection Error',
    message: 'An unexpected error occurred.',
    action: 'Please try again.',
  },
};

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

/**
 * Classify an error into a NetworkErrorCode
 */
export function classifyNetworkError(error: unknown): NetworkErrorCode {
  if (!navigator.onLine) {
    return 'NETWORK_OFFLINE';
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'RPC_TIMEOUT';
    }

    // Rate limiting (HTTP 429)
    if (message.includes('429') || message.includes('rate limit') || message.includes('too many')) {
      return 'RPC_RATE_LIMITED';
    }

    // Connection refused
    if (message.includes('econnrefused') || message.includes('connection refused')) {
      return 'CONNECTION_REFUSED';
    }

    // DNS errors
    if (message.includes('enotfound') || message.includes('dns') || message.includes('getaddrinfo')) {
      return 'DNS_LOOKUP_FAILED';
    }

    // SSL/TLS errors
    if (message.includes('ssl') || message.includes('certificate') || message.includes('tls')) {
      return 'SSL_ERROR';
    }

    // Server errors (5xx)
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return 'RPC_UNAVAILABLE';
    }

    // Generic network errors
    if (name.includes('network') || message.includes('network') || message.includes('fetch')) {
      return 'RPC_UNAVAILABLE';
    }

    // RPC-specific errors
    if (message.includes('rpc') || message.includes('jsonrpc')) {
      return 'RPC_ERROR';
    }
  }

  return 'UNKNOWN';
}

/**
 * Create a NetworkError from any error
 */
export function createNetworkError(
  error: unknown,
  endpoint?: string
): NetworkError {
  const code = classifyNetworkError(error);
  const errorInfo = NETWORK_ERROR_MESSAGES[code];

  return {
    code,
    message: errorInfo.message,
    originalError: error instanceof Error ? error : new Error(String(error)),
    endpoint,
    retryable: DEFAULT_RETRY_CONFIG.retryOnCodes.includes(code),
    action: getErrorAction(code),
    timestamp: Date.now(),
  };
}

/**
 * Get suggested action for an error code
 */
function getErrorAction(code: NetworkErrorCode): NetworkErrorAction {
  switch (code) {
    case 'NETWORK_OFFLINE':
      return 'check_connection';
    case 'RPC_RATE_LIMITED':
      return 'wait';
    case 'RPC_UNAVAILABLE':
    case 'RPC_TIMEOUT':
    case 'CONNECTION_REFUSED':
      return 'switch_rpc';
    case 'RPC_ERROR':
    case 'DNS_LOOKUP_FAILED':
    case 'SSL_ERROR':
      return 'retry';
    default:
      return 'contact_support';
  }
}

// ============================================================================
// RETRY UTILITIES
// ============================================================================

/**
 * Calculate delay for next retry attempt
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  let delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  delay = Math.min(delay, config.maxDelay);

  if (config.jitter) {
    // Add ±25% jitter
    const jitterRange = delay * 0.25;
    delay += (Math.random() * 2 - 1) * jitterRange;
  }

  return Math.round(delay);
}

/**
 * Sleep for specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (attempt: number, error: Error, delay: number) => void
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const errorCode = classifyNetworkError(error);
      if (!fullConfig.retryOnCodes.includes(errorCode)) {
        throw lastError;
      }

      if (attempt < fullConfig.maxRetries) {
        const delay = calculateRetryDelay(attempt, fullConfig);
        onRetry?.(attempt + 1, lastError, delay);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// ============================================================================
// RPC ENDPOINT MANAGEMENT
// ============================================================================

/**
 * Get endpoints for a specific network, sorted by priority
 */
export function getEndpointsForNetwork(
  network: RPCEndpoint['network'],
  endpoints: RPCEndpoint[] = DEFAULT_RPC_ENDPOINTS
): RPCEndpoint[] {
  return endpoints
    .filter((e) => e.network === network)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Get next fallback endpoint
 */
export function getNextFallbackEndpoint(
  currentEndpoint: RPCEndpoint | null,
  network: RPCEndpoint['network'],
  endpoints: RPCEndpoint[] = DEFAULT_RPC_ENDPOINTS
): RPCEndpoint | null {
  const networkEndpoints = getEndpointsForNetwork(network, endpoints);

  if (!currentEndpoint) {
    return networkEndpoints[0] ?? null;
  }

  const currentIndex = networkEndpoints.findIndex((e) => e.id === currentEndpoint.id);
  const nextIndex = currentIndex + 1;

  if (nextIndex < networkEndpoints.length) {
    const nextEndpoint = networkEndpoints[nextIndex];
    return nextEndpoint ?? null;
  }

  // Wrap around to first endpoint
  return networkEndpoints[0] ?? null;
}

/**
 * Health check an RPC endpoint
 */
export async function checkEndpointHealth(endpoint: RPCEndpoint): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.result === 'ok';
  } catch {
    return false;
  }
}

// ============================================================================
// NETWORK STATE HOOK
// ============================================================================

export interface UseNetworkStateOptions {
  /** Initial network */
  network?: RPCEndpoint['network'];
  /** Custom endpoints */
  endpoints?: RPCEndpoint[];
  /** Custom retry config */
  retryConfig?: Partial<RetryConfig>;
  /** Enable auto-reconnect */
  autoReconnect?: boolean;
  /** Health check interval (ms) */
  healthCheckInterval?: number;
}

export interface UseNetworkStateReturn extends NetworkState {
  /** Switch to a specific endpoint */
  switchEndpoint: (endpoint: RPCEndpoint) => void;
  /** Switch to next fallback endpoint */
  switchToFallback: () => void;
  /** Retry connection */
  retry: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
  /** Check current endpoint health */
  checkHealth: () => Promise<boolean>;
  /** Get all endpoints for current network */
  getEndpoints: () => RPCEndpoint[];
}

/**
 * Hook for managing network state with auto-retry and fallback
 */
export function useNetworkState(
  options: UseNetworkStateOptions = {}
): UseNetworkStateReturn {
  const {
    network = 'devnet',
    endpoints = DEFAULT_RPC_ENDPOINTS,
    retryConfig = {},
    autoReconnect = true,
    healthCheckInterval = 30000,
  } = options;

  const [state, setState] = useState<NetworkState>(() => {
    const initialEndpoint = getEndpointsForNetwork(network, endpoints)[0];
    return {
      status: 'connecting',
      currentEndpoint: initialEndpoint ?? null,
      lastConnected: null,
      error: null,
      retryCount: 0,
      isRetrying: false,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    };
  });

  const retryConfigRef = useRef({ ...DEFAULT_RETRY_CONFIG, ...retryConfig });
  const healthCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor online status
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      if (autoReconnect && state.status === 'disconnected') {
        retry();
      }
    };

    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        isOnline: false,
        status: 'disconnected',
        error: createNetworkError(new Error('Network offline')),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoReconnect, state.status]);

  // Health check interval
  useEffect(() => {
    if (!state.currentEndpoint || state.status !== 'connected') {
      return undefined;
    }

    const runHealthCheck = async () => {
      const isHealthy = await checkEndpointHealth(state.currentEndpoint!);
      if (!isHealthy) {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: createNetworkError(
            new Error('Health check failed'),
            prev.currentEndpoint?.url
          ),
        }));

        if (autoReconnect) {
          switchToFallback();
        }
      }
    };

    healthCheckTimeoutRef.current = setInterval(runHealthCheck, healthCheckInterval);

    return () => {
      if (healthCheckTimeoutRef.current) {
        clearInterval(healthCheckTimeoutRef.current);
      }
    };
  }, [state.currentEndpoint, state.status, autoReconnect, healthCheckInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (healthCheckTimeoutRef.current) {
        clearInterval(healthCheckTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const switchEndpoint = useCallback((endpoint: RPCEndpoint) => {
    setState((prev) => ({
      ...prev,
      currentEndpoint: endpoint,
      status: 'connecting',
      error: null,
      retryCount: 0,
    }));
  }, []);

  const switchToFallback = useCallback(() => {
    setState((prev) => {
      const nextEndpoint = getNextFallbackEndpoint(
        prev.currentEndpoint,
        network,
        endpoints
      );

      return {
        ...prev,
        currentEndpoint: nextEndpoint,
        status: 'connecting',
        retryCount: 0,
      };
    });
  }, [network, endpoints]);

  const retry = useCallback(async () => {
    if (!state.currentEndpoint) return;

    setState((prev) => ({ ...prev, isRetrying: true, status: 'connecting' }));

    try {
      const isHealthy = await checkEndpointHealth(state.currentEndpoint);

      if (isHealthy) {
        setState((prev) => ({
          ...prev,
          status: 'connected',
          lastConnected: Date.now(),
          error: null,
          retryCount: 0,
          isRetrying: false,
        }));
      } else {
        throw new Error('Endpoint health check failed');
      }
    } catch (error) {
      const networkError = createNetworkError(error, state.currentEndpoint.url);

      setState((prev) => {
        const newRetryCount = prev.retryCount + 1;

        if (newRetryCount >= retryConfigRef.current.maxRetries) {
          // Max retries reached, switch to fallback
          if (autoReconnect) {
            const nextEndpoint = getNextFallbackEndpoint(
              prev.currentEndpoint,
              network,
              endpoints
            );
            return {
              ...prev,
              currentEndpoint: nextEndpoint,
              status: 'connecting',
              error: networkError,
              retryCount: 0,
              isRetrying: false,
            };
          }
        }

        return {
          ...prev,
          status: 'error',
          error: networkError,
          retryCount: newRetryCount,
          isRetrying: false,
        };
      });

      // Schedule next retry
      if (autoReconnect && state.retryCount < retryConfigRef.current.maxRetries) {
        const delay = calculateRetryDelay(state.retryCount, retryConfigRef.current);
        reconnectTimeoutRef.current = setTimeout(retry, delay);
      }
    }
  }, [state.currentEndpoint, state.retryCount, autoReconnect, network, endpoints]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    if (!state.currentEndpoint) return false;
    return checkEndpointHealth(state.currentEndpoint);
  }, [state.currentEndpoint]);

  const getEndpoints = useCallback((): RPCEndpoint[] => {
    return getEndpointsForNetwork(network, endpoints);
  }, [network, endpoints]);

  return useMemo(
    () => ({
      ...state,
      switchEndpoint,
      switchToFallback,
      retry,
      clearError,
      checkHealth,
      getEndpoints,
    }),
    [state, switchEndpoint, switchToFallback, retry, clearError, checkHealth, getEndpoints]
  );
}

// ============================================================================
// NETWORK ERROR DISPLAY COMPONENTS
// ============================================================================

export interface NetworkErrorDisplayProps {
  error: NetworkError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

/**
 * Props for the useNetworkFetch hook
 */
export interface UseNetworkFetchOptions<T> {
  /** Fetch function */
  fetcher: () => Promise<T>;
  /** Automatic retry on error */
  autoRetry?: boolean;
  /** Retry configuration */
  retryConfig?: Partial<RetryConfig>;
  /** On success callback */
  onSuccess?: (data: T) => void;
  /** On error callback */
  onError?: (error: NetworkError) => void;
}

export interface UseNetworkFetchReturn<T> {
  /** Fetched data */
  data: T | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: NetworkError | null;
  /** Retry count */
  retryCount: number;
  /** Refetch function */
  refetch: () => Promise<void>;
  /** Clear error */
  clearError: () => void;
}

/**
 * Hook for making network requests with automatic retry
 */
export function useNetworkFetch<T>(
  options: UseNetworkFetchOptions<T>
): UseNetworkFetchReturn<T> {
  const { fetcher, autoRetry = true, retryConfig = {}, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<NetworkError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fullConfig = useMemo(
    () => ({ ...DEFAULT_RETRY_CONFIG, ...retryConfig }),
    [retryConfig]
  );

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (autoRetry) {
        const result = await retryWithBackoff(fetcher, fullConfig, (attempt) => {
          setRetryCount(attempt);
        });
        setData(result);
        onSuccess?.(result);
      } else {
        const result = await fetcher();
        setData(result);
        onSuccess?.(result);
      }
    } catch (err) {
      const networkError = createNetworkError(err);
      setError(networkError);
      onError?.(networkError);
    } finally {
      setIsLoading(false);
      setRetryCount(0);
    }
  }, [fetcher, autoRetry, fullConfig, onSuccess, onError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return useMemo(
    () => ({
      data,
      isLoading,
      error,
      retryCount,
      refetch,
      clearError,
    }),
    [data, isLoading, error, retryCount, refetch, clearError]
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Hooks
  useNetworkState,
  useNetworkFetch,

  // Utilities
  classifyNetworkError,
  createNetworkError,
  calculateRetryDelay,
  retryWithBackoff,
  getEndpointsForNetwork,
  getNextFallbackEndpoint,
  checkEndpointHealth,
  sleep,

  // Constants
  DEFAULT_RPC_ENDPOINTS,
  DEFAULT_RETRY_CONFIG,
  NETWORK_ERROR_MESSAGES,
};
