/**
 * @fileoverview Zero-Knowledge Proof Types for Privacy DEX
 * @description Type definitions for ZK-SNARK proofs used in private swaps,
 * anonymous liquidity provision, and MEV protection.
 * 
 * @module @prvcsh/dex/zk/types
 * @version 0.1.0
 */

// =============================================================================
// ZK PROOF CORE TYPES
// =============================================================================

/**
 * Proof system types supported
 */
export type ProofSystem = 
  | 'groth16'        // Most efficient, trusted setup required
  | 'plonk'          // Universal setup, slower verification
  | 'bulletproofs';  // No trusted setup, larger proofs

/**
 * Field element (big integer in field F_p)
 */
export type FieldElement = bigint;

/**
 * G1 point on elliptic curve
 */
export interface G1Point {
  readonly x: FieldElement;
  readonly y: FieldElement;
}

/**
 * G2 point on elliptic curve (for pairings)
 */
export interface G2Point {
  readonly x: readonly [FieldElement, FieldElement];
  readonly y: readonly [FieldElement, FieldElement];
}

/**
 * Groth16 proof structure
 */
export interface Groth16Proof {
  readonly a: G1Point;
  readonly b: G2Point;
  readonly c: G1Point;
}

/**
 * Generic ZK proof
 */
export interface ZKProof {
  /** Proof system used */
  readonly system: ProofSystem;
  
  /** Serialized proof data */
  readonly proof: Uint8Array;
  
  /** Public inputs to the circuit */
  readonly publicInputs: FieldElement[];
  
  /** Proof generation timestamp */
  readonly timestamp: Date;
  
  /** Circuit identifier */
  readonly circuitId: string;
}

/**
 * Verification key for a circuit
 */
export interface VerificationKey {
  /** Circuit identifier */
  readonly circuitId: string;
  
  /** Proof system */
  readonly system: ProofSystem;
  
  /** Alpha point (G1) */
  readonly alpha: G1Point;
  
  /** Beta point (G2) */
  readonly beta: G2Point;
  
  /** Gamma point (G2) */
  readonly gamma: G2Point;
  
  /** Delta point (G2) */
  readonly delta: G2Point;
  
  /** IC points (G1) - one per public input + 1 */
  readonly ic: G1Point[];
}

/**
 * Proving key for a circuit (used by prover)
 */
export interface ProvingKey {
  /** Circuit identifier */
  readonly circuitId: string;
  
  /** Proof system */
  readonly system: ProofSystem;
  
  /** Serialized proving key */
  readonly data: Uint8Array;
  
  /** Key hash for verification */
  readonly hash: string;
}

// =============================================================================
// SWAP PROOF TYPES
// =============================================================================

/**
 * Private swap circuit public inputs
 */
export interface SwapPublicInputs {
  /** Nullifier to prevent double-spend */
  readonly nullifier: FieldElement;
  
  /** Commitment to the swap output */
  readonly outputCommitment: FieldElement;
  
  /** Pool address hash */
  readonly poolHash: FieldElement;
  
  /** Input amount (public for AMM calculation) */
  readonly inputAmount: FieldElement;
  
  /** Minimum output amount */
  readonly minOutputAmount: FieldElement;
  
  /** Merkle root of valid commitments */
  readonly merkleRoot: FieldElement;
}

/**
 * Private swap circuit private inputs (known only to prover)
 */
export interface SwapPrivateInputs {
  /** User's secret key */
  readonly secretKey: FieldElement;
  
  /** Input commitment */
  readonly inputCommitment: FieldElement;
  
  /** Randomness for output commitment */
  readonly outputRandomness: FieldElement;
  
  /** Merkle path to input commitment */
  readonly merklePath: FieldElement[];
  
  /** Merkle path indices */
  readonly merklePathIndices: number[];
}

/**
 * Complete swap proof
 */
export interface SwapProof extends ZKProof {
  /** Swap-specific public inputs */
  readonly swapInputs: SwapPublicInputs;
  
  /** Nullifier hash (for tracking) */
  readonly nullifierHash: string;
  
  /** Output commitment hash */
  readonly outputCommitmentHash: string;
}

/**
 * Swap proof generation request
 */
export interface SwapProofRequest {
  /** Pool address */
  readonly poolAddress: string;
  
  /** Input token */
  readonly inputToken: string;
  
  /** Output token */
  readonly outputToken: string;
  
  /** Input amount */
  readonly inputAmount: bigint;
  
  /** Minimum output amount */
  readonly minOutputAmount: bigint;
  
  /** User's secret key */
  readonly secretKey: Uint8Array;
  
  /** Recipient (can be different from sender) */
  readonly recipient?: string;
}

