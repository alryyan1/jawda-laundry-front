// src/router/ProtectedRoute.tsx (New File or update existing router/index.tsx content)
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore'; // Your Zustand store
import { Loader2 } from 'lucide-react'; // For a loading indicator

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, token, user, fetchUser } = useAuthStore();
  const location = useLocation();
  const [isLoadingUser, setIsLoadingUser] = React.useState(true); // Manage loading state for user fetch

  useEffect(() => {
    let isMounted = true; // Prevent state update on unmounted component

    const checkUser = async () => {
      if (token && !user) { // Token exists, but user object not in store (e.g., after refresh)
        try {
          await fetchUser(); // Attempt to fetch user data
        } catch (error) {
          console.error("ProtectedRoute: Failed to fetch user, token might be invalid.", error);
          // The fetchUser or apiClient interceptor should handle logging out if token is invalid
        } finally {
          if (isMounted) {
            setIsLoadingUser(false);
          }
        }
      } else {
        if (isMounted) {
          setIsLoadingUser(false); // No token or user already loaded
        }
      }
    };

    checkUser();

    return () => {
      isMounted = false;
    };
  }, [token, user, fetchUser]);


  if (isLoadingUser && token) { // Show loader only if token exists and we are trying to fetch user
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated && !token) { // No token and not authenticated, redirect to login
    // Store the intended location to redirect back after login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If token exists but somehow isAuthenticated is false AND user fetch failed (isLoadingUser is false)
  // this means fetchUser likely failed and the interceptor/fetchUser itself should have logged out.
  // This check is a safeguard.
  if (token && !isAuthenticated && !isLoadingUser && !user) {
      console.warn("ProtectedRoute: Token exists but user not authenticated or fetched. Redirecting to login.");
      return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }


  return <Outlet />; // User is authenticated or being resolved, render the nested routes
};