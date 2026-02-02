"use client";

/**
 * TransactionHistory Component
 *
 * Display a list of past privacy transactions (deposits and withdrawals).
 * Includes transaction row, empty state, and explorer links.
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Shield,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react";

// ============================================
// Types
// ============================================

export type TransactionType = "deposit" | "withdraw";
export type TransactionStatus = "pending" | "confirmed" | "failed";

export interface Transaction {
  /** Unique transaction ID */
  id: string;
  /** Transaction signature/hash */
  signature: string;
  /** Transaction type */
  type: TransactionType;
  /** Token symbol */
  tokenSymbol: string;
  /** Token mint address */
  tokenMint: string;
  /** Amount (formatted string) */
  amount: string;
  /** Recipient address (for withdrawals) */
  recipient?: string;
  /** Transaction status */
  status: TransactionStatus;
  /** Timestamp (ISO string or Date) */
  timestamp: string | Date;
  /** Block number/slot */
  slot?: number;
  /** Fee in SOL */
  fee?: string;
}

export interface TransactionHistoryProps {
  /** List of transactions */
  transactions?: Transaction[];
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Refresh handler */
  onRefresh?: () => void;
  /** Transaction click handler */
  onTransactionClick?: (tx: Transaction) => void;
  /** Network for explorer links */
  network?: "mainnet-beta" | "devnet" | "testnet";
  /** Explorer type */
  explorer?: "solana" | "solscan";
  /** Maximum transactions to show initially */
  initialDisplayCount?: number;
  /** Compact mode */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format timestamp to full date
 */
function formatFullDate(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get explorer URL for transaction
 */
function getExplorerUrl(
  signature: string,
  explorer: "solana" | "solscan",
  network: "mainnet-beta" | "devnet" | "testnet"
): string {
  if (explorer === "solscan") {
    const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`;
    return `https://solscan.io/tx/${signature}${cluster}`;
  }

  return `https://explorer.solana.com/tx/${signature}?cluster=${network}`;
}

/**
 * Truncate signature for display
 */
function truncateSignature(signature: string): string {
  if (signature.length <= 12) return signature;
  return `${signature.slice(0, 6)}...${signature.slice(-6)}`;
}

// ============================================
// Status Badge Component
// ============================================

interface StatusBadgeProps {
  status: TransactionStatus;
  compact?: boolean;
}

function StatusBadge({ status, compact }: StatusBadgeProps) {
  const config = {
    pending: {
      icon: <Loader2 size={14} className="animate-spin" />,
      text: "Pending",
      className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    },
    confirmed: {
      icon: <CheckCircle2 size={14} />,
      text: "Confirmed",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    failed: {
      icon: <XCircle size={14} />,
      text: "Failed",
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    },
  };

  const { icon, text, className } = config[status];

  if (compact) {
    return (
      <span className={`p-1 rounded ${className}`} title={text}>
        {icon}
      </span>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2 py-1 rounded-lg text-xs font-medium
        border ${className}
      `}
    >
      {icon}
      {text}
    </span>
  );
}

// ============================================
// Transaction Type Icon
// ============================================

interface TypeIconProps {
  type: TransactionType;
  size?: number;
}

function TypeIcon({ type, size = 18 }: TypeIconProps) {
  if (type === "deposit") {
    return (
      <div className="p-2 rounded-lg bg-emerald-500/10">
        <ArrowDownToLine size={size} className="text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="p-2 rounded-lg bg-cyan-500/10">
      <ArrowUpFromLine size={size} className="text-cyan-400" />
    </div>
  );
}

// ============================================
// Transaction Row Component
// ============================================

interface TransactionRowProps {
  transaction: Transaction;
  explorerUrl: string;
  compact?: boolean;
  onClick?: () => void;
}

function TransactionRow({
  transaction,
  explorerUrl,
  compact,
  onClick,
}: TransactionRowProps) {
  const { type, tokenSymbol, amount, status, timestamp, signature, recipient } =
    transaction;

  const typeLabel = type === "deposit" ? "Deposit" : "Withdraw";
  const amountColor = type === "deposit" ? "text-emerald-400" : "text-cyan-400";

  if (compact) {
    return (
      <div
        className="
          flex items-center justify-between p-3
          bg-white/5 rounded-lg border border-white/5
          hover:bg-white/10 transition-colors cursor-pointer
        "
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <TypeIcon type={type} size={16} />
          <div>
            <p className={`font-medium ${amountColor}`}>
              {type === "deposit" ? "+" : "-"}
              {amount} {tokenSymbol}
            </p>
            <p className="text-xs text-neutral-500">
              {formatRelativeTime(timestamp)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} compact />
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
            aria-label="View on explorer"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        p-4 rounded-xl
        bg-white/5 border border-white/5
        hover:bg-white/10 transition-colors cursor-pointer
      "
      onClick={onClick}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <TypeIcon type={type} />
          <div>
            <p className="font-medium text-white">{typeLabel}</p>
            <p className="text-xs text-neutral-500">
              {formatRelativeTime(timestamp)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-semibold ${amountColor}`}>
            {type === "deposit" ? "+" : "-"}
            {amount} {tokenSymbol}
          </p>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Details Row */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatFullDate(timestamp)}
          </span>
          {recipient && (
            <span className="font-mono">
              To: {recipient.slice(0, 4)}...{recipient.slice(-4)}
            </span>
          )}
        </div>

        {/* Explorer Link */}
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="
            flex items-center gap-1.5
            text-xs text-neutral-400 hover:text-white
            transition-colors
          "
        >
          <span className="font-mono">{truncateSignature(signature)}</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

// ============================================
// Empty State Component
// ============================================

interface EmptyStateProps {
  message?: string;
}

function EmptyState({ message = "No transactions yet" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-neutral-800/50 mb-4">
        <History size={32} className="text-neutral-500" />
      </div>
      <p className="text-neutral-400 font-medium mb-2">{message}</p>
      <p className="text-sm text-neutral-500 max-w-xs">
        Your deposit and withdrawal transactions will appear here once you start
        using the privacy mixer.
      </p>
    </div>
  );
}

// ============================================
// Loading Skeleton
// ============================================

function TransactionSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-700" />
          <div>
            <div className="w-16 h-4 rounded bg-neutral-700 mb-1" />
            <div className="w-12 h-3 rounded bg-neutral-700" />
          </div>
        </div>
        <div className="text-right">
          <div className="w-24 h-4 rounded bg-neutral-700 mb-1" />
          <div className="w-16 h-5 rounded bg-neutral-700" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="w-32 h-3 rounded bg-neutral-700" />
        <div className="w-24 h-3 rounded bg-neutral-700" />
      </div>
    </div>
  );
}

// ============================================
// TransactionHistory Component
// ============================================

export function TransactionHistory({
  transactions = [],
  loading = false,
  error = null,
  onRefresh,
  onTransactionClick,
  network = "devnet",
  explorer = "solana",
  initialDisplayCount = 5,
  compact = false,
  className = "",
}: TransactionHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  // Displayed transactions
  const displayedTransactions = useMemo(() => {
    if (showAll) return transactions;
    return transactions.slice(0, initialDisplayCount);
  }, [transactions, showAll, initialDisplayCount]);

  const hasMore = transactions.length > initialDisplayCount;

  // Generate explorer URLs
  const getUrl = useCallback(
    (signature: string) => getExplorerUrl(signature, explorer, network),
    [explorer, network]
  );

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-emerald-400" />
          <h3 className="font-semibold text-white">Transaction History</h3>
          {transactions.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-neutral-400">
              {transactions.length}
            </span>
          )}
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="
              p-2 rounded-lg
              text-neutral-400 hover:text-white
              hover:bg-white/10
              disabled:opacity-50
              transition-colors
            "
            aria-label="Refresh transactions"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && transactions.length === 0 && (
        <div className="space-y-3">
          <TransactionSkeleton />
          <TransactionSkeleton />
          <TransactionSkeleton />
        </div>
      )}

