/**
 * @fileoverview Expo PRVCSH SDK
 * @description Expo-specific wrapper for PRVCSH with native integrations.
 * 
 * @module expo-prvcsh
 * @version 0.1.0
 * 
 * @example
 * ```tsx
 * import { 
 *   PRVCSHProvider, 
 *   useExpoWallet,
 *   useBiometricAuth,
 *   useSecureStorage 
 * } from 'expo-prvcsh';
 * 
 * function App() {
 *   return (
 *     <PRVCSHProvider network="mainnet-beta">
 *       <WalletScreen />
 *     </PRVCSHProvider>
 *   );
 * }
 * ```
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';

// Re-export everything from react-native package
export * from '@prvcsh/react-native';

// =============================================================================
// EXPO-SPECIFIC TYPES
// =============================================================================

/**
 * Solana network
 */
export type SolanaNetwork = 'mainnet-beta' | 'testnet' | 'devnet';

/**
 * Expo SDK configuration
 */
export interface ExpoPRVCSHConfig {
  /** Solana network */
  network: SolanaNetwork;
  
  /** Enable biometric authentication */
  biometricAuth?: boolean;
  
  /** Enable secure storage for keys */
  secureStorage?: boolean;
  
  /** Enable push notifications */
  pushNotifications?: boolean;
  
  /** Auto-connect wallet on mount */
  autoConnect?: boolean;
  
  /** RPC endpoint override */
  rpcUrl?: string;
  
  /** Debug mode */
  debug?: boolean;
}

/**
 * Biometric authentication result
 */
export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometryType?: 'fingerprint' | 'facial' | 'iris';
}

/**
 * Secure storage item
 */
export interface SecureStorageItem {
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Push notification payload
 */
export interface PushNotificationPayload {
  type: 'transaction' | 'deposit' | 'withdrawal' | 'alert';
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * QR scan result
 */
export interface QRScanResult {
  type: 'solana-pay' | 'address' | 'unknown';
  data: string;
  parsed?: {
    recipient?: string;
    amount?: number;
    token?: string;
    label?: string;
    message?: string;
    memo?: string;
  };
}

// =============================================================================
// CONTEXT
// =============================================================================

interface ExpoPRVCSHContextValue {
  config: ExpoPRVCSHConfig;
  ready: boolean;
  biometricAvailable: boolean;
  notificationsEnabled: boolean;
}

const ExpoPRVCSHContext = createContext<ExpoPRVCSHContextValue | null>(null);

/**
 * Provider props
 */
export interface PRVCSHProviderProps {
  children: ReactNode;
  network?: SolanaNetwork;
  config?: Partial<ExpoPRVCSHConfig>;
}

/**
 * PRVCSH Provider for Expo
 */
export function PRVCSHProvider({
  children,
  network = 'devnet',
  config: userConfig,
}: PRVCSHProviderProps): React.ReactElement {
  const [ready, setReady] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const config = useMemo<ExpoPRVCSHConfig>(() => ({
    network,
    biometricAuth: false,
    secureStorage: true,
    pushNotifications: false,
    autoConnect: false,
    debug: false,
    ...userConfig,
  }), [network, userConfig]);
  
  // Initialize SDK
  useEffect(() => {
    const init = async () => {
      try {
        // Check biometric availability
        if (config.biometricAuth) {
          // Would use expo-local-authentication here
          setBiometricAvailable(false);
        }
        
        // Request notification permissions
        if (config.pushNotifications) {
          // Would use expo-notifications here
          setNotificationsEnabled(false);
        }
        
        setReady(true);
        
        if (config.debug) {
          console.log('[ExpoPRVCSH] Initialized', config);
        }
      } catch (error) {
        console.error('[ExpoPRVCSH] Init error:', error);
        setReady(true);
      }
    };
    
    init();
  }, [config]);
  
  const value = useMemo(() => ({
    config,
    ready,
    biometricAvailable,
    notificationsEnabled,
  }), [config, ready, biometricAvailable, notificationsEnabled]);
  
  return (
    <ExpoPRVCSHContext.Provider value={value}>
      {children}
    </ExpoPRVCSHContext.Provider>
  );
}

/**
 * Use Expo PRVCSH context
 */
export function useExpoPRVCSH(): ExpoPRVCSHContextValue {
  const context = useContext(ExpoPRVCSHContext);
  if (!context) {
    throw new Error('useExpoPRVCSH must be used within PRVCSHProvider');
  }
  return context;
}

// =============================================================================
// BIOMETRIC AUTH HOOK
// =============================================================================

/**
 * Biometric auth hook options
 */
export interface UseBiometricAuthOptions {
  /** Prompt message */
  promptMessage?: string;
  
