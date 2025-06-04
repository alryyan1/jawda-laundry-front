import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';

// Lazy load pages for better performance
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const OrdersPage = React.lazy(() => import('@/pages/OrdersPage'));
const OrderDetailsPage = React.lazy(() => import('@/pages/OrderDetailsPage'));
const NewOrderPage = React.lazy(() => import('@/pages/NewOrderPage'));
const CustomersPage = React.lazy(() => import('@/pages/CustomersPage'));
const ServicesPage = React.lazy(() => import('@/pages/ServicesPage'));
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage'));
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));
import React from 'react'; // Import React

// Placeholder for auth check
const isAuthenticated = () => !!localStorage.getItem('authToken'); // Replace with your actual auth logic

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};


export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <React.Suspense fallback={<>...</>}><DashboardPage /></React.Suspense> },
      { path: 'orders', element: <React.Suspense fallback={<>...</>}><OrdersPage /></React.Suspense> },
      { path: 'orders/new', element: <React.Suspense fallback={<>...</>}><NewOrderPage /></React.Suspense> },
      { path: 'orders/:id', element: <React.Suspense fallback={<>...</>}><OrderDetailsPage /></React.Suspense> },
      { path: 'customers', element: <React.Suspense fallback={<>...</>}><CustomersPage /></React.Suspense> },
      { path: 'services', element: <React.Suspense fallback={<>...</>}><ServicesPage /></React.Suspense> },
      { path: 'settings', element: <React.Suspense fallback={<>...</>}><SettingsPage /></React.Suspense> },
    ],
  },
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      { index: true, element: <React.Suspense fallback={<>...</>}><LoginPage /></React.Suspense> },
    ],
  },
  {
    path: '*', // Catch-all for 404
    element: <React.Suspense fallback={<>...</>}><NotFoundPage /></React.Suspense>
  }
]);