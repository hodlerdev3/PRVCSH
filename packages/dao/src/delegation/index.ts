/**
 * @fileoverview Delegation module for Privacy DAO
 * @description Handles anonymous vote delegation with ZK proofs,
 * allowing token holders to delegate their voting power privately.
 * 
 * @module @prvcsh/dao/delegation
 * @version 0.1.0
 */

import {
  DAOError,
  DAOErrorCode,
  calculateQuadraticWeight,
  type Delegation,
  type DelegationType,
  type DelegationProof,
  type DelegationProofInput,
  type DelegateResult,
  type DelegationConstraints,
  type VoteWeightMethod,
  type DAOEvent,
  type DAOEventListener,
} from '../types';

// =============================================================================
// DELEGATION TYPES
// =============================================================================

/**
 * Delegation configuration
 */
export interface DelegationConfig {
  /** Maximum delegation depth (1 = direct only, 2+ = allows chains) */
  readonly maxDelegationDepth: number;
  
  /** Whether to allow partial delegation */
  readonly allowPartialDelegation: boolean;
  
  /** Minimum tokens to delegate */
  readonly minDelegationAmount: bigint;
  
  /** Maximum tokens to delegate (0 = unlimited) */
  readonly maxDelegationAmount: bigint;
  
  /** Whether delegated power is quadratic */
  readonly useQuadraticDelegation: boolean;
  
  /** Vote weight method for delegation */
  readonly voteWeightMethod: VoteWeightMethod;
  
  /** Delegation lock period (seconds) */
  readonly delegationLockPeriod: number;
}

/**
 * Create delegation input
 */
export interface CreateDelegationInput {
  /** Delegate commitment (public key commitment) */
  readonly delegateCommitment: string;
  
  /** Token amount to delegate */
  readonly amount: bigint;
  
  /** Delegation type */
  readonly type: DelegationType;
  
  /** Expiration date */
  readonly expiresAt?: Date;
  
  /** ZK proof of ownership */
  readonly proof: DelegationProof;
  
  /** Optional constraints */
  readonly constraints?: DelegationConstraints;
}

/**
 * Revoke delegation input
 */
export interface RevokeDelegationInput {
  /** Delegation ID */
  readonly delegationId: string;
  
  /** ZK proof of delegator identity */
  readonly proof: DelegationProof;
  
  /** Reason for revocation */
  readonly reason?: string;
}

/**
 * Delegation power info
 */
export interface DelegationPower {
  /** Total own tokens */
  readonly ownTokens: bigint;
  
  /** Total delegated to this account */
  readonly receivedDelegation: bigint;
  
  /** Total delegated away from this account */
  readonly givenDelegation: bigint;
  
  /** Net voting power (own + received - given) */
  readonly netVotingPower: bigint;
  
  /** Quadratic voting power */
  readonly quadraticVotingPower: bigint;
  
  /** Number of delegators */
  readonly delegatorCount: number;
  
  /** Number of delegatees */
  readonly delegateeCount: number;
}

/**
 * Delegation statistics
 */
export interface DelegationStats {
  /** Total delegations */
  readonly totalDelegations: number;
  
  /** Active delegations */
  readonly activeDelegations: number;
  
  /** Total delegated amount */
  readonly totalDelegatedAmount: bigint;
  
  /** Average delegation amount */
  readonly averageDelegationAmount: bigint;
  
  /** Top delegatees by power */
  readonly topDelegatees: Array<{
    commitment: string;
    power: bigint;
    delegatorCount: number;
  }>;
}

// =============================================================================
// DELEGATION INTERFACE
// =============================================================================

/**
 * Delegation interface for anonymous vote delegation
 */
export interface IDelegation {
  /**
   * Create a delegation
   * @param input Delegation input
   * @returns Delegation result
   */
  delegate(input: CreateDelegationInput): Promise<DelegateResult>;
  
  /**
   * Revoke a delegation
   * @param input Revoke input
   * @returns Delegation result
   */
  revokeDelegation(input: RevokeDelegationInput): Promise<DelegateResult>;
  
  /**
   * Get delegation by ID
   * @param delegationId Delegation ID
   * @returns Delegation or null
   */
  getDelegation(delegationId: string): Promise<Delegation | null>;
  
