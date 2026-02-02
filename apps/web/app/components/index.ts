/**
 * App Components Index
 *
 * Barrel export for all app-specific components
 */

// Wallet Components
export { WalletButton, truncateAddress } from "./WalletButton";
export type { WalletButtonProps } from "./WalletButton";

export { WalletModal } from "./WalletModal";
export type { WalletModalProps } from "./WalletModal";

// Network Components
export { NetworkSwitcher, DEFAULT_NETWORKS } from "./NetworkSwitcher";
export type {
  NetworkSwitcherProps,
  NetworkConfig,
  SolanaNetwork,
} from "./NetworkSwitcher";

export { ConnectionStatus } from "./ConnectionStatus";
export type { ConnectionStatusProps, ConnectionState } from "./ConnectionStatus";

// Layout Components
export { Header } from "./Header";
export type { HeaderProps, NavItem } from "./Header";

export { Footer } from "./Footer";
export type { FooterProps, FooterLink, FooterLinkGroup } from "./Footer";

export { MainLayout } from "./MainLayout";
export type { MainLayoutProps } from "./MainLayout";

export { Container, PageContainer, SectionContainer } from "./Container";
export type {
  ContainerProps,
  ContainerSize,
  PageContainerProps,
  SectionContainerProps,
} from "./Container";

// Amount Components
export { AmountInput, formatAmount, parseAmount } from "./AmountInput";
export type { AmountInputProps } from "./AmountInput";

export { TokenSelector } from "./TokenSelector";
export type { TokenSelectorProps, TokenInfo } from "./TokenSelector";

export { TokenAmountInput, PresetAmountButtons } from "./TokenAmountInput";
export type { TokenAmountInputProps, PresetAmountButtonsProps } from "./TokenAmountInput";

export { WalletBalance } from "./WalletBalance";
export type { WalletBalanceProps, BalanceData } from "./WalletBalance";

export { ZKProofStatus } from "./ZKProofStatus";
export type { ZKProofStatusProps, ProofStep, StepStatus, ProofStepInfo } from "./ZKProofStatus";

export { DepositForm } from "./DepositForm";
export type { DepositFormProps, DepositState } from "./DepositForm";

export { WithdrawForm } from "./WithdrawForm";
export type { WithdrawFormProps, WithdrawState } from "./WithdrawForm";

export { MixerForm, TabSwitcher } from "./MixerForm";
export type { MixerFormProps, MixerTab, TabSwitcherProps } from "./MixerForm";

export { TransactionHistory, CompactTransactionList } from "./TransactionHistory";
export type {
  TransactionHistoryProps,
  CompactTransactionListProps,
  Transaction,
  TransactionType,
  TransactionStatus,
} from "./TransactionHistory";

export { SkipLink, SkipLinks, MainContent } from "./SkipLink";
export type { SkipLinkProps, SkipLinksProps, SkipTarget, MainContentProps } from "./SkipLink";

export { FormField, FormFieldset, FormErrorSummary, useFormField } from "./FormField";
export type {
  FormFieldProps,
  FormFieldChildProps,
  FormFieldsetProps,
  FormErrorSummaryProps,
  FormError,
  UseFormFieldOptions,
  UseFormFieldReturn,
} from "./FormField";

export {
  LiveAnnouncerProvider,
  useLiveAnnouncer,
  LiveRegion,
  ErrorAnnouncement,
  SuccessAnnouncement,
  LoadingAnnouncement,
  TransactionAnnouncement,
} from "./LiveAnnouncer";

export type {
  LiveAnnouncerProviderProps,
  LiveAnnouncerContextValue,
  AnnouncementPoliteness,
  LiveRegionProps,
  ErrorAnnouncementProps,
  SuccessAnnouncementProps,
  LoadingAnnouncementProps,
  TransactionAnnouncementProps,
  TransactionStep,
} from "./LiveAnnouncer";

// Error Handling Components
export {
  ErrorBoundary,
  ErrorFallback,
  CompactErrorFallback,
  WalletErrorBoundary,
  ZKProofErrorBoundary,
  TransactionErrorBoundary,
  SuspenseErrorBoundary,
  withErrorBoundary,
  ERROR_CODES,
  ERROR_MESSAGES,
} from "./ErrorBoundary";

export type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorFallbackProps,
  FallbackRenderProps,
  WithErrorBoundaryOptions,
  SuspenseErrorBoundaryProps,
  ErrorCode,
} from "./ErrorBoundary";

// Loading States Components
export {
  Skeleton,
  LoadingState,
  ContentPlaceholder,
  WalletBalanceSkeleton,
  TokenBalanceSkeleton,
  TransactionRowSkeleton,
  TransactionHistorySkeleton,
  FormFieldSkeleton,
  MixerFormSkeleton,
  CardSkeleton,
  ZKProofStatusSkeleton,
  HeaderSkeleton,
  PageSkeleton,
  LoadingSpinner,
  LoadingDots,
  LoadingOverlay,
} from "./LoadingStates";

export type {
  SkeletonProps,
  SkeletonVariant,
  SkeletonSize,
  LoadingStateProps,
  ContentPlaceholderProps,
} from "./LoadingStates";
