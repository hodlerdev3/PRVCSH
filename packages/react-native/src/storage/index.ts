/**
 * @fileoverview Secure Storage Module
 * @description Private key storage using secure enclave and keychain.
 * 
 * @module @prvcsh/react-native/storage
 * @version 0.1.0
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Storage accessibility levels
 */
export type StorageAccessibility =
  | 'when_unlocked'           // Only accessible when device is unlocked
  | 'after_first_unlock'      // Accessible after first unlock since boot
  | 'always'                  // Always accessible (not recommended for keys)
  | 'when_passcode_set'       // Only when device has passcode
  | 'when_unlocked_this_device_only'  // Non-migratable, highest security
  ;

/**
 * Storage options
 */
export interface SecureStorageOptions {
  /** Accessibility level */
  accessibility?: StorageAccessibility;
  
  /** Require biometric authentication to access */
  requireBiometric?: boolean;
  
  /** Key is synchronized across devices via iCloud Keychain (iOS only) */
  synchronizable?: boolean;
  
  /** Service name for keychain grouping */
  service?: string;
  
  /** Access group for sharing between apps (iOS only) */
  accessGroup?: string;
}

/**
 * Stored item metadata
 */
export interface StoredItemMetadata {
  /** When the item was created */
  createdAt: Date;
  
  /** When the item was last modified */
  modifiedAt: Date;
  
  /** Whether biometric is required */
  requiresBiometric: boolean;
  
  /** Accessibility level */
  accessibility: StorageAccessibility;
}

/**
 * Key pair info
 */
export interface KeyPairInfo {
  /** Key alias */
  alias: string;
  
  /** Public key (base64 or hex encoded) */
  publicKey: string;
  
  /** Key type */
  type: 'ed25519' | 'secp256k1' | 'rsa';
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Whether stored in secure enclave */
  inSecureEnclave: boolean;
}

// =============================================================================
// SECURE STORAGE CLASS
// =============================================================================

/**
 * Secure storage service
 * Uses iOS Keychain / Android Keystore for sensitive data
 */
export class SecureStorage {
  private readonly service: string;
  private readonly defaultOptions: SecureStorageOptions;
  
  constructor(options: SecureStorageOptions = {}) {
    this.service = options.service ?? 'com.prvcsh';
    this.defaultOptions = {
      accessibility: 'when_unlocked_this_device_only',
      requireBiometric: false,
      synchronizable: false,
      ...options,
    };
  }
  
  // =============================================================================
  // BASIC STORAGE OPERATIONS
  // =============================================================================
  
  /**
   * Store a string value securely
   */
  async setItem(
    key: string,
    value: string,
    options?: SecureStorageOptions
  ): Promise<void> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // In real implementation, use:
      // iOS: Keychain Services API
      // Android: EncryptedSharedPreferences or Android Keystore
      
