/**
 * @fileoverview Core type definitions for Privacy DAO
 * @description This module defines the fundamental types for anonymous governance
 * including proposals, voting, delegation, and timelock execution.
 * 
 * @module @prvcsh/dao/types
 * @version 0.1.0
 */

// =============================================================================
// GOVERNANCE TOKEN TYPES
// =============================================================================

/**
 * Governance token information
 */
export interface GovernanceToken {
  /** Token mint address */
  readonly mint: string;
  
  /** Token name */
  readonly name: string;
  
  /** Token symbol */
  readonly symbol: string;
  
  /** Token decimals */
  readonly decimals: number;
  
  /** Total supply */
  readonly totalSupply: bigint;
  
  /** Circulating supply (excludes treasury) */
  readonly circulatingSupply: bigint;
  
  /** Minimum tokens required to create proposal */
  readonly proposalThreshold: bigint;
  
  /** Minimum tokens required to vote */
  readonly voteThreshold: bigint;
}

// =============================================================================
// PROPOSAL TYPES
// =============================================================================

/**
 * Proposal status
 */
export type ProposalStatus =
  | 'draft'       // Not yet submitted
  | 'pending'     // Submitted, waiting for voting period
  | 'active'      // Voting in progress
  | 'succeeded'   // Passed, awaiting execution
  | 'defeated'    // Did not pass
  | 'queued'      // In timelock queue
  | 'executed'    // Successfully executed
  | 'cancelled'   // Cancelled by proposer
  | 'expired';    // Execution window passed

/**
 * Proposal action types
 */
export type ProposalActionType =
  | 'transfer'        // Transfer tokens from treasury
  | 'mint'            // Mint new tokens
  | 'burn'            // Burn tokens
  | 'upgrade'         // Upgrade program
  | 'config_change'   // Change DAO configuration
  | 'grant'           // Issue grant
  | 'custom';         // Custom instruction

/**
 * Proposal action
 */
export interface ProposalAction {
  /** Action type */
  readonly type: ProposalActionType;
  
  /** Target program/account */
  readonly target: string;
  
  /** Action data (serialized instruction) */
  readonly data: Uint8Array;
  
  /** Value to transfer (if applicable) */
  readonly value?: bigint;
  
  /** Human-readable description */
  readonly description: string;
}

/**
 * Proposal metadata
 */
export interface ProposalMetadata {
  /** Short title */
  readonly title: string;
  
  /** Detailed description (markdown) */
  readonly description: string;
  
  /** Discussion forum link */
  readonly discussionUrl?: string;
  
  /** IPFS hash for additional docs */
  readonly ipfsHash?: string;
  
  /** Tags/categories */
  readonly tags: readonly string[];
}

/**
 * Proposal timing configuration
 */
export interface ProposalTiming {
  /** Voting delay (seconds after creation) */
  readonly votingDelay: number;
  
  /** Voting period (seconds) */
  readonly votingPeriod: number;
  
  /** Timelock delay (seconds after passing) */
  readonly timelockDelay: number;
  
  /** Execution window (seconds to execute after timelock) */
  readonly executionWindow: number;
}

/**
 * Full proposal structure
 */
export interface Proposal {
  /** Unique proposal ID */
  readonly id: string;
  
  /** On-chain proposal number */
  readonly proposalNumber: number;
  
  /** Proposal metadata */
  readonly metadata: ProposalMetadata;
  
  /** Proposer's commitment (anonymous) */
  readonly proposerCommitment: string;
  
  /** Actions to execute */
  readonly actions: readonly ProposalAction[];
  
  /** Current status */
  status: ProposalStatus;
  
  /** Vote counts */
  votes: VoteTally;
  
  /** Timing configuration */
  readonly timing: ProposalTiming;
  
  /** Timestamps */
  readonly createdAt: Date;
  readonly votingStartsAt: Date;
  readonly votingEndsAt: Date;
  queuedAt?: Date;
  executedAt?: Date;
  cancelledAt?: Date;
  
  /** Transaction hashes */
  readonly createTxHash: string;
  queueTxHash?: string;
  executeTxHash?: string;
  cancelTxHash?: string;
  
  /** Quorum requirement (tokens) */
  readonly quorumRequired: bigint;
  
