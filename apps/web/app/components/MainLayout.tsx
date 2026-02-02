"use client";

/**
 * MainLayout Component
 *
 * Main application layout combining Header, main content area, and Footer.
 */

import React, { useState, useCallback } from "react";
import { Header, HeaderProps } from "./Header";
import { Footer, FooterProps } from "./Footer";
import { SolanaNetwork } from "./NetworkSwitcher";

// ============================================
// Types
// ============================================

export interface MainLayoutProps {
  /** Child content */
  children: React.ReactNode;
  /** Header props override */
  headerProps?: Partial<HeaderProps>;
  /** Footer props override */
  footerProps?: Partial<FooterProps>;
  /** Hide header */
  hideHeader?: boolean;
  /** Hide footer */
  hideFooter?: boolean;
  /** Full width mode (no max-width constraint) */
  fullWidth?: boolean;
  /** Additional className for main content */
  className?: string;
  /** Background variant */
  background?: "default" | "gradient" | "mesh";
}

// ============================================
// Background Styles
// ============================================

const backgroundStyles = {
  default: "bg-neutral-950",
  gradient: `
    bg-neutral-950
    bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]
  `,
  mesh: `
    bg-neutral-950
    bg-[radial-gradient(at_0%_0%,rgba(16,185,129,0.1)_0px,transparent_50%),radial-gradient(at_100%_0%,rgba(139,92,246,0.1)_0px,transparent_50%),radial-gradient(at_100%_100%,rgba(16,185,129,0.05)_0px,transparent_50%)]
  `,
};

// ============================================
// Main Layout Component
// ============================================

export function MainLayout({
  children,
  headerProps = {},
  footerProps = {},
  hideHeader = false,
  hideFooter = false,
  fullWidth = false,
  className = "",
  background = "gradient",
}: MainLayoutProps) {
  // Network state (can be lifted to context if needed)
  const [network, setNetwork] = useState<SolanaNetwork>("devnet");

  const handleNetworkChange = useCallback((newNetwork: SolanaNetwork) => {
    setNetwork(newNetwork);
    // In a real app, this would update the connection provider
    console.log(`Network changed to: ${newNetwork}`);
  }, []);

  return (
    <div
      className={`
        min-h-screen flex flex-col
        ${backgroundStyles[background]}
        text-white
      `}
    >
      {/* Header */}
      {!hideHeader && (
        <Header
          network={network}
          onNetworkChange={handleNetworkChange}
          showNetworkSwitcher={true}
          showConnectionStatus={true}
          {...headerProps}
        />
      )}

      {/* Main Content */}
      <main
        className={`
          flex-1 w-full
          ${!fullWidth ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" : ""}
          py-8
          ${className}
        `}
      >
        {children}
      </main>

      {/* Footer */}
      {!hideFooter && <Footer {...footerProps} />}
    </div>
  );
}

export default MainLayout;
