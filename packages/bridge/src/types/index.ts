/**
 * @fileoverview Core type definitions for PRVCSH Multi-Chain Bridge
 * @description This module defines the fundamental types used across the bridge system
 * for cross-chain privacy-preserving transactions between Solana, Ethereum, and Polygon.
 * 
 * @module @prvcsh/bridge/types
 * @version 0.1.0
 */

// =============================================================================
// CHAIN DEFINITIONS
// =============================================================================

/**
 * Supported blockchain networks
 */
export type ChainId = 
  | 'solana'
  | 'solana-devnet'
  | 'solana-testnet'
  | 'ethereum'
  | 'ethereum-sepolia'
  | 'ethereum-goerli'
  | 'polygon'
  | 'polygon-mumbai'
  | 'polygon-amoy';

/**
 * Chain type classification
 */
export type ChainType = 'solana' | 'evm';

/**
 * Chain configuration
 */
export interface ChainConfig {
  /** Unique chain identifier */
  readonly id: ChainId;
  
  /** Chain type (Solana or EVM-compatible) */
  readonly type: ChainType;
  
  /** Human-readable chain name */
  readonly name: string;
  
  /** Chain's numeric ID (for EVM chains) */
  readonly chainIdNumeric?: number;
  
  /** RPC endpoint URL */
  readonly rpcUrl: string;
  
  /** Alternative RPC endpoints for fallback */
  readonly rpcUrlFallback?: string[];
  
  /** WebSocket endpoint for real-time updates */
  readonly wsUrl?: string;
  
  /** Block explorer URL */
  readonly explorerUrl: string;
  
  /** Native token symbol */
  readonly nativeToken: string;
  
  /** Native token decimals */
  readonly nativeDecimals: number;
  
  /** Bridge contract/program address */
  readonly bridgeAddress: string;
  
  /** Lockbox contract/program address */
  readonly lockboxAddress: string;
  
  /** Verifier contract/program address */
  readonly verifierAddress: string;
  
  /** Whether this is a testnet */
  readonly isTestnet: boolean;
  
  /** Average block time in seconds */
  readonly blockTime: number;
  
  /** Recommended confirmation count */
  readonly confirmations: number;
}

/**
 * Pre-configured chain definitions
 */
export const SUPPORTED_CHAINS: Record<ChainId, ChainConfig> = {
  // Solana Networks
  'solana': {
    id: 'solana',
    type: 'solana',
    name: 'Solana Mainnet',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    nativeToken: 'SOL',
    nativeDecimals: 9,
    bridgeAddress: '', // To be deployed
    lockboxAddress: '',
    verifierAddress: '',
    isTestnet: false,
    blockTime: 0.4,
    confirmations: 31,
  },
  'solana-devnet': {
    id: 'solana-devnet',
    type: 'solana',
    name: 'Solana Devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com?cluster=devnet',
    nativeToken: 'SOL',
    nativeDecimals: 9,
    bridgeAddress: '',
    lockboxAddress: '',
    verifierAddress: '',
    isTestnet: true,
    blockTime: 0.4,
    confirmations: 31,
  },
  'solana-testnet': {
    id: 'solana-testnet',
    type: 'solana',
    name: 'Solana Testnet',
    rpcUrl: 'https://api.testnet.solana.com',
    explorerUrl: 'https://explorer.solana.com?cluster=testnet',
    nativeToken: 'SOL',
    nativeDecimals: 9,
    bridgeAddress: '',
    lockboxAddress: '',
    verifierAddress: '',
    isTestnet: true,
    blockTime: 0.4,
    confirmations: 31,
  },
  
  // Ethereum Networks
  'ethereum': {
    id: 'ethereum',
    type: 'evm',
    name: 'Ethereum Mainnet',
    chainIdNumeric: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    nativeToken: 'ETH',
    nativeDecimals: 18,
    bridgeAddress: '',
    lockboxAddress: '',
    verifierAddress: '',
    isTestnet: false,
    blockTime: 12,
    confirmations: 12,
  },
  'ethereum-sepolia': {
    id: 'ethereum-sepolia',
    type: 'evm',
    name: 'Ethereum Sepolia',
    chainIdNumeric: 11155111,
    rpcUrl: 'https://sepolia.drpc.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeToken: 'ETH',
    nativeDecimals: 18,
    bridgeAddress: '',
    lockboxAddress: '',
    verifierAddress: '',
    isTestnet: true,
    blockTime: 12,
    confirmations: 6,
  },
  'ethereum-goerli': {
    id: 'ethereum-goerli',
    type: 'evm',
    name: 'Ethereum Goerli',
    chainIdNumeric: 5,
    rpcUrl: 'https://goerli.drpc.org',
    explorerUrl: 'https://goerli.etherscan.io',
    nativeToken: 'ETH',
    nativeDecimals: 18,
    bridgeAddress: '',
    lockboxAddress: '',
    verifierAddress: '',
    isTestnet: true,
    blockTime: 12,
    confirmations: 6,
  },
  
  // Polygon Networks
  'polygon': {
    id: 'polygon',
    type: 'evm',
    name: 'Polygon Mainnet',
    chainIdNumeric: 137,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeToken: 'MATIC',
    nativeDecimals: 18,
    bridgeAddress: '',
    lockboxAddress: '',
    verifierAddress: '',
    isTestnet: false,
    blockTime: 2,
    confirmations: 128,
  },
  'polygon-mumbai': {
    id: 'polygon-mumbai',
    type: 'evm',
    name: 'Polygon Mumbai',
    chainIdNumeric: 80001,
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    explorerUrl: 'https://mumbai.polygonscan.com',
    nativeToken: 'MATIC',
    nativeDecimals: 18,
    bridgeAddress: '',
    lockboxAddress: '',
    verifierAddress: '',
    isTestnet: true,
    blockTime: 2,
    confirmations: 32,
  },
  'polygon-amoy': {
    id: 'polygon-amoy',
    type: 'evm',
    name: 'Polygon Amoy',
    chainIdNumeric: 80002,
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorerUrl: 'https://amoy.polygonscan.com',
    nativeToken: 'MATIC',
    nativeDecimals: 18,
    bridgeAddress: '',
    lockboxAddress: '',
    verifierAddress: '',
    isTestnet: true,
    blockTime: 2,
    confirmations: 32,
  },
} as const;

