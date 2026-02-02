/**
 * @fileoverview Privacy DAO - Anonymous Governance System
 * @description Main entry point for the Privacy DAO module.
 * Provides ZK-based anonymous governance with quadratic voting,
 * timelock execution, and private delegation.
 * 
 * @module @prvcsh/dao
 * @version 0.1.0
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export * from './types';

// =============================================================================
// MODULE EXPORTS
// =============================================================================

export * from './governance';
export * from './voting';
export * from './timelock';
export * from './delegation';

// =============================================================================
// CONVENIENCE RE-EXPORTS
// =============================================================================

import { createGovernance, DEFAULT_DAO_CONFIG, type IGovernance } from './governance';
import { createVoting, DEFAULT_VOTING_CONFIG, type IVoting } from './voting';
import { createTimelock, DEFAULT_TIMELOCK_CONFIG, type ITimelock } from './timelock';
import { createDelegation, DEFAULT_DELEGATION_CONFIG, type IDelegation } from './delegation';
import type { DAOConfig } from './types';

/**
 * Privacy DAO instance
 */
export interface PrivacyDAO {
  /** Governance (proposal management) */
  readonly governance: IGovernance;
  
  /** Voting (anonymous voting) */
  readonly voting: IVoting;
  
  /** Timelock (delayed execution) */
  readonly timelock: ITimelock;
  
  /** Delegation (vote delegation) */
  readonly delegation: IDelegation;
  
  /** Initialize all modules */
  initialize(): Promise<void>;
  
  /** Cleanup all modules */
  destroy(): Promise<void>;
}

/**
 * Create a complete Privacy DAO instance
 * @param config DAO configuration
 * @returns Privacy DAO instance
 */
export function createPrivacyDAO(config?: Partial<DAOConfig>): PrivacyDAO {
  const mergedConfig = {
    ...DEFAULT_DAO_CONFIG,
    ...config,
  };
  
  const governance = createGovernance(mergedConfig);
  
  const voting = createVoting({
    voteWeightMethod: mergedConfig.voteWeightMethod,
    voteThreshold: mergedConfig.voteThreshold,
    maxVotingPower: BigInt(0),
    allowVoteChange: false,
    nullifierTreeDepth: 20,
  });
  
  const timelock = createTimelock({
    minDelay: mergedConfig.timelockDelay,
    maxDelay: mergedConfig.timelockDelay * 15, // 15x min delay
    gracePeriod: 7 * 24 * 60 * 60, // 7 days
    emergencyDelay: Math.floor(mergedConfig.timelockDelay / 2),
    guardians: [],
    admin: '',
  });
  
  const delegation = createDelegation({
    maxDelegationDepth: 1,
    allowPartialDelegation: true,
    minDelegationAmount: mergedConfig.voteThreshold,
    maxDelegationAmount: BigInt(0),
    useQuadraticDelegation: mergedConfig.voteWeightMethod === 'quadratic',
    voteWeightMethod: mergedConfig.voteWeightMethod,
    delegationLockPeriod: 7 * 24 * 60 * 60,
  });
  
  return {
    governance,
    voting,
    timelock,
    delegation,
    
    async initialize(): Promise<void> {
      await Promise.all([
        governance.initialize(),
        voting.initialize(),
        timelock.initialize(),
        delegation.initialize(),
      ]);
    },
    
    async destroy(): Promise<void> {
      await Promise.all([
        governance.destroy(),
        voting.destroy(),
        timelock.destroy(),
        delegation.destroy(),
      ]);
    },
  };
}

/**
 * Default configurations
 */
export const DEFAULT_CONFIGS = {
  dao: DEFAULT_DAO_CONFIG,
  voting: DEFAULT_VOTING_CONFIG,
  timelock: DEFAULT_TIMELOCK_CONFIG,
  delegation: DEFAULT_DELEGATION_CONFIG,
} as const;

// =============================================================================
// VERSION INFO
// =============================================================================

export const VERSION = '0.1.0';
export const MODULE_NAME = '@prvcsh/dao';
