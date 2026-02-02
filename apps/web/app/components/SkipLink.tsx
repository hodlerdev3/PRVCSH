"use client";

/**
 * SkipLink Component
 *
 * Provides a skip link for keyboard users to bypass navigation
 * and go directly to main content.
 *
 * WCAG 2.1 Requirement:
 * - Bypass Blocks (2.4.1) - Mechanism to bypass repeated content
 *
 * Usage:
 * 1. Add <SkipLink /> as the first focusable element in your layout
 * 2. Add id="main-content" to your main content area
 */

import React, { useCallback } from "react";

// ============================================
// Types
// ============================================

export interface SkipLinkProps {
  /** Target element ID to skip to (default: "main-content") */
  targetId?: string;
  /** Link text (default: "Skip to main content") */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ============================================
// SkipLink Component
// ============================================

export function SkipLink({
  targetId = "main-content",
  children = "Skip to main content",
  className = "",
}: SkipLinkProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();

      const target = document.getElementById(targetId);
      if (target) {
        // Set tabindex if not already focusable
        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
        }
        target.focus();
        // Remove outline from main content (it's not interactive)
        target.style.outline = "none";
      }
    },
    [targetId]
  );

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={`
        sr-only focus:not-sr-only
        fixed top-4 left-4 z-[9999]
        px-4 py-3 rounded-lg
        bg-cyan-500 text-white font-semibold
        shadow-lg shadow-cyan-500/25
        focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2
        focus:ring-offset-neutral-900
        transition-transform
        focus:translate-y-0
        ${className}
      `.trim()}
    >
      {children}
    </a>
  );
}

// ============================================
// SkipLinks Component (Multiple Skip Links)
// ============================================

export interface SkipTarget {
  id: string;
  label: string;
}

export interface SkipLinksProps {
  /** Array of skip targets */
  targets?: SkipTarget[];
  /** Additional className */
  className?: string;
}

/**
 * Multiple skip links for complex pages
 */
export function SkipLinks({
  targets = [
    { id: "main-content", label: "Skip to main content" },
    { id: "navigation", label: "Skip to navigation" },
  ],
  className = "",
}: SkipLinksProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
      e.preventDefault();

      const target = document.getElementById(targetId);
      if (target) {
        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
        }
        target.focus();
        target.style.outline = "none";
      }
    },
    []
  );

  return (
    <nav
      aria-label="Skip links"
      className={`
        sr-only focus-within:not-sr-only
        fixed top-4 left-4 z-[9999]
        flex flex-col gap-2
        ${className}
      `.trim()}
    >
      {targets.map((target) => (
        <a
          key={target.id}
          href={`#${target.id}`}
          onClick={(e) => handleClick(e, target.id)}
          className="
            px-4 py-2 rounded-lg
            bg-cyan-500 text-white font-medium text-sm
            shadow-lg shadow-cyan-500/25
            focus:outline-none focus:ring-2 focus:ring-cyan-400
            hover:bg-cyan-400
            transition-colors
          "
        >
          {target.label}
        </a>
      ))}
    </nav>
  );
}

// ============================================
// Main Content Wrapper
// ============================================

export interface MainContentProps {
  /** Content ID (default: "main-content") */
  id?: string;
  /** Children */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * Wrapper for main content area with proper landmark and skip target
 */
export function MainContent({
  id = "main-content",
  children,
  className = "",
}: MainContentProps) {
  return (
    <main
      id={id}
      role="main"
      aria-label="Main content"
      tabIndex={-1}
      className={`outline-none ${className}`.trim()}
    >
      {children}
    </main>
  );
}

export default SkipLink;