// =============================================================================
// TOKEN DEFINITIONS
// =============================================================================

/**
 * Token information for bridging
 */
export interface BridgeToken {
  /** Token symbol */
  readonly symbol: string;
  
  /** Token name */
  readonly name: string;
  
  /** Token decimals */
  readonly decimals: number;
  
  /** Logo URL */
  readonly logoUrl?: string;
  
  /** Contract addresses per chain */
  readonly addresses: Partial<Record<ChainId, string>>;
  
  /** Whether this is a native wrapped token */
  readonly isNativeWrapped?: boolean;
  
  /** Minimum bridge amount (in smallest unit) */
  readonly minBridgeAmount: bigint;
  
  /** Maximum bridge amount (in smallest unit) */
  readonly maxBridgeAmount: bigint;
}

// =============================================================================
// BRIDGE TRANSACTION TYPES
// =============================================================================

/**
 * Bridge transaction status
 */
export type BridgeTransactionStatus = 
  | 'pending'           // Transaction initiated
  | 'source_confirming' // Waiting for source chain confirmations
  | 'source_confirmed'  // Source chain transaction confirmed
  | 'relaying'          // Relayer processing the message
  | 'dest_confirming'   // Waiting for destination chain confirmations
  | 'dest_confirmed'    // Destination chain transaction confirmed
  | 'completed'         // Bridge fully completed
  | 'failed'            // Transaction failed
  | 'refunded';         // Funds refunded on source chain

/**
 * Bridge transaction direction
 */
export interface BridgeRoute {
  /** Source chain */
  readonly sourceChain: ChainId;
  
  /** Destination chain */
  readonly destChain: ChainId;
  
  /** Token being bridged */
  readonly token: string;
  
  /** Amount in smallest unit */
  readonly amount: bigint;
}

/**
 * Bridge transaction
 */
export interface BridgeTransaction {
  /** Unique transaction ID */
  readonly id: string;
  
  /** Bridge route information */
  readonly route: BridgeRoute;
  
  /** Current status */
  status: BridgeTransactionStatus;
  
  /** Source chain transaction hash */
  readonly sourceTxHash?: string;
  
  /** Destination chain transaction hash */
  destTxHash?: string;
  
  /** Sender address on source chain */
  readonly sender: string;
  
  /** Recipient address on destination chain */
  readonly recipient: string;
  
  /** Commitment hash (for privacy) */
  readonly commitment: string;
  
  /** Nullifier hash (for double-spend prevention) */
  readonly nullifier: string;
  
  /** ZK proof for the bridge */
  readonly proof?: BridgeProof;
  
  /** Timestamp when initiated */
  readonly createdAt: Date;
  
  /** Timestamp when completed */
  completedAt?: Date;
  
  /** Error message if failed */
  error?: string;
  
  /** Bridge fee in native token */
  readonly fee: bigint;
  
