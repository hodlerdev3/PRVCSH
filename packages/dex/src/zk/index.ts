/**
 * @fileoverview ZK Module - Main Entry Point
 * @description Zero-Knowledge proof system for Privacy DEX
 * including proof generation, verification, and commitment management.
 * 
 * @module @prvcsh/dex/zk
 * @version 0.1.0
 * 
 * @example
 * ```typescript
 * import { 
 *   createProver, 
 *   createVerifier, 
 *   createCommitmentTree,
 *   createNullifierTree,
 * } from '@prvcsh/dex/zk';
 * 
 * // Create trees for tracking
 * const commitmentTree = createCommitmentTree();
 * const nullifierTree = createNullifierTree();
 * 
 * // Create prover and verifier
 * const prover = createProver();
 * const verifier = createVerifier(commitmentTree, nullifierTree);
 * 
 * // Generate proof
 * const proof = await prover.generateSwapProof(request, merkleProof);
 * 
 * // Verify proof
 * const result = await verifier.verifySwapProof(proof);
 * ```
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export * from './types';

// =============================================================================
// MODULE EXPORTS
// =============================================================================

// Poseidon hash
export {
  poseidonHash,
  poseidonHash2,
  poseidonHashMany,
  createCommitment,
  createNullifier,
  createTokenCommitment,
  createSwapCommitment,
  createPositionCommitment,
  bytesToField,
  fieldToBytes,
  hexToField,
  fieldToHex,
  randomFieldElement,
  fieldAdd,
  fieldSub,
  fieldMul,
  fieldPow,
  FIELD_PRIME,
  DEFAULT_POSEIDON_PARAMS,
} from './poseidon';

// Merkle tree
export {
  MerkleTree,
  CommitmentTree,
  NullifierTree,
  createMerkleTree,
  createCommitmentTree,
  createNullifierTree,
  verifyMerkleProof,
  computeRoot,
  DEFAULT_MERKLE_CONFIG,
} from './merkle';

// Verifier
export {
  type IVerifier,
  Verifier,
  createVerifier,
  CIRCUIT_METADATA,
  DEFAULT_VERIFICATION_OPTIONS,
} from './verifier';

// Prover
export {
  type IProver,
  Prover,
  createProver,
  generateSecretKey,
  deriveCommitment,
  DEFAULT_PROOF_OPTIONS,
} from './prover';

// =============================================================================
// ZK SYSTEM FACTORY
// =============================================================================

import { type ProofGenerationOptions, type ProofVerificationOptions } from './types';
import { CommitmentTree, NullifierTree, createCommitmentTree, createNullifierTree } from './merkle';
import { Verifier, createVerifier } from './verifier';
import { Prover, createProver } from './prover';

/**
 * ZK System configuration
 */
export interface ZKSystemConfig {
  /** Merkle tree height */
  readonly treeHeight?: number;
  
  /** Prover options */
  readonly proverOptions?: Partial<ProofGenerationOptions>;
  
  /** Verifier options */
  readonly verifierOptions?: Partial<ProofVerificationOptions>;
}

/**
 * Complete ZK system instance
 */
export interface ZKSystem {
  /** Commitment tree */
  readonly commitmentTree: CommitmentTree;
  
  /** Nullifier tree */
  readonly nullifierTree: NullifierTree;
  
  /** Prover */
  readonly prover: Prover;
  
  /** Verifier */
  readonly verifier: Verifier;
  
  /**
   * Add commitment to tree
   * @param commitment Commitment hash
   * @returns Leaf index
   */
  addCommitment(commitment: bigint): number;
  
  /**
   * Mark commitment as spent
   * @param commitment Commitment hash
   * @param nullifier Nullifier hash
   * @param txHash Transaction hash
   */
  spend(commitment: bigint, nullifier: bigint, txHash: string): void;
  
  /**
   * Check if commitment is spent
   * @param commitment Commitment hash
   * @returns Whether spent
   */
  isSpent(commitment: bigint): boolean;
  
  /**
   * Check if nullifier is used
   * @param nullifier Nullifier hash
   * @returns Whether used
   */
  isNullifierUsed(nullifier: bigint): boolean;
  
  /**
   * Get merkle proof for commitment
   * @param commitment Commitment hash
   * @returns Merkle proof
   */
  getProof(commitment: bigint): ReturnType<CommitmentTree['getProof']>;
  
  /**
   * Set current block number
   * @param blockNumber Block number
   */
  setBlockNumber(blockNumber: number): void;
}

/**
 * Create complete ZK system
 */
export function createZKSystem(config: ZKSystemConfig = {}): ZKSystem {
  const commitmentTree = createCommitmentTree({ height: config.treeHeight ?? 20 });
  const nullifierTree = createNullifierTree();
  const prover = createProver(config.proverOptions);
  const verifier = createVerifier(commitmentTree, nullifierTree);
  
  let currentBlockNumber = 0;
  
  return {
    commitmentTree,
    nullifierTree,
    prover,
    verifier,
    
    addCommitment(commitment: bigint): number {
      return commitmentTree.addCommitment(commitment);
    },
    
    spend(commitment: bigint, nullifier: bigint, txHash: string): void {
      commitmentTree.markSpent(commitment);
      nullifierTree.add(nullifier, currentBlockNumber, txHash);
    },
    
    isSpent(commitment: bigint): boolean {
      return commitmentTree.isSpent(commitment);
    },
    
    isNullifierUsed(nullifier: bigint): boolean {
      return nullifierTree.has(nullifier);
    },
    
    getProof(commitment: bigint) {
      const index = commitmentTree.findLeafIndex(commitment);
      if (index === -1) {
        throw new Error('Commitment not found');
      }
      return commitmentTree.getProof(index);
    },
    
    setBlockNumber(blockNumber: number): void {
      currentBlockNumber = blockNumber;
      verifier.setBlockNumber(blockNumber);
    },
  };
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default createZKSystem;
