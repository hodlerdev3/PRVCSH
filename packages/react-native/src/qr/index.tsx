/**
 * @fileoverview QR Code Scanning Module
 * @description Address and payment QR code scanning for PRVCSH.
 * 
 * @module @prvcsh/react-native/qr
 * @version 0.1.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  type ViewStyle,
  type StyleProp,
} from 'react-native';

// =============================================================================
// TYPES
// =============================================================================

/**
 * QR code type
 */
export type QRCodeType = 
  | 'solana-pay'        // Solana Pay URL (solana:...)
  | 'solana-address'    // Plain Solana address
  | 'transaction-request' // Solana Pay transaction request
  | 'prvcsh'      // PRVCSH specific URL
  | 'unknown';          // Unknown format

/**
 * Parsed Solana Pay data
 */
export interface SolanaPayData {
  /** Recipient address */
  recipient: string;
  
  /** Amount in tokens (decimal) */
  amount?: number;
  
  /** SPL token mint address */
  splToken?: string;
  
  /** Reference keys for tracking */
  references?: string[];
  
  /** Label for display */
  label?: string;
  
  /** Message for display */
  message?: string;
  
  /** On-chain memo */
  memo?: string;
}

/**
 * Parsed transaction request
 */
export interface TransactionRequestData {
  /** Link to transaction endpoint */
  link: string;
  
  /** Label for display */
  label?: string;
  
  /** Icon URL */
  icon?: string;
}

/**
 * PRVCSH specific data
 */
export interface PRVCSHData {
  /** Action type */
  action: 'deposit' | 'withdraw' | 'transfer' | 'pay';
  
  /** Recipient or shielded address */
  recipient?: string;
  
  /** Amount */
  amount?: number;
  
  /** Token */
  token?: string;
  
  /** Reference ID */
  reference?: string;
  
  /** Merchant info */
  merchant?: {
    name?: string;
    logo?: string;
  };
}

/**
 * Scan result
 */
export interface QRScanResult {
  /** Raw scanned data */
  raw: string;
  
  /** Detected QR type */
  type: QRCodeType;
  
  /** Parsed Solana Pay data */
  solanaPay?: SolanaPayData;
  
  /** Parsed transaction request */
  transactionRequest?: TransactionRequestData;
  
  /** Parsed PRVCSH data */
  privacyCash?: PRVCSHData;
  
  /** Solana address if type is solana-address */
  address?: string;
  
  /** Whether data is valid */
  isValid: boolean;
  
  /** Validation error message */
  error?: string;
}

/**
 * Scanner configuration
 */
export interface QRScannerConfig {
  /** Enable torch/flashlight */
  enableTorch?: boolean;
  
  /** Front or back camera */
  cameraType?: 'front' | 'back';
  
  /** Scan area size (percentage of screen) */
  scanAreaSize?: number;
  
  /** Enable vibration on scan */
  vibrate?: boolean;
  
  /** Enable sound on scan */
  playSound?: boolean;
  
  /** Continuous scanning or single scan */
  continuous?: boolean;
  
  /** Scan interval in ms (for continuous) */
  scanInterval?: number;
}

/**
 * Scanner component props
 */
export interface QRScannerProps {
  /** Callback when QR code is scanned */
  onScan: (result: QRScanResult) => void;
  
  /** Callback on scan error */
  onError?: (error: Error) => void;
  
  /** Scanner configuration */
  config?: QRScannerConfig;
  
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  
  /** Show overlay with scan area */
  showOverlay?: boolean;
  
  /** Overlay color */
  overlayColor?: string;
  
  /** Scan area border color */
  borderColor?: string;
  
  /** Children to render on top of camera */
  children?: React.ReactNode;
}

// =============================================================================
// QR PARSER
// =============================================================================

/**
 * Parse scanned QR data
 */
export function parseQRCode(data: string): QRScanResult {
  const trimmed = data.trim();
  
  // Try Solana Pay URL
  if (trimmed.startsWith('solana:')) {
    return parseSolanaPayUrl(trimmed);
  }
  
  // Try PRVCSH URL
  if (trimmed.startsWith('prvcsh:')) {
    return parsePRVCSHUrl(trimmed);
  }
  
  // Try plain Solana address
  if (isValidSolanaAddress(trimmed)) {
    return {
      raw: data,
      type: 'solana-address',
      address: trimmed,
      isValid: true,
    };
  }
  
  // Unknown format
  return {
    raw: data,
    type: 'unknown',
    isValid: false,
    error: 'Unrecognized QR code format',
  };
}

/**
 * Parse Solana Pay URL
 */
