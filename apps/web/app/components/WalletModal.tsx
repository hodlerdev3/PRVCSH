"use client";

/**
 * WalletModal Component
 *
 * Custom wallet selection modal with grid layout.
 * Uses @solana/wallet-adapter-react for wallet management.
 */

import { useCallback, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { X, ExternalLink, AlertCircle } from "lucide-react";

// ============================================
// Types
// ============================================

export interface WalletModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Featured wallets to show first */
  featuredWallets?: string[];
}

// ============================================
// Component
// ============================================

export function WalletModal({
  isOpen,
  onClose,
  featuredWallets = ["Phantom", "Solflare", "Coinbase Wallet"],
}: WalletModalProps) {
  const { wallets, select, connecting } = useWallet();

  // Sort wallets: featured first, then installed, then loadable
  const sortedWallets = useMemo(() => {
    return [...wallets].sort((a, b) => {
      // Featured wallets first
      const aFeatured = featuredWallets.includes(a.adapter.name) ? -1 : 0;
      const bFeatured = featuredWallets.includes(b.adapter.name) ? -1 : 0;
      if (aFeatured !== bFeatured) return aFeatured - bFeatured;

      // Then by ready state
      const readyOrder = {
        [WalletReadyState.Installed]: 0,
        [WalletReadyState.Loadable]: 1,
        [WalletReadyState.NotDetected]: 2,
        [WalletReadyState.Unsupported]: 3,
      };
      return (
        (readyOrder[a.readyState] ?? 4) - (readyOrder[b.readyState] ?? 4)
      );
    });
  }, [wallets, featuredWallets]);

  // Filter into groups
  const installedWallets = useMemo(
    () =>
      sortedWallets.filter(
        (w) => w.readyState === WalletReadyState.Installed
      ),
    [sortedWallets]
  );

  const otherWallets = useMemo(
    () =>
      sortedWallets.filter(
        (w) =>
          w.readyState !== WalletReadyState.Installed &&
          w.readyState !== WalletReadyState.Unsupported
      ),
    [sortedWallets]
  );

  // Handle wallet selection
  const handleSelect = useCallback(
    async (walletName: string) => {
      select(walletName as Parameters<typeof select>[0]);
      onClose();
    },
    [select, onClose]
  );

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-modal-title"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2
            id="wallet-modal-title"
            className="text-xl font-semibold text-white"
          >
            Connect Wallet
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Loading State */}
        {connecting && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-cyan-500/10 p-3 text-cyan-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            <span>Connecting...</span>
          </div>
        )}

        {/* Installed Wallets */}
        {installedWallets.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-3 text-sm font-medium text-gray-400">
              Detected Wallets
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {installedWallets.map((wallet) => (
                <button
                  key={wallet.adapter.name}
                  onClick={() => handleSelect(wallet.adapter.name)}
                  disabled={connecting}
                  className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-800/50 p-4 transition-all hover:border-cyan-500/50 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <img
                    src={wallet.adapter.icon}
                    alt={wallet.adapter.name}
                    className="h-8 w-8 rounded-lg"
                  />
                  <span className="text-sm font-medium text-white">
                    {wallet.adapter.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Wallets Detected */}
        {installedWallets.length === 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-lg bg-amber-500/10 p-4 text-amber-400">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">No wallet detected</p>
              <p className="mt-1 text-sm text-amber-400/80">
                Install a Solana wallet extension to continue.
              </p>
            </div>
          </div>
        )}

        {/* Other Wallets */}
        {otherWallets.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-400">
              More Wallets
            </h3>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {otherWallets.slice(0, 6).map((wallet) => (
                <a
                  key={wallet.adapter.name}
                  href={wallet.adapter.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-gray-800/30 p-3 transition-all hover:border-gray-600 hover:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={wallet.adapter.icon}
                      alt={wallet.adapter.name}
                      className="h-6 w-6 rounded"
                    />
                    <span className="text-sm text-gray-300">
                      {wallet.adapter.name}
                    </span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          By connecting, you agree to our Terms of Service
        </p>
      </div>
    </>
  );
}

export default WalletModal;
