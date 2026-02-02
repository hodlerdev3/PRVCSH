/**
 * @fileoverview Expo Config Plugin for PRVCSH
 * @description Configures native iOS and Android projects for PRVCSH SDK.
 * 
 * @module expo-prvcsh/plugin
 * @version 0.1.0
 */

import type { ConfigPlugin, ExportedConfig } from 'expo/config-plugins';

/**
 * Plugin configuration options
 */
export interface PRVCSHPluginOptions {
  /** Enable biometric authentication */
  biometricAuth?: boolean;
  
  /** Enable camera for QR scanning */
  cameraAccess?: boolean;
  
  /** Enable push notifications */
  pushNotifications?: boolean;
  
  /** iOS Face ID usage description */
  faceIdUsageDescription?: string;
  
  /** iOS Camera usage description */
  cameraUsageDescription?: string;
  
  /** Android biometric prompt title */
  androidBiometricTitle?: string;
}

/**
 * Default options
 */
const defaultOptions: Required<PRVCSHPluginOptions> = {
  biometricAuth: true,
  cameraAccess: true,
  pushNotifications: true,
  faceIdUsageDescription: 'PRVCSH uses Face ID to secure your wallet transactions',
  cameraUsageDescription: 'PRVCSH uses the camera to scan payment QR codes',
  androidBiometricTitle: 'PRVCSH Authentication',
};

/**
 * Modify iOS Info.plist
 */
function withIosInfoPlist(
  config: ExportedConfig,
  options: Required<PRVCSHPluginOptions>
): ExportedConfig {
  if (!config.ios) {
    config.ios = {};
  }
  
  if (!config.ios.infoPlist) {
    config.ios.infoPlist = {};
  }
  
  // Add Face ID usage description
  if (options.biometricAuth) {
    config.ios.infoPlist.NSFaceIDUsageDescription = options.faceIdUsageDescription;
  }
  
  // Add Camera usage description
  if (options.cameraAccess) {
    config.ios.infoPlist.NSCameraUsageDescription = options.cameraUsageDescription;
  }
  
  // Add URL scheme for deep linking
  if (!config.ios.infoPlist.CFBundleURLTypes) {
    config.ios.infoPlist.CFBundleURLTypes = [];
  }
  
  // Check if prvcsh scheme already exists
  const hasPRVCSHScheme = config.ios.infoPlist.CFBundleURLTypes.some(
    (urlType: { CFBundleURLSchemes?: string[] }) =>
      urlType.CFBundleURLSchemes?.includes('prvcsh')
  );
  
  if (!hasPRVCSHScheme) {
    config.ios.infoPlist.CFBundleURLTypes.push({
      CFBundleURLName: 'prvcsh',
      CFBundleURLSchemes: ['prvcsh'],
    });
  }
  
  return config;
}

/**
 * Modify Android configuration
 */
function withAndroidConfig(
  config: ExportedConfig,
  options: Required<PRVCSHPluginOptions>
): ExportedConfig {
  if (!config.android) {
    config.android = {};
  }
  
  // Add permissions
  if (!config.android.permissions) {
    config.android.permissions = [];
  }
  
  const permissions = config.android.permissions as string[];
  
  if (options.biometricAuth) {
    if (!permissions.includes('android.permission.USE_BIOMETRIC')) {
      permissions.push('android.permission.USE_BIOMETRIC');
    }
    if (!permissions.includes('android.permission.USE_FINGERPRINT')) {
      permissions.push('android.permission.USE_FINGERPRINT');
    }
  }
  
  if (options.cameraAccess) {
    if (!permissions.includes('android.permission.CAMERA')) {
      permissions.push('android.permission.CAMERA');
    }
  }
  
  if (options.pushNotifications) {
    if (!permissions.includes('android.permission.RECEIVE_BOOT_COMPLETED')) {
      permissions.push('android.permission.RECEIVE_BOOT_COMPLETED');
    }
    if (!permissions.includes('android.permission.VIBRATE')) {
      permissions.push('android.permission.VIBRATE');
    }
  }
  
  // Add intent filter for deep linking
  if (!config.android.intentFilters) {
    config.android.intentFilters = [];
  }
  
  const hasPRVCSHFilter = config.android.intentFilters.some(
    (filter: { data?: Array<{ scheme?: string }> }) =>
      filter.data?.some(d => d.scheme === 'prvcsh')
  );
  
  if (!hasPRVCSHFilter) {
    config.android.intentFilters.push({
      action: 'VIEW',
      autoVerify: true,
      data: [
        {
          scheme: 'prvcsh',
        },
      ],
      category: ['BROWSABLE', 'DEFAULT'],
    });
  }
  
  return config;
}

/**
 * PRVCSH Expo Config Plugin
 * 
 * Automatically configures:
 * - iOS: Face ID usage, Camera usage, URL schemes
 * - Android: Biometric permissions, Camera permission, Intent filters
 * 
 * @example
 * // app.config.js
 * module.exports = {
 *   expo: {
 *     plugins: [
 *       ['expo-prvcsh/plugin', {
 *         biometricAuth: true,
 *         cameraAccess: true,
 *       }]
 *     ]
 *   }
 * };
 */
const withPRVCSH: ConfigPlugin<PRVCSHPluginOptions | undefined> = (
  config,
  userOptions
) => {
  const options = { ...defaultOptions, ...userOptions };
  
  // Apply iOS modifications
  config = withIosInfoPlist(config, options);
  
  // Apply Android modifications
  config = withAndroidConfig(config, options);
  
  return config;
};

export default withPRVCSH;

/**
 * Named export for the plugin
 */
export { withPRVCSH };