  /**
   * Get delegations by delegate commitment
   * @param delegateCommitment Delegate commitment
   * @returns Delegations to this delegate
   */
  getDelegationsByDelegate(delegateCommitment: string): Promise<Delegation[]>;
  
  /**
   * Get delegation power for commitment
   * @param commitment Account commitment
   * @param ownTokens Own token amount
   * @returns Delegation power info
   */
  getDelegationPower(commitment: string, ownTokens: bigint): Promise<DelegationPower>;
  
  /**
   * Get global delegation stats
   * @returns Delegation statistics
   */
  getDelegationStats(): Promise<DelegationStats>;
  
  /**
   * Calculate effective voting power
   * @param commitment Account commitment
   * @param ownTokens Own token amount
   * @param proposalId Proposal ID (for constraints)
   * @returns Effective voting power
   */
  calculateEffectiveVotingPower(
    commitment: string,
    ownTokens: bigint,
    proposalId?: string,
  ): Promise<bigint>;
  
  /**
   * Prepare delegation proof input
   * @param secret User's secret
   * @param nonce Random nonce
   * @param tokenAmount Token amount
   * @param delegateCommitment Delegate commitment
   * @param action Action (delegate/revoke)
   * @returns Proof input
   */
  prepareDelegationProofInput(
    secret: Uint8Array,
    nonce: Uint8Array,
    tokenAmount: bigint,
    delegateCommitment: string,
    action: 'delegate' | 'revoke',
  ): Promise<DelegationProofInput>;
  
  /**
   * Verify delegation proof
   * @param proof Delegation proof
   * @returns Whether proof is valid
   */
  verifyDelegationProof(proof: DelegationProof): Promise<boolean>;
  
  /**
   * Check if delegation is valid for proposal
   * @param delegation Delegation
   * @param proposalId Proposal ID
   * @returns Whether delegation applies
   */
  isDelegationValidForProposal(
    delegation: Delegation,
    proposalId: string,
  ): boolean;
  
  /**
   * Subscribe to delegation events
   * @param listener Event listener
   * @returns Unsubscribe function
   */
  subscribe(listener: DAOEventListener): () => void;
  
  /**
   * Initialize delegation module
   */
  initialize(): Promise<void>;
  
  /**
   * Cleanup resources
   */
  destroy(): Promise<void>;
}

// =============================================================================
// DELEGATION IMPLEMENTATION
// =============================================================================

/**
 * Delegation implementation
 */
export class DelegationManager implements IDelegation {
  private config: DelegationConfig;
  private initialized: boolean = false;
  private listeners: Set<DAOEventListener> = new Set();
  
  // In-memory storage
  private delegations: Map<string, Delegation> = new Map();
  private delegateIndex: Map<string, Set<string>> = new Map();
  private delegatorIndex: Map<string, Set<string>> = new Map();
  
  constructor(config: DelegationConfig) {
    this.config = config;
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Load existing delegations from chain
    
    this.initialized = true;
  }
  
  async destroy(): Promise<void> {
    this.listeners.clear();
    this.delegations.clear();
    this.delegateIndex.clear();
    this.delegatorIndex.clear();
    this.initialized = false;
  }
  
