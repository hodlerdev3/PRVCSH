"use client";

/**
 * MixerForm Component
 *
 * Combined Deposit/Withdraw form with tab switcher.
 * This is the main component for the Privacy Mixer UI.
 */

import React, { useState, useCallback, useMemo } from "react";
import { Shield, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { DepositForm } from "./DepositForm";
import { WithdrawForm } from "./WithdrawForm";
import { TokenInfo } from "./TokenSelector";
import { SUPPORTED_TOKENS } from "../data/tokens";

// ============================================
// Types
// ============================================

export type MixerTab = "deposit" | "withdraw";

export interface MixerFormProps {
  /** Initial active tab */
  defaultTab?: MixerTab;
  /** Available tokens */
  tokens?: TokenInfo[];
  /** User's public balances by mint */
  publicBalances?: Record<string, string>;
  /** User's shielded balances by mint */
  shieldedBalances?: Record<string, string>;
  /** Token prices by symbol */
  prices?: Record<string, number>;
  /** Deposit handler */
  onDeposit?: (token: TokenInfo, amount: string) => Promise<string>;
  /** Withdraw handler */
  onWithdraw?: (
    token: TokenInfo,
    amount: string,
    recipient: string
  ) => Promise<string>;
  /** Tab change handler */
  onTabChange?: (tab: MixerTab) => void;
  /** Additional className */
  className?: string;
}

// ============================================
// Tab Button Component
// ============================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
  accentColor: "emerald" | "cyan";
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  description,
  accentColor,
}: TabButtonProps) {
  const colors = {
    emerald: {
      bg: active ? "bg-emerald-500/10" : "bg-transparent",
      border: active ? "border-emerald-500/50" : "border-white/5",
      icon: active ? "text-emerald-400" : "text-neutral-400",
      text: active ? "text-white" : "text-neutral-400",
      desc: active ? "text-neutral-400" : "text-neutral-500",
      indicator: "bg-emerald-500",
    },
    cyan: {
      bg: active ? "bg-cyan-500/10" : "bg-transparent",
      border: active ? "border-cyan-500/50" : "border-white/5",
      icon: active ? "text-cyan-400" : "text-neutral-400",
      text: active ? "text-white" : "text-neutral-400",
      desc: active ? "text-neutral-400" : "text-neutral-500",
      indicator: "bg-cyan-500",
    },
  };

  const c = colors[accentColor];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex-1 p-4 rounded-xl
        border transition-all duration-200
        ${c.bg} ${c.border}
        hover:bg-white/5
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        focus-visible:ring-${accentColor}-500 focus-visible:ring-offset-neutral-900
      `}
      role="tab"
      aria-selected={active}
    >
      {/* Active Indicator */}
      {active && (
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 ${c.indicator} rounded-b`}
        />
      )}

      <div className="flex flex-col items-center gap-2">
        <div className={c.icon}>{icon}</div>
        <div className="text-center">
          <p className={`font-semibold ${c.text}`}>{label}</p>
          <p className={`text-xs ${c.desc}`}>{description}</p>
        </div>
      </div>
    </button>
  );
}

// ============================================
// Stats Display Component
// ============================================

interface StatsDisplayProps {
  publicBalance: string;
  shieldedBalance: string;
  tokenSymbol: string;
}

function StatsDisplay({
  publicBalance,
  shieldedBalance,
  tokenSymbol,
}: StatsDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {/* Public Balance */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/5">
        <p className="text-xs text-neutral-500 mb-1">Public Balance</p>
        <p className="font-semibold text-white">
          {publicBalance} <span className="text-neutral-400">{tokenSymbol}</span>
        </p>
      </div>

      {/* Shielded Balance */}
      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
        <div className="flex items-center gap-1.5 mb-1">
          <Shield size={12} className="text-emerald-400" />
          <p className="text-xs text-emerald-400">Shielded</p>
        </div>
        <p className="font-semibold text-white">
          {shieldedBalance}{" "}
          <span className="text-neutral-400">{tokenSymbol}</span>
        </p>
      </div>
    </div>
  );
}

// ============================================
// MixerForm Component
// ============================================

