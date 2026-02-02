"use client";

/**
 * LiquiditySection Component
 *
 * Displays liquidity pool information and provides add/remove liquidity interface.
 */

import React, { useState, useMemo } from "react";
import {
  Droplets,
  Plus,
  Minus,
  TrendingUp,
  Wallet,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

// ============================================
// Types
// ============================================

interface LPPosition {
  poolId: string;
  tokenA: { symbol: string; amount: string; icon?: string };
  tokenB: { symbol: string; amount: string; icon?: string };
  lpTokens: string;
  sharePercent: number;
  valueUsd: number;
  fees24h: number;
  apr: number;
}

interface PoolOption {
  id: string;
  tokenA: { symbol: string; icon?: string };
  tokenB: { symbol: string; icon?: string };
  tvl: number;
  apr: number;
}

// ============================================
// Mock Data
// ============================================

const MOCK_POSITIONS: LPPosition[] = [
  {
    poolId: "sol-usdc",
    tokenA: { symbol: "SOL", amount: "25.5", icon: "/tokens/sol.svg" },
    tokenB: { symbol: "USDC", amount: "2,432.75", icon: "/tokens/usdc.svg" },
    lpTokens: "248.52",
    sharePercent: 0.042,
    valueUsd: 4865.5,
    fees24h: 12.45,
    apr: 42.5,
  },
  {
    poolId: "msol-sol",
    tokenA: { symbol: "mSOL", amount: "10.25", icon: "/tokens/msol.svg" },
    tokenB: { symbol: "SOL", amount: "10.45", icon: "/tokens/sol.svg" },
    lpTokens: "145.32",
    sharePercent: 0.018,
    valueUsd: 1987.25,
    fees24h: 4.82,
    apr: 25.8,
  },
];

const AVAILABLE_POOLS: PoolOption[] = [
  {
    id: "sol-usdc",
    tokenA: { symbol: "SOL", icon: "/tokens/sol.svg" },
    tokenB: { symbol: "USDC", icon: "/tokens/usdc.svg" },
    tvl: 12500000,
    apr: 42.5,
  },
  {
    id: "sol-usdt",
    tokenA: { symbol: "SOL", icon: "/tokens/sol.svg" },
    tokenB: { symbol: "USDT", icon: "/tokens/usdt.svg" },
    tvl: 8200000,
    apr: 38.2,
  },
  {
    id: "msol-sol",
    tokenA: { symbol: "mSOL", icon: "/tokens/msol.svg" },
    tokenB: { symbol: "SOL", icon: "/tokens/sol.svg" },
    tvl: 5600000,
    apr: 25.8,
  },
  {
    id: "bonk-sol",
    tokenA: { symbol: "BONK", icon: "/tokens/bonk.svg" },
    tokenB: { symbol: "SOL", icon: "/tokens/sol.svg" },
    tvl: 3200000,
    apr: 85.3,
  },
];

// ============================================
// Helper Functions
// ============================================

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

// ============================================
// LiquiditySection Component
// ============================================

export function LiquiditySection() {
  const [activeTab, setActiveTab] = useState<"positions" | "add" | "remove">(
    "positions"
  );
  const [selectedPool, setSelectedPool] = useState<PoolOption>(AVAILABLE_POOLS[0]!);
  const [showPoolSelector, setShowPoolSelector] = useState(false);
  const [tokenAAmount, setTokenAAmount] = useState<string>("");
  const [tokenBAmount, setTokenBAmount] = useState<string>("");
  const [privacyMode, setPrivacyMode] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<LPPosition | null>(
    MOCK_POSITIONS[0] ?? null
  );
  const [removePercent, setRemovePercent] = useState<number>(50);

  // Total position value
  const totalPositionValue = useMemo(() => {
    return MOCK_POSITIONS.reduce((sum, pos) => sum + pos.valueUsd, 0);
  }, []);

  // Total fees
  const totalFees = useMemo(() => {
    return MOCK_POSITIONS.reduce((sum, pos) => sum + pos.fees24h, 0);
  }, []);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-400" />
            Liquidity
          </h3>
          {privacyMode && (
            <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">Anonymous LP</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("positions")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "positions"
                ? "bg-purple-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <Wallet className="w-4 h-4 inline mr-2" />
            Positions
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "add"
                ? "bg-purple-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Liquidity
          </button>
          <button
            onClick={() => setActiveTab("remove")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "remove"
                ? "bg-purple-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <Minus className="w-4 h-4 inline mr-2" />
            Remove
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Positions Tab */}
        {activeTab === "positions" && (
          <div>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">Total Value</div>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(totalPositionValue)}
                </div>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">24h Fees Earned</div>
                <div className="text-xl font-bold text-green-400">
                  +{formatCurrency(totalFees)}
                </div>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">Active Positions</div>
                <div className="text-xl font-bold text-white">
                  {MOCK_POSITIONS.length}
                </div>
              </div>
            </div>

            {/* Position List */}
            {MOCK_POSITIONS.length > 0 ? (
              <div className="space-y-4">
                {MOCK_POSITIONS.map((position) => (
                  <div
                    key={position.poolId}
                    className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-700/70 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-gray-800">
                            {position.tokenA.symbol.slice(0, 2)}
                          </div>
                          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-gray-800">
                            {position.tokenB.symbol.slice(0, 2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {position.tokenA.symbol}/{position.tokenB.symbol}
                          </div>
                          <div className="text-xs text-gray-400">
                            {position.sharePercent.toFixed(3)}% Pool Share
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">
                          {formatCurrency(position.valueUsd)}
                        </div>
                        <div className="text-xs text-green-400 flex items-center gap-1 justify-end">
                          <TrendingUp className="w-3 h-3" />
                          {position.apr.toFixed(1)}% APR
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400 text-xs">Token A</div>
                        <div className="text-white">
                          {position.tokenA.amount} {position.tokenA.symbol}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Token B</div>
                        <div className="text-white">
                          {position.tokenB.amount} {position.tokenB.symbol}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">24h Fees</div>
                        <div className="text-green-400">
                          +{formatCurrency(position.fees24h)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          setSelectedPosition(position);
                          setActiveTab("add");
                        }}
                        className="flex-1 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors"
                      >
                        Add More
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPosition(position);
                          setActiveTab("remove");
                        }}
                        className="flex-1 py-2 bg-gray-600/50 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Droplets className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">
                  You don&apos;t have any liquidity positions yet.
                </p>
                <button
                  onClick={() => setActiveTab("add")}
                  className="px-6 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
                >
                  Add Liquidity
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Liquidity Tab */}
        {activeTab === "add" && (
          <div className="max-w-lg mx-auto">
            {/* Pool Selector */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                Select Pool
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowPoolSelector(!showPoolSelector)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white border border-gray-800">
                        {selectedPool.tokenA.symbol.slice(0, 2)}
                      </div>
                      <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white border border-gray-800">
                        {selectedPool.tokenB.symbol.slice(0, 2)}
                      </div>
                    </div>
                    <span className="text-white">
                      {selectedPool.tokenA.symbol}/{selectedPool.tokenB.symbol}
                    </span>
                    <span className="text-xs text-green-400">
                      {selectedPool.apr.toFixed(1)}% APR
                    </span>
                  </div>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </button>

                {showPoolSelector && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-gray-700 border border-gray-600 rounded-xl shadow-xl z-10 overflow-hidden">
                    {AVAILABLE_POOLS.map((pool) => (
                      <button
                        key={pool.id}
                        onClick={() => {
                          setSelectedPool(pool);
                          setShowPoolSelector(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-600 transition-colors ${
                          selectedPool.id === pool.id ? "bg-gray-600" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-white">
                            {pool.tokenA.symbol}/{pool.tokenB.symbol}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">
                            TVL: {formatCurrency(pool.tvl)}
                          </div>
                          <div className="text-xs text-green-400">
                            {pool.apr.toFixed(1)}% APR
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Token A Input */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                {selectedPool.tokenA.symbol} Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={tokenAAmount}
                  onChange={(e) => {
                    setTokenAAmount(e.target.value);
                    // Auto-calculate token B based on pool ratio
                    const value = parseFloat(e.target.value) || 0;
                    setTokenBAmount((value * 95.42).toFixed(2));
                  }}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 text-sm hover:text-purple-300">
                  MAX
                </button>
              </div>
            </div>

            {/* Token B Input */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                {selectedPool.tokenB.symbol} Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={tokenBAmount}
                  onChange={(e) => {
                    setTokenBAmount(e.target.value);
                    const value = parseFloat(e.target.value) || 0;
                    setTokenAAmount((value / 95.42).toFixed(4));
                  }}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 text-sm hover:text-purple-300">
                  MAX
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-700/50 rounded-xl mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Pool Share</span>
                <span className="text-white">~0.05%</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Estimated APR</span>
                <span className="text-green-400">{selectedPool.apr.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">LP Tokens</span>
                <span className="text-white">~125.42</span>
              </div>
            </div>

            {/* Privacy Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl mb-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <span className="text-sm text-white">Anonymous Liquidity</span>
              </div>
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

            {/* Add Button */}
            <button
              disabled={!tokenAAmount || !tokenBAmount}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                tokenAAmount && tokenBAmount
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              {tokenAAmount && tokenBAmount ? (
                <span className="flex items-center justify-center gap-2">
                  <Droplets className="w-5 h-5" />
                  Add Liquidity {privacyMode && "Privately"}
                </span>
              ) : (
                "Enter Amounts"
              )}
            </button>
          </div>
        )}

        {/* Remove Liquidity Tab */}
        {activeTab === "remove" && (
          <div className="max-w-lg mx-auto">
            {selectedPosition ? (
              <>
                {/* Selected Position */}
                <div className="p-4 bg-gray-700/50 rounded-xl mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-gray-800">
                          {selectedPosition.tokenA.symbol.slice(0, 2)}
                        </div>
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-gray-800">
                          {selectedPosition.tokenB.symbol.slice(0, 2)}
                        </div>
                      </div>
                      <span className="text-white font-medium">
                        {selectedPosition.tokenA.symbol}/
                        {selectedPosition.tokenB.symbol}
                      </span>
                    </div>
                    <div className="text-white font-medium">
                      {formatCurrency(selectedPosition.valueUsd)}
                    </div>
                  </div>
                </div>

                {/* Remove Percentage Slider */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">
                    Amount to Remove
                  </label>
                  <div className="text-4xl font-bold text-white text-center mb-4">
                    {removePercent}%
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={removePercent}
                    onChange={(e) => setRemovePercent(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between mt-2">
                    {[25, 50, 75, 100].map((percent) => (
                      <button
                        key={percent}
                        onClick={() => setRemovePercent(percent)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          removePercent === percent
                            ? "bg-purple-500 text-white"
                            : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                        }`}
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Receive Preview */}
                <div className="p-4 bg-gray-700/50 rounded-xl mb-6">
                  <div className="text-sm text-gray-400 mb-3">You will receive</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white">
                        {(
                          parseFloat(selectedPosition.tokenA.amount) *
                          (removePercent / 100)
                        ).toFixed(4)}{" "}
                        {selectedPosition.tokenA.symbol}
                      </span>
                      <span className="text-gray-400">
                        ~
                        {formatCurrency(
                          selectedPosition.valueUsd * 0.5 * (removePercent / 100)
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white">
                        {(
                          parseFloat(selectedPosition.tokenB.amount.replace(",", "")) *
                          (removePercent / 100)
                        ).toFixed(2)}{" "}
                        {selectedPosition.tokenB.symbol}
                      </span>
                      <span className="text-gray-400">
                        ~
                        {formatCurrency(
                          selectedPosition.valueUsd * 0.5 * (removePercent / 100)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  disabled={removePercent === 0}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                    removePercent > 0
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {removePercent > 0 ? (
                    <span className="flex items-center justify-center gap-2">
                      <Minus className="w-5 h-5" />
                      Remove {removePercent}% Liquidity
                    </span>
                  ) : (
                    "Select Amount"
                  )}
                </button>
              </>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  Select a position from the Positions tab to remove liquidity.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