  /** Cancel button label */
  cancelLabel?: string;
  
  /** Fallback to passcode */
  fallbackToPasscode?: boolean;
}

/**
 * Biometric auth hook result
 */
export interface UseBiometricAuthResult {
  available: boolean;
  biometryType: 'fingerprint' | 'facial' | 'iris' | null;
  authenticate: () => Promise<BiometricAuthResult>;
  authenticating: boolean;
}

/**
 * Use biometric authentication
 */
export function useBiometricAuth(options: UseBiometricAuthOptions = {}): UseBiometricAuthResult {
  const [authenticating, setAuthenticating] = useState(false);
  const [available, setAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<'fingerprint' | 'facial' | 'iris' | null>(null);
  
  // Check availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        // Would use expo-local-authentication
        // const hasHardware = await LocalAuthentication.hasHardwareAsync();
        // const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        // const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        
        setAvailable(false);
        setBiometryType(null);
      } catch {
        setAvailable(false);
      }
    };
    
    checkAvailability();
  }, []);
  
  const authenticate = useCallback(async (): Promise<BiometricAuthResult> => {
    if (!available) {
      return { success: false, error: 'Biometric authentication not available' };
    }
    
    setAuthenticating(true);
    
    try {
      // Would use expo-local-authentication
      // const result = await LocalAuthentication.authenticateAsync({
      //   promptMessage: options.promptMessage ?? 'Authenticate to continue',
      //   cancelLabel: options.cancelLabel ?? 'Cancel',
      //   disableDeviceFallback: !options.fallbackToPasscode,
      // });
      
      // Simulate for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAuthenticating(false);
      return { success: true, biometryType: biometryType ?? undefined };
    } catch (error) {
      setAuthenticating(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }, [available, biometryType, options]);
  
  return { available, biometryType, authenticate, authenticating };
}

// =============================================================================
// SECURE STORAGE HOOK
// =============================================================================

/**
 * Secure storage hook result
 */
export interface UseSecureStorageResult {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

/**
 * Use secure storage (expo-secure-store)
 */
export function useSecureStorage(): UseSecureStorageResult {
  const get = useCallback(async (key: string): Promise<string | null> => {
    try {
      // Would use expo-secure-store
      // return await SecureStore.getItemAsync(key);
      
      // Fallback to regular storage for demo
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(`secure_${key}`);
      }
      return null;
    } catch {
      return null;
    }
  }, []);
  
  const set = useCallback(async (key: string, value: string): Promise<void> => {
    try {
      // Would use expo-secure-store
      // await SecureStore.setItemAsync(key, value);
      
      // Fallback to regular storage for demo
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`secure_${key}`, value);
      }
    } catch (error) {
      console.error('SecureStorage set error:', error);
    }
  }, []);
  
  const remove = useCallback(async (key: string): Promise<void> => {
    try {
      // Would use expo-secure-store
      // await SecureStore.deleteItemAsync(key);
      
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`secure_${key}`);
      }
    } catch (error) {
      console.error('SecureStorage remove error:', error);
    }
  }, []);
  
  const clear = useCallback(async (): Promise<void> => {
    try {
      // Would iterate and clear all secure items
      if (typeof localStorage !== 'undefined') {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('secure_'));
        keys.forEach(k => localStorage.removeItem(k));
      }
    } catch (error) {
      console.error('SecureStorage clear error:', error);
    }
  }, []);
  
  return { get, set, remove, clear };
}

