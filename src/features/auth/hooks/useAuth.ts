// src/features/auth/hooks/useAuth.ts
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

/**
 * Custom hook for accessing and managing authentication state and actions.
 * This provides a clean, reusable interface to the underlying Zustand store
 * and includes helpful derived state and authorization functions.
 *
 * @returns An object containing the authentication state (user, token, isAuthenticated)
 *          and helper functions (login, logout, can, hasRole, isAdmin).
 */
export const useAuth = () => {
  // Select specific state and actions from the Zustand store.
  // This memoized selection prevents components from re-rendering if other, unused parts of the store change.
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const storeLogin = useAuthStore((state) => state.login);
  const storeLogout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  // --- DERIVED STATE & AUTHORIZATION HELPERS ---

  /**
   * Checks if the currently authenticated user has a specific role.
   * Relies on the 'roles' array provided by Spatie.
   * @param targetRole The role name (string) or an array of role names to check against.
   * @returns `true` if the user has at least one of the specified roles, otherwise `false`.
   */
  const hasRole = (targetRole: string | string[]): boolean => {
    console.log(user,'user roles',targetRole,'target role',isAuthenticated,'is authenticated')
    if (!isAuthenticated || !user?.roles) {
      return false;
    }

console.log('jskdfjldsfjdkslfjksldfjkd')
    if (Array.isArray(targetRole)) {
      // Check if the user's roles array has any intersection with the target roles array.
      return user.roles.some(userRole => targetRole.includes(userRole));
    }
    // Check for a single role.
    return user.roles.includes(targetRole);
  };

  /**
   * Checks if the currently authenticated user has a specific permission.
   * This is the primary method for granular action authorization.
   * It includes a client-side shortcut that automatically grants all permissions
   * if the user has the 'admin' role.
   *
   * @param permissionName The name of the permission to check (e.g., 'order:create').
   * @returns `true` if the user has the permission, otherwise `false`.
   */
  const can = (permissionName: string): boolean => {
    if (!isAuthenticated || !user?.permissions) {
      return false;
    }

    // Client-side shortcut: An 'admin' can do anything.
    // The ultimate source of truth is always the backend's Gate/Policy, but this
    // is extremely useful for hiding/showing UI elements without an API call.
    if (user.roles?.includes('admin')) {
      return true;
    }

    return user.permissions.includes(permissionName);
  };

  // A convenient boolean derived from the hasRole helper.
  const isAdmin = hasRole('admin');

  /**
   * A wrapper around the store's login action for consistent naming and potential future logic.
   */
  const login = (token: string, userData: User) => {
    storeLogin(token, userData);
  };

  /**
   * A wrapper around the store's logout action.
   */
  const logout = () => {
    storeLogout();
  };

  return {
    // ---- STATE ----
    /** The authentication token, or null if not authenticated. */
    token,
    /** The authenticated user object, or null if not authenticated. Contains roles and permissions. */
    user,
    /** A boolean flag indicating if the user is currently authenticated. */
    isAuthenticated,

    // ---- ACTIONS ----
    /** Function to log the user in by setting token and user data in the store. */
    login,
    /** Function to log the user out, clearing token and user data. */
    logout,
    /** Raw function to set the user object in the store. */
    setUser,
    /** Action to re-fetch user data from the backend using the existing token. */
    fetchUser,

    // ---- AUTHORIZATION HELPERS ----
    /**
     * Checks if the user has a specific permission.
     * @example can('order:create')
     */
    can,
    /**
     * Checks if the user has a specific role or one of several roles.
     * @example hasRole('receptionist')
     * @example hasRole(['admin', 'receptionist'])
     */
    hasRole,
    /** A convenient boolean flag to check if the user is an admin. */
    isAdmin,
  };
};