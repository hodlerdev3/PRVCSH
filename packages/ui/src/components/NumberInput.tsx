/**
 * @prvcsh/ui - NumberInput Component
 * Numeric input with increment/decrement controls
 * 
 * Features:
 * - Increment/decrement buttons
 * - Min/max constraints
 * - Step value support
 * - Decimal precision
 * - Keyboard controls (up/down arrows)
 */

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "../lib/utils";

/* ====================================
 * Types
 * ==================================== */

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type" | "size"> {
  /** Current value */
  value?: number;
  /** Change handler */
  onChange?: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Decimal precision */
  precision?: number;
  /** Input label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Input size */
  inputSize?: "sm" | "md" | "lg";
  /** Hide increment/decrement buttons */
  hideControls?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Container class */
  containerClassName?: string;
}

/* ====================================
 * Size Styles
 * ==================================== */

const sizes = {
  sm: {
    input: "h-8 text-sm",
    button: "h-8 w-8",
    icon: "h-3 w-3",
  },
  md: {
    input: "h-10 text-base",
    button: "h-10 w-10",
    icon: "h-4 w-4",
  },
  lg: {
    input: "h-12 text-lg",
    button: "h-12 w-12",
    icon: "h-5 w-5",
  },
};

/* ====================================
 * Component
 * ==================================== */

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      containerClassName,
      value = 0,
      onChange,
      min,
      max,
      step = 1,
      precision = 0,
      label,
      helperText,
      error,
      inputSize = "md",
      hideControls = false,
      fullWidth = false,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const hasError = Boolean(error);

    // Clamp value to min/max
    const clamp = (val: number): number => {
      let clamped = val;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      return Number(clamped.toFixed(precision));
    };

    // Handle increment
    const handleIncrement = () => {
      if (disabled) return;
      const newValue = clamp(value + step);
      onChange?.(newValue);
    };

    // Handle decrement
    const handleDecrement = () => {
      if (disabled) return;
      const newValue = clamp(value - step);
      onChange?.(newValue);
    };

    // Handle direct input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (inputValue === "" || inputValue === "-") {
        onChange?.(0);
        return;
      }
      const parsed = parseFloat(inputValue);
      if (!isNaN(parsed)) {
        onChange?.(clamp(parsed));
      }
    };

    // Handle keyboard
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleDecrement();
      }
    };

    const isMinReached = min !== undefined && value <= min;
    const isMaxReached = max !== undefined && value >= max;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full", containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium text-[#A1A1B5]",
              disabled && "opacity-50"
            )}
          >
            {label}
          </label>
        )}

        {/* Input group */}
        <div className={cn("flex", fullWidth && "w-full")}>
          {/* Decrement button */}
          {!hideControls && (
            <button
              type="button"
              onClick={handleDecrement}
              disabled={disabled || isMinReached}
              className={cn(
                "flex items-center justify-center",
                "bg-[#1A1A2E] border border-[rgba(255,255,255,0.1)]",
                "text-[#A1A1B5]",
                "rounded-l-lg border-r-0",
                "transition-all duration-150",
                "hover:bg-[#252538] hover:text-[#F5F5FA]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                sizes[inputSize].button
              )}
              aria-label="Decrease value"
            >
              <Minus className={sizes[inputSize].icon} />
            </button>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex-1 text-center",
              "bg-[rgba(0,0,0,0.3)] backdrop-blur-sm",
              "text-[#F5F5FA] font-medium",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-inset",

              // Border
              "border-y",
              hasError
                ? "border-[#EF4444] focus:ring-[#EF4444]/20"
                : "border-[rgba(255,255,255,0.1)] focus:ring-[#818CF8]/20",

              // Rounded corners when controls are hidden
              hideControls && "rounded-lg border-x",

              // Size
              sizes[inputSize].input,

              // Disabled
              disabled && "opacity-50 cursor-not-allowed bg-[#141420]",

              className
            )}
            disabled={disabled}
            aria-invalid={hasError}
            {...props}
          />

          {/* Increment button */}
          {!hideControls && (
            <button
              type="button"
              onClick={handleIncrement}
              disabled={disabled || isMaxReached}
              className={cn(
                "flex items-center justify-center",
                "bg-[#1A1A2E] border border-[rgba(255,255,255,0.1)]",
                "text-[#A1A1B5]",
                "rounded-r-lg border-l-0",
                "transition-all duration-150",
                "hover:bg-[#252538] hover:text-[#F5F5FA]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                sizes[inputSize].button
              )}
              aria-label="Increase value"
            >
              <Plus className={sizes[inputSize].icon} />
            </button>
          )}
        </div>

        {/* Error */}
        {hasError && (
          <p className="text-xs text-[#EF4444]">{error}</p>
        )}

        {/* Helper */}
        {!hasError && helperText && (
          <p className="text-xs text-[#6B6B80]">{helperText}</p>
        )}
      </div>
    );
  }
);

NumberInput.displayName = "NumberInput";

export default NumberInput;