function parseSolanaPayUrl(url: string): QRScanResult {
  try {
    // Check for transaction request
    if (url.startsWith('solana:https://') || url.startsWith('solana:http://')) {
      return parseTransactionRequest(url);
    }
    
    const parsed = new URL(url);
    const recipient = parsed.pathname;
    
    if (!isValidSolanaAddress(recipient)) {
      return {
        raw: url,
        type: 'solana-pay',
        isValid: false,
        error: 'Invalid recipient address',
      };
    }
    
    const params = parsed.searchParams;
    
    const solanaPay: SolanaPayData = {
      recipient,
      amount: params.has('amount') ? parseFloat(params.get('amount')!) : undefined,
      splToken: params.get('spl-token') ?? undefined,
      references: params.getAll('reference').filter(Boolean),
      label: params.get('label') ?? undefined,
      message: params.get('message') ?? undefined,
      memo: params.get('memo') ?? undefined,
    };
    
    return {
      raw: url,
      type: 'solana-pay',
      solanaPay,
      isValid: true,
    };
  } catch {
    return {
      raw: url,
      type: 'solana-pay',
      isValid: false,
      error: 'Failed to parse Solana Pay URL',
    };
  }
}

/**
 * Parse Solana Pay transaction request
 */
function parseTransactionRequest(url: string): QRScanResult {
  try {
    // Remove solana: prefix to get the actual URL
    const link = url.replace('solana:', '');
    
    const parsed = new URL(link);
    const params = parsed.searchParams;
    
    const transactionRequest: TransactionRequestData = {
      link,
      label: params.get('label') ?? undefined,
      icon: params.get('icon') ?? undefined,
    };
    
    return {
      raw: url,
      type: 'transaction-request',
      transactionRequest,
      isValid: true,
    };
  } catch {
    return {
      raw: url,
      type: 'transaction-request',
      isValid: false,
      error: 'Failed to parse transaction request',
    };
  }
}

/**
 * Parse PRVCSH URL
 */
function parsePRVCSHUrl(url: string): QRScanResult {
  try {
    const parsed = new URL(url);
    const action = parsed.pathname as PRVCSHData['action'];
    const params = parsed.searchParams;
    
    const validActions = ['deposit', 'withdraw', 'transfer', 'pay'];
    if (!validActions.includes(action)) {
      return {
        raw: url,
        type: 'prvcsh',
        isValid: false,
        error: 'Invalid action type',
      };
    }
    
    const privacyCash: PRVCSHData = {
      action,
      recipient: params.get('to') ?? undefined,
      amount: params.has('amount') ? parseFloat(params.get('amount')!) : undefined,
      token: params.get('token') ?? undefined,
      reference: params.get('ref') ?? undefined,
      merchant: params.get('merchant') ? {
        name: params.get('merchant')!,
        logo: params.get('logo') ?? undefined,
      } : undefined,
    };
    
    return {
      raw: url,
      type: 'prvcsh',
      privacyCash,
      isValid: true,
    };
  } catch {
    return {
      raw: url,
      type: 'prvcsh',
      isValid: false,
      error: 'Failed to parse PRVCSH URL',
    };
  }
}

/**
 * Validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  // Base58 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

// =============================================================================
// QR GENERATOR
// =============================================================================

/**
 * Generate Solana Pay URL
 */
export function createSolanaPayUrl(data: SolanaPayData): string {
  const url = new URL(`solana:${data.recipient}`);
  
  if (data.amount !== undefined) {
    url.searchParams.set('amount', data.amount.toString());
  }
  
  if (data.splToken) {
    url.searchParams.set('spl-token', data.splToken);
  }
  
  if (data.references) {
    for (const ref of data.references) {
      url.searchParams.append('reference', ref);
    }
  }
  
  if (data.label) {
    url.searchParams.set('label', data.label);
  }
  
  if (data.message) {
    url.searchParams.set('message', data.message);
  }
  
  if (data.memo) {
    url.searchParams.set('memo', data.memo);
  }
  
  return url.toString();
}

/**
 * Generate PRVCSH URL
 */
export function createPRVCSHUrl(data: PRVCSHData): string {
  const url = new URL(`prvcsh:${data.action}`);
  
  if (data.recipient) {
    url.searchParams.set('to', data.recipient);
  }
  
  if (data.amount !== undefined) {
    url.searchParams.set('amount', data.amount.toString());
  }
  
  if (data.token) {
    url.searchParams.set('token', data.token);
  }
  
  if (data.reference) {
    url.searchParams.set('ref', data.reference);
  }
  
  if (data.merchant?.name) {
    url.searchParams.set('merchant', data.merchant.name);
    if (data.merchant.logo) {
      url.searchParams.set('logo', data.merchant.logo);
    }
  }
  
  return url.toString();
}

