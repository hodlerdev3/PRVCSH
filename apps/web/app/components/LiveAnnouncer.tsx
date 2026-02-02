"use client";

/**
 * LiveAnnouncer Component & Hook
 *
 * Provides accessible announcements for screen readers.
 * Uses aria-live regions for dynamic content updates.
 *
 * WCAG Requirements:
 * - Status Messages (4.1.3)
 * - Error Identification (3.3.1)
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";

// ============================================
// Types
// ============================================

export type AnnouncementPoliteness = "polite" | "assertive" | "off";

export interface Announcement {
  id: string;
  message: string;
  politeness: AnnouncementPoliteness;
  timestamp: number;
}

export interface LiveAnnouncerContextValue {
  /** Announce a message politely (non-interrupting) */
  announce: (message: string) => void;
  /** Announce a message assertively (interrupting) */
  announceAssertive: (message: string) => void;
  /** Announce an error message */
  announceError: (message: string) => void;
  /** Announce a success message */
  announceSuccess: (message: string) => void;
  /** Clear all announcements */
  clear: () => void;
}

// ============================================
// Context
// ============================================

const LiveAnnouncerContext = createContext<LiveAnnouncerContextValue | null>(
  null
);

// ============================================
// Hook
// ============================================

/**
 * Hook to access the live announcer
 */
export function useLiveAnnouncer(): LiveAnnouncerContextValue {
  const context = useContext(LiveAnnouncerContext);

  if (!context) {
    // Return no-op functions if used outside provider
    return {
      announce: () => {},
      announceAssertive: () => {},
      announceError: () => {},
      announceSuccess: () => {},
      clear: () => {},
    };
  }

  return context;
}

// ============================================
// Provider Component
// ============================================

export interface LiveAnnouncerProviderProps {
  children: React.ReactNode;
}

export function LiveAnnouncerProvider({
  children,
}: LiveAnnouncerProviderProps) {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear messages after announcement
  const clearMessages = useCallback(() => {
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
    }
    clearTimeoutRef.current = setTimeout(() => {
      setPoliteMessage("");
      setAssertiveMessage("");
    }, 1000);
  }, []);

  // Announce politely
  const announce = useCallback(
    (message: string) => {
      setPoliteMessage(message);
      clearMessages();
    },
    [clearMessages]
  );

  // Announce assertively
  const announceAssertive = useCallback(
    (message: string) => {
      setAssertiveMessage(message);
      clearMessages();
    },
    [clearMessages]
  );

  // Announce error
  const announceError = useCallback(
    (message: string) => {
      announceAssertive(`Error: ${message}`);
    },
    [announceAssertive]
  );

  // Announce success
  const announceSuccess = useCallback(
    (message: string) => {
      announce(`Success: ${message}`);
    },
    [announce]
  );

  // Clear all
  const clear = useCallback(() => {
    setPoliteMessage("");
    setAssertiveMessage("");
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  const value: LiveAnnouncerContextValue = {
    announce,
    announceAssertive,
    announceError,
    announceSuccess,
    clear,
  };

  return (
    <LiveAnnouncerContext.Provider value={value}>
      {children}

      {/* Polite Live Region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>

      {/* Assertive Live Region */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </LiveAnnouncerContext.Provider>
  );
}

// ============================================
// Standalone Live Region Components
// ============================================

export interface LiveRegionProps {
  /** The message to announce */
  message?: string;
  /** Politeness level */
  politeness?: AnnouncementPoliteness;
  /** Role for the region */
  role?: "status" | "alert" | "log";
  /** Whether to clear after announcement */
  clearAfter?: number;
  /** Additional className */
  className?: string;
}

/**
 * Standalone live region for specific announcements
 */
export function LiveRegion({
  message,
  politeness = "polite",
  role = "status",
  clearAfter,
  className = "",
}: LiveRegionProps) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);

    if (clearAfter && message) {
      const timer = setTimeout(() => {
        setCurrentMessage("");
      }, clearAfter);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [message, clearAfter]);

  return (
    <div
      role={role}
      aria-live={politeness}
      aria-atomic="true"
      className={`sr-only ${className}`.trim()}
    >
      {currentMessage}
    </div>
  );
}