  /** Relayer fee in native token */
  readonly relayerFee: bigint;
  
  /** Estimated completion time in seconds */
  readonly estimatedTime: number;
}

// =============================================================================
// ZK PROOF TYPES
// =============================================================================

/**
 * ZK proof types supported by the bridge
 */
export type ProofType = 
  | 'deposit'   // Proof of deposit on source chain
  | 'withdraw'  // Proof of withdrawal on destination chain
  | 'transfer'  // Proof of cross-chain transfer
  | 'claim';    // Proof for claiming bridged funds

/**
 * ZK proof data structure
 */
export interface BridgeProof {
  /** Proof type */
  readonly type: ProofType;
  
  /** Proof data (serialized) */
  readonly proof: Uint8Array;
  
  /** Public inputs */
  readonly publicInputs: readonly string[];
  
  /** Merkle root at time of proof */
  readonly merkleRoot: string;
  
  /** Commitment being proven */
  readonly commitment: string;
  
  /** Nullifier (for withdrawal/claim proofs) */
  readonly nullifier?: string;
  
  /** Proof verification status */
  verified?: boolean;
  
  /** Chain the proof was generated for */
  readonly targetChain: ChainId;
  
  /** Timestamp of proof generation */
  readonly generatedAt: Date;
}

/**
 * Proof generation input
 */
export interface ProofInput {
  /** Secret key (private) */
  readonly secret: Uint8Array;
  
  /** Random nonce */
  readonly nonce: Uint8Array;
  
  /** Amount */
  readonly amount: bigint;
  
  /** Token address/mint */
  readonly token: string;
  
  /** Source chain */
  readonly sourceChain: ChainId;
  
  /** Destination chain */
  readonly destChain: ChainId;
  
  /** Recipient address */
  readonly recipient: string;
  
  /** Merkle path for inclusion proof */
  readonly merklePath: readonly string[];
  
  /** Path indices */
  readonly pathIndices: readonly number[];
}

// =============================================================================
// BRIDGE CONFIGURATION
// =============================================================================

/**
 * Bridge configuration
 */
export interface BridgeConfig {
  /** Enabled chains */
  readonly enabledChains: readonly ChainId[];
  
  /** Default source chain */
  readonly defaultSourceChain: ChainId;
  
  /** Default destination chain */
  readonly defaultDestChain: ChainId;
  
  /** Relayer endpoint URL */
  readonly relayerUrl: string;
  
  /** WebSocket endpoint for real-time updates */
  readonly wsUrl?: string;
  
  /** API key for relayer (if required) */
  readonly apiKey?: string;
  
  /** Custom chain configs (overrides defaults) */
  readonly chainOverrides?: Partial<Record<ChainId, Partial<ChainConfig>>>;
  
  /** Fee configuration */
  readonly fees: BridgeFeeConfig;
  
  /** Timeout settings */
  readonly timeouts: BridgeTimeoutConfig;
  
  /** Debug mode */
  readonly debug?: boolean;
}

/**
 * Bridge fee configuration
 */
export interface BridgeFeeConfig {
  /** Base fee percentage (in basis points, 100 = 1%) */
  readonly baseFeePercent: number;
  
  /** Minimum fee in USD */
  readonly minFeeUsd: number;
  
  /** Maximum fee in USD */
  readonly maxFeeUsd: number;
  
  /** Relayer fee percentage */
  readonly relayerFeePercent: number;
}

/**
 * Bridge timeout configuration
 */
export interface BridgeTimeoutConfig {
  /** Transaction confirmation timeout (ms) */
  readonly confirmationTimeout: number;
  
  /** Relayer response timeout (ms) */
  readonly relayerTimeout: number;
  
  /** Proof generation timeout (ms) */
  readonly proofTimeout: number;
  
  /** Total bridge operation timeout (ms) */
  readonly totalTimeout: number;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

/**
 * Bridge event types
 */
export type BridgeEventType =
  | 'deposit_initiated'
  | 'deposit_confirmed'
  | 'relay_started'
  | 'relay_completed'
  | 'withdrawal_initiated'
  | 'withdrawal_confirmed'
  | 'bridge_completed'
  | 'bridge_failed'
  | 'refund_initiated'
  | 'refund_completed';

/**
 * Bridge event
 */
export interface BridgeEvent {
  /** Event type */
  readonly type: BridgeEventType;
  
  /** Transaction ID */
  readonly transactionId: string;
  
  /** Event data */
  readonly data: Record<string, unknown>;
  
  /** Timestamp */
  readonly timestamp: Date;
  
  /** Block number (if on-chain event) */
  readonly blockNumber?: number;
  
