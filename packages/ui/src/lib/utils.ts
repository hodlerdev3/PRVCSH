/**
 * @prvcsh/ui - Utility Functions
 * CSS class name utilities for component composition
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with conflict resolution
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Create variant-based class generator
 * Useful for building component variants
 */
export function createVariants<T extends Record<string, Record<string, string>>>(
  base: string,
  variants: T
) {
  return function getVariantClasses(
    selectedVariants: Partial<{ [K in keyof T]: keyof T[K] }>
  ): string {
    const variantClasses = Object.entries(selectedVariants)
      .map(([key, value]) => {
        const variantGroup = variants[key];
        if (variantGroup && value) {
          return variantGroup[value as string];
        }
        return "";
      })
      .filter(Boolean);

    return cn(base, ...variantClasses);
  };
}
