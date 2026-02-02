"use client";

/**
 * DepositForm Component
 *
 * Form for depositing tokens into the privacy pool.
 */

import React, { useState, useCallback, useMemo } from "react";
import { Shield, AlertTriangle, Info } from "lucide-react";
import { TokenAmountInput, PresetAmountButtons } from "./TokenAmountInput";
import { ZKProofStatus, ProofStep } from "./ZKProofStatus";
import { TokenInfo } from "./TokenSelector";
import { SUPPORTED_TOKENS, getPoolAmounts } from "../data/tokens";

// ============================================
// Types
// ============================================

export type DepositState = "idle" | "confirming" | "processing" | "success" | "error";

export interface DepositFormProps {
  /** Available tokens for deposit */
  tokens?: TokenInfo[];
  /** User's public balances by mint */
  balances?: Record<string, string>;
  /** Token prices by symbol */
  prices?: Record<string, number>;
  /** Submit handler */
  onSubmit?: (token: TokenInfo, amount: string) => Promise<string>;
  /** Cancel handler */
  onCancel?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================
// Confirmation Modal
// ============================================

interface ConfirmModalProps {
  token: TokenInfo;
  amount: string;
  usdValue: number | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmModal({
  token,
  amount,
  usdValue,
  onConfirm,
  onCancel,
  loading,
}: ConfirmModalProps) {
  const formattedUsd = usdValue
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(usdValue)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-neutral-900 border border-white/10 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-emerald-500/10">
              <Shield size={24} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Confirm Deposit
              </h3>
              <p className="text-sm text-neutral-400">
                Shield your tokens privately
              </p>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Amount</span>
              <div className="text-right">
                <p className="text-xl font-semibold text-white">
                  {amount} {token.symbol}
                </p>
                {formattedUsd && (
                  <p className="text-sm text-neutral-500">{formattedUsd}</p>
                )}
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-6">
            <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-200/80">
              This will generate a zero-knowledge proof. The process may take up
              to 60 seconds. Do not close this window.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="
                flex-1 h-12 rounded-xl
                bg-neutral-800 text-white font-medium
                hover:bg-neutral-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="
                flex-1 h-12 rounded-xl
                bg-emerald-500 text-white font-semibold
                hover:bg-emerald-400
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {loading ? "Processing..." : "Confirm Deposit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Success View
// ============================================

interface SuccessViewProps {
  token: TokenInfo;
  amount: string;
  txSignature: string;
  onClose: () => void;
}

function SuccessView({ token, amount, txSignature, onClose }: SuccessViewProps) {
  const explorerUrl = `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;

  return (
    <div className="text-center py-8">
      {/* Success Icon */}
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <Shield size={32} className="text-emerald-400" />
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">
        Deposit Successful!
      </h3>
      <p className="text-neutral-400 mb-6">
        {amount} {token.symbol} has been shielded
      </p>

      {/* Transaction Link */}
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="
          inline-block px-4 py-2 rounded-lg
          bg-white/5 text-emerald-400
          hover:bg-white/10
          transition-colors text-sm
        "
      >
        View on Explorer →
      </a>

      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="
          w-full mt-6 h-12 rounded-xl
          bg-emerald-500 text-white font-semibold
          hover:bg-emerald-400
          transition-colors
        "
      >
        Done
      </button>
    </div>
  );
}

// ============================================
// DepositForm Component
// ============================================

export function DepositForm({
  tokens = SUPPORTED_TOKENS,
  balances = {},
  prices = {},
  onSubmit,
  onCancel,
  className = "",
}: DepositFormProps) {
  // Form state
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(
    tokens[0] ?? null
  );
  const [state, setState] = useState<DepositState>("idle");
  const [proofStep, setProofStep] = useState<ProofStep>("preparing");
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Get token with balance
  const tokensWithBalances = useMemo(() => {
    return tokens.map((token) => ({
      ...token,
      balance: balances[token.mint] ?? "0",
      price: prices[token.symbol],
    }));
  }, [tokens, balances, prices]);

  // Current token balance
  const maxAmount = selectedToken ? balances[selectedToken.mint] ?? "0" : "0";
  const tokenPrice = selectedToken ? prices[selectedToken.symbol] : undefined;

  // Pool amounts for presets
  const poolAmounts = selectedToken
    ? getPoolAmounts(selectedToken.symbol)
    : [];

  // Validation
  const isValidAmount = useMemo(() => {
    if (!amount || !selectedToken) return false;
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return false;
    if (parseFloat(maxAmount) < num) return false;
    return true;
  }, [amount, selectedToken, maxAmount]);

  // Handle token change
  const handleTokenChange = useCallback((token: TokenInfo) => {
    setSelectedToken(token);
    setAmount(""); // Reset amount when token changes
  }, []);

  // Handle preset amount
  const handlePresetAmount = useCallback((preset: number) => {
    setAmount(preset.toString());
  }, []);

  // Handle form submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValidAmount || !selectedToken) return;

      setState("confirming");
    },
    [isValidAmount, selectedToken]
  );

  // Handle confirm deposit
  const handleConfirm = useCallback(async () => {
    if (!selectedToken || !onSubmit) return;

    setState("processing");
    setError(null);

    try {
      // Simulate proof generation steps
      setProofStep("preparing");
      await new Promise((r) => setTimeout(r, 1000));

      setProofStep("computing");
      await new Promise((r) => setTimeout(r, 3000));

      setProofStep("signing");
      await new Promise((r) => setTimeout(r, 1000));

      setProofStep("submitting");
      const signature = await onSubmit(selectedToken, amount);

      setProofStep("completed");
      setTxSignature(signature);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
      setState("error");
    }
  }, [selectedToken, amount, onSubmit]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setState("idle");
    setError(null);
    onCancel?.();
  }, [onCancel]);

  // Handle success close
  const handleSuccessClose = useCallback(() => {
    setState("idle");
    setAmount("");
    setTxSignature(null);
  }, []);

  // Calculate USD value
  const usdValue = useMemo(() => {
    if (!tokenPrice || !amount) return null;
    const num = parseFloat(amount);
    if (isNaN(num)) return null;
    return num * tokenPrice;
  }, [tokenPrice, amount]);

  // Render success view
  if (state === "success" && txSignature && selectedToken) {
    return (
      <div className={className}>
        <SuccessView
          token={selectedToken}
          amount={amount}
          txSignature={txSignature}
          onClose={handleSuccessClose}
        />
      </div>
    );
  }

  // Render processing view
  if (state === "processing") {
    return (
      <div className={`p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-6 text-center">
          Processing Deposit
        </h3>
        <ZKProofStatus
          currentStep={proofStep}
          error={error ?? undefined}
          estimatedTime={proofStep === "computing" ? 45 : undefined}
        />
        {error && (
          <button
            type="button"
            onClick={handleCancel}
            className="
              w-full mt-6 h-12 rounded-xl
              bg-neutral-800 text-white font-medium
              hover:bg-neutral-700
              transition-colors
            "
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Confirmation Modal */}
      {state === "confirming" && selectedToken && (
        <ConfirmModal
          token={selectedToken}
          amount={amount}
          usdValue={usdValue}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Banner */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Info size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-200/80">
            Deposit tokens to shield them privately. Shielded tokens can only be
            accessed with your wallet.
          </p>
        </div>

        {/* Amount + Token Input */}
        <TokenAmountInput
          amount={amount}
          onAmountChange={setAmount}
          selectedToken={selectedToken}
          onTokenChange={handleTokenChange}
          tokens={tokensWithBalances}
          maxAmount={maxAmount}
          tokenPrice={tokenPrice}
          label="Amount to Shield"
          size="lg"
        />

        {/* Preset Amounts */}
        {poolAmounts.length > 0 && selectedToken && (
          <div>
            <p className="text-xs text-neutral-500 mb-2">Quick amounts:</p>
            <PresetAmountButtons
              presets={poolAmounts.slice(0, 5)}
              selectedAmount={parseFloat(amount) || undefined}
              onSelect={handlePresetAmount}
              tokenSymbol={selectedToken.symbol}
              size="sm"
            />
          </div>
        )}

        {/* Error Display */}
        {error && state === "error" && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValidAmount}
          className="
            w-full h-14 rounded-xl
            bg-emerald-500 text-white font-semibold text-lg
            hover:bg-emerald-400
            disabled:bg-neutral-700 disabled:text-neutral-400
            disabled:cursor-not-allowed
            transition-colors
            flex items-center justify-center gap-2
          "
        >
          <Shield size={20} />
          Shield Tokens
        </button>
      </form>
    </div>
  );
}

export default DepositForm;
