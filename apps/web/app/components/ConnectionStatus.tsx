"use client";

/**
 * ConnectionStatus Component
 *
 * RPC connection health indicator with latency display.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Wifi, WifiOff, AlertCircle, RefreshCw } from "lucide-react";

// ============================================
// Types
// ============================================

export type ConnectionState = "connected" | "connecting" | "disconnected" | "error";

export interface ConnectionStatusProps {
  /** Show latency in ms */
  showLatency?: boolean;
  /** Show network name */
  showNetwork?: boolean;
  /** Check interval in ms */
  checkInterval?: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
  /** Minimal mode - just icon */
  minimal?: boolean;
}

interface ConnectionInfo {
  state: ConnectionState;
  latency: number | null;
  lastChecked: Date | null;
  endpoint: string;
}

// ============================================
// Size Variants
// ============================================

const sizeClasses = {
  sm: {
    container: "text-xs gap-1.5",
    icon: 12,
    dot: "w-1.5 h-1.5",
  },
  md: {
    container: "text-sm gap-2",
    icon: 14,
    dot: "w-2 h-2",
  },
  lg: {
    container: "text-base gap-2.5",
    icon: 16,
    dot: "w-2.5 h-2.5",
  },
};

// ============================================
// State Colors
// ============================================

const stateConfig = {
  connected: {
    color: "text-emerald-400",
    bgColor: "bg-emerald-400",
    label: "Connected",
  },
  connecting: {
    color: "text-yellow-400",
    bgColor: "bg-yellow-400",
    label: "Connecting",
  },
  disconnected: {
    color: "text-neutral-500",
    bgColor: "bg-neutral-500",
    label: "Disconnected",
  },
  error: {
    color: "text-red-400",
    bgColor: "bg-red-400",
    label: "Error",
  },
};

// ============================================
// Helper Functions
// ============================================

function extractNetworkName(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    const host = url.hostname;

    if (host.includes("mainnet")) return "Mainnet";
    if (host.includes("devnet")) return "Devnet";
    if (host.includes("testnet")) return "Testnet";
    if (host.includes("localhost") || host.includes("127.0.0.1")) return "Localhost";

    return "Custom RPC";
  } catch {
    return "Unknown";
  }
}

function getLatencyColor(latency: number): string {
  if (latency < 100) return "text-emerald-400";
  if (latency < 300) return "text-yellow-400";
  return "text-red-400";
}

// ============================================
// Component
// ============================================

export function ConnectionStatus({
  showLatency = true,
  showNetwork = false,
  checkInterval = 30000, // 30 seconds
  size = "md",
  className = "",
  minimal = false,
}: ConnectionStatusProps) {
  const { connection } = useConnection();
  const sizeConfig = sizeClasses[size];

  const [info, setInfo] = useState<ConnectionInfo>({
    state: "connecting",
    latency: null,
    lastChecked: null,
    endpoint: "",
  });

  const [isChecking, setIsChecking] = useState(false);

  // Check connection health
  const checkConnection = useCallback(async () => {
    if (!connection) {
      setInfo((prev) => ({
        ...prev,
        state: "disconnected",
        latency: null,
      }));
      return;
    }

    setIsChecking(true);
    const startTime = performance.now();

    try {
      // Get recent block hash as health check
      await connection.getLatestBlockhash();
      const latency = Math.round(performance.now() - startTime);

      setInfo({
        state: "connected",
        latency,
        lastChecked: new Date(),
        endpoint: connection.rpcEndpoint,
      });
    } catch (error) {
      setInfo((prev) => ({
        ...prev,
        state: "error",
        latency: null,
        lastChecked: new Date(),
      }));
    } finally {
      setIsChecking(false);
    }
  }, [connection]);

  // Initial check and interval
  useEffect(() => {
    checkConnection();

    const intervalId = setInterval(checkConnection, checkInterval);
    return () => clearInterval(intervalId);
  }, [checkConnection, checkInterval]);

  // Update endpoint when connection changes
  useEffect(() => {
    if (connection) {
      setInfo((prev) => ({
        ...prev,
        endpoint: connection.rpcEndpoint,
      }));
    }
  }, [connection]);

  const config = stateConfig[info.state];
  const networkName = useMemo(
    () => extractNetworkName(info.endpoint),
    [info.endpoint]
  );

  // Get appropriate icon
  const StatusIcon = useMemo(() => {
    switch (info.state) {
      case "connected":
        return Wifi;
      case "connecting":
        return RefreshCw;
      case "error":
        return AlertCircle;
      default:
        return WifiOff;
    }
  }, [info.state]);

  // Minimal mode - just status dot
  if (minimal) {
    return (
      <div
        className={`flex items-center ${className}`}
        title={`${config.label}${info.latency ? ` (${info.latency}ms)` : ""}`}
      >
        <span
          className={`
            ${sizeConfig.dot} rounded-full ${config.bgColor}
            ${info.state === "connecting" ? "animate-pulse" : ""}
          `}
        />
      </div>
    );
  }

  return (
    <div
      className={`
        flex items-center ${sizeConfig.container}
        px-2.5 py-1.5 rounded-lg
        bg-neutral-900/50 border border-white/5
        ${className}
      `}
    >
      {/* Status Icon */}
      <div className="relative">
        <StatusIcon
          size={sizeConfig.icon}
          className={`
            ${config.color}
            ${isChecking ? "animate-spin" : ""}
          `}
        />
        {/* Status Dot */}
        <span
          className={`
            absolute -top-0.5 -right-0.5
            ${sizeConfig.dot} rounded-full ${config.bgColor}
            ${info.state === "connecting" ? "animate-pulse" : ""}
          `}
        />
      </div>

      {/* Status Text */}
      <div className="flex items-center gap-1.5">
        <span className={`font-medium ${config.color}`}>
          {config.label}
        </span>

        {/* Network Name */}
        {showNetwork && info.state === "connected" && (
          <span className="text-neutral-500">
            ({networkName})
          </span>
        )}

        {/* Latency */}
        {showLatency && info.latency !== null && info.state === "connected" && (
          <span className={`${getLatencyColor(info.latency)} tabular-nums`}>
            {info.latency}ms
          </span>
        )}
      </div>

      {/* Manual Refresh Button */}
      <button
        type="button"
        onClick={checkConnection}
        disabled={isChecking}
        className="
          p-1 rounded-md
          text-neutral-500 hover:text-neutral-300
          hover:bg-white/5
          transition-colors duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        aria-label="Refresh connection status"
        title="Refresh"
      >
        <RefreshCw
          size={sizeConfig.icon - 2}
          className={isChecking ? "animate-spin" : ""}
        />
      </button>
    </div>
  );
}

export default ConnectionStatus;
