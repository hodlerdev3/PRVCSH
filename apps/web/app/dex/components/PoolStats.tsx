"use client";

/**
 * PoolStats Component
 *
 * Displays pool statistics including TVL, volume, and fees.
 */

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Users,
  ChevronDown,
  ExternalLink,
  Droplets,
} from "lucide-react";

// ============================================
// Types
// ============================================

interface PoolData {
  id: string;
  tokenA: { symbol: string; icon?: string };
  tokenB: { symbol: string; icon?: string };
  tvl: number;
  volume24h: number;
  fees24h: number;
  apr: number;
  change24h: number;
  lpCount: number;
}

// ============================================
// Mock Data
// ============================================

const MOCK_POOLS: PoolData[] = [
  {
    id: "sol-usdc",
    tokenA: { symbol: "SOL", icon: "/tokens/sol.svg" },
    tokenB: { symbol: "USDC", icon: "/tokens/usdc.svg" },
    tvl: 12500000,
    volume24h: 8750000,
    fees24h: 26250,
    apr: 42.5,
    change24h: 5.2,
    lpCount: 1250,
  },
  {
    id: "sol-usdt",
    tokenA: { symbol: "SOL", icon: "/tokens/sol.svg" },
    tokenB: { symbol: "USDT", icon: "/tokens/usdt.svg" },
    tvl: 8200000,
    volume24h: 5100000,
    fees24h: 15300,
    apr: 38.2,
    change24h: -2.1,
    lpCount: 890,
  },
  {
    id: "msol-sol",
    tokenA: { symbol: "mSOL", icon: "/tokens/msol.svg" },
    tokenB: { symbol: "SOL", icon: "/tokens/sol.svg" },
    tvl: 5600000,
    volume24h: 2800000,
    fees24h: 8400,
    apr: 25.8,
    change24h: 1.5,
    lpCount: 520,
  },
  {
    id: "bonk-sol",
    tokenA: { symbol: "BONK", icon: "/tokens/bonk.svg" },
    tokenB: { symbol: "SOL", icon: "/tokens/sol.svg" },
    tvl: 3200000,
    volume24h: 4500000,
    fees24h: 13500,
    apr: 85.3,
    change24h: 12.4,
    lpCount: 2100,
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

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toFixed(0);
}

// ============================================
// PoolStats Component
// ============================================

export function PoolStats() {
  const [selectedPool, setSelectedPool] = useState<PoolData>(MOCK_POOLS[0]!);
  const [showDropdown, setShowDropdown] = useState(false);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    return MOCK_POOLS.reduce(
      (acc, pool) => ({
        totalTvl: acc.totalTvl + pool.tvl,
        totalVolume: acc.totalVolume + pool.volume24h,
        totalFees: acc.totalFees + pool.fees24h,
        totalLPs: acc.totalLPs + pool.lpCount,
      }),
      { totalTvl: 0, totalVolume: 0, totalFees: 0, totalLPs: 0 }
    );
  }, []);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          Pool Stats
        </h3>

        {/* Pool Selector */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <span className="text-sm text-white">
              {selectedPool.tokenA.symbol}/{selectedPool.tokenB.symbol}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded-xl shadow-xl z-10 overflow-hidden">
              {MOCK_POOLS.map((pool) => (
                <button
                  key={pool.id}
                  onClick={() => {
                    setSelectedPool(pool);
                    setShowDropdown(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-600 transition-colors ${
                    selectedPool.id === pool.id ? "bg-gray-600" : ""
                  }`}
                >
                  <span className="text-sm text-white">
                    {pool.tokenA.symbol}/{pool.tokenB.symbol}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pool Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">TVL</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatCurrency(selectedPool.tvl)}
          </div>
          <div
            className={`flex items-center gap-1 mt-1 text-xs ${
              selectedPool.change24h >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {selectedPool.change24h >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(selectedPool.change24h).toFixed(1)}%
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Volume 24h</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatCurrency(selectedPool.volume24h)}
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Fees 24h</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatCurrency(selectedPool.fees24h)}
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-400">APR</span>
          </div>
          <div className="text-xl font-bold text-green-400">
            {selectedPool.apr.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* LP Info */}
      <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Liquidity Providers</span>
        </div>
        <span className="text-sm text-white font-medium">
          {formatNumber(selectedPool.lpCount)}
        </span>
      </div>

      {/* Aggregate Stats */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h4 className="text-sm font-medium text-gray-400 mb-4">
          Total Protocol Stats
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Total TVL</span>
            <span className="text-sm text-white font-medium">
              {formatCurrency(aggregateStats.totalTvl)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">24h Volume</span>
            <span className="text-sm text-white font-medium">
              {formatCurrency(aggregateStats.totalVolume)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">24h Fees</span>
            <span className="text-sm text-white font-medium">
              {formatCurrency(aggregateStats.totalFees)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Total LPs</span>
            <span className="text-sm text-white font-medium">
              {formatNumber(aggregateStats.totalLPs)}
            </span>
          </div>
        </div>
      </div>

      {/* View All Pools */}
      <button className="w-full mt-4 py-2 text-sm text-purple-400 hover:text-purple-300 flex items-center justify-center gap-2">
        View All Pools
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
}
