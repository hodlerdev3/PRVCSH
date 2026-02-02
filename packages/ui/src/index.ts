/**
 * @prvcsh/ui
 * PRVCSH - UI Component Library
 *
 * A comprehensive component library built with React and TypeScript
 * for the PRVCSH ecosystem, featuring the Cipher Noir design system.
 */

// ============================================
// Utilities
// ============================================
export { cn, createVariants } from "./lib/utils";

// ============================================
// Styles (CSS)
// ============================================
// Import in your app: import '@prvcsh/ui/styles';
// Or individually: import '@prvcsh/ui/styles/tokens.css';

// ============================================
// Core Components
// ============================================

// Buttons
export { ShieldButton } from "./components/ShieldButton";
export type { ShieldButtonProps } from "./components/ShieldButton";

// Legacy exports (for compatibility)
export { Button } from "./button";
export { Card } from "./card";
export { Code } from "./code";

// ============================================
// Form Components
// ============================================
export { TextInput } from "./components/TextInput";
export type { TextInputProps } from "./components/TextInput";

export { NumberInput } from "./components/NumberInput";
export type { NumberInputProps } from "./components/NumberInput";

// ============================================
// Layout Components
// ============================================
export {
  PrivacyCard,
  PrivacyCardHeader,
  PrivacyCardFooter,
  CollapsibleCard,
} from "./components/PrivacyCard";
export type {
  PrivacyCardProps,
  PrivacyCardHeaderProps,
  PrivacyCardFooterProps,
  CollapsibleCardProps,
} from "./components/PrivacyCard";

// ============================================
// Overlay Components
// ============================================
export { Modal } from "./components/Modal";
export type { ModalProps } from "./components/Modal";

export { Tooltip } from "./components/Tooltip";
export type { TooltipProps } from "./components/Tooltip";

// ============================================
// Feedback Components
// ============================================
export { Toast, ToastContainer } from "./components/Toast";
export type { ToastProps, ToastVariant, ToastContainerProps } from "./components/Toast";

export { Spinner } from "./components/Spinner";
export type { SpinnerProps } from "./components/Spinner";

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonAvatar,
} from "./components/Skeleton";
export type { SkeletonProps, SkeletonTextProps } from "./components/Skeleton";

// ============================================
// Icons
// ============================================
export * from "./components/Icons";

// ============================================
// Legacy Types
// ============================================
export type { ButtonProps } from "./button";
export type { CardProps } from "./card";
export type { CodeProps } from "./code";
