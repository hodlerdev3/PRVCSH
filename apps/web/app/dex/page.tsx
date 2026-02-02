"use client";

/**
 * Privacy DEX Page
 *
 * Main page for the privacy-preserving DEX with swap interface and pool stats.
 */

import React from "react";
import { MainLayout } from "../components/MainLayout";
import { SwapCard } from "./components/SwapCard";
import { PoolStats } from "./components/PoolStats";
import { RecentTrades } from "./components/RecentTrades";
import { LiquiditySection } from "./components/LiquiditySection";

export default function DexPage() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black py-8">
        {/* Header */}
        <div className="container mx-auto px-4 mb-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Privacy DEX
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto">
              Swap tokens privately with zero-knowledge proofs. 
              Your trades are protected from MEV and front-running.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Swap */}
            <div className="lg:col-span-2">
              <SwapCard />
            </div>

            {/* Right Column - Pool Stats */}
            <div className="lg:col-span-1 space-y-6">
              <PoolStats />
              <RecentTrades />
            </div>
          </div>

          {/* Liquidity Section */}
          <div className="mt-8">
            <LiquiditySection />
          </div>
        </div>

        {/* Privacy Badge */}
        <div className="fixed bottom-4 right-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-medium">
              Privacy Mode Active
            </span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
