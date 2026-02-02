/**
 * Accessibility - Screen Reader Utilities
 *
 * Provides utilities for screen reader accessibility.
 * Ensures icon-only buttons and interactive elements have proper labels.
 *
 * WCAG 2.1 Requirements:
 * - Non-text content has text alternatives (1.1.1)
 * - Link purpose is clear (2.4.4)
 * - Labels or instructions are provided (3.3.2)
 */

import React from "react";

// ============================================
// Screen Reader Only CSS Class
// ============================================

/**
 * Tailwind class for visually hidden but screen reader accessible content
 * This is the sr-only class from Tailwind
 */
export const SR_ONLY_CLASS = "sr-only";

/**
 * CSS for screen reader only content (for inline styles)
 */
export const srOnlyStyles: React.CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: 0,
};

// ============================================
// Icon Button Aria Labels
// ============================================

/**
 * Common aria-labels for icon-only buttons
 * Use these for consistency across the app
 */
export const ARIA_LABELS = {
  // Navigation
  menu: "Open menu",
  closeMenu: "Close menu",
  home: "Go to home",
  back: "Go back",
  forward: "Go forward",

  // Actions
  close: "Close",
  dismiss: "Dismiss",
  cancel: "Cancel",
  confirm: "Confirm",
  save: "Save",
  delete: "Delete",
  edit: "Edit",
  copy: "Copy to clipboard",
  paste: "Paste from clipboard",
  clear: "Clear",
  reset: "Reset",

  // Wallet
  connectWallet: "Connect wallet",
  disconnectWallet: "Disconnect wallet",
  copyAddress: "Copy wallet address",
  viewOnExplorer: "View on explorer",

  // Privacy
  shield: "Shield tokens",
  unshield: "Unshield tokens",
  deposit: "Deposit tokens",
  withdraw: "Withdraw tokens",
  refresh: "Refresh",
  refreshBalance: "Refresh balance",

  // Form controls
  showPassword: "Show password",
  hidePassword: "Hide password",
  increaseAmount: "Increase amount",
  decreaseAmount: "Decrease amount",
  maxAmount: "Set maximum amount",
  selectToken: "Select token",

  // Information
  info: "More information",
  help: "Help",
  settings: "Settings",
  notifications: "Notifications",

  // Social
  twitter: "Follow us on Twitter",
  github: "View on GitHub",
  discord: "Join Discord",
  telegram: "Join Telegram",

  // Misc
  externalLink: "Opens in new tab",
  loading: "Loading",
  expandMore: "Show more",
  expandLess: "Show less",
} as const;

export type AriaLabelKey = keyof typeof ARIA_LABELS;

// ============================================
// Icon Button Props Helper
// ============================================

/**
 * Get props for an icon-only button
 * Ensures accessibility compliance
 */
export function getIconButtonProps(
  label: string,
  onClick?: () => void
): React.ButtonHTMLAttributes<HTMLButtonElement> {
  return {
    type: "button",
    "aria-label": label,
    onClick,
  };
}

/**
 * Get props for an icon-only link
 */
export function getIconLinkProps(
  label: string,
  href: string,
  external?: boolean
): React.AnchorHTMLAttributes<HTMLAnchorElement> {
  const baseProps: React.AnchorHTMLAttributes<HTMLAnchorElement> = {
    href,
    "aria-label": label,
  };

  if (external) {
    return {
      ...baseProps,
      target: "_blank",
      rel: "noopener noreferrer",
      "aria-label": `${label} (${ARIA_LABELS.externalLink})`,
    };
  }

  return baseProps;
}

// ============================================
// Live Region Utilities
// ============================================

/**
 * Props for an aria-live region
 * Used for dynamic content announcements
 */
export interface LiveRegionProps {
  /** Politeness level */
  "aria-live": "polite" | "assertive" | "off";
  /** What changes to announce */
  "aria-atomic"?: boolean;
  /** Relevant changes */
  "aria-relevant"?: "additions" | "removals" | "text" | "all";
  /** Role for the region */
  role?: "status" | "alert" | "log";
}

/**
 * Get props for a polite live region (non-urgent updates)
 */
export function getPoliteRegionProps(): LiveRegionProps {
  return {
    "aria-live": "polite",
    "aria-atomic": true,
    role: "status",
  };
}

/**
 * Get props for an assertive live region (urgent updates)
 */
export function getAssertiveRegionProps(): LiveRegionProps {
  return {
    "aria-live": "assertive",
    "aria-atomic": true,
    role: "alert",
  };
}

// ============================================
// Form Accessibility Helpers
// ============================================

/**
 * Generate unique IDs for form field associations
 */
export function getFormFieldIds(baseName: string) {
  return {
    input: `${baseName}-input`,
    label: `${baseName}-label`,
    description: `${baseName}-description`,
    error: `${baseName}-error`,
  };
}

/**
 * Get aria props for a form input
 */
export function getInputAriaProps(options: {
  hasError?: boolean;
  errorId?: string;
  descriptionId?: string;
  required?: boolean;
}) {
  const { hasError, errorId, descriptionId, required } = options;

  const describedBy = [
    descriptionId,
    hasError && errorId,
  ].filter(Boolean).join(" ") || undefined;

  return {
    "aria-invalid": hasError || undefined,
    "aria-describedby": describedBy,
    "aria-required": required || undefined,
  };
}

// ============================================
// Loading State Announcements
// ============================================

/**
 * Get props for a loading indicator
 */
export function getLoadingProps(label?: string) {
  return {
    role: "status" as const,
    "aria-label": label ?? ARIA_LABELS.loading,
    "aria-busy": true,
  };
}

/**
 * Get props for a progress indicator
 */
export function getProgressProps(options: {
  value: number;
  max?: number;
  label?: string;
}) {
  const { value, max = 100, label } = options;
  return {
    role: "progressbar" as const,
    "aria-valuenow": value,
    "aria-valuemin": 0,
    "aria-valuemax": max,
    "aria-label": label,
  };
}

// ============================================
// Description Helpers
// ============================================

/**
 * Common descriptions for complex UI elements
 */
export const ARIA_DESCRIPTIONS = {
  zkProof:
    "Zero-knowledge proof generation may take up to 60 seconds. Do not close this window.",
  shieldedBalance:
    "Your shielded balance is private and only visible to you with your wallet.",
  publicBalance: "Your public balance is visible on the blockchain.",
  recipientAddress:
    "Enter the Solana wallet address of the recipient. Double-check the address before sending.",
  transactionHistory:
    "List of your past deposits and withdrawals in the privacy mixer.",
  networkFee:
    "Network fee paid to Solana validators for processing your transaction.",
} as const;

export type AriaDescriptionKey = keyof typeof ARIA_DESCRIPTIONS;

// ============================================
// Component Prop Utilities
// ============================================

/**
 * Merge aria-label with existing props
 * Only adds if label is provided
 */
export function withAriaLabel<P extends object>(
  props: P,
  label?: string
): P & { "aria-label"?: string } {
  if (!label) return props;
  return { ...props, "aria-label": label };
}

/**
 * Add screen reader only text element
 */
export function ScreenReaderOnly({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return React.createElement(
    "span",
    { className: SR_ONLY_CLASS },
    children
  );
}

// Type export for external use
export type AriaLabels = typeof ARIA_LABELS;
export type AriaDescriptions = typeof ARIA_DESCRIPTIONS;
