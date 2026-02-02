/**
 * @fileoverview Merchant Management API
 * @description Handles merchant registration, API key management, and authentication.
 * 
 * @module @prvcsh/payments/merchant
 * @version 0.1.0
 */

import {
  Merchant,
  MerchantStatus,
  MerchantTier,
  APIKey,
  APIKeyPermission,
  CreateMerchantInput,
  UpdateMerchantInput,
  PaymentErrorCode,
  ALL_API_KEY_PERMISSIONS,
} from '../types';

// =============================================================================
// MERCHANT MANAGER INTERFACE
// =============================================================================

/**
 * Merchant manager interface
 */
export interface IMerchantManager {
  // Merchant CRUD
  createMerchant(input: CreateMerchantInput): Promise<Merchant>;
  getMerchant(merchantId: string): Promise<Merchant | undefined>;
  updateMerchant(merchantId: string, input: UpdateMerchantInput): Promise<Merchant>;
  suspendMerchant(merchantId: string, reason: string): Promise<void>;
  activateMerchant(merchantId: string): Promise<void>;
  
  // API Key management
  createAPIKey(merchantId: string, name: string, permissions: APIKeyPermission[], isLive: boolean): Promise<{ key: APIKey; secret: string }>;
  revokeAPIKey(keyId: string): Promise<void>;
  listAPIKeys(merchantId: string): Promise<APIKey[]>;
  validateAPIKey(keyPrefix: string, keySecret: string): Promise<{ valid: boolean; merchant?: Merchant; key?: APIKey }>;
  
  // Auth
  authenticateRequest(authHeader: string): Promise<AuthResult>;
}

/**
 * Authentication result
 */
export interface AuthResult {
  /** Is authenticated */
  authenticated: boolean;
  
  /** Merchant (if authenticated) */
  merchant?: Merchant;
  
  /** API key (if authenticated) */
  apiKey?: APIKey;
  
  /** Error code (if not authenticated) */
  errorCode?: PaymentErrorCode;
  
  /** Error message */
  errorMessage?: string;
}

/**
 * Merchant manager configuration
 */
export interface MerchantManagerConfig {
  /** API key prefix */
  apiKeyPrefix: string;
  
  /** Test API key prefix */
  testApiKeyPrefix: string;
  
  /** API key length */
  apiKeyLength: number;
  
  /** Default tier for new merchants */
  defaultTier: MerchantTier;
  
  /** Require email verification */
  requireEmailVerification: boolean;
}

/**
 * Default merchant manager configuration
 */
export const DEFAULT_MERCHANT_CONFIG: MerchantManagerConfig = {
  apiKeyPrefix: 'pk_live_',
  testApiKeyPrefix: 'pk_test_',
  apiKeyLength: 32,
  defaultTier: 'starter',
  requireEmailVerification: true,
};

// =============================================================================
// CRYPTO UTILITIES
// =============================================================================

/**
 * Generate random bytes as hex string
 */
function generateRandomHex(length: number): string {
  const array = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate unique ID
 */
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = generateRandomHex(8);
  return `${prefix}_${timestamp}${random}`;
}

/**
 * Simple hash function for key validation
 * In production, use proper crypto like bcrypt/argon2
 */
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  
  // Use SubtleCrypto if available
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback simple hash (not secure, for demo only)
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Generate HMAC signature for webhook verification
 */
export async function generateHmacSignature(
  payload: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const payloadData = encoder.encode(payload);
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, payloadData);
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  // Fallback (not secure, for demo only)
  return hashKey(payload + secret);
}

/**
 * Verify HMAC signature
 */
export async function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await generateHmacSignature(payload, secret);
  return signature === expectedSignature;
}

// =============================================================================
// MERCHANT MANAGER IMPLEMENTATION
// =============================================================================

/**
 * In-memory merchant manager for development
 */
export class MerchantManager implements IMerchantManager {
  private merchants: Map<string, Merchant> = new Map();
  private apiKeys: Map<string, APIKey> = new Map();
  private apiKeySecrets: Map<string, string> = new Map(); // keyId -> hashed secret
  private readonly config: MerchantManagerConfig;
  
  constructor(config: Partial<MerchantManagerConfig> = {}) {
    this.config = { ...DEFAULT_MERCHANT_CONFIG, ...config };
  }
  
  /**
   * Create a new merchant
   */
  async createMerchant(input: CreateMerchantInput): Promise<Merchant> {
    // Validate input
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Merchant name is required');
    }
    
    if (!input.email || !input.email.includes('@')) {
      throw new Error('Valid email is required');
    }
    
