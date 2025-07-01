// src/api/apiClient.ts
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized (401), attempting to logout from apiClient.");
      try {
        // Dynamically import to avoid circular dependencies if authStore imports apiClient
        const { useAuthStore } = await import('@/store/authStore');
        useAuthStore.getState().logout();

        // Do not force a hard redirect; let the app/router handle navigation if needed
      } catch (importError) {
        console.error("Failed to import authStore or logout from apiClient:", importError);
      }
    }
    return Promise.reject(error);
  }
);

// Always attach the latest token from the store to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    } else if (config.headers && 'Authorization' in config.headers) {
      delete config.headers['Authorization'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;