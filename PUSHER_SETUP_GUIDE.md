# Pusher Setup Guide for Hostinger Production

## Current Issue
Your POS system is trying to connect to Pusher for real-time updates, but the connection is timing out because Pusher is not properly configured on your Hostinger production environment.

## Quick Fix (Disable Real-time Updates)
If you want to disable real-time updates temporarily:

1. Create a `.env` file in your frontend root directory with:
```env
VITE_API_BASE_URL=https://shai-khadri.com/api
VITE_PUSHER_APP_KEY=
VITE_PUSHER_APP_CLUSTER=
VITE_PUSHER_HOST=
VITE_PUSHER_PORT=
VITE_PUSHER_SCHEME=
```

2. Leave all Pusher variables empty - this will disable real-time updates and prevent the long loading times.

## Full Pusher Setup (Recommended)

### Step 1: Create Pusher Account
1. Go to [pusher.com](https://pusher.com)
2. Sign up for a free account
3. Create a new Channels app
4. Note down your app credentials

### Step 2: Configure Frontend Environment
Create a `.env` file in your frontend root directory:

```env
VITE_API_BASE_URL=https://shai-khadri.com/api
VITE_PUSHER_APP_KEY=your_pusher_app_key_here
VITE_PUSHER_APP_CLUSTER=your_cluster_here
VITE_PUSHER_HOST=
VITE_PUSHER_PORT=443
VITE_PUSHER_SCHEME=https
```

### Step 3: Configure Backend Environment
In your Laravel backend `.env` file:

```env
BROADCAST_DRIVER=pusher
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=your_cluster
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_ENCRYPTED=true
```

### Step 4: Deploy Changes
1. Upload the updated frontend files to Hostinger
2. Upload the updated backend `.env` file
3. Clear any caches on your Laravel backend

### Step 5: Test Connection
1. Open your POS page
2. Check browser console for Pusher connection messages
3. Create a test order to verify real-time updates work

## Troubleshooting

### If Real-time Still Doesn't Work:
1. Check browser console for errors
2. Verify Pusher credentials are correct
3. Ensure your Hostinger plan supports WebSocket connections
4. Check if your domain has SSL (required for secure WebSocket connections)

### Alternative: Use Polling Instead
If Pusher continues to have issues, you can implement polling as an alternative:

1. Disable Pusher completely
2. Implement periodic API calls to check for updates
3. This is less efficient but more reliable

## Current Status
The code has been updated to:
- ✅ Handle missing Pusher configuration gracefully
- ✅ Add timeouts to prevent long loading times
- ✅ Provide better error messages
- ✅ Fall back to dummy Echo when Pusher is not available

Your POS system will now load quickly even without Pusher configured. 