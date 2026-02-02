/**
 * @fileoverview Merkle Tree Implementation
 * @description Sparse Merkle tree for commitment tracking with
 * efficient proof generation for ZK circuits.
 * 
 * @module @prvcsh/dex/zk/merkle
 * @version 0.1.0
 */

import { 
  type FieldElement, 
  type MerkleProof, 
  type MerkleTreeConfig,
  type SparseMerkleTree,
  type CommitmentLeaf,
  ZKError,
  ZKErrorCode,
} from './types';
import { poseidonHash2, FIELD_PRIME } from './poseidon';

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

/**
 * Default Merkle tree configuration
 */
export const DEFAULT_MERKLE_CONFIG: MerkleTreeConfig = {
  height: 20, // 2^20 = ~1M leaves
  hashFunction: 'poseidon',
  zeroValue: BigInt(0),
};

// =============================================================================
// MERKLE TREE IMPLEMENTATION
// =============================================================================

/**
 * Pre-compute zero hashes for each level
 */
function computeZeroHashes(height: number, zeroValue: FieldElement): FieldElement[] {
  const zeros: FieldElement[] = [zeroValue];
  
  for (let i = 1; i <= height; i++) {
    zeros.push(poseidonHash2(zeros[i - 1], zeros[i - 1]));
  }
  
  return zeros;
}

/**
 * Merkle Tree class for managing commitments
 */
export class MerkleTree implements SparseMerkleTree {
  private config: MerkleTreeConfig;
  private leaves: Map<number, FieldElement>;
  private nodes: Map<string, FieldElement>;
  private zeroHashes: FieldElement[];
  private _root: FieldElement;
  private _nextIndex: number;
  
  constructor(config: Partial<MerkleTreeConfig> = {}) {
    this.config = { ...DEFAULT_MERKLE_CONFIG, ...config };
    this.leaves = new Map();
    this.nodes = new Map();
    this.zeroHashes = computeZeroHashes(this.config.height, this.config.zeroValue);
    this._root = this.zeroHashes[this.config.height];
    this._nextIndex = 0;
  }
  
  /**
   * Get tree root
   */
  get root(): FieldElement {
    return this._root;
  }
  
  /**
   * Get tree height
   */
  get height(): number {
    return this.config.height;
  }
  
  /**
   * Get number of leaves
   */
  get leafCount(): number {
    return this.leaves.size;
  }
  
  /**
   * Get next available index
   */
  get nextIndex(): number {
    return this._nextIndex;
  }
  
  /**
   * Insert a leaf at the next available index
   * @param leaf Leaf value (commitment)
   * @returns Index where leaf was inserted
   */
  insert(leaf: FieldElement): number {
    const index = this._nextIndex;
    this.insertAt(index, leaf);
    this._nextIndex++;
    return index;
  }
  
  /**
   * Insert a leaf at a specific index
   * @param index Leaf index
   * @param leaf Leaf value
   */
  insertAt(index: number, leaf: FieldElement): void {
    if (index >= 2 ** this.config.height) {
      throw new ZKError(
        ZKErrorCode.INVALID_MERKLE_PROOF,
        `Index ${index} exceeds tree capacity`,
      );
    }
    
    this.leaves.set(index, leaf);
    this.updatePath(index, leaf);
  }
  
  /**
   * Update the path from leaf to root
   */
  private updatePath(index: number, leaf: FieldElement): void {
    let currentHash = leaf;
    let currentIndex = index;
    
    for (let level = 0; level < this.config.height; level++) {
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;
      
      // Get sibling hash
      const siblingHash = this.getNode(level, siblingIndex);
      
      // Store current node
      this.setNode(level, currentIndex, currentHash);
      
      // Compute parent hash
      const parentHash = isRight
        ? poseidonHash2(siblingHash, currentHash)
        : poseidonHash2(currentHash, siblingHash);
      
      // Move to parent
      currentHash = parentHash;
      currentIndex = Math.floor(currentIndex / 2);
    }
    
    // Update root
    this._root = currentHash;
  }
  
  /**
   * Get node at level and index
   */
  private getNode(level: number, index: number): FieldElement {
    const key = `${level}-${index}`;
    return this.nodes.get(key) ?? this.zeroHashes[level];
  }
  
