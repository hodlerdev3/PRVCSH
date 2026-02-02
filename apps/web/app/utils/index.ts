/**
 * App Utilities Index
 *
 * Barrel export for all utility functions
 */

// Accessibility - Color Contrast
export {
  getContrastRatio,
  meetsContrastAA,
  meetsContrastAALarge,
  meetsContrastAAA,
  auditColorContrast,
  A11Y_COLORS,
  A11Y_TEXT_CLASSES,
} from "./a11y-colors";

export type { A11yColors, A11yTextClasses } from "./a11y-colors";

// Accessibility - Keyboard Navigation
export {
  KEYS,
  FOCUSABLE_SELECTOR,
  TABBABLE_SELECTOR,
  getFocusableElements,
  getTabbableElements,
  focusFirst,
  focusLast,
  useFocusTrap,
  useRovingTabIndex,
  handleKeyboardClick,
  getButtonA11yProps,
  getSkipLinkProps,
  FOCUS_CLASSES,
} from "./a11y-keyboard";

export type {
  KeyName,
  UseFocusTrapOptions,
  UseRovingTabIndexOptions,
  SkipLinkProps,
  FocusClassType,
} from "./a11y-keyboard";

// Accessibility - Screen Reader
export {
  SR_ONLY_CLASS,
  srOnlyStyles,
  ARIA_LABELS,
  ARIA_DESCRIPTIONS,
  getIconButtonProps,
  getIconLinkProps,
  getPoliteRegionProps,
  getAssertiveRegionProps,
  getFormFieldIds,
  getInputAriaProps,
  getLoadingProps,
  getProgressProps,
  withAriaLabel,
  ScreenReaderOnly,
} from "./a11y-screen-reader";

export type {
  AriaLabelKey,
  LiveRegionProps,
  AriaDescriptionKey,
  AriaLabels,
  AriaDescriptions,
} from "./a11y-screen-reader";

// Accessibility - Reduced Motion
export {
  usePrefersReducedMotion,
  useMotionConfig,
  useMotion,
  MotionProvider,
  REDUCED_MOTION_QUERY,
  ANIMATION_DURATIONS,
  REDUCED_DURATIONS,
  EASINGS,
  MOTION_CLASSES,
  TAILWIND_MOTION_CLASSES,
  getAnimationClasses,
  getMotionSafeClass,
  getMotionSafeStyles,
  createTransitionStyles,
  buildMotionSafeClassName,
  getInitialMotionPreference,
  checkReducedMotion,
  REDUCED_DURATION_MULTIPLIER,
  MAX_REDUCED_DURATION,
  MIN_DURATION,
} from "./a11y-motion";

export type {
  MotionPreference,
  MotionConfig,
  TransitionConfig,
  CSSTransitionProperties,
  AnimationConfig,
  MotionProviderProps,
  MotionSafeProps,
} from "./a11y-motion";

// Network Error Handling
export {
  useNetworkState,
  useNetworkFetch,
  classifyNetworkError,
  createNetworkError,
  calculateRetryDelay,
  retryWithBackoff,
  getEndpointsForNetwork,
  getNextFallbackEndpoint,
  checkEndpointHealth,
  sleep,
  DEFAULT_RPC_ENDPOINTS,
  DEFAULT_RETRY_CONFIG,
  NETWORK_ERROR_MESSAGES,
} from "./network-errors";

export type {
  NetworkStatus,
  RPCEndpoint,
  NetworkError,
  NetworkErrorCode,
  NetworkErrorAction,
  RetryConfig,
  NetworkState,
  UseNetworkStateOptions,
  UseNetworkStateReturn,
  NetworkErrorDisplayProps,
  UseNetworkFetchOptions,
  UseNetworkFetchReturn,
} from "./network-errors";

// Wallet Error Handling
export {
  useWalletError,
  classifyWalletError,
  createWalletError,
  isUserRejection,
  isRecoverableError,
  parseTransactionError,
  getFailedTxExplorerUrl,
  canAttemptConnection,
  getTimeUntilNextAttempt,
  openWalletInstallPage,
  getWalletDisplayName,
  formatWalletAddress,
  getErrorIcon,
  getErrorColorClass,
  WALLET_ERROR_INFO,
  WALLET_NAMES,
  WALLET_INSTALL_URLS,
  INITIAL_CONNECTION_STATE,
  CONNECTION_LIMITS,
} from "./wallet-errors";

export type {
  WalletErrorCode,
  WalletErrorSeverity,
  WalletError,
  WalletErrorAction,
  WalletErrorInfo,
  UseWalletErrorReturn,
  TransactionErrorInfo,
  WalletConnectionState,
} from "./wallet-errors";

// ZK Proof Error Handling
export {
  useZKProofState,
  classifyZKProofError,
  createZKProofError,
  isTimeoutError,
  isRetryableZKError,
  checkZKBrowserSupport,
  getRecommendedBrowserMessage,
  getStageIcon,
  getStageColorClass,
  formatElapsedTime,
  getEstimatedTimeRemaining,
  PROOF_GENERATION_TIMEOUT,
  STAGE_TIMEOUTS,
  ZK_PROOF_ERROR_INFO,
  STAGE_NAMES,
} from "./zk-proof-errors";

export type {
  ZKProofErrorCode,
  ZKProofStage,
  ZKProofErrorSeverity,
  ZKProofError,
  ZKProofErrorAction,
  ZKProofErrorInfo,
  ZKProofState,
  UseZKProofStateOptions,
  UseZKProofStateReturn,
} from "./zk-proof-errors";
