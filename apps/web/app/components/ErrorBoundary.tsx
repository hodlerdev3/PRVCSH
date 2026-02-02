/**
 * Error Boundary Components
 * 
 * React Error Boundary implementation for catching and handling
 * runtime errors gracefully. Provides fallback UI and error reporting.
 * 
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */

'use client';

import React, { Component, type ReactNode, type ErrorInfo, useCallback, useState } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Custom fallback component to render on error */
  fallback?: ReactNode;
  /** Custom fallback render function with error details */
  fallbackRender?: (props: FallbackRenderProps) => ReactNode;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Callback when error is reset */
  onReset?: () => void;
  /** Keys that trigger a reset when changed */
  resetKeys?: unknown[];
  /** Component name for error context */
  componentName?: string;
  /** Whether to show detailed error info (dev mode) */
  showDetails?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface FallbackRenderProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  componentName?: string;
}

export interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo | null;
  resetError?: () => void;
  title?: string;
  message?: string;
  showDetails?: boolean;
  showReload?: boolean;
  showReset?: boolean;
  componentName?: string;
}

// ============================================================================
// ERROR CODES & MESSAGES
// ============================================================================

export const ERROR_CODES = {
  UNKNOWN: 'ERR_UNKNOWN',
  NETWORK: 'ERR_NETWORK',
  WALLET: 'ERR_WALLET',
  ZK_PROOF: 'ERR_ZK_PROOF',
  RENDER: 'ERR_RENDER',
  TIMEOUT: 'ERR_TIMEOUT',
  VALIDATION: 'ERR_VALIDATION',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export const ERROR_MESSAGES: Record<ErrorCode, { title: string; message: string }> = {
  [ERROR_CODES.UNKNOWN]: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
  },
  [ERROR_CODES.NETWORK]: {
    title: 'Network Error',
    message: 'Unable to connect to the network. Please check your connection.',
  },
  [ERROR_CODES.WALLET]: {
    title: 'Wallet Error',
    message: 'There was a problem with your wallet connection.',
  },
  [ERROR_CODES.ZK_PROOF]: {
    title: 'Proof Generation Failed',
    message: 'Unable to generate the zero-knowledge proof. Please try again.',
  },
  [ERROR_CODES.RENDER]: {
    title: 'Display Error',
    message: 'Unable to display this content. Please refresh the page.',
  },
  [ERROR_CODES.TIMEOUT]: {
    title: 'Request Timeout',
    message: 'The request took too long. Please try again.',
  },
  [ERROR_CODES.VALIDATION]: {
    title: 'Validation Error',
    message: 'Please check your input and try again.',
  },
};

// ============================================================================
// ERROR ICONS
// ============================================================================

function ErrorIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-16 h-16 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

function RefreshIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function HomeIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

// ============================================================================
// ERROR FALLBACK COMPONENT
// ============================================================================

/**
 * Default error fallback UI component
 */
