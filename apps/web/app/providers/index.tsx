"use client";

/**
 * App Providers
 *
 * Combines all context providers for the application.
 */

import { type ReactNode } from "react";
import { SolanaProvider, type SolanaProviderProps } from "./SolanaProvider";

export interface AppProvidersProps extends Omit<SolanaProviderProps, "children"> {
  children: ReactNode;
}

/**
 * Root providers wrapper
 * Wrap your app with this component to enable all context providers.
 */
export function AppProviders({ children, ...solanaProps }: AppProvidersProps) {
  return <SolanaProvider {...solanaProps}>{children}</SolanaProvider>;
}

export { SolanaProvider } from "./SolanaProvider";
export type { SolanaProviderProps } from "./SolanaProvider";

export default AppProviders;
