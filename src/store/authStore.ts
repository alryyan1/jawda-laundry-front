// src/store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '@/lib/axios'; // Your configured axios instance
import type { User } from '@/types/auth.types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  fetchUser: () => Promise<void>; // To fetch user if token exists but user is not in store
}

export const useAuthStore = create(
  persist<AuthState>(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setToken: (token) => {
        set({ token, isAuthenticated: !!token });
        if (token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          delete apiClient.defaults.headers.common['Authorization'];
        }
      },
      setUser: (user) => set({ user }),
      login: (token, user) => {
        get().setToken(token);
        get().setUser(user);
      },
      logout: () => {
        get().setToken(null);
        get().setUser(null);
        // Optionally call backend logout endpoint if necessary
        // apiClient.post('/logout').catch(console.error);
      },
      fetchUser: async () => {
        if (get().token && !get().user) {
          try {
            const response = await apiClient.get('/user');
            get().setUser(response.data); // Assuming response.data is the user object
          } catch (error) {
            console.error("Failed to fetch user, logging out:", error);
            get().logout(); // Token might be invalid, so log out
          }
        }
      },
    }),
    {
      name: 'auth-storage', // Name of the item in storage
      storage: createJSONStorage(() => localStorage), // Or sessionStorage
      partialize: (state: AuthState) => ({
        token: state.token ?? null,
        isAuthenticated: !!state.isAuthenticated
      }) as AuthState, // Persist both token and isAuthenticated state, type-cast to fix TS error
    }
  )
);

// Initialize token from storage on app load
// This ensures the Authorization header is set if a token exists from a previous session
const initialToken = useAuthStore.getState().token;
if (initialToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
  // Attempt to fetch user data if token exists but user is not in store (e.g., after refresh)
  useAuthStore.getState().fetchUser();
}