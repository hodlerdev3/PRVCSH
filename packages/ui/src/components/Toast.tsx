/**
 * @prvcsh/ui - Toast/Notification Component
 * Toast notifications with auto-dismiss
 * 
 * Features:
 * - Multiple variants: success, error, warning, info
 * - Position options (top-right default)
 * - Auto-dismiss with configurable duration
 * - Stack multiple toasts
 * - Progress bar for dismiss timing
 */

import * as React from "react";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "../lib/utils";

/* ====================================
 * Types
 * ==================================== */

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastProps {
  /** Toast ID */
  id: string;
  /** Toast variant */
  variant?: ToastVariant;
  /** Toast title */
  title: string;
  /** Toast description */
  description?: string;
  /** Auto-dismiss duration in ms (0 to disable) */
  duration?: number;
  /** Close handler */
  onClose: (id: string) => void;
  /** Show close button */
  closable?: boolean;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContainerProps {
  /** Toast position */
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
  /** Children (Toast components) */
  children: React.ReactNode;
}

/* ====================================
 * Variant Styles
 * ==================================== */

const variantStyles = {
  success: {
    bg: "bg-[#10B981]/10 border-[#10B981]/30",
    icon: CheckCircle2,
    iconColor: "text-[#10B981]",
    progress: "bg-[#10B981]",
  },
  error: {
    bg: "bg-[#EF4444]/10 border-[#EF4444]/30",
    icon: AlertCircle,
    iconColor: "text-[#EF4444]",
    progress: "bg-[#EF4444]",
  },
  warning: {
    bg: "bg-[#F59E0B]/10 border-[#F59E0B]/30",
    icon: AlertTriangle,
    iconColor: "text-[#F59E0B]",
    progress: "bg-[#F59E0B]",
  },
  info: {
    bg: "bg-[#3B82F6]/10 border-[#3B82F6]/30",
    icon: Info,
    iconColor: "text-[#3B82F6]",
    progress: "bg-[#3B82F6]",
  },
};

const positions = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
};

/* ====================================
 * Toast Component
 * ==================================== */

export const Toast: React.FC<ToastProps> = ({
  id,
  variant = "info",
  title,
  description,
  duration = 5000,
  onClose,
  closable = true,
  action,
}) => {
  const [progress, setProgress] = React.useState(100);
  const [isPaused, setIsPaused] = React.useState(false);
  const startTimeRef = React.useRef<number>(Date.now());
  const remainingTimeRef = React.useRef<number>(duration);

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  // Auto-dismiss timer with pause support
  React.useEffect(() => {
    if (duration === 0) return;

    let animationFrame: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    const updateProgress = () => {
      if (isPaused) return;

      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, remainingTimeRef.current - elapsed);
      const progressPercent = (remaining / duration) * 100;

      setProgress(progressPercent);

      if (progressPercent > 0) {
        animationFrame = requestAnimationFrame(updateProgress);
      }
    };

    if (!isPaused) {
      startTimeRef.current = Date.now();
      animationFrame = requestAnimationFrame(updateProgress);

      timeoutId = setTimeout(() => {
        onClose(id);
      }, remainingTimeRef.current);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(timeoutId);
    };
  }, [id, duration, isPaused, onClose]);

  // Handle pause on hover
  const handleMouseEnter = () => {
    if (duration === 0) return;
    remainingTimeRef.current = (progress / 100) * duration;
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    if (duration === 0) return;
    startTimeRef.current = Date.now();
    setIsPaused(false);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative w-full max-w-sm overflow-hidden",
        "rounded-lg border",
        "backdrop-blur-md",
        "shadow-lg shadow-black/20",
        "animate-in slide-in-from-right-full fade-in duration-300",
        styles.bg
      )}
    >
      <div className="p-4 flex gap-3">
        {/* Icon */}
        <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", styles.iconColor)} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#F5F5FA]">{title}</p>
          {description && (
            <p className="mt-1 text-sm text-[#A1A1B5]">{description}</p>
          )}
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="mt-2 text-sm font-medium text-[#818CF8] hover:text-[#A78BFA] transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        {closable && (
          <button
            type="button"
            onClick={() => onClose(id)}
            className={cn(
              "flex-shrink-0 p-1 rounded",
              "text-[#6B6B80] hover:text-[#A1A1B5]",
              "hover:bg-[rgba(255,255,255,0.05)]",
              "transition-colors duration-150"
            )}
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="h-1 bg-[rgba(255,255,255,0.05)]">
          <div
            className={cn("h-full transition-all duration-100", styles.progress)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

Toast.displayName = "Toast";

/* ====================================
 * ToastContainer Component
 * ==================================== */

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = "top-right",
  children,
}) => {
  return (
    <div
      className={cn(
        "fixed z-[600] flex flex-col gap-2 pointer-events-none",
        positions[position]
      )}
      aria-label="Notifications"
    >
      <div className="flex flex-col gap-2 pointer-events-auto">
        {children}
      </div>
    </div>
  );
};

ToastContainer.displayName = "ToastContainer";

export default Toast;