      {/* Empty State */}
      {!loading && transactions.length === 0 && <EmptyState />}

      {/* Transaction List */}
      {displayedTransactions.length > 0 && (
        <div className="space-y-3">
          {displayedTransactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              explorerUrl={getUrl(tx.signature)}
              compact={compact}
              onClick={() => onTransactionClick?.(tx)}
            />
          ))}
        </div>
      )}

      {/* Show More/Less Button */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="
            w-full mt-4 py-3 rounded-xl
            flex items-center justify-center gap-2
            text-sm font-medium text-neutral-400
            bg-white/5 border border-white/5
            hover:bg-white/10 hover:text-white
            transition-colors
          "
        >
          {showAll ? (
            <>
              <ChevronUp size={16} />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Show All ({transactions.length})
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ============================================
// Compact Transaction List (for sidebar)
// ============================================

export interface CompactTransactionListProps {
  transactions?: Transaction[];
  network?: "mainnet-beta" | "devnet" | "testnet";
  explorer?: "solana" | "solscan";
  maxItems?: number;
  className?: string;
}

export function CompactTransactionList({
  transactions = [],
  network = "devnet",
  explorer = "solana",
  maxItems = 3,
  className = "",
}: CompactTransactionListProps) {
  const displayedTxs = transactions.slice(0, maxItems);

  if (displayedTxs.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-sm text-neutral-500">No recent transactions</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {displayedTxs.map((tx) => {
        const url = getExplorerUrl(tx.signature, explorer, network);
        const amountColor =
          tx.type === "deposit" ? "text-emerald-400" : "text-cyan-400";

        return (
          <a
            key={tx.id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex items-center justify-between p-2 rounded-lg
              hover:bg-white/5 transition-colors
            "
          >
            <div className="flex items-center gap-2">
              {tx.type === "deposit" ? (
                <ArrowDownToLine size={14} className="text-emerald-400" />
              ) : (
                <ArrowUpFromLine size={14} className="text-cyan-400" />
              )}
              <span className={`text-sm font-medium ${amountColor}`}>
                {tx.type === "deposit" ? "+" : "-"}
                {tx.amount} {tx.tokenSymbol}
              </span>
            </div>
            <span className="text-xs text-neutral-500">
              {formatRelativeTime(tx.timestamp)}
            </span>
          </a>
        );
      })}
    </div>
  );
}

export default TransactionHistory;
