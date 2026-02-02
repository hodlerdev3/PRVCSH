/**
 * @prvcsh/ui - Icon System
 * Re-exports of commonly used Lucide icons with consistent styling
 * 
 * Features:
 * - Pre-configured icon sizes
 * - Privacy/crypto-themed icon set
 * - Consistent color handling
 */

import * as React from "react";
import {
  // Privacy & Security
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  Eye,
  EyeOff,
  
  // Wallet & Finance
  Wallet,
  CreditCard,
  Coins,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  
  // Actions
  Send,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  X,
  Plus,
  Minus,
  
  // Navigation
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Menu,
  MoreHorizontal,
  MoreVertical,
  ExternalLink,
  
  // Status & Feedback
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Hourglass,
  
  // ZK & Crypto
  Cpu,
  Binary,
  Hash,
  Link2,
  Unlink2,
  Shuffle,
  GitBranch,
  
  // UI
  Settings,
  Search,
  Filter,
  SlidersHorizontal,
  HelpCircle,
  Bell,
  Sun,
  Moon,
  
  // Types
  type LucideProps,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/utils";

/* ====================================
 * Types
 * ==================================== */

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface IconProps extends Omit<LucideProps, "size"> {
  /** Icon size */
  size?: IconSize | number;
}

/* ====================================
 * Size Map
 * ==================================== */

const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

/* ====================================
 * Icon Wrapper
 * ==================================== */

export function createIcon(IconComponent: LucideIcon): React.FC<IconProps> {
  const WrappedIcon: React.FC<IconProps> = ({
    size = "md",
    className,
    ...props
  }) => {
    const pixelSize = typeof size === "number" ? size : sizeMap[size];

    return (
      <IconComponent
        size={pixelSize}
        className={cn("flex-shrink-0", className)}
        {...props}
      />
    );
  };

  WrappedIcon.displayName = IconComponent.displayName;
  return WrappedIcon;
}

/* ====================================
 * Privacy & Security Icons
 * ==================================== */

export const ShieldIcon = createIcon(Shield);
export const ShieldCheckIcon = createIcon(ShieldCheck);
export const ShieldAlertIcon = createIcon(ShieldAlert);
export const LockIcon = createIcon(Lock);
export const UnlockIcon = createIcon(Unlock);
export const KeyIcon = createIcon(Key);
export const FingerprintIcon = createIcon(Fingerprint);
export const EyeIcon = createIcon(Eye);
export const EyeOffIcon = createIcon(EyeOff);

/* ====================================
 * Wallet & Finance Icons
 * ==================================== */

export const WalletIcon = createIcon(Wallet);
export const CreditCardIcon = createIcon(CreditCard);
export const CoinsIcon = createIcon(Coins);
export const DollarSignIcon = createIcon(DollarSign);
export const TrendingUpIcon = createIcon(TrendingUp);
export const TrendingDownIcon = createIcon(TrendingDown);
export const SendIcon = createIcon(Send);
export const ReceiveIcon = createIcon(ArrowDownLeft);
export const DepositIcon = createIcon(ArrowUpRight);

/* ====================================
 * Action Icons
 * ==================================== */

export const DownloadIcon = createIcon(Download);
export const UploadIcon = createIcon(Upload);
export const RefreshIcon = createIcon(RefreshCw);
export const CopyIcon = createIcon(Copy);
export const CheckIcon = createIcon(Check);
export const CloseIcon = createIcon(X);
export const PlusIcon = createIcon(Plus);
export const MinusIcon = createIcon(Minus);

/* ====================================
 * Navigation Icons
 * ==================================== */

export const ChevronDownIcon = createIcon(ChevronDown);
export const ChevronUpIcon = createIcon(ChevronUp);
export const ChevronLeftIcon = createIcon(ChevronLeft);
export const ChevronRightIcon = createIcon(ChevronRight);
export const ArrowLeftIcon = createIcon(ArrowLeft);
export const ArrowRightIcon = createIcon(ArrowRight);
export const MenuIcon = createIcon(Menu);
export const MoreHorizontalIcon = createIcon(MoreHorizontal);
export const MoreVerticalIcon = createIcon(MoreVertical);
export const ExternalLinkIcon = createIcon(ExternalLink);

/* ====================================
 * Status Icons
 * ==================================== */

export const ErrorIcon = createIcon(AlertCircle);
export const WarningIcon = createIcon(AlertTriangle);
export const InfoIcon = createIcon(Info);
export const SuccessIcon = createIcon(CheckCircle2);
export const FailedIcon = createIcon(XCircle);
export const PendingIcon = createIcon(Clock);
export const LoadingIcon = createIcon(Loader2);
export const WaitingIcon = createIcon(Hourglass);

/* ====================================
 * ZK & Crypto Icons
 * ==================================== */

export const ProofIcon = createIcon(Cpu);
export const BinaryIcon = createIcon(Binary);
export const HashIcon = createIcon(Hash);
export const LinkIcon = createIcon(Link2);
export const UnlinkIcon = createIcon(Unlink2);
export const MixerIcon = createIcon(Shuffle);
export const MerkleIcon = createIcon(GitBranch);

/* ====================================
 * UI Icons
 * ==================================== */

export const SettingsIcon = createIcon(Settings);
export const SearchIcon = createIcon(Search);
export const FilterIcon = createIcon(Filter);
export const AdjustIcon = createIcon(SlidersHorizontal);
export const HelpIcon = createIcon(HelpCircle);
export const NotificationIcon = createIcon(Bell);
export const LightModeIcon = createIcon(Sun);
export const DarkModeIcon = createIcon(Moon);

/* ====================================
 * Type Export
 * ==================================== */

export type { LucideIcon, LucideProps };