  /** Transaction hash (if on-chain event) */
  readonly txHash?: string;
}

/**
 * Event listener type
 */
export type BridgeEventListener = (event: BridgeEvent) => void | Promise<void>;

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Bridge error codes
 */
export enum BridgeErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INVALID_CONFIG = 'INVALID_CONFIG',
  
  // Chain errors
  UNSUPPORTED_CHAIN = 'UNSUPPORTED_CHAIN',
  CHAIN_UNAVAILABLE = 'CHAIN_UNAVAILABLE',
  RPC_ERROR = 'RPC_ERROR',
  
  // Transaction errors
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_FEE = 'INSUFFICIENT_FEE',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  TRANSACTION_TIMEOUT = 'TRANSACTION_TIMEOUT',
  TRANSACTION_REVERTED = 'TRANSACTION_REVERTED',
  
  // Proof errors
  PROOF_GENERATION_FAILED = 'PROOF_GENERATION_FAILED',
  PROOF_VERIFICATION_FAILED = 'PROOF_VERIFICATION_FAILED',
  INVALID_PROOF = 'INVALID_PROOF',
  
  // Relayer errors
  RELAYER_UNAVAILABLE = 'RELAYER_UNAVAILABLE',
  RELAYER_REJECTED = 'RELAYER_REJECTED',
  RELAYER_TIMEOUT = 'RELAYER_TIMEOUT',
  
  // Lockbox errors
  LOCKBOX_FULL = 'LOCKBOX_FULL',
  LOCKBOX_EMPTY = 'LOCKBOX_EMPTY',
  INVALID_COMMITMENT = 'INVALID_COMMITMENT',
  NULLIFIER_USED = 'NULLIFIER_USED',
  
  // Amount errors
  AMOUNT_TOO_LOW = 'AMOUNT_TOO_LOW',
  AMOUNT_TOO_HIGH = 'AMOUNT_TOO_HIGH',
}

/**
 * Bridge error
 */
export class BridgeError extends Error {
  constructor(
    public readonly code: BridgeErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'BridgeError';
  }
  
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Quote for a bridge operation
 */
export interface BridgeQuote {
  /** Route information */
  readonly route: BridgeRoute;
  
  /** Amount to receive on destination */
  readonly destAmount: bigint;
  
  /** Bridge fee */
  readonly bridgeFee: bigint;
  
  /** Relayer fee */
  readonly relayerFee: bigint;
  
  /** Total fees */
  readonly totalFee: bigint;
  
  /** Fee percentage */
  readonly feePercent: number;
  
  /** Estimated time to complete (seconds) */
  readonly estimatedTime: number;
  
  /** Quote expiry timestamp */
  readonly expiresAt: Date;
  
  /** Quote ID (for execution) */
  readonly quoteId: string;
}

/**
 * Bridge operation options
 */
export interface BridgeOptions {
  /** Custom recipient (if different from sender) */
  readonly recipient?: string;
  
  /** Slippage tolerance (basis points) */
  readonly slippage?: number;
  
  /** Deadline timestamp */
  readonly deadline?: Date;
  
  /** Priority fee (for faster processing) */
  readonly priorityFee?: bigint;
  
  /** Skip preflight checks */
  readonly skipPreflight?: boolean;
}

/**
 * Bridge result
 */
export interface BridgeResult {
  /** Success status */
  readonly success: boolean;
  
  /** Transaction information */
  readonly transaction?: BridgeTransaction;
  
  /** Error if failed */
  readonly error?: BridgeError;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Check if a chain ID is valid
 */
export function isValidChainId(chainId: string): chainId is ChainId {
  return chainId in SUPPORTED_CHAINS;
}

/**
 * Check if a chain is Solana-based
 */
export function isSolanaChain(chainId: ChainId): boolean {
  return SUPPORTED_CHAINS[chainId]?.type === 'solana';
}

/**
 * Check if a chain is EVM-based
 */
export function isEVMChain(chainId: ChainId): boolean {
  return SUPPORTED_CHAINS[chainId]?.type === 'evm';
}

/**
 * Check if a chain is a testnet
 */
export function isTestnet(chainId: ChainId): boolean {
  return SUPPORTED_CHAINS[chainId]?.isTestnet ?? false;
}

/**
 * Get chain config by ID
 */
export function getChainConfig(chainId: ChainId): ChainConfig {
  const config = SUPPORTED_CHAINS[chainId];
  if (!config) {
    throw new BridgeError(
      BridgeErrorCode.UNSUPPORTED_CHAIN,
      `Unsupported chain: ${chainId}`,
    );
  }
  return config;
}