    if (!input.walletAddress || input.walletAddress.length < 32) {
      throw new Error('Valid wallet address is required');
    }
    
    // Generate ID
    const id = generateId('merchant');
    
    // Generate webhook secret
    const webhookSecret = generateRandomHex(32);
    
    const merchant: Merchant = {
      id,
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      status: this.config.requireEmailVerification ? 'pending' : 'active',
      tier: this.config.defaultTier,
      walletAddress: input.walletAddress,
      websiteUrl: input.websiteUrl,
      logoUrl: input.logoUrl,
      webhookUrl: input.webhookUrl,
      webhookSecret,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: input.metadata,
    };
    
    this.merchants.set(id, merchant);
    
    return merchant;
  }
  
  /**
   * Get merchant by ID
   */
  async getMerchant(merchantId: string): Promise<Merchant | undefined> {
    return this.merchants.get(merchantId);
  }
  
  /**
   * Update merchant
   */
  async updateMerchant(
    merchantId: string,
    input: UpdateMerchantInput
  ): Promise<Merchant> {
    const merchant = this.merchants.get(merchantId);
    
    if (!merchant) {
      throw new Error(`Merchant not found: ${merchantId}`);
    }
    
    // Update fields
    const updated: Merchant = {
      ...merchant,
      name: input.name || merchant.name,
      websiteUrl: input.websiteUrl ?? merchant.websiteUrl,
      logoUrl: input.logoUrl ?? merchant.logoUrl,
      webhookUrl: input.webhookUrl ?? merchant.webhookUrl,
      metadata: input.metadata ?? merchant.metadata,
      updatedAt: new Date(),
    };
    
    this.merchants.set(merchantId, updated);
    
    return updated;
  }
  
  /**
   * Suspend merchant
   */
  async suspendMerchant(merchantId: string, _reason: string): Promise<void> {
    const merchant = this.merchants.get(merchantId);
    
    if (!merchant) {
      throw new Error(`Merchant not found: ${merchantId}`);
    }
    
    merchant.status = 'suspended';
    merchant.updatedAt = new Date();
  }
  
  /**
   * Activate merchant
   */
  async activateMerchant(merchantId: string): Promise<void> {
    const merchant = this.merchants.get(merchantId);
    
    if (!merchant) {
      throw new Error(`Merchant not found: ${merchantId}`);
    }
    
    if (merchant.status === 'disabled') {
      throw new Error('Cannot activate disabled merchant');
    }
    
    merchant.status = 'active';
    merchant.updatedAt = new Date();
  }
  
  /**
   * Create API key for merchant
   */
  async createAPIKey(
    merchantId: string,
    name: string,
    permissions: APIKeyPermission[],
    isLive: boolean
  ): Promise<{ key: APIKey; secret: string }> {
    const merchant = this.merchants.get(merchantId);
    
    if (!merchant) {
      throw new Error(`Merchant not found: ${merchantId}`);
    }
    
    if (merchant.status !== 'active') {
      throw new Error('Merchant must be active to create API keys');
    }
    
    // Generate key
    const keyPrefix = isLive
      ? this.config.apiKeyPrefix
      : this.config.testApiKeyPrefix;
    const keySecret = generateRandomHex(this.config.apiKeyLength);
    const fullKey = `${keyPrefix}${keySecret}`;
    
    // Hash the secret for storage
    const keyHash = await hashKey(keySecret);
    
    const keyId = generateId('key');
    
    const apiKey: APIKey = {
      id: keyId,
      prefix: fullKey.slice(0, 12),
      keyHash,
      merchantId,
      name,
      permissions,
      isLive,
      createdAt: new Date(),
      isActive: true,
    };
    
    this.apiKeys.set(keyId, apiKey);
    this.apiKeySecrets.set(apiKey.prefix, keyHash);
    
    return {
      key: apiKey,
      secret: fullKey, // Only returned once at creation
    };
  }
  
  /**
   * Revoke API key
   */
  async revokeAPIKey(keyId: string): Promise<void> {
    const key = this.apiKeys.get(keyId);
    
    if (!key) {
      throw new Error(`API key not found: ${keyId}`);
    }
    
    key.isActive = false;
    this.apiKeySecrets.delete(key.prefix);
  }
  
  /**
   * List API keys for merchant
   */
  async listAPIKeys(merchantId: string): Promise<APIKey[]> {
    const keys: APIKey[] = [];
    
    for (const key of this.apiKeys.values()) {
      if (key.merchantId === merchantId) {
        keys.push(key);
      }
    }
    
    return keys;
  }
  
  /**
   * Validate API key
   */
  async validateAPIKey(
    keyPrefix: string,
    keySecret: string
  ): Promise<{ valid: boolean; merchant?: Merchant; key?: APIKey }> {
    // Find key by prefix
    let foundKey: APIKey | undefined;
    
    for (const key of this.apiKeys.values()) {
      if (key.prefix === keyPrefix && key.isActive) {
        foundKey = key;
        break;
      }
    }
    
    if (!foundKey) {
      return { valid: false };
    }
    
    // Verify hash
    const secretHash = await hashKey(keySecret);
    if (secretHash !== foundKey.keyHash) {
      return { valid: false };
    }
    
    // Check expiry
    if (foundKey.expiresAt && foundKey.expiresAt < new Date()) {
      return { valid: false };
    }
    
    // Get merchant
    const merchant = this.merchants.get(foundKey.merchantId);
    
    if (!merchant || merchant.status !== 'active') {
      return { valid: false };
    }
    
    // Update last used
    foundKey.lastUsedAt = new Date();
    
    return {
      valid: true,
      merchant,
      key: foundKey,
    };
  }
  
  /**
   * Authenticate API request
   */
  async authenticateRequest(authHeader: string): Promise<AuthResult> {
    // Expect: "Bearer pk_live_xxxx" or "Bearer pk_test_xxxx"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authenticated: false,
        errorCode: PaymentErrorCode.INVALID_API_KEY,
        errorMessage: 'Missing or invalid authorization header',
      };
    }
    
    const fullKey = authHeader.slice(7); // Remove "Bearer "
    
    // Extract prefix and secret
    const prefixEnd = fullKey.indexOf('_', 8); // After pk_live_ or pk_test_
    if (prefixEnd === -1) {
      return {
        authenticated: false,
        errorCode: PaymentErrorCode.INVALID_API_KEY,
        errorMessage: 'Invalid API key format',
      };
    }
    
    const keyPrefix = fullKey.slice(0, prefixEnd + 1 + 4); // pk_live_xxxx (first 4 chars)
    const keySecret = fullKey.slice(prefixEnd + 1 + 4); // Remaining secret
    
    // Validate
    const result = await this.validateAPIKey(keyPrefix, keySecret);
    
    if (!result.valid) {
      return {
        authenticated: false,
        errorCode: PaymentErrorCode.INVALID_API_KEY,
        errorMessage: 'Invalid API key',
      };
    }
    
    return {
      authenticated: true,
      merchant: result.merchant,
      apiKey: result.key,
    };
  }
  
  /**
   * Check if API key has permission
   */
  hasPermission(key: APIKey, permission: APIKeyPermission): boolean {
    return key.permissions.includes(permission);
  }
  
  /**
   * Get merchant stats
   */
  getStats(): { totalMerchants: number; byStatus: Record<MerchantStatus, number>; byTier: Record<MerchantTier, number> } {
    const byStatus: Record<MerchantStatus, number> = {
      pending: 0,
      active: 0,
      suspended: 0,
      disabled: 0,
    };
    
    const byTier: Record<MerchantTier, number> = {
      starter: 0,
      growth: 0,
      enterprise: 0,
      custom: 0,
    };
    
    for (const merchant of this.merchants.values()) {
      byStatus[merchant.status]++;
      byTier[merchant.tier]++;
    }
    
    return {
      totalMerchants: this.merchants.size,
      byStatus,
      byTier,
    };
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create merchant manager
 */
export function createMerchantManager(
  config?: Partial<MerchantManagerConfig>
): MerchantManager {
  return new MerchantManager(config);
}

/**
 * Parse API key from header
 */
export function parseAPIKey(fullKey: string): { prefix: string; secret: string; isLive: boolean } | null {
  if (!fullKey.startsWith('pk_live_') && !fullKey.startsWith('pk_test_')) {
    return null;
  }
  
  const isLive = fullKey.startsWith('pk_live_');
  const keyPart = fullKey.slice(8); // After pk_xxxx_
  
  if (keyPart.length < 16) {
    return null;
  }
  
  return {
    prefix: fullKey.slice(0, 12),
    secret: keyPart,
    isLive,
  };
}

/**
 * Check if key is test key
 */
export function isTestKey(fullKey: string): boolean {
  return fullKey.startsWith('pk_test_');
}

/**
 * Check if key is live key
 */
export function isLiveKey(fullKey: string): boolean {
  return fullKey.startsWith('pk_live_');
}
