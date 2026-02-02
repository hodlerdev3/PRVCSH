/**
 * @prvcsh/ui - ShieldButton Component
 * Primary button component for PRVCSH ecosystem
 * 
 * Features:
 * - Multiple variants: primary, secondary, ghost, danger
 * - Multiple sizes: sm, md, lg
 * - States: hover, focus, disabled, loading
 * - Icon support: leftIcon, rightIcon
 * - Full accessibility support
 */

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

/* ====================================
 * Types
 * ==================================== */

export interface ShieldButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant style */
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Show loading spinner */
  loading?: boolean;
  /** Icon to display on the left */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right */
  rightIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Button as child renders as a different element */
  asChild?: boolean;
}

/* ====================================
 * Variant Styles
 * ==================================== */

const variants = {
  primary: [
    "bg-gradient-to-r from-[#818CF8] to-[#A78BFA]",
    "text-white font-medium",
    "shadow-[0_0_20px_rgba(129,140,248,0.4)]",
    "hover:shadow-[0_0_30px_rgba(129,140,248,0.6)]",
    "hover:scale-[1.02]",
    "active:scale-[0.98]",
    "disabled:from-gray-600 disabled:to-gray-700",
    "disabled:shadow-none",
  ].join(" "),

  secondary: [
    "bg-[#1A1A2E]",
    "text-[#A1A1B5] font-medium",
    "border border-[rgba(255,255,255,0.1)]",
    "hover:bg-[#252538]",
    "hover:text-[#F5F5FA]",
    "hover:border-[rgba(255,255,255,0.2)]",
    "active:scale-[0.98]",
    "disabled:bg-[#141420]",
    "disabled:text-[#4B4B5E]",
  ].join(" "),

  ghost: [
    "bg-transparent",
    "text-[#A1A1B5] font-medium",
    "hover:bg-[rgba(255,255,255,0.05)]",
    "hover:text-[#F5F5FA]",
    "active:bg-[rgba(255,255,255,0.1)]",
    "disabled:text-[#4B4B5E]",
    "disabled:hover:bg-transparent",
  ].join(" "),

  outline: [
    "bg-transparent",
    "text-[#818CF8] font-medium",
    "border-2 border-[#818CF8]",
    "hover:bg-[#818CF8]",
    "hover:text-white",
    "active:scale-[0.98]",
    "disabled:border-[#4B4B5E]",
    "disabled:text-[#4B4B5E]",
  ].join(" "),

  danger: [
    "bg-gradient-to-r from-[#EF4444] to-[#F87171]",
    "text-white font-medium",
    "shadow-[0_0_20px_rgba(239,68,68,0.4)]",
    "hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]",
    "hover:scale-[1.02]",
    "active:scale-[0.98]",
    "disabled:from-gray-600 disabled:to-gray-700",
    "disabled:shadow-none",
  ].join(" "),
};

const sizes = {
  sm: "h-8 px-3 text-sm rounded-md gap-1.5",
  md: "h-10 px-4 text-base rounded-lg gap-2",
  lg: "h-12 px-6 text-lg rounded-xl gap-2.5",
};

/* ====================================
 * Component
 * ==================================== */

export const ShieldButton = React.forwardRef<HTMLButtonElement, ShieldButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center",
          "transition-all duration-200 ease-out",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F]",
          "disabled:cursor-not-allowed disabled:opacity-50",

          // Variant
          variants[variant],

          // Size
          sizes[size],

          // Full width
          fullWidth && "w-full",

          // Custom classes
          className
        )}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <Loader2
            className={cn(
              "animate-spin",
              size === "sm" && "h-3.5 w-3.5",
              size === "md" && "h-4 w-4",
              size === "lg" && "h-5 w-5"
            )}
            aria-hidden="true"
          />
        )}

        {/* Left icon */}
        {!loading && leftIcon && (
          <span
            className={cn(
              "flex-shrink-0",
              size === "sm" && "[&>svg]:h-3.5 [&>svg]:w-3.5",
              size === "md" && "[&>svg]:h-4 [&>svg]:w-4",
              size === "lg" && "[&>svg]:h-5 [&>svg]:w-5"
            )}
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        {/* Button text */}
        <span className={cn(loading && "opacity-70")}>{children}</span>

        {/* Right icon */}
        {rightIcon && (
          <span
            className={cn(
              "flex-shrink-0",
              size === "sm" && "[&>svg]:h-3.5 [&>svg]:w-3.5",
              size === "md" && "[&>svg]:h-4 [&>svg]:w-4",
              size === "lg" && "[&>svg]:h-5 [&>svg]:w-5"
            )}
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

ShieldButton.displayName = "ShieldButton";

export default ShieldButton;
