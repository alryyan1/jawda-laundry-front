// src/features/auth/hooks/useAuth.ts
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types'; // Or import from '@/types/auth.types' if you made that split

export const useAuth = () => {
  const {
    token,
    user,
    isAuthenticated,
    login: storeLogin, // Renaming to avoid conflict if used in component with local 'login'
    logout: storeLogout,
    setUser: storeSetUser,
    setToken: storeSetToken,
    fetchUser: storeFetchUser,
  } = useAuthStore();

  // You can add derived state or convenience functions here if needed
  // For example:
  // const isAdmin = user?.role === 'admin';

  const login = (token: string, userData: User) => {
    storeLogin(token, userData);
  };

  const logout = async () => { // Make it async if you await API call
    // try {
    //   await logoutUser(); // Call the API service for backend logout
    // } catch (error) {
    //   console.error("Backend logout failed, proceeding with client-side logout:", error);
    // } finally {
    //   storeLogout();
    // }
    // For now, matching the store's simpler logout:
    storeLogout();
    // The store's logout might internally call the API, or MainLayout handles it.
  };


  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    setUser: storeSetUser, // Expose raw store setters if needed elsewhere
    setToken: storeSetToken,
    fetchUser: storeFetchUser,
    // isAdmin, // Export derived state
  };
};