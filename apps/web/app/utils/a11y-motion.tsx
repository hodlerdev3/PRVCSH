/**
 * Reduced Motion Accessibility Utilities
 * 
 * Provides prefers-reduced-motion support for WCAG 2.1 AA compliance.
 * Users who have enabled reduced motion in their OS settings will
 * see static alternatives instead of animations.
 * 
 * @see https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
 */

'use client';

import { useState, useEffect, useCallback, useMemo, createContext, useContext, type ReactNode } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type MotionPreference = 'no-preference' | 'reduce';

export interface MotionConfig {
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean;
  /** Motion preference value */
  motionPreference: MotionPreference;
  /** Check if animations should be enabled */
  shouldAnimate: boolean;
  /** Get animation duration based on preference */
  getAnimationDuration: (normalDuration: number) => number;
  /** Get transition configuration */
  getTransition: (config?: TransitionConfig) => CSSTransitionProperties;
}

export interface TransitionConfig {
  /** Duration in milliseconds */
  duration?: number;
  /** Easing function */
  easing?: string;
  /** Delay in milliseconds */
  delay?: number;
  /** Property to transition */
  property?: string;
}

export interface CSSTransitionProperties {
  transition: string;
  transitionDuration: string;
  transitionTimingFunction: string;
  transitionDelay: string;
  transitionProperty: string;
}

