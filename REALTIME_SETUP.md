# Real-Time Updates Setup Guide

This guide explains how to set up real-time updates for the POS system.

## Backend Setup

### 1. Broadcasting Configuration

The backend is already configured with broadcasting support. Make sure your `.env` file has the following settings:

```env
BROADCAST_DRIVER=pusher
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=mt1
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_ENCRYPTED=true
```

### 2. Events

Two events have been created:
- `OrderCreated` - Broadcasted when a new order is created
- `OrderUpdated` - Broadcasted when an order is updated

These events are automatically dispatched from the `OrderController`.

## Frontend Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
VITE_PUSHER_APP_KEY=your_app_key
VITE_PUSHER_APP_CLUSTER=mt1
VITE_PUSHER_HOST=
VITE_PUSHER_PORT=443
VITE_PUSHER_SCHEME=https
```

### 2. Dependencies

The required dependencies are already installed:
- `laravel-echo`
- `pusher-js`
- `@types/pusher-js`

### 3. Usage

The real-time updates are automatically enabled when you use the `useRealtimeUpdates` hook in the POS page.

## How It Works

1. **Order Creation**: When a user creates an order, the backend dispatches an `OrderCreated` event
2. **Order Updates**: When an order is updated, the backend dispatches an `OrderUpdated` event
3. **Real-Time Notifications**: All connected clients receive these events via WebSocket
4. **Automatic Updates**: The frontend automatically invalidates and refetches relevant data
5. **User Notifications**: Toast notifications inform users of new orders and status changes

## Features

- ✅ Real-time order creation notifications
- ✅ Real-time order status updates
- ✅ Automatic data refresh
- ✅ Toast notifications
- ✅ Fallback for development without Pusher
- ✅ Automatic cleanup on component unmount

## Development Mode

If Pusher is not configured, the system will work without real-time updates and show a warning in the console. This allows development to continue without requiring Pusher setup.

## Production Setup

For production, you'll need to:
1. Set up a Pusher account
2. Configure the environment variables
3. Ensure the broadcasting driver is set to 'pusher'
4. Test the real-time functionality

## Troubleshooting

1. **No real-time updates**: Check if Pusher is properly configured
2. **Console warnings**: These are normal if Pusher is not configured
3. **Connection issues**: Verify your Pusher credentials and network connectivity 