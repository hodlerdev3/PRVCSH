"use client";

/**
 * NetworkSwitcher Component
 *
 * Dropdown to switch between Solana networks (Devnet/Mainnet).
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check, Globe } from "lucide-react";

// ============================================
// Types
// ============================================

export type SolanaNetwork = "mainnet-beta" | "devnet" | "testnet" | "localnet";

export interface NetworkConfig {
  id: SolanaNetwork;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
}

export interface NetworkSwitcherProps {
  /** Currently selected network */
  network: SolanaNetwork;
  /** Callback when network changes */
  onNetworkChange: (network: SolanaNetwork) => void;
  /** Available networks */
  networks?: NetworkConfig[];
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

// ============================================
// Default Networks
// ============================================

const DEFAULT_NETWORKS: NetworkConfig[] = [
  {
    id: "mainnet-beta",
    name: "Mainnet",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    explorerUrl: "https://explorer.solana.com",
    isTestnet: false,
  },
  {
    id: "devnet",
    name: "Devnet",
    rpcUrl: "https://api.devnet.solana.com",
    explorerUrl: "https://explorer.solana.com?cluster=devnet",
    isTestnet: true,
  },
  {
    id: "testnet",
    name: "Testnet",
    rpcUrl: "https://api.testnet.solana.com",
    explorerUrl: "https://explorer.solana.com?cluster=testnet",
    isTestnet: true,
  },
  {
    id: "localnet",
    name: "Localhost",
    rpcUrl: "http://127.0.0.1:8899",
    explorerUrl: "https://explorer.solana.com?cluster=custom&customUrl=http://127.0.0.1:8899",
    isTestnet: true,
  },
];

// ============================================
// Size Variants
// ============================================

const sizeClasses = {
  sm: "h-8 text-xs px-2.5 gap-1",
  md: "h-9 text-sm px-3 gap-1.5",
  lg: "h-10 text-base px-3.5 gap-2",
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
};

// ============================================
// Component
// ============================================

export function NetworkSwitcher({
  network,
  onNetworkChange,
  networks = DEFAULT_NETWORKS,
  size = "md",
  className = "",
  disabled = false,
}: NetworkSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iconSize = iconSizes[size];

  // Get current network config
  const currentNetwork = networks.find((n) => n.id === network) ?? networks[0]!;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
    return undefined;
  }, [isOpen]);

  const handleSelect = useCallback(
    (selectedNetwork: SolanaNetwork) => {
      onNetworkChange(selectedNetwork);
      setIsOpen(false);
    },
    [onNetworkChange]
  );

  const toggleDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled]);

  // Network status indicator color
  const getNetworkColor = (isTestnet: boolean) => {
    return isTestnet ? "bg-yellow-500" : "bg-emerald-500";
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          inline-flex items-center justify-between
          ${sizeClasses[size]}
          rounded-lg font-medium
          border border-white/10
          bg-neutral-900 text-white
          transition-all duration-200
          hover:bg-neutral-800 hover:border-white/20
          focus:outline-none focus:ring-2 focus:ring-emerald-500/40
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <Globe size={iconSize} className="text-neutral-400" />
          <span
            className={`w-2 h-2 rounded-full ${getNetworkColor(currentNetwork.isTestnet)}`}
          />
          <span className="truncate">{currentNetwork.name}</span>
        </div>
        <ChevronDown
          size={iconSize}
          className={`text-neutral-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute top-full right-0 mt-1 z-50
            min-w-[180px] py-1
            rounded-lg border border-white/10
            bg-neutral-900 shadow-xl
            animate-in fade-in slide-in-from-top-2 duration-200
          "
          role="listbox"
          aria-label="Select network"
        >
          {networks.map((net) => {
            const isSelected = net.id === network;
            return (
              <button
                key={net.id}
                type="button"
                onClick={() => handleSelect(net.id)}
                className={`
                  w-full flex items-center justify-between
                  px-3 py-2 text-sm text-left
                  transition-colors duration-150
                  ${
                    isSelected
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-neutral-300 hover:bg-white/5"
                  }
                `}
                role="option"
                aria-selected={isSelected}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${getNetworkColor(net.isTestnet)}`}
                  />
                  <span>{net.name}</span>
                  {net.isTestnet && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-400 rounded">
                      Test
                    </span>
                  )}
                </div>
                {isSelected && <Check size={14} className="text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NetworkSwitcher;
export { DEFAULT_NETWORKS };
