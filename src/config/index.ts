// Configuration Module Exports
// This file exports all configuration-related modules for easy importing

// Main configuration exports
export { default as CONFIG } from './config';
export { environment, configHelpers } from './environment';
export { 
  CONFIG as Config,
  URLS,
  ENV_CONFIG,
  getCurrentEnvConfig,
  validateConfig 
} from './config';

// Type exports
export type { EnvironmentConfig } from './environment';

// Re-export commonly used configuration
import { CONFIG, URLS } from './config';
export const {
  API,
  PROJECT,
  REALTIME,
  DEV,
  FEATURES
} = CONFIG;

// Re-export URL builders
export const {
  api,
  base,
  endpoint,
  project,
  projectPath,
  auth,
  orders,
  reports
} = URLS;

// Default export for backward compatibility
export default CONFIG;
