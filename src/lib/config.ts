// src/lib/config.ts

// Configuration variables for the application
export const CONFIG = {
  // Schema - HTTP protocol
  SCHEMA: 'https',
  
  // Host - Dynamic based on current device IP
  // HOST: 'intaj-starstechnology.com',
  HOST:import.meta.env.VITE_HOST ,
  
  // Project folder - Backend directory name
  // PROJECT_FOLDER: 'laundry-backend',
  PROJECT_FOLDER: 'jawda-laundry-backend',
  // PROJECT_FOLDER: 'sekka_shawrma_backend',
  
  // Derived values
  get BASE_URL() {
    return `${this.SCHEMA}://${this.HOST}/${this.PROJECT_FOLDER}/public/api`;
    // return `${this.SCHEMA}://${this.HOST}/${this.PROJECT_FOLDER}/public/api`;
  },
  
  get FULL_URL() {
    return `${this.SCHEMA}://${this.HOST}/${this.PROJECT_FOLDER}`;
    // return `${this.SCHEMA}://${this.HOST}/${this.PROJECT_FOLDER}`;
  }
} as const;

// Export individual values for convenience
export const SCHEMA = CONFIG.SCHEMA;
export const HOST = CONFIG.HOST;
export const PROJECT_FOLDER = CONFIG.PROJECT_FOLDER;
export const BASE_URL = CONFIG.BASE_URL;
export const FULL_URL = CONFIG.FULL_URL;
