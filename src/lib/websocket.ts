import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Declare Pusher on window object
declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo;
  }
}

// Initialize Pusher
window.Pusher = Pusher;

// Check if Pusher is configured
const isPusherConfigured = import.meta.env.VITE_PUSHER_APP_KEY && 
                          import.meta.env.VITE_PUSHER_APP_KEY !== 'your-pusher-key';

// Initialize Laravel Echo with fallback
if (isPusherConfigured) {
  window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    wsHost: import.meta.env.VITE_PUSHER_HOST || `ws-${import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1'}.pusher.com`,
    wsPort: import.meta.env.VITE_PUSHER_PORT || 80,
    wssPort: import.meta.env.VITE_PUSHER_PORT || 443,
    forceTLS: (import.meta.env.VITE_PUSHER_SCHEME || 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
  });
} else {
  // Fallback for development without Pusher
  console.warn('Pusher not configured. Real-time updates will be disabled.');
  window.Echo = {
    channel: () => ({
      listen: () => {},
      stopListening: () => {},
    }),
    leaveChannel: () => {},
  } as any;
}

export default window.Echo; 