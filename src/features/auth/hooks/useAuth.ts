// src/features/auth/hooks/useAuth.ts
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types'; // Import the main User type

/**
 * Custom hook for accessing authentication state and actions.
 * This acts as a clean, reusable interface to the underlying Zustand store,
 * abstracting the direct store usage from components.
 *
 * @returns An object containing authentication state and helper functions.
 */
export const useAuth = () => {
  // Select specific state and actions from the Zustand store.
  // This can help with performance as components will only re-render if the state they subscribe to changes.
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const storeLogin = useAuthStore((state) => state.login);
  const storeLogout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  // --- Derived State and Helper Functions ---

  /**
   * Checks if the currently authenticated user has a specific role.
   * @param targetRole The role name (string) or an array of role names to check against.
   * @returns `true` if the user has the role, otherwise `false`.
   */
  const hasRole = (targetRole: string | string[]): boolean => {
    if (!isAuthenticated || !user?.roles) return false;

    if (Array.isArray(targetRole)) {
      // Check if the user has ANY of the roles in the target array
      return user.roles.some(userRole => targetRole.includes(userRole));
    }
    // Check for a single role
    return user.roles.includes(targetRole);
  };

  /**
   * Checks if the currently authenticated user has a specific permission.
   * This is the primary method for checking authorization for actions.
   * It automatically grants all permissions to the 'admin' role as a client-side shortcut.
   *
   * @param permissionName The name of the permission to check (e.g., 'order:create').
   * @returns `true` if the user has the permission, otherwise `false`.
   */
  const can = (permissionName: string): boolean => {
    if (!isAuthenticated || !user?.permissions) return false;

    // Client-side shortcut: Admins can do anything.
    // The final source of truth is always the backend's Gate/Policy.
    if (user.roles?.includes('admin')) {
      return true;
    }

    return user.permissions.includes(permissionName);
  };

  // Convenience boolean for the most common role check.
  const isAdmin = hasRole('admin');

  /**
   * A wrapper around the store's login action for consistent naming.
   */
  const login = (token: string, userData: User) => {
    storeLogin(token, userData);
  };

  /**
   * A wrapper around the store's logout action.
   * In a real app, this might also include API calls to invalidate tokens,
   * but that logic is often handled in the store action itself.
   */
  const logout = () => {
    storeLogout();
  };


  return {
    // State
    token,
    user,
    isAuthenticated,

    // Actions
    login,
    logout,
    setUser,
    fetchUser,

    // Authorization Helpers
    can,
    hasRole,
    isAdmin,
  };
};