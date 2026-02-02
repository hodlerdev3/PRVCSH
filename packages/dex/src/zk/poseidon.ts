/**
 * @fileoverview Poseidon Hash Implementation
 * @description ZK-friendly hash function for commitments and nullifiers.
 * Optimized for use in ZK circuits with minimal constraints.
 * 
 * @module @prvcsh/dex/zk/poseidon
 * @version 0.1.0
 */

import { type FieldElement, type PoseidonParams } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * BN254 field prime (used by Groth16 on Ethereum/Solana)
 */
export const FIELD_PRIME = BigInt(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617'
);

/**
 * Default Poseidon parameters (for t=3, width 3)
 */
export const DEFAULT_POSEIDON_PARAMS: PoseidonParams = {
  rounds: 63,
  width: 3,
  rate: 2,
  capacity: 1,
};

/**
 * Poseidon round constants (pre-computed for t=3)
 * Note: These are simplified examples. Production would use cryptographically secure constants.
 */
const ROUND_CONSTANTS: bigint[] = Array.from(
  { length: DEFAULT_POSEIDON_PARAMS.rounds * DEFAULT_POSEIDON_PARAMS.width },
  (_, i) => BigInt(i + 1) * BigInt(0x123456789abcdef)
).map(x => x % FIELD_PRIME);

/**
 * MDS matrix for Poseidon (3x3)
 */
const MDS_MATRIX: bigint[][] = [
  [BigInt(2), BigInt(1), BigInt(1)],
  [BigInt(1), BigInt(2), BigInt(1)],
  [BigInt(1), BigInt(1), BigInt(2)],
];

// =============================================================================
// FIELD ARITHMETIC
// =============================================================================

/**
 * Modular addition in the field
 */
export function fieldAdd(a: FieldElement, b: FieldElement): FieldElement {
  return ((a % FIELD_PRIME) + (b % FIELD_PRIME)) % FIELD_PRIME;
}

/**
 * Modular subtraction in the field
 */
export function fieldSub(a: FieldElement, b: FieldElement): FieldElement {
  const result = ((a % FIELD_PRIME) - (b % FIELD_PRIME)) % FIELD_PRIME;
  return result >= 0 ? result : result + FIELD_PRIME;
}

/**
 * Modular multiplication in the field
 */
export function fieldMul(a: FieldElement, b: FieldElement): FieldElement {
  return ((a % FIELD_PRIME) * (b % FIELD_PRIME)) % FIELD_PRIME;
}

/**
 * Modular exponentiation in the field
 */
export function fieldPow(base: FieldElement, exp: FieldElement): FieldElement {
  let result = BigInt(1);
  let b = base % FIELD_PRIME;
  let e = exp;
  
  while (e > 0) {
    if (e % BigInt(2) === BigInt(1)) {
      result = fieldMul(result, b);
    }
    b = fieldMul(b, b);
    e = e / BigInt(2);
  }
  
  return result;
}

/**
 * S-box function (x^5 in the field)
 */
function sbox(x: FieldElement): FieldElement {
  const x2 = fieldMul(x, x);
  const x4 = fieldMul(x2, x2);
  return fieldMul(x4, x);
}

// =============================================================================
// POSEIDON HASH
// =============================================================================

/**
 * Apply MDS matrix to state
 */
function mdsMultiply(state: FieldElement[]): FieldElement[] {
  const result: FieldElement[] = [];
  
  for (let i = 0; i < state.length; i++) {
    let sum = BigInt(0);
    for (let j = 0; j < state.length; j++) {
      sum = fieldAdd(sum, fieldMul(MDS_MATRIX[i][j], state[j]));
    }
    result.push(sum);
  }
  
  return result;
}

/**
 * Apply round constants to state
 */
function addRoundConstants(
  state: FieldElement[], 
  round: number, 
  width: number
): FieldElement[] {
  return state.map((s, i) => 
    fieldAdd(s, ROUND_CONSTANTS[round * width + i])
  );
}

/**
 * Full round (all elements through S-box)
 */
function fullRound(
  state: FieldElement[], 
  round: number, 
  width: number
): FieldElement[] {
  // Add round constants
  state = addRoundConstants(state, round, width);
  
  // S-box on all elements
  state = state.map(sbox);
  
  // MDS mixing
  return mdsMultiply(state);
}

/**
 * Partial round (only first element through S-box)
 */
function partialRound(
  state: FieldElement[], 
  round: number, 
  width: number
): FieldElement[] {
  // Add round constants
  state = addRoundConstants(state, round, width);
  
  // S-box on first element only
  state[0] = sbox(state[0]);
  
  // MDS mixing
  return mdsMultiply(state);
}

/**
 * Poseidon hash function
 * 
 * @param inputs Input field elements
 * @param params Poseidon parameters
 * @returns Hash output
 */