export interface AnimationConfig {
  /** Normal animation (when motion is allowed) */
  normal: string;
  /** Reduced animation (when motion is reduced) */
  reduced: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Media query for reduced motion preference
 */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Reduced duration multiplier (for essential animations)
 * Essential animations can still run, but much faster
 */
export const REDUCED_DURATION_MULTIPLIER = 0.1;

/**
 * Maximum animation duration when reduced motion is enabled (in ms)
 */
export const MAX_REDUCED_DURATION = 50;

/**
 * Minimum animation duration (in ms)
 */
export const MIN_DURATION = 0;

/**
 * Animation durations in normal mode
 */
export const ANIMATION_DURATIONS = {
  instant: 100,
  fast: 150,
  normal: 200,
  moderate: 300,
  slow: 500,
  verySlow: 750,
} as const;

/**
 * Animation durations in reduced motion mode
 */
export const REDUCED_DURATIONS = {
  instant: 0,
  fast: 0,
  normal: 0,
  moderate: 0,
  slow: 0,
  verySlow: 0,
} as const;

/**
 * CSS easing functions
 */
export const EASINGS = {
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  // Custom curves
  easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeInOutQuart: 'cubic-bezier(0.76, 0, 0.24, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// ============================================================================
// MOTION DETECTION HOOK
// ============================================================================

/**
 * Hook to detect user's motion preference from OS settings
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const prefersReducedMotion = usePrefersReducedMotion();
 *   
 *   return (
 *     <div className={prefersReducedMotion ? 'static' : 'animated'}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    // Check initial value (SSR-safe)
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReducedMotion;
}

// ============================================================================
// MOTION CONFIGURATION HOOK
// ============================================================================

/**
 * Comprehensive motion configuration hook
 * Provides all motion-related utilities based on user preference
 * 
 * @example
 * ```tsx
 * function AnimatedCard() {
 *   const { shouldAnimate, getAnimationDuration, getTransition } = useMotionConfig();
 *   
 *   const transition = getTransition({ duration: 300, easing: 'easeOut' });
 *   
 *   return (
 *     <div
 *       style={shouldAnimate ? transition : {}}
 *       className={shouldAnimate ? 'hover:scale-105' : ''}
 *     >
 *       Card Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useMotionConfig(): MotionConfig {
  const prefersReducedMotion = usePrefersReducedMotion();

  const getAnimationDuration = useCallback(
    (normalDuration: number): number => {
      if (prefersReducedMotion) {
        const reduced = normalDuration * REDUCED_DURATION_MULTIPLIER;
        return Math.min(reduced, MAX_REDUCED_DURATION);
      }
      return normalDuration;
    },
    [prefersReducedMotion]
  );

  const getTransition = useCallback(
    (config: TransitionConfig = {}): CSSTransitionProperties => {
      const {
        duration = ANIMATION_DURATIONS.normal,
        easing = EASINGS.easeOut,
        delay = 0,
        property = 'all',
      } = config;

      const actualDuration = prefersReducedMotion ? 0 : duration;
      const actualDelay = prefersReducedMotion ? 0 : delay;

      return {
        transition: `${property} ${actualDuration}ms ${easing} ${actualDelay}ms`,
        transitionDuration: `${actualDuration}ms`,
        transitionTimingFunction: easing,
        transitionDelay: `${actualDelay}ms`,
        transitionProperty: property,
      };
    },
    [prefersReducedMotion]
  );

  return useMemo(
    () => ({
      prefersReducedMotion,
      motionPreference: prefersReducedMotion ? 'reduce' : 'no-preference',
      shouldAnimate: !prefersReducedMotion,
      getAnimationDuration,
      getTransition,
    }),
    [prefersReducedMotion, getAnimationDuration, getTransition]
  );
}

// ============================================================================
// MOTION CONTEXT (For App-Wide Access)
// ============================================================================

const MotionContext = createContext<MotionConfig | null>(null);

export interface MotionProviderProps {
  children: ReactNode;
}

/**
 * Motion Provider component for app-wide motion preference access
 * 
 * Usage: Wrap your layout with MotionProvider for app-wide access
 * to motion preferences via the useMotion hook.
 */
export function MotionProvider({ children }: MotionProviderProps) {
  const motionConfig = useMotionConfig();

  return (
    <MotionContext.Provider value={motionConfig}>
      {children}
    </MotionContext.Provider>
  );
}

/**
 * Hook to access motion configuration from context
 * Must be used within MotionProvider
 */
export function useMotion(): MotionConfig {
  const context = useContext(MotionContext);
  if (!context) {
    throw new Error('useMotion must be used within a MotionProvider');
  }
  return context;
}

// ============================================================================
// ANIMATION CLASS UTILITIES
// ============================================================================

/**
 * Get animation classes based on motion preference
 * 
 * @example
 * ```tsx
 * const classes = getAnimationClasses(
 *   prefersReducedMotion,
 *   'animate-fade-in duration-300',
 *   'opacity-100'
 * );
 * ```
 */
export function getAnimationClasses(
  prefersReducedMotion: boolean,
  animatedClasses: string,
  staticClasses: string = ''
): string {
  return prefersReducedMotion ? staticClasses : animatedClasses;
}

/**
 * Predefined animation class pairs
 */
export const MOTION_CLASSES = {
  fadeIn: {
    normal: 'animate-fade-in duration-300',
    reduced: 'opacity-100',
  },
  fadeOut: {
    normal: 'animate-fade-out duration-300',
    reduced: 'opacity-0',
  },
  slideUp: {
    normal: 'animate-slide-up duration-300',
    reduced: 'translate-y-0',
  },
  slideDown: {
    normal: 'animate-slide-down duration-300',
    reduced: 'translate-y-0',
  },
  scaleIn: {
    normal: 'animate-scale-in duration-200',
    reduced: 'scale-100',
  },
  scaleOut: {
    normal: 'animate-scale-out duration-200',
    reduced: 'scale-0',
  },
  spin: {
    normal: 'animate-spin',
    reduced: '', // No spinning
  },
  pulse: {
    normal: 'animate-pulse',
    reduced: '', // No pulsing
  },
  bounce: {
    normal: 'animate-bounce',
    reduced: '', // No bouncing
  },
  ping: {
    normal: 'animate-ping',
    reduced: '', // No ping effect
  },
  glowPulse: {
    normal: 'animate-pulse-glow',
    reduced: '', // Static glow
  },
  zkProgress: {
    normal: 'animate-zk-progress',
    reduced: '', // Static progress
  },
} as const;

/**
 * Get motion-safe animation class
 */
export function getMotionSafeClass(
  prefersReducedMotion: boolean,
  animation: keyof typeof MOTION_CLASSES
): string {
  const config = MOTION_CLASSES[animation];
  return prefersReducedMotion ? config.reduced : config.normal;
}

// ============================================================================
// CSS-IN-JS UTILITIES
// ============================================================================

/**
 * Create motion-safe inline styles
 */
export function getMotionSafeStyles(
  prefersReducedMotion: boolean,
  animatedStyles: React.CSSProperties,
  staticStyles: React.CSSProperties = {}
): React.CSSProperties {
  return prefersReducedMotion ? staticStyles : animatedStyles;
}

/**
 * Create transition styles with motion preference
 */
export function createTransitionStyles(
  prefersReducedMotion: boolean,
  properties: string[] = ['all'],
  duration: number = 200,
  easing: string = 'ease-out'
): React.CSSProperties {
  if (prefersReducedMotion) {
    return { transition: 'none' };
  }

  return {
    transition: properties
      .map((prop) => `${prop} ${duration}ms ${easing}`)
      .join(', '),
  };
}

// ============================================================================
// TAILWIND CSS CLASSES FOR REDUCED MOTION
// ============================================================================

/**
 * Tailwind motion utility classes
 * Use these in className for motion-safe components
 */
export const TAILWIND_MOTION_CLASSES = {
  // Motion-safe wrapper - disables animations when reduced motion is preferred
  motionSafe: 'motion-safe:animate-',
  motionReduce: 'motion-reduce:animate-none',
  
  // Complete motion-safe animation examples
  fadeInSafe: 'motion-safe:animate-fade-in motion-reduce:animate-none motion-reduce:opacity-100',
  slideUpSafe: 'motion-safe:animate-slide-up motion-reduce:animate-none motion-reduce:translate-y-0',
  spinSafe: 'motion-safe:animate-spin motion-reduce:animate-none',
  pulseSafe: 'motion-safe:animate-pulse motion-reduce:animate-none',
  bounceSafe: 'motion-safe:animate-bounce motion-reduce:animate-none',
  
  // Hover effects
  hoverScaleSafe: 'motion-safe:hover:scale-105 motion-reduce:hover:scale-100',
  hoverTranslateSafe: 'motion-safe:hover:-translate-y-1 motion-reduce:hover:translate-y-0',
  
  // Transition classes
  transitionSafe: 'motion-safe:transition-all motion-reduce:transition-none',
  transitionColorsSafe: 'motion-safe:transition-colors motion-reduce:transition-none',
  transitionOpacitySafe: 'motion-safe:transition-opacity motion-reduce:transition-none',
  transitionTransformSafe: 'motion-safe:transition-transform motion-reduce:transition-none',
} as const;

// ============================================================================
// COMPONENT HELPERS
// ============================================================================

/**
 * Props for motion-safe wrapper component
 */
export interface MotionSafeProps {
  /** Whether animation is currently active */
  isAnimating?: boolean;
  /** Animation CSS class */
  animationClass?: string;
  /** Static alternative CSS class */
  staticClass?: string;
  /** Additional classes */
  className?: string;
}

/**
 * Build className for motion-safe components
 */
export function buildMotionSafeClassName({
  animationClass = '',
  staticClass = '',
  className = '',
}: MotionSafeProps & { prefersReducedMotion: boolean }): string {
  // Use Tailwind's motion utilities
  const motionClasses = animationClass
    ? `motion-safe:${animationClass} motion-reduce:${staticClass || 'animate-none'}`
    : '';

  return [className, motionClasses].filter(Boolean).join(' ');
}

// ============================================================================
// SSR-SAFE INITIAL CHECK
// ============================================================================

/**
 * Get initial motion preference for SSR
 * Always returns false on server, actual value on client
 */
export function getInitialMotionPreference(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Check if reduced motion is preferred (synchronous, client-only)
 * For use outside of React components
 */
export function checkReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Hooks
  usePrefersReducedMotion,
  useMotionConfig,
  useMotion,
  
  // Provider
  MotionProvider,
  
  // Constants
  REDUCED_MOTION_QUERY,
  ANIMATION_DURATIONS,
  REDUCED_DURATIONS,
  EASINGS,
  MOTION_CLASSES,
  TAILWIND_MOTION_CLASSES,
  
  // Utilities
  getAnimationClasses,
  getMotionSafeClass,
  getMotionSafeStyles,
  createTransitionStyles,
  buildMotionSafeClassName,
  getInitialMotionPreference,
  checkReducedMotion,
};
