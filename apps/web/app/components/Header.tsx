"use client";

/**
 * Header Component
 *
 * Main navigation header with logo, nav links, and wallet button.
 * Responsive design with mobile hamburger menu.
 */

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { Menu, X, Shield, ExternalLink } from "lucide-react";
import { WalletButton } from "./WalletButton";
import { NetworkSwitcher, SolanaNetwork } from "./NetworkSwitcher";
import { ConnectionStatus } from "./ConnectionStatus";

// ============================================
// Types
// ============================================

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
  badge?: string;
}

export interface HeaderProps {
  /** Navigation items */
  navItems?: NavItem[];
  /** Current network */
  network?: SolanaNetwork;
  /** Network change handler */
  onNetworkChange?: (network: SolanaNetwork) => void;
  /** Show network switcher */
  showNetworkSwitcher?: boolean;
  /** Show connection status */
  showConnectionStatus?: boolean;
  /** Logo click handler */
  onLogoClick?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================
// Default Navigation
// ============================================

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Mixer", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Docs", href: "https://docs.privacycash.io", external: true },
];

// ============================================
// Logo Component
// ============================================

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="flex items-center gap-2 group"
      aria-label="PRVCSH Home"
    >
      {/* Shield Icon with gradient */}
      <div className="relative">
        <Shield
          size={32}
          className="text-emerald-400 group-hover:text-emerald-300 transition-colors"
          strokeWidth={2}
        />
        <div className="absolute inset-0 bg-emerald-400/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Logo Text */}
      <div className="flex flex-col">
        <span className="text-lg font-bold text-white tracking-tight leading-none">
          Privacy<span className="text-emerald-400">Cash</span>
        </span>
        <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
          Solana Privacy
        </span>
      </div>
    </Link>
  );
}

// ============================================
// Desktop Navigation
// ============================================

function DesktopNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="hidden md:flex items-center gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          target={item.external ? "_blank" : undefined}
          rel={item.external ? "noopener noreferrer" : undefined}
          className="
            px-3 py-2 rounded-lg
            text-sm font-medium text-neutral-400
            hover:text-white hover:bg-white/5
            transition-colors duration-150
            flex items-center gap-1.5
          "
        >
          {item.label}
          {item.badge && (
            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded">
              {item.badge}
            </span>
          )}
          {item.external && (
            <ExternalLink size={12} className="text-neutral-500" />
          )}
        </Link>
      ))}
    </nav>
  );
}

// ============================================
// Mobile Navigation
// ============================================

function MobileNav({
  items,
  isOpen,
  onClose,
}: {
  items: NavItem[];
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out menu */}
      <div
        className="
          fixed top-0 right-0 h-full w-64
          bg-neutral-900 border-l border-white/10
          z-50 md:hidden
          animate-in slide-in-from-right duration-300
        "
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Close button */}
        <div className="flex justify-end p-4">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col p-4 gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              onClick={onClose}
              className="
                px-4 py-3 rounded-lg
                text-base font-medium text-neutral-300
                hover:text-white hover:bg-white/5
                transition-colors duration-150
                flex items-center justify-between
              "
            >
              <span className="flex items-center gap-2">
                {item.label}
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded">
                    {item.badge}
                  </span>
                )}
              </span>
              {item.external && (
                <ExternalLink size={14} className="text-neutral-500" />
              )}
            </Link>
          ))}
        </nav>

        {/* Mobile wallet button */}
        <div className="p-4 border-t border-white/10">
          <WalletButton size="md" className="w-full justify-center" />
        </div>
      </div>
    </>
  );
}

// ============================================
// Main Header Component
// ============================================

export function Header({
  navItems = DEFAULT_NAV_ITEMS,
  network = "devnet",
  onNetworkChange,
  showNetworkSwitcher = true,
  showConnectionStatus = false,
  onLogoClick,
  className = "",
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleNetworkChange = useCallback(
    (newNetwork: SolanaNetwork) => {
      onNetworkChange?.(newNetwork);
    },
    [onNetworkChange]
  );

  return (
    <header
      className={`
        sticky top-0 z-30
        w-full h-16
        bg-neutral-950/80 backdrop-blur-xl
        border-b border-white/5
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            <Logo onClick={onLogoClick} />
            <DesktopNav items={navItems} />
          </div>

          {/* Right: Status + Network + Wallet + Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Connection Status (Desktop only) */}
            {showConnectionStatus && (
              <div className="hidden lg:block">
                <ConnectionStatus size="sm" minimal />
              </div>
            )}

            {/* Network Switcher (Desktop only) */}
            {showNetworkSwitcher && onNetworkChange && (
              <div className="hidden md:block">
                <NetworkSwitcher
                  network={network}
                  onNetworkChange={handleNetworkChange}
                  size="sm"
                />
              </div>
            )}

            {/* Wallet Button (Desktop) */}
            <div className="hidden md:block">
              <WalletButton size="md" />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="
                md:hidden p-2 rounded-lg
                text-neutral-400 hover:text-white hover:bg-white/5
                transition-colors duration-150
              "
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        items={navItems}
        isOpen={mobileMenuOpen}
        onClose={closeMobileMenu}
      />
    </header>
  );
}

export default Header;