  /**
   * Set node at level and index
   */
  private setNode(level: number, index: number, value: FieldElement): void {
    const key = `${level}-${index}`;
    this.nodes.set(key, value);
  }
  
  /**
   * Generate Merkle proof for a leaf
   * @param index Leaf index
   * @returns Merkle proof
   */
  getProof(index: number): MerkleProof {
    if (!this.leaves.has(index)) {
      throw new ZKError(
        ZKErrorCode.COMMITMENT_NOT_FOUND,
        `Leaf at index ${index} not found`,
      );
    }
    
    const pathElements: FieldElement[] = [];
    const pathIndices: number[] = [];
    let currentIndex = index;
    
    for (let level = 0; level < this.config.height; level++) {
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;
      
      pathElements.push(this.getNode(level, siblingIndex));
      pathIndices.push(isRight ? 1 : 0);
      
      currentIndex = Math.floor(currentIndex / 2);
    }
    
    return {
      leaf: this.leaves.get(index)!,
      index,
      pathElements,
      pathIndices,
      root: this._root,
    };
  }
  
  /**
   * Verify a Merkle proof
   * @param proof Merkle proof
   * @returns Whether proof is valid
   */
  verifyProof(proof: MerkleProof): boolean {
    return verifyMerkleProof(proof);
  }
  
  /**
   * Get leaf at index
   * @param index Leaf index
   * @returns Leaf value or undefined
   */
  getLeaf(index: number): FieldElement | undefined {
    return this.leaves.get(index);
  }
  
  /**
   * Check if leaf exists
   * @param leaf Leaf value
   * @returns Whether leaf exists in tree
   */
  hasLeaf(leaf: FieldElement): boolean {
    for (const [_, value] of this.leaves) {
      if (value === leaf) return true;
    }
    return false;
  }
  
  /**
   * Find index of a leaf
   * @param leaf Leaf value
   * @returns Index or -1 if not found
   */
  findLeafIndex(leaf: FieldElement): number {
    for (const [index, value] of this.leaves) {
      if (value === leaf) return index;
    }
    return -1;
  }
  
  /**
   * Get all leaves as array
   * @returns Array of commitment leaves
   */
  getLeaves(): CommitmentLeaf[] {
    const result: CommitmentLeaf[] = [];
    
    for (const [index, commitment] of this.leaves) {
      result.push({
        index,
        commitment,
        hash: commitment, // In our case, leaf = commitment = hash
      });
    }
    
    return result.sort((a, b) => a.index - b.index);
  }
  
  /**
   * Export tree state for persistence
   */
  export(): {
    root: string;
    height: number;
    nextIndex: number;
    leaves: Array<[number, string]>;
  } {
    return {
      root: this._root.toString(),
      height: this.config.height,
      nextIndex: this._nextIndex,
      leaves: Array.from(this.leaves.entries()).map(
        ([index, value]) => [index, value.toString()]
      ),
    };
  }
  
  /**
   * Import tree state from persistence
   */
  static import(data: {
    root: string;
    height: number;
    nextIndex: number;
    leaves: Array<[number, string]>;
  }): MerkleTree {
    const tree = new MerkleTree({ height: data.height });
    
    // Insert leaves in order
    for (const [index, value] of data.leaves) {
      tree.insertAt(index, BigInt(value));
    }
    
    tree._nextIndex = data.nextIndex;
    
    // Verify root matches
    if (tree._root.toString() !== data.root) {
      throw new ZKError(
        ZKErrorCode.MERKLE_ROOT_MISMATCH,
        'Imported tree root does not match',
      );
    }
    
    return tree;
  }
}

// =============================================================================
// PROOF VERIFICATION
// =============================================================================

/**
 * Verify a Merkle proof independently
 * @param proof Merkle proof
 * @returns Whether proof is valid
 */
export function verifyMerkleProof(proof: MerkleProof): boolean {
  const { leaf, pathElements, pathIndices, root } = proof;
  
  if (pathElements.length !== pathIndices.length) {
    return false;
  }
  
  let currentHash = leaf;
  
  for (let i = 0; i < pathElements.length; i++) {
    const sibling = pathElements[i];
    const isRight = pathIndices[i] === 1;
    
    currentHash = isRight
      ? poseidonHash2(sibling, currentHash)
      : poseidonHash2(currentHash, sibling);
  }
  
  return currentHash === root;
}

