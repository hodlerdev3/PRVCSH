/**
 * Loading States & Skeleton Components
 * 
 * Provides consistent loading states and skeleton UI throughout the app.
 * Implements shimmer animation and various skeleton patterns for
 * different content types.
 */

'use client';

import React, { useMemo, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '../utils/a11y-motion';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SkeletonVariant = 
  | 'text'
  | 'heading'
  | 'avatar'
  | 'button'
  | 'card'
  | 'input'
  | 'badge'
  | 'icon'
  | 'image'
  | 'custom';

export type SkeletonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SkeletonProps {
  /** Variant type */
  variant?: SkeletonVariant;
  /** Size preset */
  size?: SkeletonSize;
  /** Width (CSS value or Tailwind class) */
  width?: string | number;
  /** Height (CSS value or Tailwind class) */
  height?: string | number;
  /** Border radius (CSS value or Tailwind class) */
  rounded?: string;
  /** Additional CSS classes */
  className?: string;
  /** Enable shimmer animation */
  animate?: boolean;
  /** Number of items to render */
  count?: number;
  /** Gap between items */
  gap?: string;
  /** Aria label for accessibility */
  'aria-label'?: string;
}

export interface LoadingStateProps {
  /** Whether loading is active */
  isLoading: boolean;
  /** Content to show when loaded */
  children: ReactNode;
  /** Skeleton to show while loading */
  skeleton?: ReactNode;
  /** Delay before showing skeleton (ms) */
  delay?: number;
  /** Minimum loading time (ms) */
  minLoadingTime?: number;
  /** Fallback for null/undefined children */
  fallback?: ReactNode;
}

export interface ContentPlaceholderProps {
  /** Type of content being loaded */
  type: 'wallet' | 'balance' | 'transaction' | 'form' | 'history' | 'card' | 'list';
  /** Number of items for list-type placeholders */
  count?: number;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// SKELETON SIZE PRESETS
// ============================================================================

const SIZE_PRESETS: Record<SkeletonVariant, Record<SkeletonSize, { width: string; height: string; rounded: string }>> = {
  text: {
    xs: { width: 'w-16', height: 'h-3', rounded: 'rounded' },
    sm: { width: 'w-24', height: 'h-4', rounded: 'rounded' },
    md: { width: 'w-32', height: 'h-4', rounded: 'rounded' },
    lg: { width: 'w-48', height: 'h-5', rounded: 'rounded' },
    xl: { width: 'w-64', height: 'h-6', rounded: 'rounded' },
  },
  heading: {
    xs: { width: 'w-24', height: 'h-5', rounded: 'rounded' },
    sm: { width: 'w-32', height: 'h-6', rounded: 'rounded' },
    md: { width: 'w-48', height: 'h-7', rounded: 'rounded' },
    lg: { width: 'w-64', height: 'h-8', rounded: 'rounded' },
    xl: { width: 'w-80', height: 'h-10', rounded: 'rounded' },
  },
  avatar: {
    xs: { width: 'w-6', height: 'h-6', rounded: 'rounded-full' },
    sm: { width: 'w-8', height: 'h-8', rounded: 'rounded-full' },
    md: { width: 'w-10', height: 'h-10', rounded: 'rounded-full' },
    lg: { width: 'w-12', height: 'h-12', rounded: 'rounded-full' },
    xl: { width: 'w-16', height: 'h-16', rounded: 'rounded-full' },
  },
  button: {
    xs: { width: 'w-16', height: 'h-7', rounded: 'rounded-md' },
    sm: { width: 'w-20', height: 'h-8', rounded: 'rounded-md' },
    md: { width: 'w-24', height: 'h-10', rounded: 'rounded-lg' },
    lg: { width: 'w-32', height: 'h-11', rounded: 'rounded-lg' },
    xl: { width: 'w-40', height: 'h-12', rounded: 'rounded-xl' },
  },
  card: {
    xs: { width: 'w-full', height: 'h-24', rounded: 'rounded-lg' },
    sm: { width: 'w-full', height: 'h-32', rounded: 'rounded-lg' },
    md: { width: 'w-full', height: 'h-48', rounded: 'rounded-xl' },
    lg: { width: 'w-full', height: 'h-64', rounded: 'rounded-xl' },
    xl: { width: 'w-full', height: 'h-80', rounded: 'rounded-2xl' },
  },
  input: {
    xs: { width: 'w-32', height: 'h-8', rounded: 'rounded-md' },
    sm: { width: 'w-48', height: 'h-9', rounded: 'rounded-md' },
    md: { width: 'w-full', height: 'h-10', rounded: 'rounded-lg' },
    lg: { width: 'w-full', height: 'h-11', rounded: 'rounded-lg' },
    xl: { width: 'w-full', height: 'h-12', rounded: 'rounded-xl' },
  },
  badge: {
    xs: { width: 'w-12', height: 'h-5', rounded: 'rounded-full' },
    sm: { width: 'w-16', height: 'h-6', rounded: 'rounded-full' },
    md: { width: 'w-20', height: 'h-6', rounded: 'rounded-full' },
    lg: { width: 'w-24', height: 'h-7', rounded: 'rounded-full' },
    xl: { width: 'w-28', height: 'h-8', rounded: 'rounded-full' },
  },
  icon: {
    xs: { width: 'w-4', height: 'h-4', rounded: 'rounded' },
    sm: { width: 'w-5', height: 'h-5', rounded: 'rounded' },
    md: { width: 'w-6', height: 'h-6', rounded: 'rounded-md' },
    lg: { width: 'w-8', height: 'h-8', rounded: 'rounded-md' },
    xl: { width: 'w-10', height: 'h-10', rounded: 'rounded-lg' },
  },
  image: {
    xs: { width: 'w-16', height: 'h-16', rounded: 'rounded-lg' },
    sm: { width: 'w-24', height: 'h-24', rounded: 'rounded-lg' },
    md: { width: 'w-32', height: 'h-32', rounded: 'rounded-xl' },
    lg: { width: 'w-48', height: 'h-48', rounded: 'rounded-xl' },
    xl: { width: 'w-64', height: 'h-64', rounded: 'rounded-2xl' },
  },
  custom: {
    xs: { width: 'w-full', height: 'h-4', rounded: 'rounded' },
    sm: { width: 'w-full', height: 'h-6', rounded: 'rounded' },
    md: { width: 'w-full', height: 'h-8', rounded: 'rounded-md' },
    lg: { width: 'w-full', height: 'h-10', rounded: 'rounded-lg' },
    xl: { width: 'w-full', height: 'h-12', rounded: 'rounded-xl' },
  },
};

// ============================================================================
// BASE SKELETON COMPONENT
// ============================================================================

/**
 * Base skeleton component with shimmer animation
 */
export function Skeleton({
  variant = 'text',
  size = 'md',
  width,
  height,
  rounded,
  className = '',
  animate = true,
  count = 1,
  gap = 'gap-2',
  'aria-label': ariaLabel,
}: SkeletonProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;

  const preset = SIZE_PRESETS[variant][size];

  const widthClass = width
    ? typeof width === 'number'
      ? ''
      : width
    : preset.width;

  const heightClass = height
    ? typeof height === 'number'
      ? ''
      : height
    : preset.height;

  const roundedClass = rounded || preset.rounded;

  const widthStyle = typeof width === 'number' ? { width: `${width}px` } : {};
  const heightStyle = typeof height === 'number' ? { height: `${height}px` } : {};

  const baseClasses = [
    'bg-neutral-800/50',
    widthClass,
    heightClass,
    roundedClass,
    shouldAnimate ? 'animate-shimmer' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={baseClasses}
      style={{
        ...widthStyle,
        ...heightStyle,
        backgroundImage: shouldAnimate
          ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)'
          : undefined,
        backgroundSize: shouldAnimate ? '200% 100%' : undefined,
      }}
      role="presentation"
      aria-hidden="true"
    />
  ));

  if (count === 1) {
    return (
      <div
        className={baseClasses}
        style={{ ...widthStyle, ...heightStyle }}
        role="status"
        aria-label={ariaLabel || 'Loading...'}
        aria-live="polite"
      />
    );
  }

  return (
    <div className={`flex flex-col ${gap}`} role="status" aria-label={ariaLabel || 'Loading...'}>
      {items}
    </div>
  );
}