  /** Whether quorum was reached */
  quorumReached: boolean;
}

/**
 * Vote tally
 */
export interface VoteTally {
  /** Total votes for */
  forVotes: bigint;
  
  /** Total votes against */
  againstVotes: bigint;
  
  /** Total abstain votes */
  abstainVotes: bigint;
  
  /** Unique voters count */
  voterCount: number;
  
  /** Total voting power used */
  totalVotingPower: bigint;
}

// =============================================================================
// VOTING TYPES
// =============================================================================

/**
 * Vote choice
 */
export type VoteChoice = 'for' | 'against' | 'abstain';

/**
 * Vote weight calculation method
 */
export type VoteWeightMethod =
  | 'linear'     // 1 token = 1 vote
  | 'quadratic'  // vote weight = sqrt(tokens)
  | 'conviction' // Time-weighted voting
  | 'delegation';// Delegated vote power

/**
 * Vote record (anonymous)
 */
export interface VoteRecord {
  /** Vote nullifier (prevents double voting) */
  readonly nullifier: string;
  
  /** Proposal ID */
  readonly proposalId: string;
  
  /** Vote choice */
  readonly choice: VoteChoice;
  
  /** Vote weight */
  readonly weight: bigint;
  
  /** Raw token amount (for quadratic calculation) */
  readonly tokenAmount: bigint;
  
  /** ZK proof of token ownership */
  readonly proof: VoteProof;
  
  /** Timestamp */
  readonly votedAt: Date;
  
  /** Transaction hash */
  readonly txHash: string;
}

/**
 * ZK proof for voting
 */
export interface VoteProof {
  /** Proof data */
  readonly proof: Uint8Array;
  
  /** Public inputs */
  readonly publicInputs: readonly string[];
  
  /** Merkle root at time of vote */
  readonly merkleRoot: string;
  
  /** Token ownership commitment */
  readonly commitment: string;
  
  /** Nullifier */
  readonly nullifier: string;
  
  /** Proposal ID being voted on */
  readonly proposalId: string;
  
  /** Vote choice hash */
  readonly choiceHash: string;
}

/**
 * Vote proof input (private data)
 */
export interface VoteProofInput {
  /** User's secret */
  readonly secret: Uint8Array;
  
  /** Random nonce */
  readonly nonce: Uint8Array;
  
  /** Token amount held */
  readonly tokenAmount: bigint;
  
  /** Proposal ID */
  readonly proposalId: string;
  
  /** Vote choice */
  readonly choice: VoteChoice;
  
  /** Merkle path for token ownership proof */
  readonly merklePath: readonly string[];
  
  /** Path indices */
  readonly pathIndices: readonly number[];
  
  /** Leaf index in token holders tree */
  readonly leafIndex: number;
}

// =============================================================================
// DELEGATION TYPES
// =============================================================================

/**
 * Delegation type
 */
export type DelegationType =
  | 'full'      // Delegate all voting power
  | 'partial'   // Delegate portion of voting power
  | 'proposal'; // Delegate for specific proposal only

/**
 * Delegation record
 */
export interface Delegation {
  /** Unique delegation ID */
  readonly delegationId: string;
  
  /** Delegator's commitment (anonymous) */
  readonly delegatorCommitment: string;
  
  /** Delegate's commitment (anonymous) */
  readonly delegateCommitment: string;
  
  /** Delegation type */
  readonly delegationType: DelegationType;
  
  /** Token amount delegated */
  readonly amount: bigint;
  
  /** Delegated voting power */
  readonly delegatedPower: bigint;
  
  /** Specific proposal (if type === 'proposal') */
  readonly proposalId?: string;
  
  /** Expiry timestamp */
  readonly expiresAt?: Date;
  
  /** Is active */
  isActive: boolean;
  
  /** Creation timestamp */
  readonly createdAt: Date;
  
  /** Revocation timestamp */
  revokedAt?: Date;
  
  /** Transaction hash */
  readonly txHash?: string;
  
  /** ZK proof */
  readonly proof?: DelegationProof;
  
  /** Delegation constraints */
  readonly constraints?: DelegationConstraints;
}

/**
 * Delegation constraints
 */
