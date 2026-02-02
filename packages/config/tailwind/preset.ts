/**
 * PRVCSH - Tailwind CSS Preset
 * Cipher Noir Design System
 *
 * This preset can be used in tailwind.config.ts:
 * ```ts
 * import { tailwindPreset } from '@prvcsh/config/tailwind';
 *
 * export default {
 *   presets: [tailwindPreset],
 *   // ... your config
 * }
 * ```
 */

import type { Config } from "tailwindcss";
import {
  cipherNoirColors,
  cipherNoirTypography,
  cipherNoirSpacing,
  cipherNoirBorderRadius,
  cipherNoirShadows,
  cipherNoirZIndex,
  cipherNoirAnimation,
} from "./tokens";

const preset: Partial<Config> = {
  darkMode: "class",
  theme: {
    extend: {
      // Colors
      colors: {
        // Surface colors
        surface: cipherNoirColors.surface,

        // Background variants
        bg: cipherNoirColors.background,

        // Border colors
        border: cipherNoirColors.border,

        // Text colors
        text: cipherNoirColors.text,

        // Cipher (Primary accent)
        cipher: cipherNoirColors.cipher,

        // Proof (Success/Verified)
        proof: cipherNoirColors.proof,

        // Semantic
        error: cipherNoirColors.error,
        warning: cipherNoirColors.warning,
        info: cipherNoirColors.info,

        // Token colors
        token: cipherNoirColors.token,
      },

      // Typography
      fontFamily: cipherNoirTypography.fontFamily,
      fontSize: cipherNoirTypography.fontSize,
      fontWeight: cipherNoirTypography.fontWeight,
      letterSpacing: cipherNoirTypography.letterSpacing,

      // Spacing
      spacing: cipherNoirSpacing,

      // Border radius
      borderRadius: cipherNoirBorderRadius,

      // Shadows
      boxShadow: cipherNoirShadows,

      // Z-index
      zIndex: cipherNoirZIndex,

      // Transitions
      transitionDuration: cipherNoirAnimation.duration,
      transitionTimingFunction: cipherNoirAnimation.easing,

      // Keyframes
      keyframes: cipherNoirAnimation.keyframes,

      // Animations
      animation: cipherNoirAnimation.animation,

      // Backdrop blur
      backdropBlur: {
        xs: "2px",
      },

      // Container
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "2rem",
          lg: "4rem",
          xl: "5rem",
          "2xl": "6rem",
        },
      },
    },
  },
  plugins: [],
};

export default preset;