// ============================================================================
// LOADING STATE WRAPPER
// ============================================================================

/**
 * Wrapper component that shows skeleton while loading
 */
export function LoadingState({
  isLoading,
  children,
  skeleton,
  delay = 0,
  fallback = null,
}: LoadingStateProps) {
  const [showSkeleton, setShowSkeleton] = React.useState(delay === 0);

  React.useEffect(() => {
    if (!isLoading) {
      setShowSkeleton(false);
      return undefined;
    }

    if (delay === 0) {
      setShowSkeleton(true);
      return undefined;
    }

    const timer = setTimeout(() => {
      setShowSkeleton(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  if (isLoading) {
    if (!showSkeleton) {
      return null;
    }
    return <>{skeleton || <Skeleton variant="card" size="md" />}</>;
  }

  return <>{children ?? fallback}</>;
}

// ============================================================================
// SPECIFIC SKELETON PATTERNS
// ============================================================================

/**
 * Wallet balance skeleton
 */
export function WalletBalanceSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Balance label */}
      <Skeleton variant="text" size="sm" width="w-24" />
      {/* Balance amount */}
      <Skeleton variant="heading" size="xl" width="w-48" />
      {/* USD value */}
      <Skeleton variant="text" size="sm" width="w-32" />
    </div>
  );
}

/**
 * Token balance row skeleton
 */
export function TokenBalanceSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Token icon */}
      <Skeleton variant="avatar" size="md" />
      <div className="flex-1 space-y-1">
        {/* Token name */}
        <Skeleton variant="text" size="sm" width="w-20" />
        {/* Balance */}
        <Skeleton variant="text" size="xs" width="w-16" />
      </div>
      {/* USD value */}
      <Skeleton variant="text" size="sm" width="w-24" />
    </div>
  );
}

