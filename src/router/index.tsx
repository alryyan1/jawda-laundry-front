// src/router/index.tsx
import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

// Layouts
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";

// Protected Route Wrapper
import { ProtectedRoute } from "./ProtectedRoute"; // Assuming ProtectedRoute.tsx is in the same folder

// --- Page Imports (Lazy Loaded) ---

// General Pages
const DashboardPage = React.lazy(() => import("@/pages/DashboardPage"));
const SettingsPage = React.lazy(() => import("@/pages/SettingsPage"));
const NotFoundPage = React.lazy(() => import("@/pages/NotFoundPage"));

// Auth Pages
const LoginPage = React.lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = React.lazy(() => import("@/pages/auth/RegisterPage"));
// const ForgotPasswordPage = React.lazy(() => import('@/pages/auth/ForgotPasswordPage')); // Future

// Customer Pages
const CustomersListPage = React.lazy(
  () => import("@/pages/customers/CustomersListPage")
);
const NewCustomerPage = React.lazy(
  () => import("@/pages/customers/NewCustomerPage")
);
const EditCustomerPage = React.lazy(
  () => import("@/pages/customers/EditCustomerPage")
);

// Order Pages
const OrdersListPage = React.lazy(
  () => import("@/pages/orders/OrdersListPage")
);
const NewOrderPage = React.lazy(() => import("@/pages/orders/NewOrderPage"));
const OrderDetailsPage = React.lazy(
  () => import("@/pages/orders/OrderDetailsPage")
);
// const EditOrderPage = React.lazy(() => import('@/pages/orders/EditOrderPage')); // Future

// Service Management Pages (Admin)
const ServiceOfferingsListPage = React.lazy(
  () => import("@/pages/services/offerings/ServiceOfferingsListPage")
);
const NewServiceOfferingPage = React.lazy(
  () => import("@/pages/services/offerings/NewServiceOfferingPage")
);
const EditServiceOfferingPage = React.lazy(
  () => import("@/pages/services/offerings/EditServiceOfferingPage")
);

const ProductCategoriesListPage = React.lazy(
  () => import("@/pages/services/product-categories/ProductCategoriesListPage")
);
const ProductTypesListPage = React.lazy(
  () => import("@/pages/services/product-types/ProductTypesListPage")
);
const ServiceActionsListPage = React.lazy(
  () => import("@/pages/services/service-actions/ServiceActionsListPage")
);

// Loading fallback component for Suspense
const RouteSuspenseFallback = () => (
  <div className="flex items-center justify-center h-screen w-screen">
    {/* You can use a more sophisticated spinner from Shadcn or your library */}
    <svg
      className="animate-spin h-8 w-8 text-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  </div>
);

export const router = createBrowserRouter([
  {
    // Routes that use the MainLayout (typically protected)
    element: <MainLayout />, // MainLayout itself is not protected here, but its Outlet will be.
    children: [
      {
        element: <ProtectedRoute />, // This component protects all its nested children
        children: [
          {
            path: "/",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <DashboardPage />
              </React.Suspense>
            ),
          },
          // Customers
          {
            path: "customers",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <CustomersListPage />
              </React.Suspense>
            ),
          },
          {
            path: "customers/new",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <NewCustomerPage />
              </React.Suspense>
            ),
          },
          {
            path: "customers/:id/edit",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <EditCustomerPage />
              </React.Suspense>
            ),
          },
          // Orders
          {
            path: "orders",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <OrdersListPage />
              </React.Suspense>
            ),
          },
          {
            path: "orders/new",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <NewOrderPage />
              </React.Suspense>
            ),
          },
          {
            path: "orders/:id",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <OrderDetailsPage />
              </React.Suspense>
            ),
          },
          // { // Future Edit Order Page
          //   path: 'orders/:id/edit',
          //   element: <React.Suspense fallback={<RouteSuspenseFallback />}><EditOrderPage /></React.Suspense>,
          // },

          // Service Offerings (User-facing list of services)
          {
            path: "service-offerings",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <ServiceOfferingsListPage />
              </React.Suspense>
            ),
          },
          {
            path: "service-offerings/new",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <NewServiceOfferingPage />
              </React.Suspense>
            ),
          },
          {
            path: "service-offerings/:id/edit",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <EditServiceOfferingPage />
              </React.Suspense>
            ),
          },

          // Admin Service Management (could be further nested under an /admin path if desired)
          {
            path: "admin/product-categories",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <ProductCategoriesListPage />
              </React.Suspense>
            ),
          },
          {
            path: "admin/product-types",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <ProductTypesListPage />
              </React.Suspense>
            ),
          },
          {
            path: "admin/service-actions",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <ServiceActionsListPage />
              </React.Suspense>
            ),
          },
          // Settings
          {
            path: "settings",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <SettingsPage />
              </React.Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    // Authentication routes (use AuthLayout, typically not protected by ProtectedRoute)
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: (
          <React.Suspense fallback={<RouteSuspenseFallback />}>
            <LoginPage />
          </React.Suspense>
        ),
      },
      {
        path: "register",
        element: (
          <React.Suspense fallback={<RouteSuspenseFallback />}>
            <RegisterPage />
          </React.Suspense>
        ),
      },
      // {
      //   path: 'forgot-password',
      //   element: <React.Suspense fallback={<RouteSuspenseFallback />}><ForgotPasswordPage /></React.Suspense>,
      // },
      // Redirect /auth to /auth/login if someone navigates to just /auth
      {
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
    ],
  },
  {
    // Catch-all for 404 Not Found
    path: "*",
    element: (
      <React.Suspense fallback={<RouteSuspenseFallback />}>
        <NotFoundPage />
      </React.Suspense>
    ),
  },
]);
