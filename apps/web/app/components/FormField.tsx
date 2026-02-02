"use client";

/**
 * FormField Component
 *
 * Accessible form field wrapper with proper label-input association.
 * Ensures WCAG 2.1 compliance for form accessibility.
 *
 * WCAG Requirements:
 * - Labels or Instructions (3.3.2)
 * - Info and Relationships (1.3.1)
 * - Error Identification (3.3.1)
 */

import React, { useId, useMemo } from "react";
import { AlertCircle, Info, HelpCircle } from "lucide-react";

// ============================================
// Types
// ============================================

export interface FormFieldProps {
  /** Field label text */
  label: string;
  /** Field name/id base */
  name?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Show optional label for non-required fields */
  showOptional?: boolean;
  /** Hide label visually (still accessible) */
  hideLabel?: boolean;
  /** Tooltip/info for the label */
  tooltip?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Children (input element) */
  children:
    | React.ReactElement
    | ((props: FormFieldChildProps) => React.ReactElement);
  /** Additional className */
  className?: string;
}

export interface FormFieldChildProps {
  /** Input ID for label association */
  id: string;
  /** Name attribute */
  name: string;
  /** Aria attributes */
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

// ============================================
// FormField Component
// ============================================

export function FormField({
  label,
  name,
  helperText,
  error,
  required = false,
  disabled = false,
  showOptional = false,
  hideLabel = false,
  tooltip,
  size = "md",
  children,
  className = "",
}: FormFieldProps) {
  // Generate unique IDs
  const uniqueId = useId();
  const fieldName = name ?? label.toLowerCase().replace(/\s+/g, "-");
  const inputId = `${fieldName}-${uniqueId}`;
  const helperId = `${fieldName}-helper-${uniqueId}`;
  const errorId = `${fieldName}-error-${uniqueId}`;

  // Build aria-describedby
  const describedBy = useMemo(() => {
    const parts: string[] = [];
    if (helperText) parts.push(helperId);
    if (error) parts.push(errorId);
    return parts.length > 0 ? parts.join(" ") : undefined;
  }, [helperText, error, helperId, errorId]);

  // Child props for input
  const childProps: FormFieldChildProps = {
    id: inputId,
    name: fieldName,
    "aria-invalid": !!error,
    "aria-describedby": describedBy,
    "aria-required": required,
    disabled,
  };

  // Render child
  const renderChild = () => {
    if (typeof children === "function") {
      return children(childProps);
    }

    // Clone element with props
    return React.cloneElement(children, childProps);
  };

  // Size classes
  const labelSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const helperSizes = {
    sm: "text-xs",
    md: "text-xs",
    lg: "text-sm",
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className={`
            ${hideLabel ? "sr-only" : "block"}
            font-medium text-neutral-200
            ${labelSizes[size]}
            ${disabled ? "opacity-50" : ""}
          `.trim()}
        >
          {label}
          {required && (
            <span className="text-red-400 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only">(required)</span>}
        </label>

        {/* Optional / Required indicator */}
        <div className="flex items-center gap-2">
          {showOptional && !required && (
            <span className={`text-neutral-500 ${helperSizes[size]}`}>
              Optional
            </span>
          )}

          {/* Tooltip */}
          {tooltip && (
            <button
              type="button"
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
              aria-label={`More info about ${label}`}
              title={tooltip}
            >
              <HelpCircle size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="relative">{renderChild()}</div>

      {/* Helper Text */}
      {helperText && !error && (
        <p
          id={helperId}
          className={`flex items-start gap-1.5 text-neutral-500 ${helperSizes[size]}`}
        >
          <Info size={12} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
          {helperText}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p
          id={errorId}
          className={`flex items-start gap-1.5 text-red-400 ${helperSizes[size]}`}
          role="alert"
          aria-live="polite"
        >
          <AlertCircle
            size={12}
            className="flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================
// FormFieldset Component
// ============================================

export interface FormFieldsetProps {
  /** Fieldset legend */
  legend: string;
  /** Description text */
  description?: string;
  /** Hide legend visually */
  hideLegend?: boolean;
  /** Children */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * Group related form fields together
 */
export function FormFieldset({
  legend,
  description,
  hideLegend = false,
  children,
  className = "",
}: FormFieldsetProps) {
  return (
    <fieldset
      className={`border-0 p-0 m-0 ${className}`}
      role="group"
      aria-labelledby={`${legend.toLowerCase().replace(/\s+/g, "-")}-legend`}
    >
      <legend
        id={`${legend.toLowerCase().replace(/\s+/g, "-")}-legend`}
        className={`
          ${hideLegend ? "sr-only" : "block mb-4"}
          text-lg font-semibold text-white
        `.trim()}
      >
        {legend}
      </legend>

      {description && (
        <p className="text-sm text-neutral-400 mb-4">{description}</p>
      )}

      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

// ============================================
// FormErrorSummary Component
// ============================================

export interface FormError {
  field: string;
  message: string;
}

export interface FormErrorSummaryProps {
  /** List of errors */
  errors: FormError[];
  /** Title for the summary */
  title?: string;
  /** Additional className */
  className?: string;
}

/**
 * Summary of all form errors for screen readers
 */
export function FormErrorSummary({
  errors,
  title = "Please fix the following errors:",
  className = "",
}: FormErrorSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <div
      className={`
        p-4 rounded-xl
        bg-red-500/10 border border-red-500/20
        ${className}
      `}
      role="alert"
      aria-live="assertive"
      aria-labelledby="error-summary-title"
    >
      <h3
        id="error-summary-title"
        className="text-sm font-semibold text-red-400 mb-2"
      >
        {title}
      </h3>
      <ul className="list-disc list-inside space-y-1">
        {errors.map((error, index) => (
          <li key={index} className="text-sm text-red-300">
            <a
              href={`#${error.field}`}
              className="hover:underline focus:underline"
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// useFormField Hook
// ============================================

export interface UseFormFieldOptions {
  name: string;
  required?: boolean;
  validate?: (value: string) => string | undefined;
}

export interface UseFormFieldReturn {
  value: string;
  error: string | undefined;
  touched: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  reset: () => void;
  validate: () => boolean;
}

/**
 * Hook for managing form field state with validation
 */
export function useFormField(
  options: UseFormFieldOptions
): UseFormFieldReturn {
  const { required, validate } = options;

  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [touched, setTouched] = React.useState(false);

  const validateField = React.useCallback((): boolean => {
    let fieldError: string | undefined;

    if (required && !value.trim()) {
      fieldError = "This field is required";
    } else if (validate) {
      fieldError = validate(value);
    }

    setError(fieldError);
    return !fieldError;
  }, [value, required, validate]);

  const handleChange = React.useCallback((newValue: string) => {
    setValue(newValue);
    // Clear error on change
    setError(undefined);
  }, []);

  const handleBlur = React.useCallback(() => {
    setTouched(true);
    validateField();
  }, [validateField]);

  const reset = React.useCallback(() => {
    setValue("");
    setError(undefined);
    setTouched(false);
  }, []);

  return {
    value,
    error: touched ? error : undefined,
    touched,
    onChange: handleChange,
    onBlur: handleBlur,
    reset,
    validate: validateField,
  };
}

export default FormField;
