/**
 * Cipher Noir Design System - Design Tokens
 *
 * These tokens define the visual language for the PRVCSH ecosystem.
 */

// ============================================
// Color System
// ============================================

export const cipherNoirColors = {
  // Surface Colors
  surface: {
    base: "#0D0D0D",
    elevated: "#141414",
    overlay: "#1A1A1A",
    sunken: "#080808",
  },

  // Background with opacity variants
  background: {
    primary: "rgba(255, 255, 255, 0.05)",
    secondary: "rgba(255, 255, 255, 0.03)",
    tertiary: "rgba(255, 255, 255, 0.02)",
    hover: "rgba(255, 255, 255, 0.08)",
    active: "rgba(255, 255, 255, 0.10)",
  },

  // Border colors
  border: {
    default: "rgba(255, 255, 255, 0.10)",
    subtle: "rgba(255, 255, 255, 0.05)",
    strong: "rgba(255, 255, 255, 0.20)",
    focus: "#00F5D4",
  },

  // Text colors
  text: {
    primary: "#FFFFFF",
    secondary: "rgba(255, 255, 255, 0.70)",
    tertiary: "rgba(255, 255, 255, 0.50)",
    disabled: "rgba(255, 255, 255, 0.30)",
    inverse: "#0D0D0D",
  },

  // Accent Colors - Cipher Teal (Primary)
  cipher: {
    50: "#E6FFFB",
    100: "#B3FFF5",
    200: "#80FFEF",
    300: "#4DFFE9",
    400: "#26FFE3",
    500: "#00F5D4", // Primary
    600: "#00D4B8",
    700: "#00A892",
    800: "#007D6C",
    900: "#005246",
    950: "#002923",
  },

  // Proof Green (Success/Verified)
  proof: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#34D399",
    500: "#10B981", // Primary
    600: "#059669",
    700: "#047857",
    800: "#065F46",
    900: "#064E3B",
    950: "#022C22",
  },

  // Semantic Colors
  error: {
    light: "#FEE2E2",
    default: "#F43F5E",
    dark: "#BE123C",
  },

  warning: {
    light: "#FEF3C7",
    default: "#F59E0B",
    dark: "#B45309",
  },

  info: {
    light: "#DBEAFE",
    default: "#3B82F6",
    dark: "#1D4ED8",
  },

  // Token-specific colors
  token: {
    sol: "#9945FF",
    usdc: "#2775CA",
    usdt: "#26A17B",
    zec: "#F4B728",
    ore: "#CD7F32",
    store: "#00D4AA",
  },
};

// ============================================
// Typography System
// ============================================

export const cipherNoirTypography = {
  fontFamily: {
    sans: ["Geist Sans", "system-ui", "sans-serif"],
    mono: ["Geist Mono", "Menlo", "monospace"],
    display: ["Outfit", "system-ui", "sans-serif"],
    accessibility: ["Atkinson Hyperlegible", "system-ui", "sans-serif"],
  },

  fontSize: {
    xs: ["0.75rem", "1rem"] as [string, string],
    sm: ["0.875rem", "1.25rem"] as [string, string],
    base: ["1rem", "1.5rem"] as [string, string],
    lg: ["1.125rem", "1.75rem"] as [string, string],
    xl: ["1.25rem", "1.75rem"] as [string, string],
    "2xl": ["1.5rem", "2rem"] as [string, string],
    "3xl": ["1.875rem", "2.25rem"] as [string, string],
    "4xl": ["2.25rem", "2.5rem"] as [string, string],
    "5xl": ["3rem", "1.15"] as [string, string],
    "6xl": ["3.75rem", "1.1"] as [string, string],
  },

  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
};

// ============================================
// Spacing System (4px base)
// ============================================

export const cipherNoirSpacing = {
  0: "0",
  px: "1px",
  0.5: "0.125rem", // 2px
  1: "0.25rem", // 4px
  1.5: "0.375rem", // 6px
  2: "0.5rem", // 8px
  2.5: "0.625rem", // 10px
  3: "0.75rem", // 12px
  3.5: "0.875rem", // 14px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  7: "1.75rem", // 28px
  8: "2rem", // 32px
  9: "2.25rem", // 36px
  10: "2.5rem", // 40px
  11: "2.75rem", // 44px
  12: "3rem", // 48px
  14: "3.5rem", // 56px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  28: "7rem", // 112px
  32: "8rem", // 128px
};

// ============================================
// Border Radius
// ============================================

export const cipherNoirBorderRadius = {
  none: "0",
  sm: "0.25rem", // 4px
  DEFAULT: "0.5rem", // 8px
  md: "0.5rem", // 8px
  lg: "0.75rem", // 12px
  xl: "1rem", // 16px
  "2xl": "1.5rem", // 24px
  "3xl": "2rem", // 32px
  full: "9999px",
};

// ============================================
// Shadows
// ============================================

export const cipherNoirShadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.5)",
  DEFAULT: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.75)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.5)",
  glow: "0 0 20px rgba(0, 245, 212, 0.3)",
  "glow-lg": "0 0 40px rgba(0, 245, 212, 0.4)",
  none: "none",
};

// ============================================
// Z-Index Scale
// ============================================

export const cipherNoirZIndex = {
  dropdown: "100",
  sticky: "200",
  fixed: "300",
  modalBackdrop: "400",
  modal: "500",
  popover: "600",
  tooltip: "700",
  toast: "800",
};

// ============================================
// Animation & Transitions
// ============================================

export const cipherNoirAnimation = {
  // Durations
  duration: {
    instant: "100ms",
    quick: "200ms",
    moderate: "300ms",
    slow: "500ms",
    slower: "700ms",
  },

  // Timing functions
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    outExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
    inOutQuart: "cubic-bezier(0.76, 0, 0.24, 1)",
  },

  // Keyframe animations
  keyframes: {
    shimmer: {
      "0%": { backgroundPosition: "-200% 0" },
      "100%": { backgroundPosition: "200% 0" },
    },
    fadeIn: {
      from: { opacity: "0" },
      to: { opacity: "1" },
    },
    fadeOut: {
      from: { opacity: "1" },
      to: { opacity: "0" },
    },
    slideInUp: {
      from: { transform: "translateY(10px)", opacity: "0" },
      to: { transform: "translateY(0)", opacity: "1" },
    },
    slideInDown: {
      from: { transform: "translateY(-10px)", opacity: "0" },
      to: { transform: "translateY(0)", opacity: "1" },
    },
    scaleIn: {
      from: { transform: "scale(0.95)", opacity: "0" },
      to: { transform: "scale(1)", opacity: "1" },
    },
    pulse: {
      "0%, 100%": { opacity: "1" },
      "50%": { opacity: "0.5" },
    },
    spin: {
      from: { transform: "rotate(0deg)" },
      to: { transform: "rotate(360deg)" },
    },
    zkProof: {
      "0%": { strokeDashoffset: "100" },
      "100%": { strokeDashoffset: "0" },
    },
  },

  // Animation utilities
  animation: {
    shimmer: "shimmer 2s infinite linear",
    fadeIn: "fadeIn 0.2s ease-out",
    fadeOut: "fadeOut 0.2s ease-out",
    slideInUp: "slideInUp 0.3s ease-out",
    slideInDown: "slideInDown 0.3s ease-out",
    scaleIn: "scaleIn 0.2s ease-out",
    pulse: "pulse 2s infinite",
    spin: "spin 1s linear infinite",
    zkProof: "zkProof 2s ease-out forwards",
  },
};
