// src/lib/axios.ts (Simplified Interceptor)
import axios from 'axios';
// Import the store directly to call logout if needed
// Be cautious with this pattern if it causes circular dependencies.
// import { useAuthStore } from '@/store/authStore';


const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized access - 401. Token might be invalid or expired.");
      // Consider triggering a logout action.
      // For example, by emitting an event that a top-level component listens to.
      // Or, if this doesn't cause issues:
      // useAuthStore.getState().logout();
      // window.location.href = '/login'; // Hard redirect
    }
    return Promise.reject(error);
  }
);

export default apiClient;