/**
 * Compute root from leaf and path
 * @param leaf Leaf value
 * @param pathElements Path siblings
 * @param pathIndices Path indices
 * @returns Computed root
 */
export function computeRoot(
  leaf: FieldElement,
  pathElements: FieldElement[],
  pathIndices: number[],
): FieldElement {
  let currentHash = leaf;
  
  for (let i = 0; i < pathElements.length; i++) {
    const sibling = pathElements[i];
    const isRight = pathIndices[i] === 1;
    
    currentHash = isRight
      ? poseidonHash2(sibling, currentHash)
      : poseidonHash2(currentHash, sibling);
  }
  
  return currentHash;
}

// =============================================================================
// COMMITMENT TREE
// =============================================================================

/**
 * Specialized Merkle tree for token commitments
 */
export class CommitmentTree extends MerkleTree {
  private spentCommitments: Set<string> = new Set();
  
  /**
   * Add a new commitment
   * @param commitment Commitment hash
   * @returns Index
   */
  addCommitment(commitment: FieldElement): number {
    return this.insert(commitment);
  }
  
  /**
   * Mark a commitment as spent
   * @param commitment Commitment hash
   */
  markSpent(commitment: FieldElement): void {
    this.spentCommitments.add(commitment.toString());
  }
  
  /**
   * Check if commitment is spent
   * @param commitment Commitment hash
   * @returns Whether spent
   */
  isSpent(commitment: FieldElement): boolean {
    return this.spentCommitments.has(commitment.toString());
  }
  
  /**
   * Get unspent commitments
   * @returns Unspent commitment leaves
   */
  getUnspentCommitments(): CommitmentLeaf[] {
    return this.getLeaves().filter(
      leaf => !this.isSpent(leaf.commitment)
    );
  }
}

// =============================================================================
// NULLIFIER TREE
// =============================================================================

/**
 * Specialized tree for tracking used nullifiers
 */
export class NullifierTree {
  private nullifiers: Set<string> = new Set();
  private entries: Map<string, { blockNumber: number; txHash: string; timestamp: Date }> = new Map();
  
  /**
   * Add a nullifier
   * @param nullifier Nullifier hash
   * @param blockNumber Block number
   * @param txHash Transaction hash
   */
  add(nullifier: FieldElement, blockNumber: number, txHash: string): void {
    const key = nullifier.toString();
    
    if (this.nullifiers.has(key)) {
      throw new ZKError(
        ZKErrorCode.NULLIFIER_ALREADY_USED,
        `Nullifier ${key} already used`,
      );
    }
    
    this.nullifiers.add(key);
    this.entries.set(key, {
      blockNumber,
      txHash,
      timestamp: new Date(),
    });
  }
  
  /**
   * Check if nullifier exists
   * @param nullifier Nullifier hash
   * @returns Whether nullifier is used
   */
  has(nullifier: FieldElement): boolean {
    return this.nullifiers.has(nullifier.toString());
  }
  
  /**
   * Get nullifier entry
   * @param nullifier Nullifier hash
   * @returns Entry or undefined
   */
  get(nullifier: FieldElement): { blockNumber: number; txHash: string; timestamp: Date } | undefined {
    return this.entries.get(nullifier.toString());
  }
  
  /**
   * Get all nullifiers
   * @returns Set of nullifier strings
   */
  getAll(): Set<string> {
    return new Set(this.nullifiers);
  }
  
  /**
   * Get count of nullifiers
   */
  get size(): number {
    return this.nullifiers.size;
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a new Merkle tree
 */
export function createMerkleTree(config?: Partial<MerkleTreeConfig>): MerkleTree {
  return new MerkleTree(config);
}

/**
 * Create a new commitment tree
 */
export function createCommitmentTree(config?: Partial<MerkleTreeConfig>): CommitmentTree {
  return new CommitmentTree(config);
}

/**
 * Create a new nullifier tree
 */
export function createNullifierTree(): NullifierTree {
  return new NullifierTree();
}