export function ErrorFallback({
  error,
  errorInfo,
  resetError,
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  showDetails = false,
  showReload = true,
  showReset = true,
  componentName,
}: ErrorFallbackProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  const handleGoHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
    >
      {/* Error Icon */}
      <div className="mb-6 text-red-500">
        <ErrorIcon />
      </div>

      {/* Error Title */}
      <h2 className="text-2xl font-bold text-white mb-2">
        {title}
      </h2>

      {/* Error Message */}
      <p className="text-neutral-400 mb-6 max-w-md">
        {message}
      </p>

      {/* Component Context */}
      {componentName && (
        <p className="text-sm text-neutral-500 mb-4">
          Error in: <code className="text-cyan-400">{componentName}</code>
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        {showReset && resetError && (
          <button
            type="button"
            onClick={resetError}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-neutral-900"
            aria-label="Try again"
          >
            <RefreshIcon />
            Try Again
          </button>
        )}

        {showReload && (
          <button
            type="button"
            onClick={handleReload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-neutral-900"
            aria-label="Reload page"
          >
            <RefreshIcon />
            Reload Page
          </button>
        )}

        <button
          type="button"
          onClick={handleGoHome}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-neutral-900"
          aria-label="Go to home page"
        >
          <HomeIcon />
          Go Home
        </button>
      </div>

      {/* Error Details (Development) */}
      {showDetails && error && (
        <div className="w-full max-w-2xl">
          <button
            type="button"
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            className="text-sm text-neutral-500 hover:text-neutral-300 underline mb-2"
            aria-expanded={isDetailsOpen}
            aria-controls="error-details"
          >
            {isDetailsOpen ? 'Hide' : 'Show'} Error Details
          </button>

          {isDetailsOpen && (
            <div
              id="error-details"
              className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 text-left overflow-auto max-h-64"
            >
              <h3 className="text-sm font-semibold text-red-400 mb-2">
                {error.name}: {error.message}
              </h3>
              {error.stack && (
                <pre className="text-xs text-neutral-400 whitespace-pre-wrap font-mono">
                  {error.stack}
                </pre>
              )}
              {errorInfo?.componentStack && (
                <>
                  <h4 className="text-sm font-semibold text-yellow-400 mt-4 mb-2">
                    Component Stack:
                  </h4>
                  <pre className="text-xs text-neutral-400 whitespace-pre-wrap font-mono">
                    {errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error ID for support */}
      <p className="text-xs text-neutral-600 mt-4">
        Error ID: {Date.now().toString(36).toUpperCase()}
      </p>
    </div>
  );
}

// ============================================================================
// COMPACT ERROR FALLBACK
// ============================================================================

/**
 * Compact error fallback for inline/card errors
 */
export function CompactErrorFallback({
  error,
  resetError,
  title = 'Error',
  message = 'Something went wrong',
}: Pick<ErrorFallbackProps, 'error' | 'resetError' | 'title' | 'message'>) {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
    >
      <svg
        className="w-6 h-6 text-red-500 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-red-400">{title}</p>
        <p className="text-sm text-neutral-400 truncate">
          {error?.message || message}
        </p>
      </div>

      {resetError && (
        <button
          type="button"
          onClick={resetError}
          className="flex-shrink-0 px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Retry"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ============================================================================
// ERROR BOUNDARY CLASS COMPONENT
// ============================================================================

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors in child component tree and displays fallback UI.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallbackRender={({ error, resetError }) => (
 *     <ErrorFallback error={error} resetError={resetError} />
 *   )}
 *   onError={(error, info) => console.error(error, info)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Call onError callback
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
    }

    // TODO: Send to error reporting service (Sentry, etc.)
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys changed
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );

      if (hasKeyChanged) {
        this.resetError();
      }
    }
  }

  private reportError(error: Error, _errorInfo: ErrorInfo): void {
    // Placeholder for error reporting service integration
    // Example: Sentry.captureException(error, { extra: { componentStack: _errorInfo.componentStack } });
    
    // For now, just log to analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as typeof window & { gtag: (...args: unknown[]) => void }).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }

  resetError = (): void => {
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { children, fallback, fallbackRender, componentName, showDetails } = this.props;
    const { hasError, error, errorInfo } = this.state;

    if (hasError && error) {
      // Custom fallback render function
      if (fallbackRender) {
        return fallbackRender({
          error,
          errorInfo,
          resetError: this.resetError,
          componentName,
        });
      }

      // Custom fallback component
      if (fallback) {
        return fallback;
      }

      // Default fallback
      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetError}
          componentName={componentName}
          showDetails={showDetails ?? process.env.NODE_ENV === 'development'}
        />
      );
    }

    return children;
  }
}

// ============================================================================
// FUNCTIONAL ERROR BOUNDARY WRAPPER
// ============================================================================

export interface WithErrorBoundaryOptions {
  fallback?: ReactNode;
  fallbackRender?: (props: FallbackRenderProps) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

/**
 * HOC to wrap a component with an ErrorBoundary
 * 
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   componentName: 'MyComponent',
 *   fallbackRender: ({ resetError }) => <ErrorFallback resetError={resetError} />
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const WithErrorBoundaryComponent: React.FC<P> = (props) => {
    return (
      <ErrorBoundary
        componentName={options.componentName || displayName}
        fallback={options.fallback}
        fallbackRender={options.fallbackRender}
        onError={options.onError}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundaryComponent;
}

// ============================================================================
// SPECIALIZED ERROR BOUNDARIES
// ============================================================================

/**
 * Error boundary for wallet-related components
 */
export function WalletErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      componentName="WalletSection"
      fallbackRender={({ resetError }) => (
        <CompactErrorFallback
          title="Wallet Error"
          message="Unable to connect to wallet. Please try again."
          resetError={resetError}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary for ZK proof components
 */
export function ZKProofErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      componentName="ZKProof"
      fallbackRender={({ resetError }) => (
        <CompactErrorFallback
          title="Proof Generation Error"
          message="Failed to generate ZK proof. Please try again."
          resetError={resetError}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary for transaction forms
 */
export function TransactionErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      componentName="TransactionForm"
      fallbackRender={({ resetError }) => (
        <ErrorFallback
          title="Transaction Error"
          message="There was a problem processing your transaction. Please try again."
          resetError={resetError}
          showReset={true}
          showReload={false}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// ============================================================================
// SUSPENSE ERROR BOUNDARY
// ============================================================================

export interface SuspenseErrorBoundaryProps {
  children: ReactNode;
  /** Loading fallback for Suspense */
  loadingFallback?: ReactNode;
  /** Error fallback */
  errorFallback?: ReactNode;
  /** Error render function */
  errorFallbackRender?: (props: FallbackRenderProps) => ReactNode;
}

/**
 * Combined Suspense + ErrorBoundary wrapper
 * 
 * @example
 * ```tsx
 * <SuspenseErrorBoundary
 *   loadingFallback={<Skeleton />}
 *   errorFallbackRender={({ resetError }) => <ErrorFallback resetError={resetError} />}
 * >
 *   <AsyncComponent />
 * </SuspenseErrorBoundary>
 * ```
 */
export function SuspenseErrorBoundary({
  children,
  loadingFallback = <DefaultLoadingFallback />,
  errorFallback,
  errorFallbackRender,
}: SuspenseErrorBoundaryProps) {
  // errorFallbackRender will be passed to ErrorBoundary
  return (
    <ErrorBoundary fallback={errorFallback} fallbackRender={errorFallbackRender}>
      <React.Suspense fallback={loadingFallback}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}

/**
 * Default loading fallback for Suspense
 */
function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center gap-3 text-neutral-400">
        <svg
          className="w-6 h-6 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Loading...</span>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ErrorBoundary;