  async delegate(input: CreateDelegationInput): Promise<DelegateResult> {
    this.ensureInitialized();
    
    try {
      // Verify proof
      const isValid = await this.verifyDelegationProof(input.proof);
      if (!isValid) {
        return {
          success: false,
          error: new DAOError(
            DAOErrorCode.INVALID_DELEGATION_PROOF,
            'Invalid delegation proof',
          ),
        };
      }
      
      // Validate amount
      if (input.amount < this.config.minDelegationAmount) {
        return {
          success: false,
          error: new DAOError(
            DAOErrorCode.DELEGATION_AMOUNT_TOO_LOW,
            `Amount ${input.amount} below minimum ${this.config.minDelegationAmount}`,
          ),
        };
      }
      
      if (this.config.maxDelegationAmount > BigInt(0) && 
          input.amount > this.config.maxDelegationAmount) {
        return {
          success: false,
          error: new DAOError(
            DAOErrorCode.DELEGATION_AMOUNT_TOO_HIGH,
            `Amount ${input.amount} exceeds maximum ${this.config.maxDelegationAmount}`,
          ),
        };
      }
      
      // Generate delegation ID
      const delegationId = this.generateDelegationId(
        input.proof.delegatorCommitment,
        input.delegateCommitment,
        input.amount,
      );
      
      // Check for existing delegation
      if (this.delegations.has(delegationId)) {
        return {
          success: false,
          error: new DAOError(
            DAOErrorCode.DELEGATION_ALREADY_EXISTS,
            'Delegation already exists',
          ),
        };
      }
      
      // Calculate delegated power
      const delegatedPower = this.config.useQuadraticDelegation
        ? calculateQuadraticWeight(input.amount)
        : input.amount;
      
      // Create delegation
      const now = new Date();
      const delegation: Delegation = {
        delegationId,
        delegatorCommitment: input.proof.delegatorCommitment,
        delegateCommitment: input.delegateCommitment,
        amount: input.amount,
        delegatedPower,
        delegationType: input.type,
        createdAt: now,
        expiresAt: input.expiresAt,
        isActive: true,
        proof: input.proof,
        constraints: input.constraints,
      };
      
      // Store delegation
      this.delegations.set(delegationId, delegation);
      
      // Update delegate index
      let delegateDelegations = this.delegateIndex.get(input.delegateCommitment);
      if (!delegateDelegations) {
        delegateDelegations = new Set();
        this.delegateIndex.set(input.delegateCommitment, delegateDelegations);
      }
      delegateDelegations.add(delegationId);
      
      // Update delegator index
      let delegatorDelegations = this.delegatorIndex.get(input.proof.delegatorCommitment);
      if (!delegatorDelegations) {
        delegatorDelegations = new Set();
        this.delegatorIndex.set(input.proof.delegatorCommitment, delegatorDelegations);
      }
      delegatorDelegations.add(delegationId);
      
      // Emit event
      await this.emit({
        type: 'delegation_created',
        data: {
          delegationId,
          type: input.type,
          amount: input.amount.toString(),
          delegatedPower: delegatedPower.toString(),
          // Note: commitments not included for privacy
        },
        timestamp: now,
        blockNumber: 0,
        txHash: '',
      });
      
      return {
        success: true,
        delegation,
        txHash: '',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof DAOError ? error : new DAOError(
          DAOErrorCode.UNKNOWN_ERROR,
          String(error),
        ),
      };
    }
  }
  
  async revokeDelegation(input: RevokeDelegationInput): Promise<DelegateResult> {
    this.ensureInitialized();
    
    try {
      const delegation = this.delegations.get(input.delegationId);
      if (!delegation) {
        return {
          success: false,
          error: new DAOError(
            DAOErrorCode.DELEGATION_NOT_FOUND,
            `Delegation ${input.delegationId} not found`,
          ),
        };
      }
      
      if (!delegation.isActive) {
        return {
          success: false,
          error: new DAOError(
            DAOErrorCode.DELEGATION_ALREADY_REVOKED,
            'Delegation already revoked',
          ),
        };
      }
      
      // Verify proof matches delegator
      const isValid = await this.verifyDelegationProof(input.proof);
      if (!isValid) {
        return {
          success: false,
          error: new DAOError(
            DAOErrorCode.INVALID_DELEGATION_PROOF,
            'Invalid revocation proof',
          ),
        };
      }
      
      // Check lock period
      const now = new Date();
      const lockEnd = new Date(
        delegation.createdAt.getTime() + this.config.delegationLockPeriod * 1000
      );
      
      if (now < lockEnd) {
        const secondsRemaining = Math.ceil((lockEnd.getTime() - now.getTime()) / 1000);
        return {
          success: false,
          error: new DAOError(
            DAOErrorCode.DELEGATION_LOCKED,
            `Delegation locked for ${secondsRemaining} more seconds`,
          ),
        };
      }
      
      // Revoke delegation
      delegation.isActive = false;
      delegation.revokedAt = now;
      this.delegations.set(input.delegationId, delegation);
      
      // Emit event
      await this.emit({
        type: 'delegation_revoked',
        data: {
          delegationId: input.delegationId,
          reason: input.reason,
        },
        timestamp: now,
        blockNumber: 0,
        txHash: '',
      });
      
      return {
        success: true,
        delegation,
        txHash: '',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof DAOError ? error : new DAOError(
          DAOErrorCode.UNKNOWN_ERROR,
          String(error),
        ),
      };
    }
  }
  
