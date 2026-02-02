"use client";

/**
 * PRVCSH - Main Mixer Page
 * Zero-Knowledge Privacy for Solana
 *
 * FULLY FUNCTIONAL - Connected to real wallet data
 */

import { MainLayout } from "./components/MainLayout";
import { MixerForm } from "./components/MixerForm";
import { useWallet } from "@solana/wallet-adapter-react";
import { Shield, Lock, Zap, Eye, EyeOff, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { useWalletBalances } from "./hooks/useWalletBalances";
import { useShieldedBalances } from "./hooks/useShieldedBalances";
import { useTransactionHistory } from "./hooks/useTransactionHistory";
import { useMixer } from "./hooks/useMixer";
import { TokenInfo } from "./components/TokenSelector";
import { NATIVE_SOL_MINT } from "./data/tokens";

// ============================================
// Hero Section
// ============================================

function HeroSection() {
  return (
    <section className="text-center py-12 md:py-20">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cipher-500/10 border border-cipher-500/20 mb-6">
        <Shield className="w-4 h-4 text-cipher-500" />
        <span className="text-sm font-medium text-cipher-500">
          Powered by ZK-SNARKs on Solana
        </span>
      </div>

      <h1 className="text-4xl md:text-6xl font-bold font-display mb-4">
        <span className="text-text-primary">Shield Your </span>
        <span className="bg-gradient-to-r from-cipher-500 via-cipher-400 to-proof-500 bg-clip-text text-transparent">
          Transactions
        </span>
      </h1>

      <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-8">
        Privacy is a right, not a privilege. Deposit, mix, and withdraw your SOL
        and tokens with zero-knowledge proofs.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-tertiary">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-proof-500" />
          <span>Audited by Zigtur</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning-default" />
          <span>~30s Proof Time</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cipher-500" />
          <span>Groth16 ZK-SNARKs</span>
        </div>
      </div>
    </section>
  );
}

// ============================================
// Connect Wallet CTA
// ============================================

function ConnectWalletCTA() {
  return (
    <div className="glass-card p-8 md:p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-cipher-500/10 flex items-center justify-center">
        <Shield className="w-8 h-8 text-cipher-500" />
      </div>
      <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
      <p className="text-text-secondary mb-6 max-w-md mx-auto">
        Connect your Solana wallet to start using the Privacy Mixer. Your funds
        remain in your control at all times.
      </p>
      <p className="text-sm text-text-tertiary">
        Supports Phantom, Solflare, Backpack, and more
      </p>
    </div>
  );
}

// ============================================
// Balance Card Component
// ============================================

interface BalanceCardProps {
  solBalance: string;
  shieldedSolBalance: string;
  showBalances: boolean;
  onToggleVisibility: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function BalanceCard({
  solBalance,
  shieldedSolBalance,
  showBalances,
  onToggleVisibility,
  onRefresh,
  isRefreshing,
}: BalanceCardProps) {
  // Calculate USD values (using approximate SOL price)
  const solPrice = 100; // In production, fetch from price API
  const publicUsd = parseFloat(solBalance) * solPrice;
  const shieldedUsd = parseFloat(shieldedSolBalance) * solPrice;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Your Balances</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-bg-hover transition-colors disabled:opacity-50"
            aria-label="Refresh balances"
          >
            <RefreshCw className={`w-4 h-4 text-text-tertiary ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onToggleVisibility}
            className="p-2 rounded-lg hover:bg-bg-hover transition-colors"
            aria-label={showBalances ? "Hide balances" : "Show balances"}
          >
            {showBalances ? (
              <EyeOff className="w-4 h-4 text-text-tertiary" />
            ) : (
              <Eye className="w-4 h-4 text-text-tertiary" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-text-tertiary mb-1">Public Balance</p>
          <p className="text-2xl font-bold font-mono">
            {showBalances ? solBalance : "••••••"} SOL
          </p>
          <p className="text-sm text-text-secondary">
            {showBalances ? `≈ $${publicUsd.toFixed(2)}` : "••••••"}
          </p>
        </div>

        <div className="border-t border-border-subtle pt-4">
          <p className="text-sm text-text-tertiary mb-1 flex items-center gap-2">
            <Shield className="w-3 h-3 text-cipher-500" />
            Shielded Balance
          </p>
          <p className="text-2xl font-bold font-mono text-cipher-500">
            {showBalances ? shieldedSolBalance : "••••••"} SOL
          </p>
          <p className="text-sm text-text-secondary">
            {showBalances ? `≈ $${shieldedUsd.toFixed(2)}` : "••••••"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Transaction History Component
// ============================================

interface TransactionItemProps {
  type: "deposit" | "withdraw";
  tokenSymbol: string;
  amount: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  txSignature?: string;
}

function TransactionItem({ type, tokenSymbol, amount, timestamp, status, txSignature }: TransactionItemProps) {
  const explorerUrl = txSignature
    ? `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`
    : null;

  const statusColors = {
    pending: "text-yellow-400",
    confirmed: "text-green-400",
    failed: "text-red-400",
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            type === "deposit"
              ? "bg-proof-500/10 text-proof-500"
              : "bg-cipher-500/10 text-cipher-500"
          }`}
        >
          {type === "deposit" ? (
            <Lock className="w-4 h-4" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium capitalize">{type}</p>
            {status === "pending" && (
              <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />
            )}
          </div>
          <p className={`text-xs ${statusColors[status]}`}>
            {status}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-mono">
          {type === "deposit" ? "+" : "-"}
          {amount} {tokenSymbol}
        </p>
        <div className="flex items-center gap-2 justify-end">
          <p className="text-xs text-text-tertiary">
            {new Date(timestamp).toLocaleTimeString()}
          </p>
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-tertiary hover:text-cipher-500"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionHistoryCard() {
  const { transactions } = useTransactionHistory();
  const recentTxs = transactions.slice(0, 5);

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
      {recentTxs.length > 0 ? (
        <div className="space-y-1">
          {recentTxs.map((tx) => (
            <TransactionItem
              key={tx.id}
              type={tx.type}
              tokenSymbol={tx.tokenSymbol}
              amount={tx.amount}
              timestamp={tx.timestamp}
              status={tx.status}
              txSignature={tx.txSignature}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-tertiary text-center py-8">
          No transactions yet. Make your first deposit to get started!
        </p>
      )}
    </div>
  );
}

// ============================================
// Main Dashboard
// ============================================

function Dashboard() {
  const [showBalances, setShowBalances] = useState(true);

  // Real wallet balances
  const {
    solBalance,
    publicBalances,
    isLoading: isLoadingBalances,
    refresh: refreshBalances,
  } = useWalletBalances();

  // Shielded balances
  const { balances: shieldedBalances } = useShieldedBalances();

  // Mixer operations
  const { deposit, withdraw, state: mixerState, reset: resetMixer } = useMixer();

  // Get shielded SOL balance
  const shieldedSolBalance = shieldedBalances[NATIVE_SOL_MINT] ?? "0";

  // Handle deposit
  const handleDeposit = useCallback(async (token: TokenInfo, amount: string): Promise<string> => {
    resetMixer();
    const signature = await deposit(token, amount);
    if (signature) {
      // Refresh balances after successful deposit
      setTimeout(() => refreshBalances(), 2000);
    }
    return signature ?? "";
  }, [deposit, resetMixer, refreshBalances]);

  // Handle withdraw
  const handleWithdraw = useCallback(async (token: TokenInfo, amount: string, recipient: string): Promise<string> => {
    resetMixer();
    const signature = await withdraw(token, amount, recipient);
    return signature ?? "";
  }, [withdraw, resetMixer]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Balances & History */}
      <div className="lg:col-span-1 space-y-6">
        <BalanceCard
          solBalance={solBalance}
          shieldedSolBalance={shieldedSolBalance}
          showBalances={showBalances}
          onToggleVisibility={() => setShowBalances(!showBalances)}
          onRefresh={refreshBalances}
          isRefreshing={isLoadingBalances}
        />
        <TransactionHistoryCard />
      </div>

      {/* Right Column - Mixer Form */}
      <div className="lg:col-span-2">
        <MixerForm
          publicBalances={publicBalances}
          shieldedBalances={shieldedBalances}
          onDeposit={handleDeposit}
          onWithdraw={handleWithdraw}
        />
      </div>
    </div>
  );
}

// ============================================
// Features Section
// ============================================

function FeaturesSection() {
  return (
    <section className="py-16 mt-8">
      <h2 className="text-2xl font-bold text-center mb-12">
        Why PRVCSH?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cipher-500/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-cipher-500" />
          </div>
          <h3 className="font-semibold mb-2">Zero-Knowledge Privacy</h3>
          <p className="text-sm text-text-secondary">
            Groth16 ZK-SNARKs ensure your transaction links are completely
            hidden.
          </p>
        </div>

        <div className="glass-card p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-proof-500/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-proof-500" />
          </div>
          <h3 className="font-semibold mb-2">Non-Custodial</h3>
          <p className="text-sm text-text-secondary">
            Your keys, your coins. Funds are secured by smart contracts, not
            third parties.
          </p>
        </div>

        <div className="glass-card p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-warning-default/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-warning-default" />
          </div>
          <h3 className="font-semibold mb-2">Fast & Cheap</h3>
          <p className="text-sm text-text-secondary">
            Built on Solana for sub-second finality and minimal transaction
            fees.
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function Home() {
  const { connected } = useWallet();

  return (
    <MainLayout background="gradient">
      <div className="max-w-6xl mx-auto px-4">
        <HeroSection />
        
        {connected ? <Dashboard /> : <ConnectWalletCTA />}

        <FeaturesSection />
      </div>
    </MainLayout>
  );
}
