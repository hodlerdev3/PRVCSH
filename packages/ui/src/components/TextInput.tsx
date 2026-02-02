/**
 * @prvcsh/ui - TextInput Component
 * Input component for text entry with validation support
 * 
 * Features:
 * - Multiple variants: default, error, success
 * - Label and helper text support
 * - Icon addons (left/right)
 * - Prefix/suffix text
 * - Error message display
 * - Full accessibility support
 */

import * as React from "react";
import { AlertCircle, CheckCircle2, type LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

/* ====================================
 * Types
 * ==================================== */

export interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Input label */
  label?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message (shows error state) */
  error?: string;
  /** Success state */
  success?: boolean;
  /** Icon on the left side */
  leftIcon?: LucideIcon;
  /** Icon on the right side */
  rightIcon?: LucideIcon;
  /** Prefix text inside input */
  prefix?: string;
  /** Suffix text inside input */
  suffix?: string;
  /** Input size */
  inputSize?: "sm" | "md" | "lg";
  /** Full width input */
  fullWidth?: boolean;
  /** Container class */
  containerClassName?: string;
}

/* ====================================
 * Size Styles
 * ==================================== */

const sizes = {
  sm: {
    input: "h-8 text-sm px-3",
    icon: "h-3.5 w-3.5",
    label: "text-xs",
  },
  md: {
    input: "h-10 text-base px-4",
    icon: "h-4 w-4",
    label: "text-sm",
  },
  lg: {
    input: "h-12 text-lg px-5",
    icon: "h-5 w-5",
    label: "text-base",
  },
};

/* ====================================
 * Component
 * ==================================== */

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      className,
      containerClassName,
      label,
      helperText,
      error,
      success,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      prefix,
      suffix,
      inputSize = "md",
      fullWidth = false,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    const hasError = Boolean(error);
    const hasSuccess = success && !hasError;

    // Determine which status icon to show
    let StatusIcon: LucideIcon | null = null;
    if (hasError) StatusIcon = AlertCircle;
    else if (hasSuccess) StatusIcon = CheckCircle2;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full", containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              sizes[inputSize].label,
              "font-medium text-[#A1A1B5]",
              disabled && "opacity-50"
            )}
          >
            {label}
          </label>
        )}

        {/* Input container */}
        <div className="relative">
          {/* Prefix */}
          {prefix && (
            <span
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2",
                "text-[#6B6B80]",
                sizes[inputSize].label
              )}
            >
              {prefix}
            </span>
          )}

          {/* Left icon */}
          {LeftIcon && (
            <LeftIcon
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2",
                "text-[#6B6B80]",
                sizes[inputSize].icon
              )}
              aria-hidden="true"
            />
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Base styles
              "w-full rounded-lg",
              "bg-[rgba(0,0,0,0.3)] backdrop-blur-sm",
              "text-[#F5F5FA] placeholder-[#6B6B80]",
              "transition-all duration-200",
              "focus:outline-none",

              // Border
              "border",
              hasError
                ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20"
                : hasSuccess
                  ? "border-[#10B981] focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20"
                  : "border-[rgba(255,255,255,0.1)] focus:border-[#818CF8] focus:ring-2 focus:ring-[#818CF8]/20",

              // Size
              sizes[inputSize].input,

              // Padding adjustments for icons
              LeftIcon && "pl-10",
              prefix && "pl-10",
              (RightIcon || StatusIcon) && "pr-10",
              suffix && "pr-10",

              // Disabled
              disabled && "opacity-50 cursor-not-allowed bg-[#141420]",

              className
            )}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
            {...props}
          />

          {/* Suffix */}
          {suffix && !StatusIcon && (
            <span
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2",
                "text-[#6B6B80]",
                sizes[inputSize].label
              )}
            >
              {suffix}
            </span>
          )}

          {/* Right icon or status icon */}
          {(RightIcon || StatusIcon) && (
            <span
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2",
                sizes[inputSize].icon
              )}
              aria-hidden="true"
            >
              {StatusIcon ? (
                <StatusIcon
                  className={cn(
                    sizes[inputSize].icon,
                    hasError ? "text-[#EF4444]" : "text-[#10B981]"
                  )}
                />
              ) : RightIcon ? (
                <RightIcon className={cn(sizes[inputSize].icon, "text-[#6B6B80]")} />
              ) : null}
            </span>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <p id={errorId} className="text-xs text-[#EF4444] flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}

        {/* Helper text */}
        {!hasError && helperText && (
          <p id={helperId} className="text-xs text-[#6B6B80]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

export default TextInput;
