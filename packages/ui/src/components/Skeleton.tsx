/**
 * @prvcsh/ui - Skeleton Component
 * Loading placeholder with shimmer animation
 * 
 * Features:
 * - Shimmer animation
 * - Multiple shapes: text, circle, rectangle
 * - Customizable dimensions
 * - Composable for complex layouts
 */

import * as React from "react";
import { cn } from "../lib/utils";

/* ====================================
 * Types
 * ==================================== */

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Skeleton variant */
  variant?: "text" | "circular" | "rectangular" | "rounded";
  /** Width (CSS value or Tailwind class) */
  width?: string | number;
  /** Height (CSS value or Tailwind class) */
  height?: string | number;
  /** Disable animation */
  animation?: boolean;
}

export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of lines */
  lines?: number;
  /** Last line width */
  lastLineWidth?: string;
}

/* ====================================
 * Skeleton Component
 * ==================================== */

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "text",
  width,
  height,
  animation = true,
  className,
  style,
  ...props
}) => {
  const variantStyles = {
    text: "h-4 rounded",
    circular: "rounded-full aspect-square",
    rectangular: "rounded-none",
    rounded: "rounded-lg",
  };

  // Parse dimensions
  const widthStyle = typeof width === "number" ? `${width}px` : width;
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={cn(
        "bg-[#252538]",
        animation && [
          "relative overflow-hidden",
          "after:absolute after:inset-0",
          "after:bg-gradient-to-r after:from-transparent after:via-[rgba(255,255,255,0.08)] after:to-transparent",
          "after:animate-[shimmer_2s_ease-in-out_infinite]",
          "after:-translate-x-full",
        ],
        variantStyles[variant],
        className
      )}
      style={{
        width: widthStyle,
        height: heightStyle,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
};

Skeleton.displayName = "Skeleton";

/* ====================================
 * SkeletonText Component
 * ==================================== */

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lastLineWidth = "60%",
  className,
  ...props
}) => {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          className={cn(
            "h-4",
            index === lines - 1 && lastLineWidth !== "100%"
              ? `w-[${lastLineWidth}]`
              : "w-full"
          )}
          style={
            index === lines - 1 && lastLineWidth !== "100%"
              ? { width: lastLineWidth }
              : undefined
          }
        />
      ))}
    </div>
  );
};

SkeletonText.displayName = "SkeletonText";

/* ====================================
 * SkeletonCard Component (Pre-composed)
 * ==================================== */

export const SkeletonCard: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "p-4 rounded-xl",
        "bg-[rgba(26,26,46,0.8)] border border-[rgba(255,255,255,0.05)]",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      {/* Body */}
      <SkeletonText lines={3} />

      {/* Footer */}
      <div className="flex gap-2 mt-4">
        <Skeleton variant="rounded" className="h-9 w-20" />
        <Skeleton variant="rounded" className="h-9 w-20" />
      </div>
    </div>
  );
};

SkeletonCard.displayName = "SkeletonCard";

/* ====================================
 * SkeletonAvatar Component (Pre-composed)
 * ==================================== */

export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className,
}) => {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
};

SkeletonAvatar.displayName = "SkeletonAvatar";

export default Skeleton;
