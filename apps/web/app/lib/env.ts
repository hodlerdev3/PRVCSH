/**
 * Environment Configuration & Validation
 * 
 * Centralized environment variable access with type safety
 * and runtime validation.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';

interface PublicEnv {
  // App
  appUrl: string;
  
  // Solana
  solanaNetwork: SolanaNetwork;
  solanaRpcUrl: string;
  solanaRpcFallbackUrls: string[];
  
  // Features
  relayerUrl: string | null;
  relayerEnabled: boolean;
  
  // Analytics
  posthogKey: string | null;
  posthogHost: string | null;
  sentryDsn: string | null;
  
  // Debug
  debug: boolean;
  mockMode: boolean;
}

interface ServerEnv {
  // Server-side RPC
  solanaRpcUrl: string;
  
  // Sentry
  sentryAuthToken: string | null;
  sentryOrg: string | null;
  sentryProject: string | null;
}

interface VercelEnv {
  env: 'production' | 'preview' | 'development' | null;
  url: string | null;
  gitCommitSha: string | null;
  gitCommitMessage: string | null;
  gitRepoSlug: string | null;
}

// ============================================================================
// ENVIRONMENT GETTERS
// ============================================================================

/**
 * Get public environment variables (safe for client-side)
 */
export function getPublicEnv(): PublicEnv {
  const fallbackUrls = process.env.NEXT_PUBLIC_SOLANA_RPC_FALLBACK_URLS || '';
  
  return {
    // App
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    
    // Solana
    solanaNetwork: (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet') as SolanaNetwork,
    solanaRpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    solanaRpcFallbackUrls: fallbackUrls ? fallbackUrls.split(',').map(url => url.trim()) : [],
    
    // Features
    relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL || null,
    relayerEnabled: process.env.NEXT_PUBLIC_RELAYER_ENABLED === 'true',
    
    // Analytics
    posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || null,
    posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST || null,
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || null,
    
    // Debug
    debug: process.env.NEXT_PUBLIC_DEBUG === 'true',
    mockMode: process.env.NEXT_PUBLIC_MOCK_MODE === 'true',
  };
}

/**
 * Get server-side environment variables (DO NOT expose to client)
 */
export function getServerEnv(): ServerEnv {
  return {
    solanaRpcUrl: process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    sentryAuthToken: process.env.SENTRY_AUTH_TOKEN || null,
    sentryOrg: process.env.SENTRY_ORG || null,
    sentryProject: process.env.SENTRY_PROJECT || null,
  };
}

/**
 * Get Vercel-specific environment variables
 */
export function getVercelEnv(): VercelEnv {
  const vercelEnv = process.env.VERCEL_ENV as VercelEnv['env'] | undefined;
  
  return {
    env: vercelEnv || null,
    url: process.env.VERCEL_URL || null,
    gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    gitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || null,
    gitRepoSlug: process.env.VERCEL_GIT_REPO_SLUG || null,
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate required environment variables
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const publicEnv = getPublicEnv();
  
  // Required checks
  if (!publicEnv.solanaRpcUrl) {
    errors.push('NEXT_PUBLIC_SOLANA_RPC_URL is required');
  }
  
  if (!publicEnv.solanaNetwork) {
    errors.push('NEXT_PUBLIC_SOLANA_NETWORK is required');
  }
  
  // Validate network value
  const validNetworks: SolanaNetwork[] = ['mainnet-beta', 'devnet', 'testnet', 'localnet'];
  if (!validNetworks.includes(publicEnv.solanaNetwork)) {
    errors.push(`NEXT_PUBLIC_SOLANA_NETWORK must be one of: ${validNetworks.join(', ')}`);
  }
  
  // Warnings for production
  const vercelEnv = getVercelEnv();
  if (vercelEnv.env === 'production') {
    if (publicEnv.solanaRpcUrl.includes('api.devnet.solana.com')) {
      warnings.push('Using public RPC in production - consider a premium provider');
    }
    
    if (!publicEnv.sentryDsn) {
      warnings.push('NEXT_PUBLIC_SENTRY_DSN not set - error tracking disabled');
    }
    
    if (publicEnv.debug) {
      warnings.push('NEXT_PUBLIC_DEBUG is enabled in production');
    }
    
    if (publicEnv.mockMode) {
      errors.push('NEXT_PUBLIC_MOCK_MODE should not be enabled in production');
    }
  }
  
  // Warning for missing fallback
  if (publicEnv.solanaRpcFallbackUrls.length === 0) {
    warnings.push('No fallback RPC URLs configured');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log environment validation results
 */
export function logEnvValidation(): void {
  const result = validateEnv();
  
  if (result.errors.length > 0) {
    console.error('❌ Environment validation failed:');
    result.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️ Environment warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  if (result.valid && result.warnings.length === 0) {
    console.log('✅ Environment validation passed');
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || getVercelEnv().env === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running on Vercel
 */
export function isVercel(): boolean {
  return !!process.env.VERCEL;
}

/**
 * Get the current app URL (handles Vercel preview URLs)
 */
export function getAppUrl(): string {
  const vercelEnv = getVercelEnv();
  
  // Use Vercel URL for previews
  if (vercelEnv.url && vercelEnv.env === 'preview') {
    return `https://${vercelEnv.url}`;
  }
  
  return getPublicEnv().appUrl;
}

/**
 * Get RPC URL with fallback support
 */
export function getRpcUrl(): string {
  const publicEnv = getPublicEnv();
  return publicEnv.solanaRpcUrl;
}

/**
 * Get all RPC URLs including fallbacks
 */
export function getAllRpcUrls(): string[] {
  const publicEnv = getPublicEnv();
  return [publicEnv.solanaRpcUrl, ...publicEnv.solanaRpcFallbackUrls];
}

// ============================================================================
// EXPORTS
// ============================================================================

export const env = {
  public: getPublicEnv,
  server: getServerEnv,
  vercel: getVercelEnv,
  validate: validateEnv,
  log: logEnvValidation,
  isProduction,
  isDevelopment,
  isVercel,
  getAppUrl,
  getRpcUrl,
  getAllRpcUrls,
};

export default env;
