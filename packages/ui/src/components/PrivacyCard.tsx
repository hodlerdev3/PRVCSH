/**
 * @prvcsh/ui - PrivacyCard Component
 * Glass morphism card for PRVCSH UI
 * 
 * Features:
 * - Glass morphism background with blur
 * - Multiple variants: default, elevated, outlined, interactive
 * - Header and footer slots
 * - Collapsible accordion mode
 */

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

/* ====================================
 * Types
 * ==================================== */

export interface PrivacyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: "default" | "elevated" | "outlined" | "interactive";
  /** Padding size */
  padding?: "none" | "sm" | "md" | "lg";
  /** Enable hover effects */
  hoverable?: boolean;
  /** Border glow effect */
  glow?: boolean;
  /** Card as a link or button */
  as?: "div" | "article" | "section";
}

export interface PrivacyCardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Card title */
  title?: React.ReactNode;
  /** Card subtitle */
  subtitle?: React.ReactNode;
  /** Actions slot (buttons, icons, etc.) */
  actions?: React.ReactNode;
  /** Icon before title */
  icon?: React.ReactNode;
}

export interface PrivacyCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Divider line */
  divider?: boolean;
}

export interface CollapsibleCardProps extends Omit<PrivacyCardProps, "title"> {
  /** Card title for header */
  title: React.ReactNode;
  /** Icon before title */
  icon?: React.ReactNode;
  /** Default open state */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Open change handler */
  onOpenChange?: (open: boolean) => void;
}

/* ====================================
 * Variant Styles
 * ==================================== */

const variants = {
  default: [
    "bg-[rgba(26,26,46,0.8)]",
    "backdrop-blur-md",
    "border border-[rgba(255,255,255,0.05)]",
  ].join(" "),

  elevated: [
    "bg-[rgba(26,26,46,0.9)]",
    "backdrop-blur-lg",
    "border border-[rgba(255,255,255,0.1)]",
    "shadow-lg shadow-black/20",
  ].join(" "),

  outlined: [
    "bg-transparent",
    "border-2 border-[rgba(255,255,255,0.1)]",
  ].join(" "),

  interactive: [
    "bg-[rgba(26,26,46,0.8)]",
    "backdrop-blur-md",
    "border border-[rgba(255,255,255,0.05)]",
    "cursor-pointer",
    "transition-all duration-200",
    "hover:bg-[rgba(37,37,56,0.9)]",
    "hover:border-[rgba(255,255,255,0.15)]",
    "hover:shadow-lg hover:shadow-black/20",
    "active:scale-[0.99]",
  ].join(" "),
};

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

/* ====================================
 * PrivacyCard Component
 * ==================================== */

export const PrivacyCard = React.forwardRef<HTMLDivElement, PrivacyCardProps>(
  (
    {
      className,
      variant = "default",
      padding = "md",
      hoverable = false,
      glow = false,
      as: Component = "div",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          // Base
          "rounded-xl",
          "relative overflow-hidden",

          // Variant
          variants[variant],

          // Padding
          paddings[padding],

          // Hover effect
          hoverable && "transition-all duration-200 hover:border-[rgba(255,255,255,0.15)]",

          // Glow effect
          glow && "shadow-[0_0_30px_rgba(129,140,248,0.2)]",

          className
        )}
        {...props}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-[#818CF8]/5 via-transparent to-[#22D3EE]/5 pointer-events-none"
          aria-hidden="true"
        />
        {children}
      </Component>
    );
  }
);

PrivacyCard.displayName = "PrivacyCard";

/* ====================================
 * PrivacyCardHeader Component
 * ==================================== */

export const PrivacyCardHeader = React.forwardRef<HTMLDivElement, PrivacyCardHeaderProps>(
  ({ className, title, subtitle, actions, icon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-start justify-between gap-4 mb-4", className)}
        {...props}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          {icon && (
            <div className="flex-shrink-0 mt-0.5 text-[#818CF8]">{icon}</div>
          )}

          {/* Title/Subtitle */}
          <div className="flex flex-col gap-0.5">
            {title && (
              <h3 className="text-lg font-semibold text-[#F5F5FA]">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-[#6B6B80]">{subtitle}</p>
            )}
            {children}
          </div>
        </div>

        {/* Actions */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    );
  }
);

PrivacyCardHeader.displayName = "PrivacyCardHeader";

/* ====================================
 * PrivacyCardFooter Component
 * ==================================== */

export const PrivacyCardFooter = React.forwardRef<HTMLDivElement, PrivacyCardFooterProps>(
  ({ className, divider = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mt-4 pt-4 flex items-center justify-end gap-3",
          divider && "border-t border-[rgba(255,255,255,0.05)]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PrivacyCardFooter.displayName = "PrivacyCardFooter";

/* ====================================
 * CollapsibleCard Component
 * ==================================== */

export const CollapsibleCard = React.forwardRef<HTMLDivElement, CollapsibleCardProps>(
  (
    {
      className,
      title,
      icon,
      defaultOpen = false,
      open: controlledOpen,
      onOpenChange,
      children,
      ...props
    },
    ref
  ) => {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : internalOpen;

    const handleToggle = () => {
      if (!isControlled) {
        setInternalOpen(!isOpen);
      }
      onOpenChange?.(!isOpen);
    };

    return (
      <PrivacyCard ref={ref} className={className} padding="none" {...props}>
        {/* Header (clickable) */}
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            "w-full p-4 flex items-center justify-between gap-4",
            "text-left",
            "hover:bg-[rgba(255,255,255,0.02)]",
            "transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#818CF8]"
          )}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-3">
            {icon && <span className="text-[#818CF8]">{icon}</span>}
            <span className="font-semibold text-[#F5F5FA]">{title}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-[#6B6B80]",
              "transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Content (collapsible) */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="p-4 pt-0 border-t border-[rgba(255,255,255,0.05)]">
            {children}
          </div>
        </div>
      </PrivacyCard>
    );
  }
);

CollapsibleCard.displayName = "CollapsibleCard";

export default PrivacyCard;