export interface DelegationConstraints {
  /** Only for specific proposal IDs */
  readonly proposalIds?: string[];
  
  /** Only for specific proposal types */
  readonly proposalTypes?: string[];
  
  /** Exclude these vote choices */
  readonly excludeChoices?: ('for' | 'against' | 'abstain')[];
  
  /** Maximum voting power to use */
  readonly maxVotingPower?: bigint;
}

/**
 * Delegation proof
 */
export interface DelegationProof {
  /** ZK proof */
  readonly proof: Uint8Array;
  
  /** Public inputs */
  readonly publicInputs: string[];
  
  /** Merkle root */
  readonly merkleRoot: string;
  
  /** Delegator commitment */
  readonly delegatorCommitment: string;
}

/**
 * Delegation proof input
 */
export interface DelegationProofInput {
  /** User secret */
  readonly secret: Uint8Array;
  
  /** Random nonce */
  readonly nonce: Uint8Array;
  
  /** Token amount */
  readonly tokenAmount: bigint;
  
  /** Delegate commitment */
  readonly delegateCommitment: string;
  
  /** Action (delegate or revoke) */
  readonly action: 'delegate' | 'revoke';
  
  /** Merkle path */
  readonly merklePath: string[];
  
  /** Path indices */
  readonly pathIndices: number[];
  
  /** Leaf index */
  readonly leafIndex: number;
}

/**
 * Delegate result
 */
export interface DelegateResult {
  readonly success: boolean;
  readonly delegation?: Delegation;
  readonly txHash?: string;
  readonly error?: DAOError;
}

/**
 * Delegate info (public profile)
 */
export interface DelegateProfile {
  /** Delegate commitment (public identifier) */
  readonly commitment: string;
  
  /** Display name (optional) */
  readonly name?: string;
  
  /** Description/bio */
  readonly description?: string;
  
  /** External link */
  readonly website?: string;
  
  /** Total delegated voting power */
  readonly totalDelegatedPower: bigint;
  
  /** Number of delegators */
  readonly delegatorCount: number;
  
  /** Voting participation rate */
  readonly participationRate: number;
  
  /** Historical votes cast */
  readonly votesCast: number;
}

// =============================================================================
// TIMELOCK TYPES
// =============================================================================

/**
 * Timelock transaction status
 */
export type TimelockStatus =
  | 'queued'    // In queue, waiting for delay
  | 'ready'     // Delay passed, can execute
  | 'executed'  // Successfully executed
  | 'cancelled' // Cancelled before execution
  | 'expired';  // Execution window passed

/**
 * Timelock transaction
 */
export interface TimelockTransaction {
  /** Unique transaction ID */
  readonly txId: string;
  
  /** Associated proposal ID */
  readonly proposalId: string;
  
  /** Actions to execute */
  readonly actions: readonly ProposalAction[];
  
  /** Current status */
  status: TimelockStatus;
  
  /** Delay in seconds */
  readonly delay: number;
  
  /** Salt for hash */
  readonly salt?: string;
  
  /** Earliest execution time */
  readonly executeAt: Date;
  
  /** Latest execution time (expiry) */
  readonly expiresAt: Date;
  
  /** Queued timestamp */
  readonly queuedAt: Date;
  
  /** Executed timestamp */
  executedAt?: Date;
  
  /** Cancelled timestamp */
  cancelledAt?: Date;
  
  /** Cancel reason */
  cancelReason?: string;
  
  /** Transaction hashes */
  readonly queueTxHash?: string;
  executeTxHash?: string;
  cancelTxHash?: string;
  
  /** Metadata */
  readonly metadata?: Record<string, unknown>;
}

// =============================================================================
// DAO CONFIGURATION
// =============================================================================

/**
 * DAO configuration
 */
export interface DAOConfig {
  /** DAO name */
  readonly name: string;
  
  /** DAO description */
  readonly description: string;
  
  /** Governance token */
  readonly token: GovernanceToken;
  
  /** Default voting delay (seconds) */
  readonly votingDelay: number;
  
  /** Default voting period (seconds) */
  readonly votingPeriod: number;
  
  /** Default timelock delay (seconds) */
  readonly timelockDelay: number;
  
  /** Default execution window (seconds) */
  readonly executionWindow: number;
  
