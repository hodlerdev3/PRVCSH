"use client";

/**
 * AmountInput Component
 *
 * Numeric input for token amounts with MAX button and validation.
 */

import React, {
  useState,
  useCallback,
  useId,
  forwardRef,
} from "react";

// ============================================
// Types
// ============================================

export interface AmountInputProps {
  /** Current value */
  value: string;
  /** Value change handler */
  onChange: (value: string) => void;
  /** Label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum allowed value (for MAX button) */
  maxValue?: string;
  /** Minimum allowed value */
  minValue?: string;
  /** Number of decimal places allowed */
  decimals?: number;
  /** Token symbol to display */
  tokenSymbol?: string;
  /** Show MAX button */
  showMaxButton?: boolean;
  /** Helper text below input */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state (e.g., fetching balance) */
  loading?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
  /** Input ID */
  id?: string;
  /** Auto-focus */
  autoFocus?: boolean;
}

// ============================================
// Size Classes
// ============================================

const sizeClasses = {
  sm: {
    container: "h-12",
    input: "text-lg px-3",
    button: "text-xs px-2 h-6",
    label: "text-xs",
  },
  md: {
    container: "h-14",
    input: "text-xl px-4",
    button: "text-xs px-2.5 h-7",
    label: "text-sm",
  },
  lg: {
    container: "h-16",
    input: "text-2xl px-4",
    button: "text-sm px-3 h-8",
    label: "text-sm",
  },
};

// ============================================
// Helpers
// ============================================

/**
 * Validates and formats amount input
 */
function sanitizeAmount(
  value: string,
  decimals: number
): string {
  // Remove non-numeric characters except decimal point
  let sanitized = value.replace(/[^0-9.]/g, "");

  // Handle multiple decimal points
  const parts = sanitized.split(".");
  if (parts.length > 2) {
    sanitized = (parts[0] ?? "") + "." + parts.slice(1).join("");
  }

  // Limit decimal places
  if (parts.length === 2 && (parts[1]?.length ?? 0) > decimals) {
    sanitized = (parts[0] ?? "") + "." + (parts[1]?.slice(0, decimals) ?? "");
  }

  // Remove leading zeros (but keep "0." for decimals)
  if (sanitized.length > 1 && sanitized[0] === "0" && sanitized[1] !== ".") {
    sanitized = sanitized.replace(/^0+/, "");
  }

  // Ensure empty becomes "0" when needed
  if (sanitized === "" || sanitized === ".") {
    return "";
  }

  return sanitized;
}

/**
 * Formats amount for display with thousand separators
 */
export function formatAmount(value: string, decimals: number = 9): string {
  if (!value || value === "") return "0";

  const num = parseFloat(value);
  if (isNaN(num)) return "0";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Parse amount string to number
 */
export function parseAmount(value: string): number {
  const cleaned = value.replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// ============================================
// AmountInput Component
// ============================================

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  (
    {
      value,
      onChange,
      label,
      placeholder = "0.00",
      maxValue,
      minValue = "0",
      decimals = 9,
      tokenSymbol,
      showMaxButton = true,
      helperText,
      error,
      disabled = false,
      loading = false,
      size = "md",
      className = "",
      id,
      autoFocus = false,
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const classes = sizeClasses[size];

    // Local state for input focus
    const [isFocused, setIsFocused] = useState(false);

    // Handle input change
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const sanitized = sanitizeAmount(rawValue, decimals);
        onChange(sanitized);
      },
      [decimals, onChange]
    );

    // Handle MAX button click
    const handleMaxClick = useCallback(() => {
      if (maxValue && !disabled && !loading) {
        onChange(maxValue);
      }
    }, [maxValue, disabled, loading, onChange]);

    // Determine if value exceeds max
    const exceedsMax =
      maxValue && value && parseFloat(value) > parseFloat(maxValue);

    // Determine if value is below min
    const belowMin =
      minValue &&
      value &&
      value !== "" &&
      parseFloat(value) < parseFloat(minValue);

    // Combined error state
    const hasError = !!error || exceedsMax || belowMin;
    const errorMessage =
      error ||
      (exceedsMax ? `Maximum is ${formatAmount(maxValue!, decimals)}` : null) ||
      (belowMin ? `Minimum is ${formatAmount(minValue, decimals)}` : null);

    return (
      <div className={`w-full ${className}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={`
              block mb-1.5 font-medium text-neutral-300
              ${classes.label}
            `}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div
          className={`
            relative flex items-center
            ${classes.container}
            rounded-xl
            bg-neutral-900 border
            transition-all duration-200
            ${
              isFocused
                ? "border-emerald-500/50 ring-2 ring-emerald-500/20"
                : hasError
                  ? "border-red-500/50"
                  : "border-white/10 hover:border-white/20"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            autoFocus={autoFocus}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled || loading}
            className={`
              flex-1 h-full
              ${classes.input}
              bg-transparent text-white font-mono
              placeholder:text-neutral-600
              focus:outline-none
              disabled:cursor-not-allowed
            `}
            aria-invalid={hasError || undefined}
            aria-describedby={
              errorMessage
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
          />

          {/* Right side: Token symbol + MAX button */}
          <div className="flex items-center gap-2 pr-3">
            {/* Token Symbol */}
            {tokenSymbol && (
              <span className="text-sm font-medium text-neutral-400">
                {tokenSymbol}
              </span>
            )}

            {/* MAX Button */}
            {showMaxButton && maxValue && (
              <button
                type="button"
                onClick={handleMaxClick}
                disabled={disabled || loading || !maxValue}
                className={`
                  ${classes.button}
                  rounded-md font-semibold uppercase
                  bg-emerald-500/10 text-emerald-400
                  hover:bg-emerald-500/20
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-150
                `}
              >
                MAX
              </button>
            )}

            {/* Loading indicator */}
            {loading && (
              <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
            )}
          </div>
        </div>

        {/* Helper Text / Error */}
        {(helperText || errorMessage) && (
          <p
            id={errorMessage ? `${inputId}-error` : `${inputId}-helper`}
            className={`
              mt-1.5 text-xs
              ${errorMessage ? "text-red-400" : "text-neutral-500"}
            `}
          >
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

AmountInput.displayName = "AmountInput";

export default AmountInput;