  async getDelegation(delegationId: string): Promise<Delegation | null> {
    this.ensureInitialized();
    return this.delegations.get(delegationId) ?? null;
  }
  
  async getDelegationsByDelegate(delegateCommitment: string): Promise<Delegation[]> {
    this.ensureInitialized();
    
    const delegationIds = this.delegateIndex.get(delegateCommitment);
    if (!delegationIds) return [];
    
    return Array.from(delegationIds)
      .map(id => this.delegations.get(id))
      .filter((d): d is Delegation => d !== undefined && d.isActive);
  }
  
  async getDelegationPower(commitment: string, ownTokens: bigint): Promise<DelegationPower> {
    this.ensureInitialized();
    
    // Get received delegations
    const receivedDelegations = await this.getDelegationsByDelegate(commitment);
    const receivedDelegation = receivedDelegations.reduce(
      (sum, d) => sum + d.delegatedPower,
      BigInt(0),
    );
    
    // Get given delegations
    const givenDelegationIds = this.delegatorIndex.get(commitment);
    const givenDelegations = givenDelegationIds
      ? Array.from(givenDelegationIds)
          .map(id => this.delegations.get(id))
          .filter((d): d is Delegation => d !== undefined && d.isActive)
      : [];
    const givenDelegation = givenDelegations.reduce(
      (sum, d) => sum + d.delegatedPower,
      BigInt(0),
    );
    
    const netVotingPower = ownTokens + receivedDelegation - givenDelegation;
    const quadraticVotingPower = calculateQuadraticWeight(netVotingPower);
    
    return {
      ownTokens,
      receivedDelegation,
      givenDelegation,
      netVotingPower,
      quadraticVotingPower,
      delegatorCount: receivedDelegations.length,
      delegateeCount: givenDelegations.length,
    };
  }
  
  async getDelegationStats(): Promise<DelegationStats> {
    this.ensureInitialized();
    
    const allDelegations = Array.from(this.delegations.values());
    const activeDelegations = allDelegations.filter(d => d.isActive);
    
    const totalDelegatedAmount = activeDelegations.reduce(
      (sum, d) => sum + d.amount,
      BigInt(0),
    );
    
    // Calculate top delegatees
    const delegatePowerMap = new Map<string, { power: bigint; count: number }>();
    
    for (const d of activeDelegations) {
      const existing = delegatePowerMap.get(d.delegateCommitment);
      if (existing) {
        existing.power += d.delegatedPower;
        existing.count++;
      } else {
        delegatePowerMap.set(d.delegateCommitment, {
          power: d.delegatedPower,
          count: 1,
        });
      }
    }
    
    const topDelegatees = Array.from(delegatePowerMap.entries())
      .map(([commitment, { power, count }]) => ({
        commitment,
        power,
        delegatorCount: count,
      }))
      .sort((a, b) => Number(b.power - a.power))
      .slice(0, 10);
    
    return {
      totalDelegations: allDelegations.length,
      activeDelegations: activeDelegations.length,
      totalDelegatedAmount,
      averageDelegationAmount: activeDelegations.length > 0
        ? totalDelegatedAmount / BigInt(activeDelegations.length)
        : BigInt(0),
      topDelegatees,
    };
  }
  
  async calculateEffectiveVotingPower(
    commitment: string,
    ownTokens: bigint,
    proposalId?: string,
  ): Promise<bigint> {
    this.ensureInitialized();
    
    // Get received delegations
    let receivedDelegations = await this.getDelegationsByDelegate(commitment);
    
    // Filter by proposal if specified
    if (proposalId) {
      receivedDelegations = receivedDelegations.filter(d =>
        this.isDelegationValidForProposal(d, proposalId)
      );
    }
    
    // Filter expired delegations
    const now = new Date();
    receivedDelegations = receivedDelegations.filter(d =>
      !d.expiresAt || d.expiresAt > now
    );
    
    const receivedPower = receivedDelegations.reduce(
      (sum, d) => sum + d.delegatedPower,
      BigInt(0),
    );
    
    // Get given delegations
    const givenDelegationIds = this.delegatorIndex.get(commitment);
    const givenDelegations = givenDelegationIds
      ? Array.from(givenDelegationIds)
          .map(id => this.delegations.get(id))
          .filter((d): d is Delegation => 
            d !== undefined && 
            d.isActive &&
            (!d.expiresAt || d.expiresAt > now) &&
            (!proposalId || this.isDelegationValidForProposal(d, proposalId))
          )
      : [];
    
    const givenPower = givenDelegations.reduce(
      (sum, d) => sum + d.delegatedPower,
      BigInt(0),
    );
    
    const netPower = ownTokens + receivedPower - givenPower;
    
    // Apply vote weight method
    if (this.config.voteWeightMethod === 'quadratic') {
      return calculateQuadraticWeight(netPower);
    }
    
    return netPower;
  }
  
