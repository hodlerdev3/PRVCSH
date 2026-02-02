/**
 * @fileoverview Biometric Authentication Module
 * @description FaceID/TouchID integration for PRVCSH React Native.
 * 
 * @module @prvcsh/react-native/biometric
 * @version 0.1.0
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Biometry type
 */
export type BiometryType = 'fingerprint' | 'facial' | 'iris' | 'none';

/**
 * Authentication level
 */
export type AuthenticationLevel = 'biometric' | 'biometric-weak' | 'device-credentials';

/**
 * Biometric capabilities
 */
export interface BiometricCapabilities {
  /** Device has biometric hardware */
  hasHardware: boolean;
  
  /** Biometrics are enrolled/configured */
  isEnrolled: boolean;
  
  /** Primary biometry type */
  biometryType: BiometryType;
  
  /** Supported authentication levels */
  supportedLevels: AuthenticationLevel[];
}

/**
 * Authentication options
 */
export interface BiometricAuthOptions {
  /** Prompt message shown to user */
  promptMessage?: string;
  
  /** Cancel button text */
  cancelLabel?: string;
  
  /** Description text (Android) */
  description?: string;
  
  /** Allow device credentials as fallback */
  fallbackToDeviceCredentials?: boolean;
  
  /** Required authentication level */
  level?: AuthenticationLevel;
  
  /** Confirmation required (Android) */
  confirmationRequired?: boolean;
}

/**
 * Authentication result
 */
export interface BiometricAuthResult {
  /** Authentication succeeded */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
  
  /** Error code for programmatic handling */
  errorCode?: BiometricErrorCode;
  
  /** The biometry type that was used */
  biometryType?: BiometryType;
  
  /** Whether device credentials were used instead */
  usedDeviceCredentials?: boolean;
}

/**
 * Biometric error codes
 */
export type BiometricErrorCode =
  | 'user_cancel'
  | 'user_fallback'
  | 'system_cancel'
  | 'not_available'
  | 'not_enrolled'
  | 'lockout'
  | 'lockout_permanent'
  | 'timeout'
  | 'biometry_not_recognized'
  | 'unknown';

// =============================================================================
// BIOMETRIC SERVICE
// =============================================================================

/**
 * Biometric authentication service
 */
export class BiometricService {
  private capabilities: BiometricCapabilities | null = null;
  private initialized: boolean = false;
  
  /**
   * Initialize the biometric service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    this.capabilities = await this.checkCapabilities();
    this.initialized = true;
  }
  
  /**
   * Check device biometric capabilities
   */
  async checkCapabilities(): Promise<BiometricCapabilities> {
    // This would use platform-specific APIs
    // React Native: react-native-biometrics or expo-local-authentication
    
    try {
      // Mock implementation - in real app, use native module
      const capabilities: BiometricCapabilities = {
        hasHardware: false,
        isEnrolled: false,
        biometryType: 'none',
        supportedLevels: [],
      };
      
      // Platform detection would happen here
      // iOS: Check for Face ID / Touch ID
      // Android: Check for BiometricPrompt support
      
      return capabilities;
    } catch {
      return {
        hasHardware: false,
        isEnrolled: false,
        biometryType: 'none',
        supportedLevels: [],
      };
    }
  }
  
  /**
   * Get cached capabilities
   */
  getCapabilities(): BiometricCapabilities | null {
    return this.capabilities;
  }
  
  /**
   * Check if biometric authentication is available
   */
  isAvailable(): boolean {
    return this.capabilities?.hasHardware === true && 
           this.capabilities?.isEnrolled === true;
  }
  
