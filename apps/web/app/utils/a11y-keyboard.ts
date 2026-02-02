/**
 * Accessibility - Keyboard Navigation Utilities
 *
 * Provides utilities for keyboard navigation and focus management.
 * Ensures all interactive elements are accessible via keyboard.
 *
 * WCAG 2.1 AA Requirements:
 * - All functionality available via keyboard (2.1.1)
 * - No keyboard trap (2.1.2)
 * - Focus order is logical (2.4.3)
 * - Focus is visible (2.4.7)
 */

import { useEffect, useCallback, useRef } from "react";

// ============================================
// Key Constants
// ============================================

export const KEYS = {
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  TAB: "Tab",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",
} as const;

export type KeyName = (typeof KEYS)[keyof typeof KEYS];

// ============================================
// Focusable Element Selectors
// ============================================

/**
 * Selector for all focusable elements
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

/**
 * Selector for tabbable elements (focusable + visible)
 */
export const TABBABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

// ============================================
// Focus Management Utilities
// ============================================

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(
  container: HTMLElement | null
): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/**
 * Get all tabbable elements within a container
 */
export function getTabbableElements(
  container: HTMLElement | null
): HTMLElement[] {
  if (!container) return [];
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)
  );
  // Filter out hidden elements
  return elements.filter((el) => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

/**
 * Focus the first focusable element in a container
 */
export function focusFirst(container: HTMLElement | null): boolean {
  const elements = getFocusableElements(container);
  if (elements.length > 0 && elements[0]) {
    elements[0].focus();
    return true;
  }
  return false;
}

/**
 * Focus the last focusable element in a container
 */
export function focusLast(container: HTMLElement | null): boolean {
  const elements = getFocusableElements(container);
  if (elements.length > 0) {
    const lastElement = elements[elements.length - 1];
    if (lastElement) {
      lastElement.focus();
      return true;
    }
  }
  return false;
}

// ============================================
// Focus Trap Hook
// ============================================

export interface UseFocusTrapOptions {
  /** Whether the trap is active */
  active?: boolean;
  /** Return focus to trigger element on deactivate */
  returnFocus?: boolean;
  /** Initial focus element selector or element */
  initialFocus?: string | HTMLElement | null;
  /** Called when Escape is pressed */
  onEscape?: () => void;
}

/**
 * Hook to trap focus within a container (for modals, dialogs)
 */
export function useFocusTrap(options: UseFocusTrapOptions = {}) {
  const {
    active = true,
    returnFocus = true,
    initialFocus,
    onEscape,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Store the previously focused element
  useEffect(() => {
    if (active) {
      previousActiveElement.current = document.activeElement;
    }
  }, [active]);

  // Set initial focus
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;

    // Focus initial element or first focusable
    if (initialFocus) {
      if (typeof initialFocus === 'string') {
        const el = container.querySelector<HTMLElement>(initialFocus);
        if (el) el.focus();
        else focusFirst(container);
      } else {
        initialFocus.focus();
      }
    } else {
      focusFirst(container);
    }
  }, [active, initialFocus]);

  // Return focus on deactivate
  useEffect(() => {
    return () => {
      if (returnFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [returnFocus]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!active || !containerRef.current) return;

      const container = containerRef.current;

      // Handle Escape
      if (event.key === KEYS.ESCAPE) {
        event.preventDefault();
        onEscape?.();
        return;
      }

      // Handle Tab (focus trap)
      if (event.key === KEYS.TAB) {
        const focusables = getTabbableElements(container);
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (event.shiftKey) {
          // Shift + Tab: wrap to last
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: wrap to first
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    },
    [active, onEscape]
  );

  // Attach keyboard listener
  useEffect(() => {
    if (!active) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, handleKeyDown]);

  return { containerRef };
}

// ============================================
// Roving TabIndex Hook
// ============================================

export interface UseRovingTabIndexOptions<T extends HTMLElement> {
  /** List of refs to manage */
  refs: React.RefObject<T | null>[];
  /** Orientation for arrow key navigation */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /** Loop navigation at ends */
  loop?: boolean;
  /** Currently active index */
  activeIndex?: number;
  /** Called when active index changes */
  onActiveChange?: (index: number) => void;
}

/**
 * Hook for roving tabindex pattern (toolbar, menu, tab list)
 */
export function useRovingTabIndex<T extends HTMLElement>(
  options: UseRovingTabIndexOptions<T>
) {
  const {
    refs,
    orientation = 'horizontal',
    loop = true,
    activeIndex = 0,
    onActiveChange,
  } = options;

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const count = refs.length;
      if (count === 0) return;

      let nextIndex = activeIndex;

      const prevKeys: string[] =
        orientation === 'vertical'
          ? [KEYS.ARROW_UP]
          : orientation === 'horizontal'
            ? [KEYS.ARROW_LEFT]
            : [KEYS.ARROW_UP, KEYS.ARROW_LEFT];

      const nextKeys: string[] =
        orientation === 'vertical'
          ? [KEYS.ARROW_DOWN]
          : orientation === 'horizontal'
            ? [KEYS.ARROW_RIGHT]
            : [KEYS.ARROW_DOWN, KEYS.ARROW_RIGHT];

      if (prevKeys.includes(event.key)) {
        event.preventDefault();
        nextIndex = loop
          ? (activeIndex - 1 + count) % count
          : Math.max(0, activeIndex - 1);
      } else if (nextKeys.includes(event.key)) {
        event.preventDefault();
        nextIndex = loop ? (activeIndex + 1) % count : Math.min(count - 1, activeIndex + 1);
      } else if (event.key === KEYS.HOME) {
        event.preventDefault();
        nextIndex = 0;
      } else if (event.key === KEYS.END) {
        event.preventDefault();
        nextIndex = count - 1;
      } else {
        return;
      }

      if (nextIndex !== activeIndex) {
        onActiveChange?.(nextIndex);
        refs[nextIndex]?.current?.focus();
      }
    },
    [refs, orientation, loop, activeIndex, onActiveChange]
  );

  // Get tabIndex for each item
  const getTabIndex = useCallback(
    (index: number) => (index === activeIndex ? 0 : -1),
    [activeIndex]
  );

  return { handleKeyDown, getTabIndex };
}

// ============================================
// Click as Keyboard Handler
// ============================================

/**
 * Make a div/span act like a button for keyboard users
 * Handles Enter and Space as click
 */
export function handleKeyboardClick(
  event: React.KeyboardEvent,
  onClick?: () => void
) {
  if (event.key === KEYS.ENTER || event.key === KEYS.SPACE) {
    event.preventDefault();
    onClick?.();
  }
}

/**
 * Props to make a non-button element keyboard accessible
 */
export function getButtonA11yProps(onClick?: () => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => handleKeyboardClick(e, onClick),
  };
}