// ============================================
// Error Announcement Component
// ============================================

export interface ErrorAnnouncementProps {
  /** Error message */
  error?: string | null;
  /** Field name for context */
  fieldName?: string;
  /** Delay before announcing */
  delay?: number;
}

/**
 * Announces form errors to screen readers
 */
export function ErrorAnnouncement({
  error,
  fieldName,
  delay = 100,
}: ErrorAnnouncementProps) {
  const [announced, setAnnounced] = useState(false);

  useEffect(() => {
    if (error && !announced) {
      const timer = setTimeout(() => {
        setAnnounced(true);
      }, delay);
      return () => clearTimeout(timer);
    }

    if (!error) {
      setAnnounced(false);
    }
    return undefined;
  }, [error, announced, delay]);

  if (!error) return null;

  const message = fieldName ? `${fieldName}: ${error}` : error;

  return (
    <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
      {announced ? message : ""}
    </div>
  );
}

// ============================================
// Success Announcement Component
// ============================================

export interface SuccessAnnouncementProps {
  /** Success message */
  message?: string | null;
  /** Delay before announcing */
  delay?: number;
}

/**
 * Announces success messages to screen readers
 */
export function SuccessAnnouncement({
  message,
  delay = 100,
}: SuccessAnnouncementProps) {
  const [announced, setAnnounced] = useState(false);

  useEffect(() => {
    if (message && !announced) {
      const timer = setTimeout(() => {
        setAnnounced(true);
      }, delay);
      return () => clearTimeout(timer);
    }

    if (!message) {
      setAnnounced(false);
    }
    return undefined;
  }, [message, announced, delay]);

  if (!message) return null;

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {announced ? message : ""}
    </div>
  );
}

// ============================================
// Loading Announcement Component
// ============================================

export interface LoadingAnnouncementProps {
  /** Whether loading is in progress */
  loading: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Completed message */
  completedMessage?: string;
}

/**
 * Announces loading states to screen readers
 */
export function LoadingAnnouncement({
  loading,
  loadingMessage = "Loading, please wait...",
  completedMessage = "Loading complete",
}: LoadingAnnouncementProps) {
  const [wasLoading, setWasLoading] = useState(false);
  const [announced, setAnnounced] = useState<string | null>(null);

  useEffect(() => {
    if (loading && !wasLoading) {
      setWasLoading(true);
      setAnnounced(loadingMessage);
    } else if (!loading && wasLoading) {
      setWasLoading(false);
      setAnnounced(completedMessage);

      // Clear after announcement
      const timer = setTimeout(() => {
        setAnnounced(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [loading, wasLoading, loadingMessage, completedMessage]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {announced}
    </div>
  );
}

// ============================================
// Transaction Status Announcement
// ============================================

export type TransactionStep =
  | "idle"
  | "preparing"
  | "signing"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

export interface TransactionAnnouncementProps {
  /** Current transaction step */
  step: TransactionStep;
  /** Error message if step is "error" */
  errorMessage?: string;
}

const STEP_MESSAGES: Record<TransactionStep, string> = {
  idle: "",
  preparing: "Preparing transaction...",
  signing: "Please sign the transaction in your wallet",
  submitting: "Submitting transaction to the network...",
  confirming: "Waiting for confirmation...",
  success: "Transaction successful!",
  error: "Transaction failed",
};

/**
 * Announces transaction status changes
 */
export function TransactionAnnouncement({
  step,
  errorMessage,
}: TransactionAnnouncementProps) {
  const message =
    step === "error" && errorMessage
      ? `Transaction failed: ${errorMessage}`
      : STEP_MESSAGES[step];

  if (!message) return null;

  const role = step === "error" ? "alert" : "status";
  const politeness = step === "error" ? "assertive" : "polite";

  return (
    <div role={role} aria-live={politeness} aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

export default LiveAnnouncerProvider;
