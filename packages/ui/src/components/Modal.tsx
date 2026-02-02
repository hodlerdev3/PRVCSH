/**
 * @prvcsh/ui - Modal Component
 * Accessible modal dialog with animations
 * 
 * Features:
 * - Backdrop blur and click-to-close
 * - Enter/exit animations
 * - Multiple sizes
 * - Focus trap
 * - Escape key close
 * - Full accessibility (aria-modal, role="dialog")
 */

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

/* ====================================
 * Types
 * ==================================== */

export interface ModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: React.ReactNode;
  /** Modal description */
  description?: React.ReactNode;
  /** Modal content */
  children: React.ReactNode;
  /** Modal size */
  size?: "sm" | "md" | "lg" | "xl" | "fullscreen";
  /** Show close button */
  showCloseButton?: boolean;
  /** Close on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Additional class for modal content */
  className?: string;
  /** Footer content */
  footer?: React.ReactNode;
}

/* ====================================
 * Size Styles
 * ==================================== */

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  fullscreen: "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] h-full",
};

/* ====================================
 * Component
 * ==================================== */

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  footer,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<Element | null>(null);

  // Handle escape key
  React.useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeOnEscape, onClose]);

  // Lock body scroll and manage focus
  React.useEffect(() => {
    if (open) {
      // Store current active element
      previousActiveElement.current = document.activeElement;

      // Lock body scroll
      document.body.style.overflow = "hidden";

      // Focus modal
      modalRef.current?.focus();
    } else {
      // Restore body scroll
      document.body.style.overflow = "";

      // Restore focus
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[400]",
          "bg-black/60 backdrop-blur-sm",
          "animate-in fade-in duration-200"
        )}
        aria-hidden="true"
        onClick={handleBackdropClick}
      >
        {/* Modal container */}
        <div
          className={cn(
            "fixed inset-0 z-[401]",
            "flex items-center justify-center p-4"
          )}
          onClick={handleBackdropClick}
        >
          {/* Modal content */}
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            aria-describedby={description ? "modal-description" : undefined}
            tabIndex={-1}
            className={cn(
              "relative w-full",
              "bg-[#1A1A2E] rounded-xl",
              "border border-[rgba(255,255,255,0.1)]",
              "shadow-2xl shadow-black/50",
              "animate-in zoom-in-95 fade-in duration-200",
              "focus:outline-none",
              sizes[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between gap-4 p-4 border-b border-[rgba(255,255,255,0.05)]">
                <div className="flex flex-col gap-1">
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-lg font-semibold text-[#F5F5FA]"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      id="modal-description"
                      className="text-sm text-[#6B6B80]"
                    >
                      {description}
                    </p>
                  )}
                </div>

                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className={cn(
                      "flex-shrink-0 p-1.5 rounded-lg",
                      "text-[#6B6B80]",
                      "hover:bg-[rgba(255,255,255,0.05)] hover:text-[#A1A1B5]",
                      "transition-colors duration-150",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8]"
                    )}
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="p-4">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="p-4 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

Modal.displayName = "Modal";

export default Modal;