/**
 * Transaction row skeleton
 */
export function TransactionRowSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 p-4 ${className}`}>
      {/* Icon */}
      <Skeleton variant="icon" size="lg" />
      <div className="flex-1 space-y-1">
        {/* Type + amount */}
        <Skeleton variant="text" size="md" width="w-32" />
        {/* Date */}
        <Skeleton variant="text" size="xs" width="w-24" />
      </div>
      {/* Status badge */}
      <Skeleton variant="badge" size="sm" />
    </div>
  );
}

/**
 * Transaction history list skeleton
 */
export function TransactionHistorySkeleton({ 
  count = 5,
  className = '',
}: { 
  count?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <Skeleton variant="heading" size="md" width="w-40" className="mb-4" />
      {/* Transactions */}
      {Array.from({ length: count }, (_, i) => (
        <TransactionRowSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Form field skeleton
 */
export function FormFieldSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <Skeleton variant="text" size="sm" width="w-24" />
      {/* Input */}
      <Skeleton variant="input" size="md" />
    </div>
  );
}

/**
 * Deposit/Withdraw form skeleton
 */
export function MixerFormSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab switcher */}
      <div className="flex gap-2">
        <Skeleton variant="button" size="lg" width="w-1/2" />
        <Skeleton variant="button" size="lg" width="w-1/2" />
      </div>
      {/* Balance display */}
      <WalletBalanceSkeleton />
      {/* Amount input */}
      <FormFieldSkeleton />
      {/* Token selector */}
      <FormFieldSkeleton />
      {/* Submit button */}
      <Skeleton variant="button" size="xl" width="w-full" />
    </div>
  );
}

/**
 * Card skeleton with header and content
 */
export function CardSkeleton({ 
  hasHeader = true,
  contentLines = 3,
  className = '',
}: { 
  hasHeader?: boolean;
  contentLines?: number;
  className?: string;
}) {
  return (
    <div className={`p-6 bg-neutral-900/50 rounded-xl space-y-4 ${className}`}>
      {hasHeader && (
        <div className="flex items-center justify-between">
          <Skeleton variant="heading" size="md" width="w-32" />
          <Skeleton variant="icon" size="md" />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: contentLines }, (_, i) => (
          <Skeleton
            key={i}
            variant="text"
            size="sm"
            width={i === contentLines - 1 ? 'w-3/4' : 'w-full'}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * ZK Proof status skeleton
 */
export function ZKProofStatusSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress bar */}
      <Skeleton variant="custom" size="sm" rounded="rounded-full" />
      {/* Steps */}
      <div className="flex justify-between">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton variant="avatar" size="sm" />
            <Skeleton variant="text" size="xs" width="w-16" />
          </div>
        ))}
      </div>
      {/* Status message */}
      <Skeleton variant="text" size="md" width="w-48" className="mx-auto" />
    </div>
  );
}

/**
 * Header skeleton
 */
export function HeaderSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-between p-4 ${className}`}>
      {/* Logo */}
      <Skeleton variant="heading" size="md" width="w-32" />
      {/* Navigation */}
      <div className="hidden md:flex gap-4">
        <Skeleton variant="text" size="sm" width="w-16" />
        <Skeleton variant="text" size="sm" width="w-16" />
        <Skeleton variant="text" size="sm" width="w-16" />
      </div>
      {/* Wallet button */}
      <Skeleton variant="button" size="md" width="w-36" />
    </div>
  );
}

