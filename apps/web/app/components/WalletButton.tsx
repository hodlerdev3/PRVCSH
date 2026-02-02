"use client";

/**
 * WalletButton Component
 *
 * Connect/Disconnect button for Solana wallet integration.
 * Displays wallet address when connected.
 */

import { useCallback, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet, LogOut, Copy, Check, ChevronDown } from "lucide-react";

// ============================================
// Utility Functions
// ============================================

/**
 * Truncate wallet address for display
 * @example truncateAddress("AbCdEfGhIjKlMnOpQrStUvWxYz123456789", 4) => "AbCd...6789"
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// ============================================
// Types
// ============================================

export interface WalletButtonProps {
  /** Additional CSS classes */
  className?: string;
  /** Button size variant */
  size?: "sm" | "md" | "lg";
  /** Show full address on hover */
  showFullAddressOnHover?: boolean;
}

// ============================================
// Styles
// ============================================

const sizeStyles = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2.5",
};

const baseStyles = `
  inline-flex items-center justify-center
  font-medium rounded-lg
  transition-all duration-200
  focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
`;

const connectedStyles = `
  bg-gray-800/80 hover:bg-gray-700/80
  border border-gray-700 hover:border-gray-600
  text-gray-100
  backdrop-blur-sm
`;

const disconnectedStyles = `
  bg-gradient-to-r from-cyan-500 to-teal-500
  hover:from-cyan-400 hover:to-teal-400
  text-gray-900 font-semibold
  shadow-lg shadow-cyan-500/25
`;

// ============================================
// Component
// ============================================

export function WalletButton({
  className = "",
  size = "md",
  showFullAddressOnHover = true,
}: WalletButtonProps) {
  const { wallet, publicKey, disconnect, connecting, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Derive display address
  const address = useMemo(() => {
    if (!publicKey) return "";
    return publicKey.toBase58();
  }, [publicKey]);

  const displayAddress = useMemo(() => {
    return truncateAddress(address, 4);
  }, [address]);

  // Handle connect button click
  const handleConnect = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  // Handle copy address
  const handleCopy = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  }, [address]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      setDropdownOpen(false);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  }, [disconnect]);

  // Loading state
  if (connecting) {
    return (
      <button
        disabled
        className={`
          ${baseStyles}
          ${sizeStyles[size]}
          ${disconnectedStyles}
          opacity-75 cursor-wait
          ${className}
        `}
      >
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
        <span>Connecting...</span>
      </button>
    );
  }

  // Connected state
  if (connected && publicKey) {
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`
            ${baseStyles}
            ${sizeStyles[size]}
            ${connectedStyles}
            ${className}
          `}
          title={showFullAddressOnHover ? address : undefined}
        >
          {wallet?.adapter.icon && (
            <img
              src={wallet.adapter.icon}
              alt={wallet.adapter.name}
              className="h-5 w-5 rounded-sm"
            />
          )}
          <span>{displayAddress}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />

            {/* Menu */}
            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-gray-700 bg-gray-800/95 py-1 shadow-xl backdrop-blur-sm">
              {/* Copy Address */}
              <button
                onClick={handleCopy}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span>{copied ? "Copied!" : "Copy Address"}</span>
              </button>

              {/* Disconnect */}
              <button
                onClick={handleDisconnect}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700/50 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Disconnected state
  return (
    <button
      onClick={handleConnect}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${disconnectedStyles}
        ${className}
      `}
    >
      <Wallet className="h-5 w-5" />
      <span>Connect Wallet</span>
    </button>
  );
}

export default WalletButton;