/**
 * Swap proof verification result
 */
export interface SwapProofVerification {
  /** Whether proof is valid */
  readonly isValid: boolean;
  
  /** Nullifier (to check if used) */
  readonly nullifier: string;
  
  /** Output commitment */
  readonly outputCommitment: string;
  
  /** Verified input amount */
  readonly verifiedInputAmount: bigint;
  
  /** Verification error (if invalid) */
  readonly error?: string;
}

// =============================================================================
// LIQUIDITY PROOF TYPES
// =============================================================================

/**
 * Anonymous liquidity provision public inputs
 */
export interface LiquidityPublicInputs {
  /** Position commitment */
  readonly positionCommitment: FieldElement;
  
  /** Pool hash */
  readonly poolHash: FieldElement;
  
  /** LP token amount */
  readonly lpAmount: FieldElement;
  
  /** Nullifier (for withdrawal only) */
  readonly nullifier?: FieldElement;
  
  /** Merkle root of positions */
  readonly merkleRoot: FieldElement;
}

/**
 * Anonymous liquidity provision private inputs
 */
export interface LiquidityPrivateInputs {
  /** User's secret key */
  readonly secretKey: FieldElement;
  
  /** Position randomness */
  readonly positionRandomness: FieldElement;
  
  /** Merkle path to position */
  readonly merklePath: FieldElement[];
  
  /** Merkle path indices */
  readonly merklePathIndices: number[];
}

/**
 * Liquidity proof
 */
export interface LiquidityProof extends ZKProof {
  /** Liquidity-specific public inputs */
  readonly liquidityInputs: LiquidityPublicInputs;
  
  /** Position commitment hash */
  readonly positionCommitmentHash: string;
  
  /** Operation type */
  readonly operation: 'add' | 'remove' | 'claim';
}

// =============================================================================
// COMMITMENT TYPES
// =============================================================================

/**
 * Pedersen commitment
 */
export interface PedersenCommitment {
  /** Commitment value */
  readonly commitment: FieldElement;
  
  /** Randomness used (kept secret) */
  readonly randomness: FieldElement;
  
  /** Value committed to (kept secret) */
  readonly value: FieldElement;
}

/**
 * Commitment to token ownership
 */
export interface TokenCommitment {
  /** Commitment hash */
  readonly hash: string;
  
  /** Token mint address */
  readonly tokenMint: string;
  
  /** Amount committed */
  readonly amount: bigint;
  
  /** Owner commitment (hides owner identity) */
  readonly ownerCommitment: FieldElement;
  
  /** Created at timestamp */
  readonly createdAt: Date;
  
  /** Whether this commitment has been spent */
  spent: boolean;
}

/**
 * Commitment merkle tree leaf
 */
export interface CommitmentLeaf {
  /** Leaf index */
  readonly index: number;
  
  /** Commitment hash */
  readonly commitment: FieldElement;
  
  /** Leaf hash */
  readonly hash: FieldElement;
}

// =============================================================================
// NULLIFIER TYPES
// =============================================================================

/**
 * Nullifier for preventing double-spend
 */
export interface Nullifier {
  /** Nullifier hash */
  readonly hash: string;
  
  /** Associated commitment */
  readonly commitmentHash: string;
  
  /** Created at timestamp */
  readonly createdAt: Date;
  
  /** Transaction that used this nullifier */
  readonly txHash?: string;
  
  /** Nullifier type */
  readonly type: 'swap' | 'liquidity' | 'claim';
}

/**
 * Nullifier registry entry
 */
export interface NullifierEntry {
  /** Nullifier hash */
  readonly hash: string;
  
  /** Block number when nullified */
  readonly blockNumber: number;
  
  /** Transaction hash */
  readonly txHash: string;
  
  /** Timestamp */
  readonly timestamp: Date;
}

// =============================================================================
// MERKLE TREE TYPES
// =============================================================================

/**
 * Merkle tree configuration
 */
export interface MerkleTreeConfig {
  /** Tree height (number of levels) */
  readonly height: number;
  
  /** Hash function to use */
  readonly hashFunction: 'poseidon' | 'sha256' | 'keccak256';
  
  /** Zero value for empty leaves */
  readonly zeroValue: FieldElement;
}

/**
 * Merkle tree proof
 */
export interface MerkleProof {
  /** Leaf value */
  readonly leaf: FieldElement;
  
  /** Leaf index */
  readonly index: number;
  
  /** Path elements (siblings) */
  readonly pathElements: FieldElement[];
  
  /** Path indices (0 = left, 1 = right) */
  readonly pathIndices: number[];
  
