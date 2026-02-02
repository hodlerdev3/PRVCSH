"use client";

/**
 * TokenSelector Component
 *
 * Dropdown selector for choosing tokens with icons and metadata.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { ChevronDown, Check, Search, X } from "lucide-react";

// ============================================
// Types
// ============================================

export interface TokenInfo {
  /** Token mint address */
  mint: string;
  /** Token symbol (e.g., "SOL") */
  symbol: string;
  /** Token name (e.g., "Solana") */
  name: string;
  /** Number of decimals */
  decimals: number;
  /** Token icon URL */
  icon?: string;
  /** User's balance (optional) */
  balance?: string;
  /** USD price (optional) */
  price?: number;
}

export interface TokenSelectorProps {
  /** Currently selected token */
  selectedToken: TokenInfo | null;
  /** Available tokens to choose from */
  tokens: TokenInfo[];
  /** Token selection handler */
  onSelect: (token: TokenInfo) => void;
  /** Label text */
  label?: string;
  /** Placeholder when no token selected */
  placeholder?: string;
  /** Show search input */
  showSearch?: boolean;
  /** Show balance in dropdown */
  showBalance?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
}

// ============================================
// Size Classes
// ============================================

const sizeClasses = {
  sm: {
    trigger: "h-10 px-3 text-sm",
    icon: 20,
    dropdown: "py-1",
    item: "px-3 py-2 text-sm",
    itemIcon: 24,
  },
  md: {
    trigger: "h-12 px-4 text-base",
    icon: 24,
    dropdown: "py-2",
    item: "px-4 py-2.5 text-sm",
    itemIcon: 28,
  },
  lg: {
    trigger: "h-14 px-4 text-lg",
    icon: 28,
    dropdown: "py-2",
    item: "px-4 py-3 text-base",
    itemIcon: 32,
  },
};

// ============================================
// Token Icon Component
// ============================================

function TokenIcon({
  token,
  size = 24,
  className = "",
}: {
  token: TokenInfo;
  size?: number;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  // Fallback to first letter if no icon
  if (!token.icon || hasError) {
    return (
      <div
        className={`
          flex items-center justify-center
          rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700
          text-white font-bold
          ${className}
        `}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {token.symbol.charAt(0)}
      </div>
    );
  }

  return (
    <Image
      src={token.icon}
      alt={token.symbol}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      onError={() => setHasError(true)}
    />
  );
}

// ============================================
// TokenSelector Component
// ============================================

export function TokenSelector({
  selectedToken,
  tokens,
  onSelect,
  label,
  placeholder = "Select token",
  showSearch = true,
  showBalance = true,
  disabled = false,
  size = "md",
  className = "",
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const classes = sizeClasses[size];

  // Filter tokens by search query
  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return tokens;

    const query = searchQuery.toLowerCase();
    return tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query)
    );
  }, [tokens, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
    return undefined;
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, showSearch]);

  const toggleDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
      if (isOpen) {
        setSearchQuery("");
      }
    }
  }, [disabled, isOpen]);

  const handleSelect = useCallback(
    (token: TokenInfo) => {
      onSelect(token);
      setIsOpen(false);
      setSearchQuery("");
    },
    [onSelect]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block mb-1.5 text-sm font-medium text-neutral-300">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between
          ${classes.trigger}
          rounded-xl
          bg-neutral-900 border border-white/10
          text-white font-medium
          transition-all duration-200
          hover:border-white/20
          focus:outline-none focus:ring-2 focus:ring-emerald-500/40
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? "border-emerald-500/50 ring-2 ring-emerald-500/20" : ""}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedToken ? (
          <div className="flex items-center gap-3">
            <TokenIcon token={selectedToken} size={classes.icon} />
            <div className="text-left">
              <span className="font-semibold">{selectedToken.symbol}</span>
              <span className="ml-2 text-neutral-400 text-sm hidden sm:inline">
                {selectedToken.name}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-neutral-500">{placeholder}</span>
        )}
        <ChevronDown
          size={18}
          className={`
            text-neutral-400 transition-transform duration-200
            ${isOpen ? "rotate-180" : ""}
          `}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`
            absolute top-full left-0 right-0 mt-2 z-50
            rounded-xl border border-white/10
            bg-neutral-900 shadow-xl
            animate-in fade-in slide-in-from-top-2 duration-200
            max-h-80 overflow-hidden
            ${classes.dropdown}
          `}
          role="listbox"
          aria-label="Select token"
        >
          {/* Search Input */}
          {showSearch && tokens.length > 5 && (
            <div className="px-3 py-2 border-b border-white/5">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tokens..."
                  className="
                    w-full h-9 pl-9 pr-8
                    rounded-lg bg-neutral-800 border border-white/5
                    text-sm text-white placeholder:text-neutral-500
                    focus:outline-none focus:border-white/20
                  "
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Token List */}
          <div className="overflow-y-auto max-h-60">
            {filteredTokens.length === 0 ? (
              <div className="px-4 py-8 text-center text-neutral-500 text-sm">
                No tokens found
              </div>
            ) : (
              filteredTokens.map((token) => {
                const isSelected = selectedToken?.mint === token.mint;
                return (
                  <button
                    key={token.mint}
                    type="button"
                    onClick={() => handleSelect(token)}
                    className={`
                      w-full flex items-center justify-between
                      ${classes.item}
                      transition-colors duration-150
                      ${
                        isSelected
                          ? "bg-emerald-500/10"
                          : "hover:bg-white/5"
                      }
                    `}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-3">
                      <TokenIcon token={token} size={classes.itemIcon} />
                      <div className="text-left">
                        <div className="font-medium text-white">
                          {token.symbol}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {token.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Balance */}
                      {showBalance && token.balance && (
                        <div className="text-right">
                          <div className="text-sm text-neutral-300 tabular-nums">
                            {token.balance}
                          </div>
                          {token.price && (
                            <div className="text-xs text-neutral-500">
                              ${(parseFloat(token.balance) * token.price).toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Selected Check */}
                      {isSelected && (
                        <Check size={16} className="text-emerald-400" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TokenSelector;
