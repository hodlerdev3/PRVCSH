/**
 * @prvcsh/ui - Spinner Component
 * Loading spinner with ZK-themed animation
 * 
 * Features:
 * - Multiple sizes: xs, sm, md, lg, xl
 * - Optional label text
 * - Custom color support
 * - ZK proof-style animation
 */

import * as React from "react";
import { Loader2, Shield } from "lucide-react";
import { cn } from "../lib/utils";

/* ====================================
 * Types
 * ==================================== */

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Spinner size */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Spinner variant */
  variant?: "default" | "zk" | "shield";
  /** Loading label */
  label?: string;
  /** Label position */
  labelPosition?: "right" | "bottom";
  /** Custom color (Tailwind class) */
  color?: string;
}

/* ====================================
 * Size Styles
 * ==================================== */

const sizes = {
  xs: { spinner: "h-3 w-3", label: "text-xs" },
  sm: { spinner: "h-4 w-4", label: "text-sm" },
  md: { spinner: "h-6 w-6", label: "text-base" },
  lg: { spinner: "h-8 w-8", label: "text-lg" },
  xl: { spinner: "h-12 w-12", label: "text-xl" },
};

/* ====================================
 * Spinner Component
 * ==================================== */

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  variant = "default",
  label,
  labelPosition = "right",
  color = "text-[#818CF8]",
  className,
  ...props
}) => {
  const isVertical = labelPosition === "bottom";

  return (
    <div
      role="status"
      aria-label={label || "Loading"}
      className={cn(
        "inline-flex items-center gap-2",
        isVertical && "flex-col",
        className
      )}
      {...props}
    >
      {/* Spinner icon */}
      {variant === "default" && (
        <Loader2 className={cn("animate-spin", sizes[size].spinner, color)} />
      )}

      {variant === "zk" && (
        <div className={cn("relative", sizes[size].spinner)}>
          {/* Outer ring */}
          <div
            className={cn(
              "absolute inset-0 rounded-full border-2 border-transparent",
              "border-t-[#818CF8] border-r-[#818CF8]",
              "animate-spin"
            )}
          />
          {/* Inner ring (opposite direction) */}
          <div
            className={cn(
              "absolute inset-1 rounded-full border border-transparent",
              "border-b-[#22D3EE] border-l-[#22D3EE]",
              "animate-spin"
            )}
            style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
          />
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-1 w-1 rounded-full bg-[#A78BFA] animate-pulse" />
          </div>
        </div>
      )}

      {variant === "shield" && (
        <div className="relative">
          <Shield className={cn("animate-pulse", sizes[size].spinner, color)} />
          <div
            className={cn(
              "absolute inset-0 rounded-full",
              "animate-ping opacity-30",
              color
            )}
            style={{ animationDuration: "1.5s" }}
          />
        </div>
      )}

      {/* Label */}
      {label && (
        <span className={cn("text-[#A1A1B5]", sizes[size].label)}>{label}</span>
      )}
    </div>
  );
};

Spinner.displayName = "Spinner";

export default Spinner;
