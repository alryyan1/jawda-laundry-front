// Environment Configuration
// This file centralizes all environment variables and provides type-safe access

export interface EnvironmentConfig {
  // API Configuration
  apiBaseUrl: string;
  apiSchema: string;
  apiHost: string;
  apiPort: string;
  
  // Project Configuration
  projectName: string;
  projectVersion: string;
  projectFolder: string;
  
  // Real-time Configuration
  pusher: {
    appKey: string;
    appCluster: string;
    host: string;
    port: string;
    scheme: string;
  };
  
  // Development Configuration
  isDevelopment: boolean;
  isProduction: boolean;
}

// Parse URL components from API base URL
const parseApiUrl = (apiBaseUrl: string) => {
  try {
    const url = new URL(apiBaseUrl);
    return {
      schema: url.protocol.replace(':', ''),
      host: url.hostname,
      port: url.port || (url.protocol === 'https:' ? '443' : '80'),
    };
  } catch (error) {
    console.warn('Invalid API base URL, using defaults');
    return {
      schema: 'https',
      host: 'localhost',
      port: '8000',
    };
  }
};

// Get environment variables with fallbacks
const getEnvVar = (key: string, fallback: string = ''): string => {
  return import.meta.env[key] || fallback;
};

// Parse API URL components
const apiBaseUrl = getEnvVar('VITE_API_BASE_URL', 'http://localhost:3000');
const apiComponents = parseApiUrl(apiBaseUrl);

// Environment configuration object
export const environment: EnvironmentConfig = {
  // API Configuration
  apiBaseUrl,
  apiSchema: apiComponents.schema,
  apiHost: apiComponents.host,
  apiPort: apiComponents.port,
  
  // Project Configuration
  projectName: getEnvVar('VITE_APP_NAME', 'Jawda Laundry'),
  projectVersion: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  projectFolder: getEnvVar('VITE_PROJECT_FOLDER', '/laundry-backend'),
  
  // Real-time Configuration
  pusher: {
    appKey: getEnvVar('VITE_PUSHER_APP_KEY', ''),
    appCluster: getEnvVar('VITE_PUSHER_APP_CLUSTER', ''),
    host: getEnvVar('VITE_PUSHER_HOST', ''),
    port: getEnvVar('VITE_PUSHER_PORT', ''),
    scheme: getEnvVar('VITE_PUSHER_SCHEME', ''),
  },
  
  // Environment flags
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Helper functions for common operations
export const configHelpers = {
  // Get full API URL
  getApiUrl: (endpoint: string = ''): string => {
    return `${environment.apiBaseUrl}${endpoint}`;
  },
  
  // Get base URL without /api suffix
  getBaseUrl: (): string => {
    return environment.apiBaseUrl.replace('/api', '');
  },
  
  // Check if real-time features are enabled
  isRealtimeEnabled: (): boolean => {
    return !!(environment.pusher.appKey && environment.pusher.appCluster);
  },
  
  // Get project root URL
  getProjectUrl: (): string => {
    return `${environment.apiSchema}://${environment.apiHost}${environment.projectFolder}`;
  },
  
  // Get API endpoint URL
  getEndpointUrl: (endpoint: string): string => {
    return `${environment.apiBaseUrl}${endpoint}`;
  },
};

// Export default configuration
export default environment;