  async prepareDelegationProofInput(
    secret: Uint8Array,
    nonce: Uint8Array,
    tokenAmount: bigint,
    delegateCommitment: string,
    action: 'delegate' | 'revoke',
  ): Promise<DelegationProofInput> {
    // In real implementation, query Merkle tree for path
    const merklePath: string[] = [];
    const pathIndices: number[] = [];
    const leafIndex = 0;
    
    return {
      secret,
      nonce,
      tokenAmount,
      delegateCommitment,
      action,
      merklePath,
      pathIndices,
      leafIndex,
    };
  }
  
  async verifyDelegationProof(proof: DelegationProof): Promise<boolean> {
    // In real implementation, verify ZK proof using snarkjs
    return proof.proof.length > 0;
  }
  
  isDelegationValidForProposal(delegation: Delegation, proposalId: string): boolean {
    if (!delegation.isActive) return false;
    
    const constraints = delegation.constraints;
    if (!constraints) return true;
    
    // Check proposal ID constraint
    if (constraints.proposalIds && constraints.proposalIds.length > 0) {
      if (!constraints.proposalIds.includes(proposalId)) {
        return false;
      }
    }
    
    return true;
  }
  
  subscribe(listener: DAOEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================
  
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new DAOError(
        DAOErrorCode.NOT_INITIALIZED,
        'Delegation not initialized',
      );
    }
  }
  
  private async emit(event: DAOEvent): Promise<void> {
    const promises = Array.from(this.listeners).map(listener =>
      Promise.resolve(listener(event)).catch(console.error),
    );
    await Promise.all(promises);
  }
  
  private generateDelegationId(
    delegatorCommitment: string,
    delegateCommitment: string,
    amount: bigint,
  ): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(
      `${delegatorCommitment}:${delegateCommitment}:${amount}:${Date.now()}`
    );
    
    let hash = BigInt(0);
    for (const byte of data) {
      hash = (hash * BigInt(31) + BigInt(byte)) % (BigInt(2) ** BigInt(256));
    }
    
    return '0x' + hash.toString(16).padStart(64, '0');
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create delegation manager
 */
export function createDelegation(config: DelegationConfig): IDelegation {
  return new DelegationManager(config);
}

/**
 * Default delegation configuration
 */
export const DEFAULT_DELEGATION_CONFIG: DelegationConfig = {
  maxDelegationDepth: 1, // Direct only
  allowPartialDelegation: true,
  minDelegationAmount: BigInt(1_000_000_000), // 1 token
  maxDelegationAmount: BigInt(0), // No cap
  useQuadraticDelegation: true,
  voteWeightMethod: 'quadratic',
  delegationLockPeriod: 7 * 24 * 60 * 60, // 7 days
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if delegation is expired
 */
export function isDelegationExpired(delegation: Delegation): boolean {
  if (!delegation.expiresAt) return false;
  return new Date() > delegation.expiresAt;
}

/**
 * Calculate total delegated power from delegations
 */
export function calculateTotalDelegatedPower(delegations: Delegation[]): bigint {
  return delegations
    .filter(d => d.isActive && !isDelegationExpired(d))
    .reduce((sum, d) => sum + d.delegatedPower, BigInt(0));
}

/**
 * Filter delegations by type
 */
export function filterDelegationsByType(
  delegations: Delegation[],
  type: DelegationType,
): Delegation[] {
  return delegations.filter(d => d.delegationType === type);
}
