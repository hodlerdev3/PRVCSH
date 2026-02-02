"use client";

/**
 * WalletBalance Component
 *
 * Displays public (wallet) and shielded (private) token balances.
 */

import React, { useState, useCallback } from "react";
import { RefreshCw, Eye, EyeOff, Shield, Wallet } from "lucide-react";
import { TokenInfo } from "./TokenSelector";
import { formatTokenAmount } from "../data/tokens";

// ============================================
// Types
// ============================================

export interface BalanceData {
  /** Token info */
  token: TokenInfo;
  /** Public wallet balance */
  publicBalance: string;
  /** Shielded (private) balance */
  shieldedBalance: string;
  /** USD value of total balance */
  usdValue?: number;
}

export interface WalletBalanceProps {
  /** Array of token balances */
  balances: BalanceData[];
  /** Loading state */
  loading?: boolean;
  /** Refresh handler */
  onRefresh?: () => void;
  /** Show shielded balances initially */
  showShielded?: boolean;
  /** Toggle shielded visibility handler */
  onToggleShielded?: (show: boolean) => void;
  /** Compact mode (single row) */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
// Balance Row Component
// ============================================

interface BalanceRowProps {
  balance: BalanceData;
  showShielded: boolean;
  compact?: boolean;
}

function BalanceRow({ balance, showShielded, compact }: BalanceRowProps) {
  const { token, publicBalance, shieldedBalance, usdValue } = balance;
  const decimals = token.decimals;

  // Format balances
  const formattedPublic = formatTokenAmount(publicBalance, decimals, 4);
  const formattedShielded = showShielded
    ? formatTokenAmount(shieldedBalance, decimals, 4)
    : "••••••";

  // Format USD
  const formattedUsd = usdValue
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(usdValue)
    : null;

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          {token.icon ? (
            <img
              src={token.icon}
              alt={token.symbol}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
              {token.symbol.charAt(0)}
            </div>
          )}
          <span className="font-medium text-white">{token.symbol}</span>
        </div>
        <div className="text-right">
          <span className="text-sm text-neutral-300 tabular-nums">
            {formattedPublic}
          </span>
          <span className="text-xs text-neutral-500 ml-2">
            + {formattedShielded}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
      {/* Token Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {token.icon ? (
            <img
              src={token.icon}
              alt={token.symbol}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
              {token.symbol.charAt(0)}
            </div>
          )}
          <div>
            <span className="font-semibold text-white">{token.symbol}</span>
            <span className="text-xs text-neutral-500 ml-2">{token.name}</span>
          </div>
        </div>
        {formattedUsd && (
          <span className="text-sm text-neutral-400">{formattedUsd}</span>
        )}
      </div>

      {/* Balance Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Public Balance */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Wallet size={12} />
            <span>Public</span>
          </div>
          <div className="text-lg font-mono text-white tabular-nums">
            {formattedPublic}
          </div>
        </div>

        {/* Shielded Balance */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <Shield size={12} />
            <span>Shielded</span>
          </div>
          <div className="text-lg font-mono text-emerald-400 tabular-nums">
            {formattedShielded}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Skeleton Loader
// ============================================

function BalanceSkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center justify-between py-2 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-neutral-800" />
          <div className="w-12 h-4 rounded bg-neutral-800" />
        </div>
        <div className="w-24 h-4 rounded bg-neutral-800" />
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-800" />
          <div className="w-20 h-5 rounded bg-neutral-800" />
        </div>
        <div className="w-16 h-4 rounded bg-neutral-800" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="w-12 h-3 rounded bg-neutral-800" />
          <div className="w-20 h-6 rounded bg-neutral-800" />
        </div>
        <div className="space-y-2">
          <div className="w-14 h-3 rounded bg-neutral-800" />
          <div className="w-20 h-6 rounded bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// WalletBalance Component
// ============================================

export function WalletBalance({
  balances,
  loading = false,
  onRefresh,
  showShielded: initialShowShielded = true,
  onToggleShielded,
  compact = false,
  className = "",
}: WalletBalanceProps) {
  const [showShielded, setShowShielded] = useState(initialShowShielded);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleToggleShielded = useCallback(() => {
    const newValue = !showShielded;
    setShowShielded(newValue);
    onToggleShielded?.(newValue);
  }, [showShielded, onToggleShielded]);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

  // Calculate total USD value
  const totalUsdValue = balances.reduce((sum, b) => sum + (b.usdValue ?? 0), 0);
  const formattedTotalUsd =
    totalUsdValue > 0
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(totalUsdValue)
      : null;

  return (
    <div
      className={`
        rounded-2xl border border-white/10
        bg-neutral-900/50 backdrop-blur-sm
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div>
          <h3 className="text-sm font-semibold text-white">Balances</h3>
          {formattedTotalUsd && (
            <p className="text-xs text-neutral-500 mt-0.5">
              Total: {formattedTotalUsd}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Shielded Visibility */}
          <button
            type="button"
            onClick={handleToggleShielded}
            className="
              p-2 rounded-lg
              text-neutral-400 hover:text-white
              hover:bg-white/5
              transition-colors duration-150
            "
            aria-label={showShielded ? "Hide shielded balances" : "Show shielded balances"}
            title={showShielded ? "Hide shielded" : "Show shielded"}
          >
            {showShielded ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="
                p-2 rounded-lg
                text-neutral-400 hover:text-white
                hover:bg-white/5
                transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              aria-label="Refresh balances"
              title="Refresh"
            >
              <RefreshCw
                size={16}
                className={isRefreshing || loading ? "animate-spin" : ""}
              />
            </button>
          )}
        </div>
      </div>

      {/* Balance List */}
      <div className={compact ? "px-4 py-2 divide-y divide-white/5" : "p-4 space-y-3"}>
        {loading ? (
          // Loading skeletons
          <>
            <BalanceSkeleton compact={compact} />
            <BalanceSkeleton compact={compact} />
            <BalanceSkeleton compact={compact} />
          </>
        ) : balances.length === 0 ? (
          // Empty state
          <div className="py-8 text-center text-neutral-500 text-sm">
            No balances to display
          </div>
        ) : (
          // Balance rows
          balances.map((balance) => (
            <BalanceRow
              key={balance.token.mint}
              balance={balance}
              showShielded={showShielded}
              compact={compact}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default WalletBalance;
