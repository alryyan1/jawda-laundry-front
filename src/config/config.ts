// Configuration Utilities
// Provides easy access to environment variables and common configuration patterns

import { environment, configHelpers } from './environment';

// Export the main environment configuration
export { environment, configHelpers };

// Configuration constants
export const CONFIG = {
  // API Configuration
  API: {
    BASE_URL: environment.apiBaseUrl,
    SCHEMA: environment.apiSchema,
    HOST: environment.apiHost,
    PORT: environment.apiPort,
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
  },
  
  // Project Configuration
  PROJECT: {
    NAME: environment.projectName,
    VERSION: environment.projectVersion,
    FOLDER: environment.projectFolder,
    ROOT_URL: configHelpers.getProjectUrl(),
  },
  
  // Real-time Configuration
  REALTIME: {
    ENABLED: configHelpers.isRealtimeEnabled(),
    PUSHER: environment.pusher,
  },
  
  // Development Configuration
  DEV: {
    IS_DEVELOPMENT: environment.isDevelopment,
    IS_PRODUCTION: environment.isProduction,
    DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
    LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
  },
  
  // Feature Flags
  FEATURES: {
    REALTIME_UPDATES: configHelpers.isRealtimeEnabled(),
    DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
    EXPORT_FEATURES: true,
    PAYMENT_FEATURES: true,
  },
} as const;

// URL builders
export const URLS = {
  // API URLs
  api: (endpoint: string = '') => configHelpers.getApiUrl(endpoint),
  base: () => configHelpers.getBaseUrl(),
  endpoint: (endpoint: string) => configHelpers.getEndpointUrl(endpoint),
  
  // Project URLs
  project: () => configHelpers.getProjectUrl(),
  projectPath: (path: string = '') => `${CONFIG.PROJECT.FOLDER}${path}`,
  
  // Common endpoints
  auth: {
    login: () => URLS.api('/auth/login'),
    logout: () => URLS.api('/auth/logout'),
    refresh: () => URLS.api('/auth/refresh'),
  },
  
  orders: {
    list: () => URLS.api('/orders'),
    create: () => URLS.api('/orders'),
    details: (id: number) => URLS.api(`/orders/${id}`),
    update: (id: number) => URLS.api(`/orders/${id}`),
    delete: (id: number) => URLS.api(`/orders/${id}`),
    invoice: (id: number) => URLS.base() + `/orders/${id}/pos-invoice-pdf`,
  },
  
  reports: {
    orders: () => URLS.api('/reports/orders'),
    ordersPdf: () => URLS.api('/reports/orders/pdf'),
    ordersExcel: () => URLS.api('/reports/orders/excel'),
    ordersListPdf: () => URLS.api('/reports/orders/list-pdf'),
  },
} as const;

// Environment-specific configurations
export const ENV_CONFIG = {
  development: {
    apiBaseUrl: 'http://localhost:8000/api',
    debugMode: true,
    logLevel: 'debug',
  },
  
  production: {
    apiBaseUrl: environment.apiBaseUrl,
    debugMode: false,
    logLevel: 'error',
  },
  
  test: {
    apiBaseUrl: 'http://localhost:8000/api',
    debugMode: true,
    logLevel: 'debug',
  },
} as const;

// Get current environment configuration
export const getCurrentEnvConfig = () => {
  if (environment.isDevelopment) return ENV_CONFIG.development;
  if (environment.isProduction) return ENV_CONFIG.production;
  return ENV_CONFIG.development; // Default to development
};

// Configuration validation
export const validateConfig = () => {
  const errors: string[] = [];
  
  if (!CONFIG.API.BASE_URL) {
    errors.push('VITE_API_BASE_URL is required');
  }
  
  if (!CONFIG.PROJECT.NAME) {
    errors.push('VITE_APP_NAME is required');
  }
  
  if (errors.length > 0) {
    console.error('Configuration validation failed:', errors);
    return false;
  }
  
  return true;
};

// Export default configuration
export default CONFIG;
