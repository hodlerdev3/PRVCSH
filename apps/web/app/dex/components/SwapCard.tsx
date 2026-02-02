"use client";

/**
 * SwapCard Component
 *
 * Main swap interface for the Privacy DEX with token selection,
 * amount input, and swap execution.
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  ArrowDownUp,
  Settings,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Info,
  Zap,
} from "lucide-react";
import { TokenSelector, TokenInfo } from "../../components/TokenSelector";

// ============================================
// Types
// ============================================

interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  route: string[];
  fee: string;
  minimumReceived: string;
  executionPrice: string;
}

interface SlippageOption {
  value: number;
  label: string;
}

// ============================================
// Constants
// ============================================

const SLIPPAGE_OPTIONS: SlippageOption[] = [
  { value: 0.1, label: "0.1%" },
  { value: 0.5, label: "0.5%" },
  { value: 1.0, label: "1.0%" },
];

const DEFAULT_TOKENS: TokenInfo[] = [
  {
    mint: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    icon: "/tokens/sol.svg",
    balance: "12.5",
    price: 95.42,
  },
  {
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    icon: "/tokens/usdc.svg",
    balance: "1,245.00",
    price: 1.0,
  },
  {
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    icon: "/tokens/usdt.svg",
    balance: "500.00",
    price: 1.0,
  },
  {
    mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    symbol: "mSOL",
    name: "Marinade Staked SOL",
    decimals: 9,
    icon: "/tokens/msol.svg",
    balance: "5.25",
    price: 102.18,
  },
  {
    mint: "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj",
    symbol: "stSOL",
    name: "Lido Staked SOL",
    decimals: 9,
    icon: "/tokens/stsol.svg",
    balance: "3.12",
    price: 101.55,
  },
  {
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    symbol: "BONK",
    name: "Bonk",
    decimals: 5,
    icon: "/tokens/bonk.svg",
    balance: "10,000,000",
    price: 0.000024,
  },
];

// ============================================
// SwapCard Component
// ============================================

export function SwapCard() {
  // State
  const [fromToken, setFromToken] = useState<TokenInfo | null>(DEFAULT_TOKENS[0] ?? null);
  const [toToken, setToToken] = useState<TokenInfo | null>(DEFAULT_TOKENS[1] ?? null);
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(0.5);
  const [customSlippage, setCustomSlippage] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate quote when input changes
  useEffect(() => {
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      setQuote(null);
      setToAmount("");
      return;
    }

    const fetchQuote = async () => {
      setIsFetchingQuote(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        const inputValue = parseFloat(fromAmount) * (fromToken.price || 1);
        const outputValue = inputValue * 0.997; // 0.3% fee
        const outputAmount = outputValue / (toToken.price || 1);

        const newQuote: SwapQuote = {
          inputAmount: fromAmount,
          outputAmount: outputAmount.toFixed(6),
          priceImpact: parseFloat(fromAmount) > 100 ? 0.15 : 0.02,
          route: [fromToken.symbol, toToken.symbol],
          fee: (parseFloat(fromAmount) * 0.003).toFixed(6),
          minimumReceived: (outputAmount * (1 - slippage / 100)).toFixed(6),
          executionPrice: (inputValue / outputAmount).toFixed(6),
        };

        setQuote(newQuote);
        setToAmount(newQuote.outputAmount);
      } catch (err) {
        setError("Failed to fetch quote. Please try again.");
      } finally {
        setIsFetchingQuote(false);
      }
    };

    const debounceTimer = setTimeout(fetchQuote, 300);
    return () => clearTimeout(debounceTimer);
  }, [fromToken, toToken, fromAmount, slippage]);

  // Swap tokens
  const handleSwapTokens = useCallback(() => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  }, [fromToken, toToken, fromAmount, toAmount]);

  // Execute swap
  const handleSwap = useCallback(async () => {
    if (!fromToken || !toToken || !quote) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simulate swap execution
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Show success
      alert(
        `Successfully swapped ${quote.inputAmount} ${fromToken.symbol} for ${quote.outputAmount} ${toToken.symbol}`
      );

      // Reset form
      setFromAmount("");
      setToAmount("");
      setQuote(null);
    } catch (err) {
      setError("Swap failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [fromToken, toToken, quote]);

  // Set max amount
  const handleMaxAmount = useCallback(() => {
    if (fromToken?.balance) {
      setFromAmount(fromToken.balance.replace(/,/g, ""));
    }
  }, [fromToken]);

  // Price display
  const priceDisplay = useMemo(() => {
    if (!fromToken || !toToken) return null;
    const rate = (fromToken.price || 1) / (toToken.price || 1);
    return `1 ${fromToken.symbol} = ${rate.toFixed(6)} ${toToken.symbol}`;
  }, [fromToken, toToken]);

  // Can swap
  const canSwap = useMemo(() => {
    return (
      fromToken &&
      toToken &&
      quote &&
      parseFloat(fromAmount) > 0 &&
      !isLoading &&
      !isFetchingQuote
    );
  }, [fromToken, toToken, quote, fromAmount, isLoading, isFetchingQuote]);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-white">Swap</h2>
          {privacyMode && (
            <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/30 rounded-full px-2 py-1">
              <ShieldCheck className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400">Private</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuote(null)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh quotes"
          >
            <RefreshCw
              className={`w-5 h-5 text-gray-400 ${isFetchingQuote ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-700/50 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-300">Slippage Tolerance</span>
            <div className="flex items-center gap-2">
              {SLIPPAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSlippage(option.value);
                    setCustomSlippage("");
                  }}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    slippage === option.value && !customSlippage
                      ? "bg-purple-500 text-white"
                      : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <input
                type="number"
                placeholder="Custom"
                value={customSlippage}
                onChange={(e) => {
                  setCustomSlippage(e.target.value);
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value > 0 && value <= 50) {
                    setSlippage(value);
                  }
                }}
                className="w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded-lg text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Privacy Mode</span>
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                privacyMode ? "bg-green-500" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  privacyMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* From Token */}
      <div className="bg-gray-700/50 rounded-xl p-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">You Pay</span>
          {fromToken?.balance && (
            <button
              onClick={handleMaxAmount}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              Balance: {fromToken.balance} (Max)
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <input
            type="number"
            placeholder="0.00"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            className="flex-1 bg-transparent text-2xl text-white placeholder-gray-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <TokenSelector
            selectedToken={fromToken}
            tokens={DEFAULT_TOKENS.filter((t) => t.mint !== toToken?.mint)}
            onSelect={setFromToken}
            size="md"
          />
        </div>
        {fromToken && fromAmount && (
          <div className="mt-2 text-sm text-gray-400">
            ≈ ${((parseFloat(fromAmount) || 0) * (fromToken.price || 0)).toFixed(2)}
          </div>
        )}
      </div>

      {/* Swap Button */}
      <div className="flex justify-center -my-2 relative z-10">
        <button
          onClick={handleSwapTokens}
          className="p-2 bg-gray-700 border-4 border-gray-800 rounded-xl hover:bg-gray-600 transition-colors"
        >
          <ArrowDownUp className="w-5 h-5 text-purple-400" />
        </button>
      </div>

      {/* To Token */}
      <div className="bg-gray-700/50 rounded-xl p-4 mt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">You Receive</span>
          {toToken?.balance && (
            <span className="text-sm text-gray-500">Balance: {toToken.balance}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="0.00"
            value={toAmount}
            readOnly
            className="flex-1 bg-transparent text-2xl text-white placeholder-gray-500 focus:outline-none"
          />
          <TokenSelector
            selectedToken={toToken}
            tokens={DEFAULT_TOKENS.filter((t) => t.mint !== fromToken?.mint)}
            onSelect={setToToken}
            size="md"
          />
        </div>
        {toToken && toAmount && (
          <div className="mt-2 text-sm text-gray-400">
            ≈ ${((parseFloat(toAmount) || 0) * (toToken.price || 0)).toFixed(2)}
          </div>
        )}
      </div>

      {/* Quote Details */}
      {quote && (
        <div className="mt-4 p-4 bg-gray-700/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Price</span>
            <span className="text-white">{priceDisplay}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 flex items-center gap-1">
              Price Impact
              <Info className="w-3 h-3" />
            </span>
            <span
              className={`${
                quote.priceImpact > 1
                  ? "text-red-400"
                  : quote.priceImpact > 0.1
                  ? "text-yellow-400"
                  : "text-green-400"
              }`}
            >
              {quote.priceImpact.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Minimum Received</span>
            <span className="text-white">
              {quote.minimumReceived} {toToken?.symbol}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Fee</span>
            <span className="text-white">
              {quote.fee} {fromToken?.symbol} (0.3%)
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Route</span>
            <span className="text-white flex items-center gap-1">
              {quote.route.join(" → ")}
              {privacyMode && (
                <ShieldCheck className="w-3 h-3 text-green-400 ml-1" />
              )}
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={!canSwap}
        className={`w-full mt-6 py-4 rounded-xl font-semibold text-lg transition-all ${
          canSwap
            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25"
            : "bg-gray-700 text-gray-400 cursor-not-allowed"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Swapping...
          </span>
        ) : isFetchingQuote ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Getting Quote...
          </span>
        ) : !fromToken || !toToken ? (
          "Select Tokens"
        ) : !fromAmount || parseFloat(fromAmount) <= 0 ? (
          "Enter Amount"
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Zap className="w-5 h-5" />
            Swap {privacyMode ? "Privately" : ""}
          </span>
        )}
      </button>

      {/* Privacy Info */}
      {privacyMode && (
        <div className="mt-4 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <p className="text-sm text-green-400 font-medium">
                Privacy Mode Enabled
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Your swap will be executed using zero-knowledge proofs. 
                Transaction details are encrypted and protected from MEV.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
