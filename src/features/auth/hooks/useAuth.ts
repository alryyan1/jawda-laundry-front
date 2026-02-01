// src/features/auth/hooks/useAuth.ts
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types";

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
   * Checks if the currently authenticated user is of a specific type (formerly roles).
   * @param targetRole The user type (string) or an array of user types to check against.
   * @returns `true` if the user matches at least one of the specified types, otherwise `false`.
   */
  const hasRole = (targetRole: string | string[]): boolean => {
    if (!isAuthenticated || !user?.user_type) {
      return false;
    }

    if (Array.isArray(targetRole)) {
      // Check if the user's type is in the target array.
      return targetRole.includes(user.user_type);
    }
    // Check for a single type.
    return user.user_type === targetRole;
  };

  /**
   * Checks if the currently authenticated user implies admin privileges.
   * Since granular permissions are removed, this mainly checks if user is admin.
   *
   * @param permissionName The name of the permission to check (ignored in current simplified model).
   * @returns `true` if the user is admin, otherwise `false`.
   */
  const can = (permissionName: string): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    // Client-side shortcut: An 'admin' can do anything.
    if (user.user_type === "admin") {
      return true;
    }

    // Default deny for non-admins if relying on explicit permissions which are now removed.
    // Unless we assume staff has some permissions. For now, defaulting to false unless admin.
    return false;
  };

  // A convenient boolean derived from the user_type.
  const isAdmin = user?.user_type === "admin";

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
    /** The authenticated user object, or null if not authenticated. */
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
     * Checks if the user is authorized (simplistic check for now).
     * @example can('order:create')
     */
    can,
    /**
     * Checks if the user has a specific user type.
     * @example hasRole('staff')
     * @example hasRole(['admin', 'staff'])
     */
    hasRole,
    /** A convenient boolean flag to check if the user is an admin. */
    isAdmin,
  };
};
