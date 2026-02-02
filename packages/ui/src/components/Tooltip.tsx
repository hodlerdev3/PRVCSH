/**
 * @prvcsh/ui - Tooltip Component
 * Lightweight tooltip with hover trigger
 * 
 * Features:
 * - Multiple placement options
 * - Custom delay
 * - Arrow indicator
 * - Dark theme styling
 */

import * as React from "react";
import { cn } from "../lib/utils";

/* ====================================
 * Types
 * ==================================== */

export interface TooltipProps {
  /** Tooltip content */
  content: React.ReactNode;
  /** Tooltip placement */
  placement?: "top" | "bottom" | "left" | "right";
  /** Delay before showing (ms) */
  delay?: number;
  /** Show arrow */
  arrow?: boolean;
  /** Disabled tooltip */
  disabled?: boolean;
  /** Children (trigger element) */
  children: React.ReactElement;
  /** Additional class for tooltip */
  className?: string;
}

/* ====================================
 * Placement Styles
 * ==================================== */

const placements = {
  top: {
    container: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    arrow: "top-full left-1/2 -translate-x-1/2 border-t-[#1A1A2E] border-x-transparent border-b-transparent",
  },
  bottom: {
    container: "top-full left-1/2 -translate-x-1/2 mt-2",
    arrow: "bottom-full left-1/2 -translate-x-1/2 border-b-[#1A1A2E] border-x-transparent border-t-transparent",
  },
  left: {
    container: "right-full top-1/2 -translate-y-1/2 mr-2",
    arrow: "left-full top-1/2 -translate-y-1/2 border-l-[#1A1A2E] border-y-transparent border-r-transparent",
  },
  right: {
    container: "left-full top-1/2 -translate-y-1/2 ml-2",
    arrow: "right-full top-1/2 -translate-y-1/2 border-r-[#1A1A2E] border-y-transparent border-l-transparent",
  },
};

/* ====================================
 * Tooltip Component
 * ==================================== */

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = "top",
  delay = 200,
  arrow = true,
  disabled = false,
  children,
  className,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleMouseEnter = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (disabled) {
    return children;
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {/* Trigger */}
      {children}

      {/* Tooltip */}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-[700] pointer-events-none",
            "animate-in fade-in zoom-in-95 duration-150",
            placements[placement].container
          )}
        >
          <div
            className={cn(
              "px-3 py-1.5 rounded-lg",
              "bg-[#1A1A2E] border border-[rgba(255,255,255,0.1)]",
              "text-sm text-[#F5F5FA]",
              "shadow-lg shadow-black/30",
              "whitespace-nowrap max-w-xs",
              className
            )}
          >
            {content}
          </div>

          {/* Arrow */}
          {arrow && (
            <div
              className={cn(
                "absolute w-0 h-0",
                "border-[6px]",
                placements[placement].arrow
              )}
            />
          )}
        </div>
      )}
    </div>
  );
};

Tooltip.displayName = "Tooltip";

export default Tooltip;