// =============================================================================
// PUSH NOTIFICATIONS HOOK
// =============================================================================

/**
 * Push notification handler
 */
export type NotificationHandler = (payload: PushNotificationPayload) => void;

/**
 * Push notifications hook result
 */
export interface UsePushNotificationsResult {
  enabled: boolean;
  token: string | null;
  requestPermission: () => Promise<boolean>;
  subscribe: (handler: NotificationHandler) => () => void;
  sendLocalNotification: (payload: PushNotificationPayload) => Promise<void>;
}

/**
 * Use push notifications
 */
export function usePushNotifications(): UsePushNotificationsResult {
  const [enabled, setEnabled] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [handlers] = useState<Set<NotificationHandler>>(new Set());
  
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Would use expo-notifications
      // const { status } = await Notifications.requestPermissionsAsync();
      // const granted = status === 'granted';
      // setEnabled(granted);
      // 
      // if (granted) {
      //   const token = await Notifications.getExpoPushTokenAsync();
      //   setToken(token.data);
      // }
      // 
      // return granted;
      
      return false;
    } catch {
      return false;
    }
  }, []);
  
  const subscribe = useCallback((handler: NotificationHandler): () => void => {
    handlers.add(handler);
    return () => handlers.delete(handler);
  }, [handlers]);
  
  const sendLocalNotification = useCallback(async (payload: PushNotificationPayload): Promise<void> => {
    // Would use expo-notifications
    // await Notifications.scheduleNotificationAsync({
    //   content: {
    //     title: payload.title,
    //     body: payload.body,
    //     data: payload.data,
    //   },
    //   trigger: null,
    // });
    
    console.log('[ExpoPRVCSH] Local notification:', payload);
  }, []);
  
  return { enabled, token, requestPermission, subscribe, sendLocalNotification };
}

// =============================================================================
// QR SCANNER HOOK
// =============================================================================

/**
 * QR scanner hook result
 */
export interface UseQRScannerResult {
  scanning: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  startScan: () => void;
  stopScan: () => void;
  lastScan: QRScanResult | null;
}

/**
 * Parse Solana Pay URL
 */
function parseSolanaPayUrl(url: string): QRScanResult['parsed'] | null {
  try {
    if (!url.startsWith('solana:')) {
      return null;
    }
    
    const parsed = new URL(url);
    const recipient = parsed.pathname;
    const params = parsed.searchParams;
    
    return {
      recipient,
      amount: params.has('amount') ? parseFloat(params.get('amount')!) : undefined,
      token: params.get('spl-token') ?? undefined,
      label: params.get('label') ?? undefined,
      message: params.get('message') ?? undefined,
      memo: params.get('memo') ?? undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Use QR scanner
 */
export function useQRScanner(): UseQRScannerResult {
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [lastScan, setLastScan] = useState<QRScanResult | null>(null);
  
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Would use expo-camera or expo-barcode-scanner
      // const { status } = await Camera.requestCameraPermissionsAsync();
      // const granted = status === 'granted';
      // setHasPermission(granted);
      // return granted;
      
      return false;
    } catch {
      return false;
    }
  }, []);
  
  const startScan = useCallback(() => {
    if (hasPermission) {
      setScanning(true);
      setLastScan(null);
    }
  }, [hasPermission]);
  
  const stopScan = useCallback(() => {
    setScanning(false);
  }, []);
  
  // Handle scan results
  const handleScan = useCallback((data: string) => {
    // Parse the scanned data
    const solanaPayParsed = parseSolanaPayUrl(data);
    
    if (solanaPayParsed) {
      setLastScan({
        type: 'solana-pay',
        data,
        parsed: solanaPayParsed,
      });
    } else if (data.length >= 32 && data.length <= 44 && /^[A-Za-z0-9]+$/.test(data)) {
      // Looks like a Solana address
      setLastScan({
        type: 'address',
        data,
        parsed: { recipient: data },
      });
    } else {
      setLastScan({
        type: 'unknown',
        data,
      });
    }
    
    setScanning(false);
  }, []);
  
  return { scanning, hasPermission, requestPermission, startScan, stopScan, lastScan };
}

