// src/lib/axios.ts (Simplified Interceptor)
import axios from "axios";
import { BASE_URL } from "./constants";
// Import the store directly to call logout if needed
// Be cautious with this pattern if it causes circular dependencies.
// import { useAuthStore } from '@/store/authStore';

// Use constant directly
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to add the token to every request
apiClient.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage if not already in headers
    if (!config.headers["Authorization"]) {
      try {
        const storedAuth = localStorage.getItem("auth-storage");
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          const token = authData.state?.token;
          if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
          }
        }
      } catch (e) {
        console.error("Error parsing auth-storage from localStorage", e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error(
        "Unauthorized access - 401. Token might be invalid or expired.",
      );
      // Consider triggering a logout action.
      // For example, by emitting an event that a top-level component listens to.
      // Or, if this doesn't cause issues:
      // useAuthStore.getState().logout();
      // window.location.href = '/login'; // Hard redirect
    }
    return Promise.reject(error);
  },
);

export default apiClient;