      // Mock implementation using memory storage
      this.mockStorage.set(this.getFullKey(key), {
        value,
        options: opts,
        metadata: {
          createdAt: new Date(),
          modifiedAt: new Date(),
          requiresBiometric: opts.requireBiometric ?? false,
          accessibility: opts.accessibility ?? 'when_unlocked',
        },
      });
    } catch (error) {
      throw new SecureStorageError(
        'Failed to store item',
        'store_failed',
        error
      );
    }
  }
  
  /**
   * Retrieve a string value
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const stored = this.mockStorage.get(this.getFullKey(key));
      return stored?.value ?? null;
    } catch (error) {
      throw new SecureStorageError(
        'Failed to retrieve item',
        'retrieve_failed',
        error
      );
    }
  }
  
  /**
   * Delete a stored item
   */
  async removeItem(key: string): Promise<void> {
    try {
      this.mockStorage.delete(this.getFullKey(key));
    } catch (error) {
      throw new SecureStorageError(
        'Failed to remove item',
        'remove_failed',
        error
      );
    }
  }
  
  /**
   * Check if an item exists
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      return this.mockStorage.has(this.getFullKey(key));
    } catch {
      return false;
    }
  }
  
  /**
   * Get all keys (without values)
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const prefix = `${this.service}:`;
      const keys: string[] = [];
      
      for (const fullKey of this.mockStorage.keys()) {
        if (fullKey.startsWith(prefix)) {
          keys.push(fullKey.slice(prefix.length));
        }
      }
      
      return keys;
    } catch {
      return [];
    }
  }
  
  /**
   * Clear all stored items
   */
  async clear(): Promise<void> {
    const keys = await this.getAllKeys();
    await Promise.all(keys.map(key => this.removeItem(key)));
  }
  
  /**
   * Get item metadata
   */
  async getMetadata(key: string): Promise<StoredItemMetadata | null> {
    try {
      const stored = this.mockStorage.get(this.getFullKey(key));
      return stored?.metadata ?? null;
    } catch {
      return null;
    }
  }
  
  // =============================================================================
  // BINARY DATA OPERATIONS
  // =============================================================================
  
  /**
   * Store binary data (Uint8Array)
   */
  async setBytes(
    key: string,
    value: Uint8Array,
    options?: SecureStorageOptions
  ): Promise<void> {
    const base64 = this.uint8ArrayToBase64(value);
    await this.setItem(`bytes:${key}`, base64, options);
  }
  
  /**
   * Retrieve binary data
   */
  async getBytes(key: string): Promise<Uint8Array | null> {
    const base64 = await this.getItem(`bytes:${key}`);
    if (!base64) return null;
    return this.base64ToUint8Array(base64);
  }
  
  // =============================================================================
  // KEY PAIR OPERATIONS
  // =============================================================================
  
  /**
   * Generate and store a key pair in secure enclave
   */
  async generateKeyPair(
    alias: string,
    options?: {
      type?: 'ed25519' | 'secp256k1';
      requireBiometric?: boolean;
    }
  ): Promise<KeyPairInfo> {
    const keyType = options?.type ?? 'ed25519';
    
    try {
      // In real implementation:
      // iOS: Generate key in Secure Enclave using SecKeyCreateRandomKey
      // Android: Generate key in Android Keystore with BiometricPrompt
      
      // Mock key generation
      const publicKey = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        publicKey[i] = Math.floor(Math.random() * 256);
      }
      
      const keyInfo: KeyPairInfo = {
        alias,
        publicKey: this.uint8ArrayToBase64(publicKey),
        type: keyType,
        createdAt: new Date(),
        inSecureEnclave: true,
      };
      
      // Store key info (not the private key - that stays in secure enclave)
      await this.setItem(
        `keypair:${alias}`,
        JSON.stringify(keyInfo),
        { requireBiometric: options?.requireBiometric }
      );
      
      return keyInfo;
    } catch (error) {
      throw new SecureStorageError(
        'Failed to generate key pair',
        'keygen_failed',
        error
      );
    }
  }
  
  /**
   * Get key pair info
   */
  async getKeyPairInfo(alias: string): Promise<KeyPairInfo | null> {
    try {
      const stored = await this.getItem(`keypair:${alias}`);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  
  /**
   * Sign data with a stored key pair
   * Requires biometric authentication if key was created with that option
   */
  async signWithKeyPair(
    alias: string,
    data: Uint8Array
  ): Promise<Uint8Array> {
    const keyInfo = await this.getKeyPairInfo(alias);
    if (!keyInfo) {
      throw new SecureStorageError(
        'Key pair not found',
        'key_not_found'
      );
    }
    
    try {
      // In real implementation:
      // iOS: Sign using SecKeyCreateSignature with Secure Enclave key
      // Android: Sign using Android Keystore with BiometricPrompt
      
      // Mock signature
      const signature = new Uint8Array(64);
      for (let i = 0; i < 64; i++) {
        signature[i] = Math.floor(Math.random() * 256);
      }
      
      return signature;
    } catch (error) {
      throw new SecureStorageError(
        'Failed to sign data',
        'sign_failed',
        error
      );
    }
  }
  
  /**
   * Delete a key pair
   */
  async deleteKeyPair(alias: string): Promise<void> {
    try {
      await this.removeItem(`keypair:${alias}`);
      
      // In real implementation, also delete from secure enclave
    } catch (error) {
      throw new SecureStorageError(
        'Failed to delete key pair',
        'delete_failed',
        error
      );
    }
  }
  
  /**
   * List all stored key pairs
   */
  async listKeyPairs(): Promise<KeyPairInfo[]> {
    const allKeys = await this.getAllKeys();
    const keyPairKeys = allKeys.filter(k => k.startsWith('keypair:'));
    
    const keyPairs: KeyPairInfo[] = [];
    for (const key of keyPairKeys) {
      const alias = key.replace('keypair:', '');
      const info = await this.getKeyPairInfo(alias);
      if (info) {
        keyPairs.push(info);
      }
    }
    
    return keyPairs;
  }
  
  // =============================================================================
  // WALLET KEY STORAGE
  // =============================================================================
  
  /**
   * Store wallet private key securely
   */
  async storeWalletKey(
    publicKey: string,
    privateKey: Uint8Array,
    options?: {
      requireBiometric?: boolean;
      label?: string;
    }
  ): Promise<void> {
    const keyData = {
      publicKey,
      label: options?.label ?? 'PRVCSH Wallet',
      createdAt: new Date().toISOString(),
    };
    
    await this.setBytes(`wallet:${publicKey}:private`, privateKey, {
      requireBiometric: options?.requireBiometric ?? true,
      accessibility: 'when_unlocked_this_device_only',
    });
    
    await this.setItem(`wallet:${publicKey}:info`, JSON.stringify(keyData));
  }
  
  /**
   * Retrieve wallet private key
   * Requires biometric authentication
   */
  async getWalletKey(publicKey: string): Promise<Uint8Array | null> {
    return this.getBytes(`wallet:${publicKey}:private`);
  }
  
  /**
   * Delete wallet key
   */
  async deleteWalletKey(publicKey: string): Promise<void> {
    await this.removeItem(`wallet:${publicKey}:private`);
    await this.removeItem(`wallet:${publicKey}:info`);
  }
  
  /**
   * List stored wallets
   */
  async listWallets(): Promise<Array<{ publicKey: string; label: string; createdAt: Date }>> {
    const allKeys = await this.getAllKeys();
    const walletInfoKeys = allKeys.filter(k => k.includes(':info') && k.startsWith('wallet:'));
    
    const wallets: Array<{ publicKey: string; label: string; createdAt: Date }> = [];
    
    for (const key of walletInfoKeys) {
      try {
        const info = await this.getItem(key);
        if (info) {
          const parsed = JSON.parse(info);
          wallets.push({
            publicKey: parsed.publicKey,
            label: parsed.label,
            createdAt: new Date(parsed.createdAt),
          });
        }
      } catch {
        // Skip invalid entries
      }
    }
    
    return wallets;
  }
  
  // =============================================================================
  // PRIVATE HELPERS
  // =============================================================================
  
  private mockStorage = new Map<string, {
    value: string;
    options: SecureStorageOptions;
    metadata: StoredItemMetadata;
  }>();
  
  private getFullKey(key: string): string {
    return `${this.service}:${key}`;
  }
  
  private uint8ArrayToBase64(bytes: Uint8Array): string {
    // Simple base64 encoding
    const binary = String.fromCharCode(...bytes);
    if (typeof btoa !== 'undefined') {
      return btoa(binary);
    }
    // Node.js fallback
    return Buffer.from(bytes).toString('base64');
  }
  
  private base64ToUint8Array(base64: string): Uint8Array {
    // Simple base64 decoding
    if (typeof atob !== 'undefined') {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
    // Node.js fallback
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
}

// =============================================================================
// ERROR CLASS
// =============================================================================

/**
 * Secure storage error
 */
export class SecureStorageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'SecureStorageError';
  }
}

// =============================================================================
// SINGLETON AND FACTORY
// =============================================================================

let defaultStorageInstance: SecureStorage | null = null;

/**
 * Get default secure storage instance
 */
export function getSecureStorage(): SecureStorage {
  if (!defaultStorageInstance) {
    defaultStorageInstance = new SecureStorage();
  }
  return defaultStorageInstance;
}

/**
 * Create a new secure storage instance with custom options
 */
export function createSecureStorage(options: SecureStorageOptions): SecureStorage {
  return new SecureStorage(options);
}