  /** Root hash */
  readonly root: FieldElement;
}

/**
 * Sparse Merkle tree for commitments
 */
export interface SparseMerkleTree {
  /** Tree root */
  readonly root: FieldElement;
  
  /** Tree height */
  readonly height: number;
  
  /** Number of leaves */
  readonly leafCount: number;
  
  /** Next available index */
  readonly nextIndex: number;
}

// =============================================================================
// CIRCUIT TYPES
// =============================================================================

/**
 * Circuit identifier
 */
export type CircuitId = 
  | 'private_swap'
  | 'anonymous_liquidity_add'
  | 'anonymous_liquidity_remove'
  | 'private_claim'
  | 'commitment_verify';

/**
 * Circuit metadata
 */
export interface CircuitMetadata {
  /** Circuit identifier */
  readonly id: CircuitId;
  
  /** Circuit version */
  readonly version: string;
  
  /** Number of constraints */
  readonly constraintCount: number;
  
  /** Number of public inputs */
  readonly publicInputCount: number;
  
  /** Number of private inputs */
  readonly privateInputCount: number;
  
  /** Proof generation time estimate (ms) */
  readonly estimatedProveTime: number;
  
  /** Verification time estimate (ms) */
  readonly estimatedVerifyTime: number;
}

/**
 * Circuit instance
 */
export interface Circuit {
  /** Circuit metadata */
  readonly metadata: CircuitMetadata;
  
  /** Verification key */
  readonly verificationKey: VerificationKey;
  
  /** Proving key hash (for verification) */
  readonly provingKeyHash: string;
}

// =============================================================================
// ZK ERROR TYPES
// =============================================================================

/**
 * ZK error codes
 */
export enum ZKErrorCode {
  // Proof errors
  INVALID_PROOF = 'ZK_INVALID_PROOF',
  PROOF_GENERATION_FAILED = 'ZK_PROOF_GENERATION_FAILED',
  PROOF_VERIFICATION_FAILED = 'ZK_PROOF_VERIFICATION_FAILED',
  
  // Nullifier errors
  NULLIFIER_ALREADY_USED = 'ZK_NULLIFIER_ALREADY_USED',
  INVALID_NULLIFIER = 'ZK_INVALID_NULLIFIER',
  
  // Commitment errors
  INVALID_COMMITMENT = 'ZK_INVALID_COMMITMENT',
  COMMITMENT_NOT_FOUND = 'ZK_COMMITMENT_NOT_FOUND',
  COMMITMENT_ALREADY_SPENT = 'ZK_COMMITMENT_ALREADY_SPENT',
  
  // Merkle errors
  INVALID_MERKLE_PROOF = 'ZK_INVALID_MERKLE_PROOF',
  MERKLE_ROOT_MISMATCH = 'ZK_MERKLE_ROOT_MISMATCH',
  
  // Circuit errors
  CIRCUIT_NOT_FOUND = 'ZK_CIRCUIT_NOT_FOUND',
  INVALID_CIRCUIT_INPUTS = 'ZK_INVALID_CIRCUIT_INPUTS',
  
  // Key errors
  PROVING_KEY_NOT_FOUND = 'ZK_PROVING_KEY_NOT_FOUND',
  VERIFICATION_KEY_NOT_FOUND = 'ZK_VERIFICATION_KEY_NOT_FOUND',
}

/**
 * ZK error
 */
export class ZKError extends Error {
  constructor(
    public readonly code: ZKErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ZKError';
  }
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Hash function type
 */
export type HashFunction = (inputs: FieldElement[]) => FieldElement;

/**
 * Poseidon hash parameters
 */
export interface PoseidonParams {
  /** Number of rounds */
  readonly rounds: number;
  
  /** State width */
  readonly width: number;
  
  /** Rate */
  readonly rate: number;
  
  /** Capacity */
  readonly capacity: number;
}

/**
 * Proof generation options
 */
export interface ProofGenerationOptions {
  /** Timeout in milliseconds */
  readonly timeout?: number;
  
  /** Use WebAssembly for proof generation */
  readonly useWasm?: boolean;
  
  /** Worker threads for parallel computation */
  readonly workers?: number;
  
  /** Cache proving key in memory */
  readonly cacheProvingKey?: boolean;
}

/**
 * Proof verification options
 */
export interface ProofVerificationOptions {
  /** Strict mode (additional checks) */
  readonly strict?: boolean;
  
  /** Check nullifier against registry */
  readonly checkNullifier?: boolean;
  
  /** Verify merkle root is recent */
  readonly verifyRecentRoot?: boolean;
  
  /** Maximum age of merkle root (blocks) */
  readonly maxRootAge?: number;
}
