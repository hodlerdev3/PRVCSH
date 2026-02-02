"use client";

/**
 * TokenAmountInput Component
 *
 * Combined AmountInput with TokenSelector for unified token amount entry.
 */

import React, { useMemo } from "react";
import { AmountInput } from "./AmountInput";
import { TokenSelector, TokenInfo } from "./TokenSelector";
import { formatTokenAmount } from "../data/tokens";

// ============================================
// Types
// ============================================

export interface TokenAmountInputProps {
  /** Amount value */
  amount: string;
  /** Amount change handler */
  onAmountChange: (amount: string) => void;
  /** Selected token */
  selectedToken: TokenInfo | null;
  /** Token change handler */
  onTokenChange: (token: TokenInfo) => void;
  /** Available tokens */
  tokens: TokenInfo[];
  /** Maximum amount (user balance) */
  maxAmount?: string;
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Show USD value */
  showUsdValue?: boolean;
  /** USD price per token */
  tokenPrice?: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
}

// ============================================
// Size Classes
// ============================================

const sizeClasses = {
  sm: {
    container: "gap-2",
    amountWidth: "flex-1",
    tokenWidth: "w-32",
    usdText: "text-xs",
  },
  md: {
    container: "gap-3",
    amountWidth: "flex-1",
    tokenWidth: "w-36",
    usdText: "text-sm",
  },
  lg: {
    container: "gap-4",
    amountWidth: "flex-1",
    tokenWidth: "w-40",
    usdText: "text-sm",
  },
};

// ============================================
// TokenAmountInput Component
// ============================================

export function TokenAmountInput({
  amount,
  onAmountChange,
  selectedToken,
  onTokenChange,
  tokens,
  maxAmount,
  label,
  helperText,
  error,
  disabled = false,
  loading = false,
  showUsdValue = true,
  tokenPrice,
  size = "md",
  className = "",
}: TokenAmountInputProps) {
  const classes = sizeClasses[size];

  // Calculate USD value
  const usdValue = useMemo(() => {
    if (!showUsdValue || !tokenPrice || !amount) return null;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount === 0) return null;
    return numAmount * tokenPrice;
  }, [showUsdValue, tokenPrice, amount]);

  // Format USD value
  const formattedUsdValue = useMemo(() => {
    if (usdValue === null) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usdValue);
  }, [usdValue]);

  // Get decimals from selected token
  const decimals = selectedToken?.decimals ?? 9;

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="block mb-2 text-sm font-medium text-neutral-300">
          {label}
        </label>
      )}

      {/* Input Container */}
      <div
        className={`
          flex items-stretch
          ${classes.container}
        `}
      >
        {/* Amount Input */}
        <div className={classes.amountWidth}>
          <AmountInput
            value={amount}
            onChange={onAmountChange}
            maxValue={maxAmount}
            decimals={decimals}
            placeholder="0.00"
            showMaxButton={!!maxAmount}
            disabled={disabled}
            loading={loading}
            size={size}
            error={error}
          />
        </div>

        {/* Token Selector */}
        <div className={classes.tokenWidth}>
          <TokenSelector
            selectedToken={selectedToken}
            tokens={tokens}
            onSelect={onTokenChange}
            disabled={disabled}
            size={size}
            showSearch={tokens.length > 5}
            showBalance={true}
          />
        </div>
      </div>

      {/* USD Value / Helper Text */}
      <div className="mt-2 flex items-center justify-between">
        {/* USD Value */}
        {formattedUsdValue && (
          <span className={`${classes.usdText} text-neutral-500`}>
            ≈ {formattedUsdValue}
          </span>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <span className={`${classes.usdText} text-neutral-500`}>
            {helperText}
          </span>
        )}

        {/* Balance Display */}
        {selectedToken?.balance && !error && (
          <span className={`${classes.usdText} text-neutral-400`}>
            Balance: {formatTokenAmount(selectedToken.balance, decimals)}{" "}
            {selectedToken.symbol}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// Preset Amount Buttons Component
// ============================================

export interface PresetAmountButtonsProps {
  /** Available preset amounts */
  presets: number[];
  /** Currently selected amount */
  selectedAmount?: number;
  /** Amount selection handler */
  onSelect: (amount: number) => void;
  /** Token symbol for display */
  tokenSymbol?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
}

const presetSizeClasses = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
};

export function PresetAmountButtons({
  presets,
  selectedAmount,
  onSelect,
  tokenSymbol,
  disabled = false,
  size = "md",
  className = "",
}: PresetAmountButtonsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {presets.map((preset) => {
        const isSelected = selectedAmount === preset;
        return (
          <button
            key={preset}
            type="button"
            onClick={() => onSelect(preset)}
            disabled={disabled}
            className={`
              ${presetSizeClasses[size]}
              rounded-lg font-medium
              transition-all duration-150
              ${
                isSelected
                  ? "bg-emerald-500 text-white"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {preset} {tokenSymbol}
          </button>
        );
      })}
    </div>
  );
}

export default TokenAmountInput;
