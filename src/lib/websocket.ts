import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Declare Pusher on window object
declare global {
  interface Window {
    // @ts-expect-error: Pusher type is compatible for runtime assignment
    Pusher: typeof Pusher;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Echo: Echo<any> | any;
  }
}

// Initialize Pusher
window.Pusher = Pusher;

// DISABLED: Real-time updates are disabled for production
// Set this to false to completely disable Pusher
const ENABLE_REALTIME = true;

// Check if Pusher is configured and enabled
const isPusherConfigured = ENABLE_REALTIME && 
                          import.meta.env.VITE_PUSHER_APP_KEY && 
                          import.meta.env.VITE_PUSHER_APP_KEY !== 'your-pusher-key' &&
                          import.meta.env.VITE_PUSHER_APP_KEY !== '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createDummyEcho(): any {
  return {
    channel: () => ({
      listen: () => {},
      stopListening: () => {},
    }),
    leaveChannel: () => {},
  };
}

console.log(isPusherConfigured,'isPusherConfigured')

// Initialize Laravel Echo with fallback
if (isPusherConfigured) {
  try {
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
      // Add timeout to prevent long loading times
      timeout: 10000, // 10 seconds timeout
    });
    console.log('Pusher configured successfully');
  } catch (error) {
    console.error('Failed to initialize Pusher:', error);
    // Fallback to dummy Echo
    window.Echo = createDummyEcho();
  }
} else {
  // Real-time updates are disabled
  console.log('Real-time updates are disabled. Set ENABLE_REALTIME = true to enable.');
  window.Echo = createDummyEcho();
}

export default window.Echo; 