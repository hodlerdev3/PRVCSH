"use client";

/**
 * WithdrawForm Component
 *
 * Form for withdrawing tokens from the privacy pool to a recipient address.
 * Includes recipient address input with validation and paste functionality.
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  Shield,
  AlertTriangle,
  Info,
  Clipboard,
  ExternalLink,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import { TokenAmountInput, PresetAmountButtons } from "./TokenAmountInput";
import { ZKProofStatus, ProofStep } from "./ZKProofStatus";
import { TokenInfo } from "./TokenSelector";
import { SUPPORTED_TOKENS, getPoolAmounts } from "../data/tokens";

// ============================================
// Types
// ============================================

export type WithdrawState =
  | "idle"
  | "confirming"
  | "processing"
  | "success"
  | "error";

export interface WithdrawFormProps {
  /** Available tokens for withdrawal */
  tokens?: TokenInfo[];
  /** User's shielded balances by mint */
  shieldedBalances?: Record<string, string>;
  /** Token prices by symbol */
  prices?: Record<string, number>;
  /** Submit handler */
  onSubmit?: (
    token: TokenInfo,
    amount: string,
    recipient: string
  ) => Promise<string>;
  /** Cancel handler */
  onCancel?: () => void;
  /** Default recipient address */
  defaultRecipient?: string;
  /** Additional className */
  className?: string;
}

// ============================================
// Address Validation
// ============================================

/**
 * Validate a Solana public key address
 * - Must be 32-44 characters (base58 encoded)
 * - Must only contain valid base58 characters
 */
