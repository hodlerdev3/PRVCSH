"use client";

/**
 * RecentTrades Component
 *
 * Displays recent trades on the DEX with privacy indicators.
 */

import React, { useMemo } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";

// ============================================
// Types
// ============================================

interface Trade {
  id: string;
  fromToken: { symbol: string; amount: string };
  toToken: { symbol: string; amount: string };
  timestamp: Date;
  isPrivate: boolean;
  txHash?: string;
  priceUsd: number;
}

// ============================================
// Mock Data
// ============================================

const MOCK_TRADES: Trade[] = [
  {
    id: "1",
    fromToken: { symbol: "SOL", amount: "10.5" },
    toToken: { symbol: "USDC", amount: "1,002.75" },
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    isPrivate: true,
    priceUsd: 1002.75,
  },
  {
    id: "2",
    fromToken: { symbol: "USDC", amount: "500.00" },
    toToken: { symbol: "SOL", amount: "5.23" },
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    isPrivate: false,
    txHash: "5xYz...abc1",
    priceUsd: 500,
  },
  {
    id: "3",
    fromToken: { symbol: "mSOL", amount: "3.75" },
    toToken: { symbol: "SOL", amount: "3.82" },
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    isPrivate: true,
    priceUsd: 364.09,
  },
  {
    id: "4",
    fromToken: { symbol: "BONK", amount: "5,000,000" },
    toToken: { symbol: "SOL", amount: "1.25" },
    timestamp: new Date(Date.now() - 18 * 60 * 1000),
    isPrivate: true,
    priceUsd: 119.28,
  },
  {
    id: "5",
    fromToken: { symbol: "SOL", amount: "25.00" },
    toToken: { symbol: "USDT", amount: "2,385.50" },
    timestamp: new Date(Date.now() - 32 * 60 * 1000),
    isPrivate: false,
    txHash: "7kLm...def2",
    priceUsd: 2385.5,
  },
];

// ============================================
// Helper Functions
// ============================================

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ago`;
  }
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatUsd(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

// ============================================
// RecentTrades Component
// ============================================

export function RecentTrades() {
  const privateTradeCount = useMemo(() => {
    return MOCK_TRADES.filter((t) => t.isPrivate).length;
  }, []);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-400" />
          Recent Trades
        </h3>
        <div className="flex items-center gap-1 text-xs text-green-400">
          <ShieldCheck className="w-3 h-3" />
          {privateTradeCount}/{MOCK_TRADES.length} Private
        </div>
      </div>

      {/* Trade List */}
      <div className="space-y-3">
        {MOCK_TRADES.map((trade) => (
          <div
            key={trade.id}
            className="p-3 bg-gray-700/50 rounded-xl hover:bg-gray-700/70 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              {/* Trade Pair */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white font-medium">
                  {trade.fromToken.amount} {trade.fromToken.symbol}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-500" />
                <span className="text-white font-medium">
                  {trade.toToken.amount} {trade.toToken.symbol}
                </span>
              </div>

              {/* Privacy Indicator */}
              {trade.isPrivate ? (
                <div className="flex items-center gap-1 text-green-400">
                  <EyeOff className="w-3 h-3" />
                  <span className="text-xs">Private</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400">
                  <Eye className="w-3 h-3" />
                  <span className="text-xs">Public</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(trade.timestamp)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{formatUsd(trade.priceUsd)}</span>
                {trade.txHash && (
                  <button
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    title="View on Explorer"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All */}
      <button className="w-full mt-4 py-2 text-sm text-purple-400 hover:text-purple-300 flex items-center justify-center gap-2">
        View All Trades
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
}