// =============================================================================
// EXPO WALLET HOOK
// =============================================================================

/**
 * Expo wallet hook options
 */
export interface UseExpoWalletOptions {
  /** Use biometric auth for transactions */
  biometricAuth?: boolean;
  
  /** Store private key in secure storage */
  secureStorage?: boolean;
  
  /** Network */
  network?: SolanaNetwork;
}

/**
 * Expo wallet hook result
 */
export interface UseExpoWalletResult {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  connect: (walletName?: string) => Promise<string>;
  disconnect: () => Promise<void>;
  signWithBiometric: (message: string) => Promise<Uint8Array>;
}

/**
 * Use Expo wallet with biometric and secure storage
 */
export function useExpoWallet(options: UseExpoWalletOptions = {}): UseExpoWalletResult {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  
  const { authenticate } = useBiometricAuth();
  const secureStorage = useSecureStorage();
  
  // Restore connection from secure storage
  useEffect(() => {
    const restore = async () => {
      if (options.secureStorage) {
        const savedKey = await secureStorage.get('wallet_public_key');
        if (savedKey) {
          setPublicKey(savedKey);
          setConnected(true);
        }
      }
    };
    
    restore();
  }, [options.secureStorage, secureStorage]);
  
  const connect = useCallback(async (walletName?: string): Promise<string> => {
    setConnecting(true);
    
    try {
      // Authenticate with biometric if enabled
      if (options.biometricAuth) {
        const authResult = await authenticate();
        if (!authResult.success) {
          throw new Error('Biometric authentication failed');
        }
      }
      
      // Connect to wallet (would use deep linking in real implementation)
      // For demo, generate mock key
      const mockKey = Array.from({ length: 44 }, () => 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
          .charAt(Math.floor(Math.random() * 62))
      ).join('');
      
      setPublicKey(mockKey);
      setConnected(true);
      
      // Store in secure storage
      if (options.secureStorage) {
        await secureStorage.set('wallet_public_key', mockKey);
      }
      
      return mockKey;
    } finally {
      setConnecting(false);
    }
  }, [options.biometricAuth, options.secureStorage, authenticate, secureStorage]);
  
  const disconnect = useCallback(async (): Promise<void> => {
    setConnected(false);
    setPublicKey(null);
    
    if (options.secureStorage) {
      await secureStorage.remove('wallet_public_key');
    }
  }, [options.secureStorage, secureStorage]);
  
  const signWithBiometric = useCallback(async (message: string): Promise<Uint8Array> => {
    // Authenticate first
    if (options.biometricAuth) {
      const authResult = await authenticate();
      if (!authResult.success) {
        throw new Error('Biometric authentication required');
      }
    }
    
    // Return mock signature
    const signature = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      signature[i] = Math.floor(Math.random() * 256);
    }
    return signature;
  }, [options.biometricAuth, authenticate]);
  
  return {
    connected,
    connecting,
    publicKey,
    connect,
    disconnect,
    signWithBiometric,
  };
}

// =============================================================================
// EXPO APP PLUGIN HELPER
// =============================================================================

/**
 * Expo config plugin configuration
 */
export interface ExpoPluginConfig {
  /** Enable biometric authentication */
  biometricAuth?: boolean;
  
  /** Enable camera for QR scanning */
  cameraAccess?: boolean;
  
  /** Enable push notifications */
  pushNotifications?: boolean;
  
  /** iOS Face ID usage description */
  faceIdUsageDescription?: string;
  
  /** Camera usage description */
  cameraUsageDescription?: string;
}

/**
 * Default plugin configuration
 */
export const defaultPluginConfig: ExpoPluginConfig = {
  biometricAuth: true,
  cameraAccess: true,
  pushNotifications: true,
  faceIdUsageDescription: 'PRVCSH uses Face ID to secure your wallet',
  cameraUsageDescription: 'PRVCSH uses the camera to scan QR codes',
};