  /** Quorum percentage (basis points, 100 = 1%) */
  readonly quorumPercentage: number;
  
  /** Vote weight calculation method */
  readonly voteWeightMethod: VoteWeightMethod;
  
  /** Proposal threshold (tokens required to propose) */
  readonly proposalThreshold: bigint;
  
  /** Vote threshold (minimum tokens to vote) */
  readonly voteThreshold: bigint;
  
  /** Guardian address (can cancel proposals) */
  readonly guardian?: string;
  
  /** Treasury address */
  readonly treasury: string;
  
  /** DAO program address */
  readonly programId: string;
  
  /** Governance state account */
  readonly governanceAccount?: string;
}

/**
 * DAO statistics
 */
export interface DAOStats {
  /** Total proposals created */
  readonly totalProposals: number;
  
  /** Active proposals */
  readonly activeProposals: number;
  
  /** Executed proposals */
  readonly executedProposals: number;
  
  /** Unique voters */
  readonly uniqueVoters: number;
  
  /** Total votes cast */
  readonly totalVotesCast: number;
  
  /** Average participation rate */
  readonly avgParticipationRate: number;
  
  /** Treasury balance */
  readonly treasuryBalance: bigint;
  
  /** Total delegated power */
  readonly totalDelegatedPower: bigint;
  
  /** Active delegates count */
  readonly activeDelegates: number;
  
  /** Last proposal timestamp */
  readonly lastProposalAt?: Date;
  
  /** Last vote timestamp */
  readonly lastVoteAt?: Date;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

/**
 * DAO event types
 */
export type DAOEventType =
  | 'proposal_created'
  | 'proposal_cancelled'
  | 'proposal_queued'
  | 'proposal_executed'
  | 'vote_cast'
  | 'delegation_created'
  | 'delegation_revoked'
  | 'config_updated'
  | 'guardian_changed';

/**
 * DAO event
 */
export interface DAOEvent {
  /** Event type */
  readonly type: DAOEventType;
  
  /** Related proposal ID */
  readonly proposalId?: string;
  
  /** Event data */
  readonly data: Record<string, unknown>;
  
  /** Timestamp */
  readonly timestamp: Date;
  
  /** Block number */
  readonly blockNumber: number;
  
  /** Transaction hash */
  readonly txHash: string;
}

/**
 * Event listener type
 */
export type DAOEventListener = (event: DAOEvent) => void | Promise<void>;

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * DAO error codes
 */
export enum DAOErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INVALID_CONFIG = 'INVALID_CONFIG',
  NOT_INITIALIZED = 'NOT_INITIALIZED',
  
  // Proposal errors
  PROPOSAL_NOT_FOUND = 'PROPOSAL_NOT_FOUND',
  PROPOSAL_ALREADY_EXISTS = 'PROPOSAL_ALREADY_EXISTS',
  INVALID_PROPOSAL_STATE = 'INVALID_PROPOSAL_STATE',
  PROPOSAL_THRESHOLD_NOT_MET = 'PROPOSAL_THRESHOLD_NOT_MET',
  
  // Voting errors
  VOTING_NOT_ACTIVE = 'VOTING_NOT_ACTIVE',
  ALREADY_VOTED = 'ALREADY_VOTED',
  VOTE_THRESHOLD_NOT_MET = 'VOTE_THRESHOLD_NOT_MET',
  INVALID_VOTE_PROOF = 'INVALID_VOTE_PROOF',
  NULLIFIER_ALREADY_USED = 'NULLIFIER_ALREADY_USED',
  
  // Delegation errors
  DELEGATION_NOT_FOUND = 'DELEGATION_NOT_FOUND',
  SELF_DELEGATION = 'SELF_DELEGATION',
  CIRCULAR_DELEGATION = 'CIRCULAR_DELEGATION',
  DELEGATION_EXPIRED = 'DELEGATION_EXPIRED',
  INVALID_DELEGATION_PROOF = 'INVALID_DELEGATION_PROOF',
  DELEGATION_AMOUNT_TOO_LOW = 'DELEGATION_AMOUNT_TOO_LOW',
  DELEGATION_AMOUNT_TOO_HIGH = 'DELEGATION_AMOUNT_TOO_HIGH',
  DELEGATION_ALREADY_EXISTS = 'DELEGATION_ALREADY_EXISTS',
  DELEGATION_ALREADY_REVOKED = 'DELEGATION_ALREADY_REVOKED',
  DELEGATION_LOCKED = 'DELEGATION_LOCKED',
  
