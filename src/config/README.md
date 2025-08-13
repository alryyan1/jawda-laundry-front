# Configuration System

This directory contains the centralized configuration system for the Jawda Laundry application.

## Files

- `environment.ts` - Core environment variable parsing and type definitions
- `config.ts` - Configuration utilities and constants
- `index.ts` - Main export file for easy importing

## Usage

### Basic Import

```typescript
import { CONFIG, URLS, environment } from '@/config';

// Access configuration values
console.log(CONFIG.API.BASE_URL);
console.log(CONFIG.PROJECT.NAME);
console.log(CONFIG.API.SCHEMA); // 'https'
console.log(CONFIG.API.HOST);   // 'shai-khadri.com'
console.log(CONFIG.API.PORT);   // '443'
```

### URL Building

```typescript
import { URLS } from '@/config';

// API URLs
const apiUrl = URLS.api('/orders'); // https://shai-khadri.com/api/orders
const baseUrl = URLS.base(); // https://shai-khadri.com

// Project URLs
const projectUrl = URLS.project(); // https://shai-khadri.com/laundry

// Common endpoints
const loginUrl = URLS.auth.login();
const orderDetails = URLS.orders.details(123);
const invoiceUrl = URLS.orders.invoice(123);
```

### Environment Variables

The system automatically parses these environment variables:

```bash
# API Configuration
VITE_API_BASE_URL=https://shai-khadri.com/api

# API URL Components (auto-parsed from VITE_API_BASE_URL)
VITE_API_SCHEMA=https
VITE_API_HOST=shai-khadri.com
VITE_API_PORT=443

# Project Configuration
VITE_APP_NAME="Jawda Laundry"
VITE_APP_VERSION=1.0.0
VITE_PROJECT_FOLDER=/laundry

# Real-time Configuration
VITE_PUSHER_APP_KEY=
VITE_PUSHER_APP_CLUSTER=
VITE_PUSHER_HOST=
VITE_PUSHER_PORT=
VITE_PUSHER_SCHEME=

# Development Configuration
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
```

### Environment-Specific Configuration

```typescript
import { getCurrentEnvConfig, ENV_CONFIG } from '@/config';

// Get current environment config
const currentConfig = getCurrentEnvConfig();

// Access specific environment configs
const devConfig = ENV_CONFIG.development;
const prodConfig = ENV_CONFIG.production;
```

### Configuration Validation

```typescript
import { validateConfig } from '@/config';

// Validate configuration on app startup
if (!validateConfig()) {
  console.error('Invalid configuration');
  // Handle invalid configuration
}
```

### Feature Flags

```typescript
import { CONFIG } from '@/config';

// Check if features are enabled
if (CONFIG.FEATURES.REALTIME_UPDATES) {
  // Enable real-time features
}

if (CONFIG.FEATURES.DEBUG_MODE) {
  // Enable debug logging
}
```

## Migration from Direct Environment Variable Usage

### Before (Old Way)
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
```

### After (New Way)
```typescript
import { CONFIG, URLS } from '@/config';

const apiUrl = CONFIG.API.BASE_URL;
const baseUrl = URLS.base();
```

## Benefits

1. **Type Safety** - All configuration values are typed
2. **Centralized** - All configuration in one place
3. **Validation** - Built-in configuration validation
4. **URL Building** - Helper functions for common URL patterns
5. **Environment Awareness** - Automatic environment detection
6. **Feature Flags** - Easy feature toggling
7. **Maintainability** - Easy to update and extend

## Examples

### API Client Configuration
```typescript
import { CONFIG } from '@/config';

const apiClient = axios.create({
  baseURL: CONFIG.API.BASE_URL,
  timeout: CONFIG.API.TIMEOUT,
});
```

### Real-time Configuration
```typescript
import { CONFIG } from '@/config';

if (CONFIG.REALTIME.ENABLED) {
  const pusher = new Pusher(CONFIG.REALTIME.PUSHER.appKey, {
    cluster: CONFIG.REALTIME.PUSHER.appCluster,
  });
}
```

### Project Information
```typescript
import { CONFIG } from '@/config';

console.log(`${CONFIG.PROJECT.NAME} v${CONFIG.PROJECT.VERSION}`);
console.log(`Running at: ${CONFIG.PROJECT.ROOT_URL}`);
```
