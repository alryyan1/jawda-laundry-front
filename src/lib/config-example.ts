// src/lib/config-example.ts
// Example usage of configuration variables

import { CONFIG, SCHEMA, HOST, PROJECT_FOLDER, BASE_URL, FULL_URL } from './config';

// Example 1: Using individual variables
console.log('Schema:', SCHEMA); // Output: http
console.log('Host:', HOST); // Output: current device IP (e.g., 192.168.1.100)
console.log('Project Folder:', PROJECT_FOLDER); // Output: jawda-laundry-backend

// Example 2: Using the CONFIG object
console.log('Full CONFIG object:', CONFIG);

// Example 3: Using derived URLs
console.log('API Base URL:', BASE_URL); 
// Output: http://192.168.1.100/laundry/jawda-laundry-backend/public/api

console.log('Full Project URL:', FULL_URL);
// Output: http://192.168.1.100/laundry/jawda-laundry-backend

// Example 4: Using in API calls
const apiCall = async () => {
  const response = await fetch(`${BASE_URL}/orders`);
  return response.json();
};

// Example 5: Using in navigation
const navigateToBackend = () => {
  window.open(FULL_URL, '_blank');
};

// Example 6: Dynamic configuration based on environment
const getApiUrl = () => {
  if (HOST === 'localhost' || HOST === '127.0.0.1') {
    return BASE_URL; // Use local configuration
  }
  return 'https://shai-khadri.com/api'; // Use production URL
};