function isValidSolanaAddress(address: string): boolean {
  if (!address) return false;

  // Solana addresses are base58 encoded and 32-44 chars
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Validate address with detailed error message
 */
function validateAddress(address: string): {
  valid: boolean;
  error?: string;
} {
  if (!address) {
    return { valid: false, error: "Recipient address is required" };
  }

  if (address.length < 32) {
    return { valid: false, error: "Address is too short" };
  }

  if (address.length > 44) {
    return { valid: false, error: "Address is too long" };
  }

  if (!isValidSolanaAddress(address)) {
    return { valid: false, error: "Invalid Solana address format" };
  }

  return { valid: true };
}

// ============================================
// RecipientInput Component
// ============================================

interface RecipientInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

function RecipientInput({
  value,
  onChange,
  error,
  disabled,
  className = "",
}: RecipientInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasted, setIsPasted] = useState(false);

  // Handle paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      onChange(trimmed);
      setIsPasted(true);
      setTimeout(() => setIsPasted(false), 2000);
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  }, [onChange]);

  // Handle clear
  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  const hasValue = value.length > 0;
  const hasError = !!error;

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-neutral-300 mb-2">
        Recipient Address
      </label>
      <div
        className={`
          relative rounded-xl overflow-hidden transition-all
          ${
            hasError
              ? "ring-2 ring-red-500/50"
              : isFocused
                ? "ring-2 ring-cyan-500/50"
                : "ring-1 ring-white/10"
          }
        `}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Enter Solana wallet address..."
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          className={`
            w-full h-14 px-4 pr-28
            bg-neutral-800/50 text-white
            placeholder:text-neutral-500
            font-mono text-sm
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? "recipient-error" : undefined}
        />

        {/* Action Buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {hasValue && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="
                p-2 rounded-lg
                text-neutral-400 hover:text-white hover:bg-white/10
                transition-colors
                disabled:opacity-50
              "
              aria-label="Clear address"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={handlePaste}
            disabled={disabled}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium
              flex items-center gap-1.5
              transition-colors
              ${
                isPasted
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white/10 text-white hover:bg-white/20"
              }
              disabled:opacity-50
            `}
            aria-label="Paste from clipboard"
          >
            {isPasted ? (
              <>
                <Check size={14} />
                Pasted
              </>
            ) : (
              <>
                <Clipboard size={14} />
                Paste
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {hasError && (
        <p id="recipient-error" className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {/* Address preview */}
      {hasValue && isValidSolanaAddress(value) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
          <span>
            {value.slice(0, 4)}...{value.slice(-4)}
          </span>
          <a
            href={`https://explorer.solana.com/address/${value}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
          >
            View <ExternalLink size={12} />
          </a>
        </div>
      )}
    </div>
  );
}

// ============================================
// Confirmation Modal
// ============================================

interface ConfirmModalProps {
  token: TokenInfo;
  amount: string;
  recipient: string;
  usdValue: number | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmModal({
  token,
  amount,
  recipient,
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
            <div className="p-3 rounded-full bg-cyan-500/10">
              <ArrowRight size={24} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Confirm Withdrawal
              </h3>
              <p className="text-sm text-neutral-400">
                Unshield tokens to a public address
              </p>
            </div>
          </div>

          {/* Transaction Summary */}
          <div className="space-y-3 mb-6">
            {/* Amount */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
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

            {/* Recipient */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-neutral-400">Recipient</span>
                <p className="text-sm font-mono text-white break-all">
                  {recipient}
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-6">
            <AlertTriangle
              size={18}
              className="text-yellow-400 flex-shrink-0 mt-0.5"
            />
            <p className="text-sm text-yellow-200/80">
              This will generate a zero-knowledge proof. The process may take up
              to 60 seconds. Verify the recipient address carefully.
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
                bg-cyan-500 text-white font-semibold
                hover:bg-cyan-400
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {loading ? "Processing..." : "Confirm Withdrawal"}
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
  recipient: string;
  txSignature: string;
  onClose: () => void;
}

function SuccessView({
  token,
  amount,
  recipient,
  txSignature,
  onClose,
}: SuccessViewProps) {
  const explorerUrl = `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;

  return (
    <div className="text-center py-8">
      {/* Success Icon */}
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
        <Check size={32} className="text-cyan-400" />
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">
        Withdrawal Successful!
      </h3>
      <p className="text-neutral-400 mb-2">
        {amount} {token.symbol} has been sent to
      </p>
      <p className="text-sm font-mono text-neutral-300 mb-6 break-all px-4">
        {recipient.slice(0, 8)}...{recipient.slice(-8)}
      </p>

      {/* Transaction Link */}
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="
          inline-block px-4 py-2 rounded-lg
          bg-white/5 text-cyan-400
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
          bg-cyan-500 text-white font-semibold
          hover:bg-cyan-400
          transition-colors
        "
      >
        Done
      </button>
    </div>
  );
}

// ============================================
// WithdrawForm Component
// ============================================

export function WithdrawForm({
  tokens = SUPPORTED_TOKENS,
  shieldedBalances = {},
  prices = {},
  onSubmit,
  onCancel,
  defaultRecipient = "",
  className = "",
}: WithdrawFormProps) {
  // Form state
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(
    tokens[0] ?? null
  );
  const [state, setState] = useState<WithdrawState>("idle");
  const [proofStep, setProofStep] = useState<ProofStep>("preparing");
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [recipientTouched, setRecipientTouched] = useState(false);

  // Get tokens with balances
  const tokensWithBalances = useMemo(() => {
    return tokens.map((token) => ({
      ...token,
      balance: shieldedBalances[token.mint] ?? "0",
      price: prices[token.symbol],
    }));
  }, [tokens, shieldedBalances, prices]);

  // Current token balance (shielded)
  const maxAmount = selectedToken
    ? shieldedBalances[selectedToken.mint] ?? "0"
    : "0";
  const tokenPrice = selectedToken ? prices[selectedToken.symbol] : undefined;

  // Pool amounts for presets
  const poolAmounts = selectedToken
    ? getPoolAmounts(selectedToken.symbol)
    : [];

  // Validate recipient address
  const recipientValidation = useMemo(() => {
    if (!recipientTouched && !recipient) {
      return { valid: false, error: undefined };
    }
    return validateAddress(recipient);
  }, [recipient, recipientTouched]);

  // Validate amount
  const isValidAmount = useMemo(() => {
    if (!amount || !selectedToken) return false;
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return false;
    if (parseFloat(maxAmount) < num) return false;
    return true;
  }, [amount, selectedToken, maxAmount]);

  // Overall form validity
  const isFormValid = isValidAmount && recipientValidation.valid;

  // Handle token change
  const handleTokenChange = useCallback((token: TokenInfo) => {
    setSelectedToken(token);
    setAmount(""); // Reset amount when token changes
  }, []);

  // Handle recipient change
  const handleRecipientChange = useCallback((value: string) => {
    setRecipient(value);
    setRecipientTouched(true);
  }, []);

  // Handle preset amount
  const handlePresetAmount = useCallback((preset: number) => {
    setAmount(preset.toString());
  }, []);

  // Handle form submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setRecipientTouched(true);

      if (!isFormValid || !selectedToken) return;

      setState("confirming");
    },
    [isFormValid, selectedToken]
  );

  // Handle confirm withdrawal
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
      const signature = await onSubmit(selectedToken, amount, recipient);

      setProofStep("completed");
      setTxSignature(signature);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
      setState("error");
    }
  }, [selectedToken, amount, recipient, onSubmit]);

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
    setRecipient(defaultRecipient);
    setRecipientTouched(false);
    setTxSignature(null);
  }, [defaultRecipient]);

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
          recipient={recipient}
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
          Processing Withdrawal
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
          recipient={recipient}
          usdValue={usdValue}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Banner */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <Info size={18} className="text-cyan-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-cyan-200/80">
            Withdraw shielded tokens to any Solana wallet address. The
            transaction will be private and unlinkable to your deposits.
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
          label="Amount to Withdraw"
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

        {/* Recipient Address */}
        <RecipientInput
          value={recipient}
          onChange={handleRecipientChange}
          error={recipientValidation.error}
          disabled={false}
        />

        {/* Error Display */}
        {error && state === "error" && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid}
          className="
            w-full h-14 rounded-xl
            bg-cyan-500 text-white font-semibold text-lg
            hover:bg-cyan-400
            disabled:bg-neutral-700 disabled:text-neutral-400
            disabled:cursor-not-allowed
            transition-colors
            flex items-center justify-center gap-2
          "
        >
          <Shield size={20} />
          Unshield & Send
        </button>
      </form>
    </div>
  );
}

export default WithdrawForm;