// ============================================
// Skip Link Component Props
// ============================================

export interface SkipLinkProps {
  /** Target element ID to skip to */
  targetId: string;
  /** Skip link text */
  children?: React.ReactNode;
}

/**
 * Get props for a skip link (created in component file)
 */
export function getSkipLinkProps(targetId: string) {
  return {
    href: `#${targetId}`,
    className: `
      sr-only focus:not-sr-only
      focus:absolute focus:top-4 focus:left-4 focus:z-50
      focus:px-4 focus:py-2 focus:rounded-lg
      focus:bg-cyan-500 focus:text-white focus:font-medium
      focus:outline-none focus:ring-2 focus:ring-offset-2
      focus:ring-cyan-400 focus:ring-offset-neutral-900
    `.trim(),
  };
}

// ============================================
// Keyboard Navigation CSS Classes
// ============================================

/**
 * Tailwind classes for focus-visible states
 */
export const FOCUS_CLASSES = {
  // Default focus ring
  ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900',
  
  // Focus ring without offset
  ringInset: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-inset',
  
  // Focus background change
  bg: 'focus-visible:bg-white/10',
  
  // Focus border
  border: 'focus-visible:border-cyan-400',
  
  // Combined button focus
  button: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:scale-[1.02]',
  
  // Combined input focus
  input: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:border-cyan-400',
} as const;

export type FocusClassType = keyof typeof FOCUS_CLASSES;
