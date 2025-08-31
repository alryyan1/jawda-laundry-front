# Pusher Credentials Update Guide

## Updated Pusher Credentials

```
app_id = "2044525"
key = "e17f43cb02f828c25d28"
secret = "f37621190fdc3a3ed8bb"
cluster = "ap2"
```

## Files That Need to be Updated

### 1. Frontend .env File
**Location:** `jawda-laundry-front/.env`

Update the following lines:
```env
VITE_PUSHER_APP_KEY=e17f43cb02f828c25d28
VITE_PUSHER_APP_CLUSTER=ap2
```

### 2. Backend .env File
**Location:** `jawda-laundry-backend/.env`

Add or update the following lines:
```env
PUSHER_APP_ID=2044525
PUSHER_APP_KEY=e17f43cb02f828c25d28
PUSHER_APP_SECRET=f37621190fdc3a3ed8bb
PUSHER_APP_CLUSTER=ap2
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
BROADCAST_DRIVER=pusher
```

### 3. Print Agent .env File
**Location:** `print-agent/.env`

Update the following lines:
```env
PUSHER_KEY=e17f43cb02f828c25d28
PUSHER_CLUSTER=ap2
```

## Files Already Updated

The following test files have been automatically updated with the new credentials:

1. ✅ `test-pusher.html` - Updated Pusher key from `d2492ab7c1ca847f1dcc` to `e17f43cb02f828c25d28`
2. ✅ `test-websocket.html` - Updated Pusher key from `a441e6a4328382368f6d` to `e17f43cb02f828c25d28`

## Verification Steps

1. **Test Frontend Connection:**
   - Open `test-pusher.html` in your browser
   - Check if the connection test passes with the new credentials

2. **Test WebSocket Connection:**
   - Open `test-websocket.html` in your browser
   - Verify that the WebSocket connection is established

3. **Test Backend Broadcasting:**
   - Run the backend broadcasting tests to ensure events are being sent correctly

4. **Test Print Agent:**
   - Restart the print agent service
   - Verify that it can connect to Pusher with the new credentials

## Important Notes

- The cluster remains the same (`ap2`)
- All other Pusher configuration (host, port, scheme) remains unchanged
- Make sure to restart any services that use these credentials after updating
- The frontend will need to be rebuilt after updating the .env file

## Troubleshooting

If you encounter connection issues:

1. Verify that all .env files have been updated correctly
2. Check that the Pusher app is active in your Pusher dashboard
3. Ensure that the cluster setting matches your Pusher app configuration
4. Restart all services that use Pusher credentials