/**
 * Page skeleton with full layout
 */
export function PageSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`min-h-screen space-y-8 ${className}`}>
      <HeaderSkeleton />
      <main className="max-w-4xl mx-auto px-4 space-y-8">
        <CardSkeleton />
        <MixerFormSkeleton />
        <TransactionHistorySkeleton count={3} />
      </main>
    </div>
  );
}

// ============================================================================
// CONTENT PLACEHOLDER COMPONENT
// ============================================================================

/**
 * Generic content placeholder for different content types
 */
export function ContentPlaceholder({ type, count = 3, className = '' }: ContentPlaceholderProps) {
  const content = useMemo(() => {
    switch (type) {
      case 'wallet':
        return <WalletBalanceSkeleton className={className} />;
      case 'balance':
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }, (_, i) => (
              <TokenBalanceSkeleton key={i} />
            ))}
          </div>
        );
      case 'transaction':
        return <TransactionRowSkeleton className={className} />;
      case 'form':
        return <MixerFormSkeleton className={className} />;
      case 'history':
        return <TransactionHistorySkeleton count={count} className={className} />;
      case 'card':
        return <CardSkeleton className={className} />;
      case 'list':
        return (
          <div className={`space-y-2 ${className}`}>
            {Array.from({ length: count }, (_, i) => (
              <Skeleton key={i} variant="text" size="md" />
            ))}
          </div>
        );
      default:
        return <Skeleton variant="card" size="md" className={className} />;
    }
  }, [type, count, className]);

  return <>{content}</>;
}

// ============================================================================
// INLINE LOADING INDICATORS
// ============================================================================

/**
 * Inline loading spinner
 */
export function LoadingSpinner({
  size = 'md',
  className = '',
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeClasses = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-neutral-600 border-t-cyan-400 rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Loading dots animation
 */
export function LoadingDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`} role="status" aria-label="Loading">
      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Full page loading overlay
 */
export function LoadingOverlay({
  message = 'Loading...',
  className = '',
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="xl" />
        <p className="text-neutral-300 text-lg">{message}</p>
      </div>
    </div>
  );
}

// ============================================================================
// SHIMMER KEYFRAMES (Add to globals.css or tailwind.config)
// ============================================================================

/**
 * CSS for shimmer animation (to be added to globals.css):
 * 
 * @keyframes shimmer {
 *   0% { background-position: -200% 0; }
 *   100% { background-position: 200% 0; }
 * }
 * 
 * .animate-shimmer {
 *   animation: shimmer 2s infinite linear;
 *   background: linear-gradient(
 *     90deg,
 *     rgba(255,255,255,0) 0%,
 *     rgba(255,255,255,0.05) 50%,
 *     rgba(255,255,255,0) 100%
 *   );
 *   background-size: 200% 100%;
 * }
 */

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Core components
  Skeleton,
  LoadingState,
  ContentPlaceholder,
  
  // Specific skeletons
  WalletBalanceSkeleton,
  TokenBalanceSkeleton,
  TransactionRowSkeleton,
  TransactionHistorySkeleton,
  FormFieldSkeleton,
  MixerFormSkeleton,
  CardSkeleton,
  ZKProofStatusSkeleton,
  HeaderSkeleton,
  PageSkeleton,
  
  // Loading indicators
  LoadingSpinner,
  LoadingDots,
  LoadingOverlay,
};