export function poseidonHash(
  inputs: FieldElement[],
  params: PoseidonParams = DEFAULT_POSEIDON_PARAMS,
): FieldElement {
  const { rounds, width, rate } = params;
  
  // Initialize state with zeros
  let state: FieldElement[] = Array(width).fill(BigInt(0));
  
  // Absorb inputs (sponge construction)
  for (let i = 0; i < inputs.length; i += rate) {
    for (let j = 0; j < rate && i + j < inputs.length; j++) {
      state[j] = fieldAdd(state[j], inputs[i + j]);
    }
    
    // Apply permutation
    const fullRoundsFirst = Math.floor(rounds / 2);
    const partialRoundsCount = rounds - fullRoundsFirst * 2;
    
    let roundCounter = 0;
    
    // First half of full rounds
    for (let r = 0; r < fullRoundsFirst; r++) {
      state = fullRound(state, roundCounter++, width);
    }
    
    // Partial rounds
    for (let r = 0; r < partialRoundsCount; r++) {
      state = partialRound(state, roundCounter++, width);
    }
    
    // Second half of full rounds
    for (let r = 0; r < fullRoundsFirst; r++) {
      state = fullRound(state, roundCounter++, width);
    }
  }
  
  // Squeeze output (return first element)
  return state[0];
}

/**
 * Hash two field elements (for Merkle tree)
 */
export function poseidonHash2(
  left: FieldElement, 
  right: FieldElement
): FieldElement {
  return poseidonHash([left, right]);
}

/**
 * Hash multiple field elements
 */
export function poseidonHashMany(inputs: FieldElement[]): FieldElement {
  if (inputs.length === 0) {
    return BigInt(0);
  }
  if (inputs.length === 1) {
    return poseidonHash([inputs[0], BigInt(0)]);
  }
  
  return poseidonHash(inputs);
}

// =============================================================================
// COMMITMENT FUNCTIONS
// =============================================================================

/**
 * Create Pedersen-like commitment using Poseidon
 * commitment = poseidon(value, randomness)
 */
export function createCommitment(
  value: FieldElement,
  randomness: FieldElement,
): FieldElement {
  return poseidonHash([value, randomness]);
}

/**
 * Create nullifier from secret and commitment
 * nullifier = poseidon(secretKey, commitment)
 */
export function createNullifier(
  secretKey: FieldElement,
  commitment: FieldElement,
): FieldElement {
  return poseidonHash([secretKey, commitment]);
}

/**
 * Create token commitment
 * commitment = poseidon(tokenMint, amount, ownerPubkey, randomness)
 */
export function createTokenCommitment(
  tokenMint: FieldElement,
  amount: FieldElement,
  ownerPubkey: FieldElement,
  randomness: FieldElement,
): FieldElement {
  return poseidonHash([tokenMint, amount, ownerPubkey, randomness]);
}

/**
 * Create swap commitment
 * commitment = poseidon(poolHash, inputAmount, outputAmount, secretKey, randomness)
 */
export function createSwapCommitment(
  poolHash: FieldElement,
  inputAmount: FieldElement,
  outputAmount: FieldElement,
  secretKey: FieldElement,
  randomness: FieldElement,
): FieldElement {
  return poseidonHash([
    poolHash,
    inputAmount,
    outputAmount,
    secretKey,
    randomness,
  ]);
}

/**
 * Create position commitment for anonymous liquidity
 * commitment = poseidon(poolHash, lpAmount, secretKey, randomness)
 */
export function createPositionCommitment(
  poolHash: FieldElement,
  lpAmount: FieldElement,
  secretKey: FieldElement,
  randomness: FieldElement,
): FieldElement {
  return poseidonHash([poolHash, lpAmount, secretKey, randomness]);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert bytes to field element
 */
export function bytesToField(bytes: Uint8Array): FieldElement {
  let result = BigInt(0);
  for (let i = 0; i < bytes.length && i < 31; i++) {
    result = (result << BigInt(8)) | BigInt(bytes[i]);
  }
  return result % FIELD_PRIME;
}

/**
 * Convert field element to bytes
 */
export function fieldToBytes(field: FieldElement): Uint8Array {
  const bytes = new Uint8Array(32);
  let value = field;
  
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(value & BigInt(0xff));
    value = value >> BigInt(8);
  }
  
  return bytes;
}

/**
 * Convert hex string to field element
 */
export function hexToField(hex: string): FieldElement {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  return BigInt('0x' + cleanHex) % FIELD_PRIME;
}

/**
 * Convert field element to hex string
 */
export function fieldToHex(field: FieldElement): string {
  return '0x' + field.toString(16).padStart(64, '0');
}

/**
 * Generate random field element
 */
export function randomFieldElement(): FieldElement {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToField(bytes);
}
