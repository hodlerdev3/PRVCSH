/**
 * Lib Index
 * 
 * Barrel exports for lib utilities
 */

// Metadata
export {
  siteConfig,
  defaultMetadata,
  defaultViewport,
  generatePageMetadata,
  generateOrganizationSchema,
  generateWebAppSchema,
  generateSoftwareAppSchema,
} from './metadata';

// Environment
export {
  env,
  getPublicEnv,
  getServerEnv,
  getVercelEnv,
  validateEnv,
  logEnvValidation,
  isProduction,
  isDevelopment,
  isVercel,
  getAppUrl,
  getRpcUrl,
  getAllRpcUrls,
} from './env';