  // Timelock errors
  TIMELOCK_NOT_READY = 'TIMELOCK_NOT_READY',
  TIMELOCK_EXPIRED = 'TIMELOCK_EXPIRED',
  TIMELOCK_NOT_FOUND = 'TIMELOCK_NOT_FOUND',
  INVALID_TIMELOCK_DELAY = 'INVALID_TIMELOCK_DELAY',
  INVALID_TIMELOCK_STATUS = 'INVALID_TIMELOCK_STATUS',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  
  // Permission errors
  NOT_AUTHORIZED = 'NOT_AUTHORIZED',
  GUARDIAN_ONLY = 'GUARDIAN_ONLY',
}

/**
 * DAO error
 */
export class DAOError extends Error {
  constructor(
    public readonly code: DAOErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DAOError';
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
// RESULT TYPES
// =============================================================================

/**
 * Create proposal result
 */
export interface CreateProposalResult {
  readonly success: boolean;
  readonly proposal?: Proposal;
  readonly txHash?: string;
  readonly error?: DAOError;
}

/**
 * Cast vote result
 */
export interface CastVoteResult {
  readonly success: boolean;
  readonly voteRecord?: VoteRecord;
  readonly txHash?: string;
  readonly error?: DAOError;
}

/**
 * Execute proposal result
 */
export interface ExecuteProposalResult {
  readonly success: boolean;
  readonly txHash?: string;
  readonly error?: DAOError;
}

/**
 * Create delegation result
 */
export interface CreateDelegationResult {
  readonly success: boolean;
  readonly delegation?: Delegation;
  readonly txHash?: string;
  readonly error?: DAOError;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Pagination options
 */
export interface PaginationOptions {
  readonly limit: number;
  readonly offset: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly hasMore: boolean;
}

/**
 * Proposal filter options
 */
export interface ProposalFilter {
  readonly status?: ProposalStatus[];
  readonly proposerCommitment?: string;
  readonly fromDate?: Date;
  readonly toDate?: Date;
  readonly tags?: string[];
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate quadratic vote weight
 * @param tokenAmount Token amount held
 * @returns Quadratic vote weight
 */
export function calculateQuadraticWeight(tokenAmount: bigint): bigint {
  // sqrt(tokenAmount) - using Newton's method for BigInt
  if (tokenAmount < BigInt(2)) return tokenAmount;
  
  let x = tokenAmount;
  let y = (x + BigInt(1)) / BigInt(2);
  
  while (y < x) {
    x = y;
    y = (x + tokenAmount / x) / BigInt(2);
  }
  
  return x;
}

/**
 * Check if proposal has reached quorum
 * @param votes Vote tally
 * @param quorumRequired Required quorum
 * @returns Whether quorum is reached
 */
export function hasReachedQuorum(
  votes: VoteTally,
  quorumRequired: bigint,
): boolean {
  return votes.totalVotingPower >= quorumRequired;
}

/**
 * Check if proposal has passed
 * @param votes Vote tally
 * @param quorumRequired Required quorum
 * @returns Whether proposal passed
 */
export function hasProposalPassed(
  votes: VoteTally,
  quorumRequired: bigint,
): boolean {
  if (!hasReachedQuorum(votes, quorumRequired)) return false;
  return votes.forVotes > votes.againstVotes;
}

/**
 * Get proposal status description
 */
export function getStatusDescription(status: ProposalStatus): string {
  const descriptions: Record<ProposalStatus, string> = {
    draft: 'Draft - Not yet submitted',
    pending: 'Pending - Waiting for voting to start',
    active: 'Active - Voting in progress',
    succeeded: 'Succeeded - Passed, awaiting execution',
    defeated: 'Defeated - Did not pass',
    queued: 'Queued - In timelock queue',
    executed: 'Executed - Successfully completed',
    cancelled: 'Cancelled - Cancelled by proposer',
    expired: 'Expired - Execution window passed',
  };
  return descriptions[status];
}