export function MixerForm({
  defaultTab = "deposit",
  tokens = SUPPORTED_TOKENS,
  publicBalances = {},
  shieldedBalances = {},
  prices = {},
  onDeposit,
  onWithdraw,
  onTabChange,
  className = "",
}: MixerFormProps) {
  const [activeTab, setActiveTab] = useState<MixerTab>(defaultTab);
  const [selectedTokenMint] = useState<string>(tokens[0]?.mint ?? "");

  // Handle tab change
  const handleTabChange = useCallback(
    (tab: MixerTab) => {
      setActiveTab(tab);
      onTabChange?.(tab);
    },
    [onTabChange]
  );

  // Get selected token info
  const selectedToken = useMemo(() => {
    return tokens.find((t) => t.mint === selectedTokenMint) ?? tokens[0];
  }, [tokens, selectedTokenMint]);

  // Current balances for selected token
  const currentPublicBalance = selectedToken
    ? publicBalances[selectedToken.mint] ?? "0"
    : "0";
  const currentShieldedBalance = selectedToken
    ? shieldedBalances[selectedToken.mint] ?? "0"
    : "0";

  return (
    <div
      className={`
        rounded-2xl overflow-hidden
        bg-neutral-900/50 backdrop-blur-xl
        border border-white/10
        shadow-xl shadow-black/20
        ${className}
      `}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
            <Shield size={24} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Privacy Mixer</h2>
            <p className="text-sm text-neutral-400">
              Shield your tokens privately
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          className="flex gap-3"
          role="tablist"
          aria-label="Transaction type"
        >
          <TabButton
            active={activeTab === "deposit"}
            onClick={() => handleTabChange("deposit")}
            icon={<ArrowDownToLine size={20} />}
            label="Deposit"
            description="Shield tokens"
            accentColor="emerald"
          />
          <TabButton
            active={activeTab === "withdraw"}
            onClick={() => handleTabChange("withdraw")}
            icon={<ArrowUpFromLine size={20} />}
            label="Withdraw"
            description="Unshield tokens"
            accentColor="cyan"
          />
        </div>
      </div>

      {/* Balance Stats */}
      <div className="px-6 pt-6">
        <StatsDisplay
          publicBalance={currentPublicBalance}
          shieldedBalance={currentShieldedBalance}
          tokenSymbol={selectedToken?.symbol ?? ""}
        />
      </div>

      {/* Tab Content */}
      <div className="p-6 pt-0" role="tabpanel">
        {activeTab === "deposit" ? (
          <DepositForm
            tokens={tokens}
            balances={publicBalances}
            prices={prices}
            onSubmit={onDeposit}
          />
        ) : (
          <WithdrawForm
            tokens={tokens}
            shieldedBalances={shieldedBalances}
            prices={prices}
            onSubmit={onWithdraw}
          />
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 pb-6">
        <div className="p-3 rounded-lg bg-neutral-800/50 border border-white/5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500">Network Fee</span>
            <span className="text-neutral-300">~0.000005 SOL</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-neutral-500">ZK Proof Time</span>
            <span className="text-neutral-300">~30-60 seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Compact Tab Switcher (for embedding)
// ============================================

export interface TabSwitcherProps {
  activeTab: MixerTab;
  onTabChange: (tab: MixerTab) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TabSwitcher({
  activeTab,
  onTabChange,
  size = "md",
  className = "",
}: TabSwitcherProps) {
  const sizes = {
    sm: "h-8 text-xs",
    md: "h-10 text-sm",
    lg: "h-12 text-base",
  };

  return (
    <div
      className={`
        inline-flex p-1 rounded-xl
        bg-neutral-800/50 border border-white/5
        ${className}
      `}
      role="tablist"
    >
      <button
        type="button"
        onClick={() => onTabChange("deposit")}
        className={`
          flex items-center gap-2 px-4 rounded-lg font-medium
          transition-all duration-200
          ${sizes[size]}
          ${
            activeTab === "deposit"
              ? "bg-emerald-500 text-white shadow-lg"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }
        `}
        role="tab"
        aria-selected={activeTab === "deposit"}
      >
        <ArrowDownToLine size={16} />
        Deposit
      </button>
      <button
        type="button"
        onClick={() => onTabChange("withdraw")}
        className={`
          flex items-center gap-2 px-4 rounded-lg font-medium
          transition-all duration-200
          ${sizes[size]}
          ${
            activeTab === "withdraw"
              ? "bg-cyan-500 text-white shadow-lg"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }
        `}
        role="tab"
        aria-selected={activeTab === "withdraw"}
      >
        <ArrowUpFromLine size={16} />
        Withdraw
      </button>
    </div>
  );
}

export default MixerForm;
