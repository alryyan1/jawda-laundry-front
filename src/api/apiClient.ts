// src/api/apiClient.ts
import axios from 'axios';
// import { useAuthStore } from '@/store/authStore'; // Keep if you use it directly here

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
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

        if (window.location.pathname !== '/auth/login' && !window.location.pathname.startsWith('/auth/')) {
            window.location.href = '/auth/login'; // Hard redirect
        }
      } catch (importError) {
        console.error("Failed to import authStore or logout from apiClient:", importError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;