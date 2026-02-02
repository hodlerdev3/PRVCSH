"use client";

/**
 * Container Component
 *
 * Responsive container with max-width and padding variants.
 */

import React from "react";

// ============================================
// Types
// ============================================

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

export interface ContainerProps {
  /** Child content */
  children: React.ReactNode;
  /** Container size variant */
  size?: ContainerSize;
  /** Center content horizontally */
  centered?: boolean;
  /** Padding variant */
  padding?: "none" | "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
  /** HTML element to render */
  as?: "div" | "section" | "article" | "main";
}

// ============================================
// Size Classes
// ============================================

const sizeClasses: Record<ContainerSize, string> = {
  sm: "max-w-2xl",      // 672px
  md: "max-w-4xl",      // 896px
  lg: "max-w-5xl",      // 1024px
  xl: "max-w-6xl",      // 1152px
  "2xl": "max-w-7xl",   // 1280px
  full: "max-w-full",   // 100%
};

const paddingClasses = {
  none: "",
  sm: "px-4",
  md: "px-4 sm:px-6",
  lg: "px-4 sm:px-6 lg:px-8",
};

// ============================================
// Container Component
// ============================================

export function Container({
  children,
  size = "md",
  centered = true,
  padding = "md",
  className = "",
  as: Component = "div",
}: ContainerProps) {
  return (
    <Component
      className={`
        w-full
        ${sizeClasses[size]}
        ${centered ? "mx-auto" : ""}
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

// ============================================
// Page Container - Common page wrapper
// ============================================

export interface PageContainerProps {
  /** Child content */
  children: React.ReactNode;
  /** Page title (optional, for document title) */
  title?: string;
  /** Page description (for meta) */
  description?: string;
  /** Container size */
  size?: ContainerSize;
  /** Vertical padding */
  verticalPadding?: "sm" | "md" | "lg" | "xl";
  /** Additional className */
  className?: string;
}

const verticalPaddingClasses = {
  sm: "py-4",
  md: "py-8",
  lg: "py-12",
  xl: "py-16",
};

export function PageContainer({
  children,
  size = "md",
  verticalPadding = "md",
  className = "",
}: PageContainerProps) {
  return (
    <Container
      size={size}
      padding="lg"
      as="main"
      className={`
        ${verticalPaddingClasses[verticalPadding]}
        ${className}
      `}
    >
      {children}
    </Container>
  );
}

// ============================================
// Section Container - For page sections
// ============================================

export interface SectionContainerProps {
  /** Child content */
  children: React.ReactNode;
  /** Section ID for anchor links */
  id?: string;
  /** Container size */
  size?: ContainerSize;
  /** Background variant */
  background?: "transparent" | "subtle" | "elevated";
  /** Vertical padding */
  verticalPadding?: "sm" | "md" | "lg" | "xl";
  /** Additional className */
  className?: string;
}

const backgroundClasses = {
  transparent: "",
  subtle: "bg-white/[0.02]",
  elevated: "bg-white/5 border-y border-white/5",
};

export function SectionContainer({
  children,
  id,
  size = "lg",
  background = "transparent",
  verticalPadding = "lg",
  className = "",
}: SectionContainerProps) {
  return (
    <section
      id={id}
      className={`
        w-full
        ${backgroundClasses[background]}
        ${verticalPaddingClasses[verticalPadding]}
        ${className}
      `}
    >
      <Container size={size} padding="lg">
        {children}
      </Container>
    </section>
  );
}

export default Container;
