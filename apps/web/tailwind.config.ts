import type { Config } from "tailwindcss";
import { tailwindPreset } from "@prvcsh/config/tailwind";

const config: Config = {
  presets: [tailwindPreset],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // App-specific overrides can go here
    },
  },
  plugins: [],
  darkMode: "class",
};

export default config;