  /**
   * Authenticate with biometrics
   */
  async authenticate(options: BiometricAuthOptions = {}): Promise<BiometricAuthResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Biometric authentication not available',
        errorCode: 'not_available',
      };
    }
    
    const {
      promptMessage = 'Authenticate to continue',
      cancelLabel = 'Cancel',
      description,
      fallbackToDeviceCredentials = true,
      level = 'biometric',
      confirmationRequired = false,
    } = options;
    
    try {
      // This would call native biometric API
      // For now, simulate the process
      
      // In real implementation:
      // iOS: Use LAContext
      // Android: Use BiometricPrompt
      
      await this.simulateAuthentication();
      
      return {
        success: true,
        biometryType: this.capabilities?.biometryType,
        usedDeviceCredentials: false,
      };
    } catch (error) {
      const errorResult = this.parseError(error);
      return {
        success: false,
        ...errorResult,
      };
    }
  }
  
  /**
   * Authenticate and get cryptographic signature
   */
  async authenticateAndSign(
    message: Uint8Array,
    options: BiometricAuthOptions = {}
  ): Promise<{ success: boolean; signature?: Uint8Array; error?: string }> {
    const authResult = await this.authenticate(options);
    
    if (!authResult.success) {
      return { success: false, error: authResult.error };
    }
    
    // Sign the message with the biometric-protected key
    // This would use the secure enclave on iOS or Android Keystore
    
    const signature = await this.signWithSecureKey(message);
    
    return { success: true, signature };
  }
  
  /**
   * Create a biometric-protected key pair
   */
  async createProtectedKeyPair(keyAlias: string): Promise<{
    created: boolean;
    publicKey?: Uint8Array;
    error?: string;
  }> {
    try {
      // This would create a key in the secure enclave (iOS) or Android Keystore
      // with biometric protection
      
      // Mock implementation
      const mockPublicKey = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        mockPublicKey[i] = Math.floor(Math.random() * 256);
      }
      
      return { created: true, publicKey: mockPublicKey };
    } catch (error) {
      return { 
        created: false, 
        error: error instanceof Error ? error.message : 'Failed to create key pair' 
      };
    }
  }
  
  /**
   * Delete a protected key pair
   */
  async deleteProtectedKeyPair(keyAlias: string): Promise<boolean> {
    try {
      // Would delete from secure enclave / keystore
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Check if a protected key exists
   */
  async hasProtectedKey(keyAlias: string): Promise<boolean> {
    try {
      // Would check secure enclave / keystore
      return false;
    } catch {
      return false;
    }
  }
  
  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================
  
  private async simulateAuthentication(): Promise<void> {
    // Simulate biometric prompt delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In real implementation, this would show the native biometric prompt
    // and return based on user action
  }
  
  private async signWithSecureKey(message: Uint8Array): Promise<Uint8Array> {
    // Would use secure enclave / keystore to sign
    // Mock implementation returns random signature
    
    const signature = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      signature[i] = Math.floor(Math.random() * 256);
    }
    return signature;
  }
  
  private parseError(error: unknown): { error: string; errorCode: BiometricErrorCode } {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('cancel') && message.includes('user')) {
        return { error: 'User cancelled', errorCode: 'user_cancel' };
      }
      if (message.includes('fallback')) {
        return { error: 'User chose fallback', errorCode: 'user_fallback' };
      }
      if (message.includes('lockout')) {
        if (message.includes('permanent')) {
          return { error: 'Biometrics permanently locked', errorCode: 'lockout_permanent' };
        }
        return { error: 'Biometrics temporarily locked', errorCode: 'lockout' };
      }
      if (message.includes('not enrolled') || message.includes('no biometrics')) {
        return { error: 'Biometrics not enrolled', errorCode: 'not_enrolled' };
      }
      if (message.includes('not available')) {
        return { error: 'Biometrics not available', errorCode: 'not_available' };
      }
      
      return { error: error.message, errorCode: 'unknown' };
    }
    
    return { error: 'Authentication failed', errorCode: 'unknown' };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let biometricServiceInstance: BiometricService | null = null;

/**
 * Get biometric service instance
 */
export function getBiometricService(): BiometricService {
  if (!biometricServiceInstance) {
    biometricServiceInstance = new BiometricService();
  }
  return biometricServiceInstance;
}

/**
 * Initialize biometric service
 */
export async function initializeBiometrics(): Promise<BiometricCapabilities> {
  const service = getBiometricService();
  await service.initialize();
  return service.getCapabilities()!;
}

/**
 * Quick authenticate
 */
export async function authenticateBiometric(
  options?: BiometricAuthOptions
): Promise<BiometricAuthResult> {
  const service = getBiometricService();
  return service.authenticate(options);
}

// =============================================================================
// REACT HOOK
// =============================================================================

/**
 * Biometric auth hook (for React Native)
 * Implemented in hooks/index.ts using this service
 */
export interface UseBiometricHook {
  available: boolean;
  biometryType: BiometryType;
  loading: boolean;
  authenticate: (options?: BiometricAuthOptions) => Promise<BiometricAuthResult>;
}