// =============================================================================
// SCANNER COMPONENT
// =============================================================================

const { width: screenWidth } = Dimensions.get('window');

/**
 * QR Scanner component
 * Note: Requires camera permissions and native camera module
 */
export function QRScanner({
  onScan,
  onError,
  config = {},
  style,
  showOverlay = true,
  overlayColor = 'rgba(0, 0, 0, 0.6)',
  borderColor = '#00FF00',
  children,
}: QRScannerProps): React.ReactElement {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  
  const {
    enableTorch = true,
    scanAreaSize = 0.7,
    vibrate = true,
  } = config;
  
  const scanAreaWidth = screenWidth * scanAreaSize;
  
  // Request camera permission
  useEffect(() => {
    const requestPermission = async () => {
      try {
        // In real implementation, use:
        // Expo: Camera.requestCameraPermissionsAsync()
        // RN: request(PERMISSIONS.IOS.CAMERA)
        
        setHasPermission(false); // Mock - no permission in placeholder
      } catch (error) {
        setHasPermission(false);
        onError?.(error instanceof Error ? error : new Error('Permission request failed'));
      }
    };
    
    requestPermission();
  }, [onError]);
  
  // Animate scan line
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    
    animation.start();
    
    return () => animation.stop();
  }, [scanLineAnim]);
  
  // Handle scanned data
  const handleBarCodeScanned = useCallback((data: string) => {
    if (vibrate) {
      // Vibrate on scan
      // In real implementation: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
    
    const result = parseQRCode(data);
    onScan(result);
  }, [onScan, vibrate]);
  
  // Toggle torch
  const toggleTorch = useCallback(() => {
    setTorchOn((prev) => !prev);
  }, []);
  
  // Render permission states
  if (hasPermission === null) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.text}>📷</Text>
        <Text style={styles.text}>Camera permission required</Text>
        <Text style={styles.subtext}>
          Please enable camera access in your device settings to scan QR codes.
        </Text>
      </View>
    );
  }
  
  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, scanAreaWidth - 4],
  });
  
  return (
    <View style={[styles.container, style]}>
      {/* Camera preview would go here */}
      <View style={styles.cameraPlaceholder}>
        <Text style={styles.placeholderText}>Camera Preview</Text>
        <Text style={styles.placeholderSubtext}>
          (Camera module not available in this environment)
        </Text>
      </View>
      
      {/* Overlay */}
      {showOverlay && (
        <>
          {/* Top overlay */}
          <View style={[styles.overlay, styles.overlayTop, { backgroundColor: overlayColor }]} />
          
          {/* Bottom overlay */}
          <View style={[styles.overlay, styles.overlayBottom, { backgroundColor: overlayColor }]} />
          
          {/* Left overlay */}
          <View
            style={[
              styles.overlay,
              styles.overlaySide,
              { backgroundColor: overlayColor, left: 0 },
            ]}
          />
          
          {/* Right overlay */}
          <View
            style={[
              styles.overlay,
              styles.overlaySide,
              { backgroundColor: overlayColor, right: 0 },
            ]}
          />
          
          {/* Scan area border */}
          <View
            style={[
              styles.scanArea,
              {
                width: scanAreaWidth,
                height: scanAreaWidth,
                borderColor,
              },
            ]}
          >
            {/* Corner decorations */}
            <View style={[styles.corner, styles.cornerTL, { borderColor }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor }]} />
            
            {/* Scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  backgroundColor: borderColor,
                  transform: [{ translateY: scanLineTranslate }],
                },
              ]}
            />
          </View>
        </>
      )}
      
      {/* Controls */}
      {enableTorch && (
        <TouchableOpacity
          style={[styles.torchButton, torchOn && styles.torchButtonActive]}
          onPress={toggleTorch}
        >
          <Text style={styles.torchIcon}>{torchOn ? '🔦' : '💡'}</Text>
        </TouchableOpacity>
      )}
      
      {/* Custom children */}
      {children}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    color: '#AAA',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 20,
  },
  placeholderSubtext: {
    color: '#444',
    fontSize: 12,
    marginTop: 8,
  },
  overlay: {
    position: 'absolute',
  },
  overlayTop: {
    top: 0,
    left: 0,
    right: 0,
    height: '20%',
  },
  overlayBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    height: '20%',
  },
  overlaySide: {
    top: '20%',
    width: '15%',
    height: '60%',
  },
  scanArea: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 12,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 4,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    borderRadius: 1,
  },
  torchButton: {
    position: 'absolute',
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  torchButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  torchIcon: {
    fontSize: 24,
  },
});
