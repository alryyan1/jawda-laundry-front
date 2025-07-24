// src/router/index.tsx
import React from "react";
import { createHashRouter, Navigate } from "react-router-dom";

// Layouts
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

// Protected Route Wrapper
import { ProtectedRoute } from "./ProtectedRoute"; // Assuming ProtectedRoute.tsx is in the same folder
import EditOrderPage from "@/pages/orders/EditOrderPage";
import { ApplicationSettingsAdmin } from "@/features/settings/components/ApplicationSettingsAdmin";
import UsersListPage from "@/pages/admin/users/UsersListPage";
import UserFormPage from "@/pages/admin/users/UserFormPage";
import RolesListPage from "@/pages/admin/roles/RolesListPage";
import RoleFormPage from "@/pages/admin/roles/RoleFormPage";
import RestaurantTablesListPage from "@/pages/admin/RestaurantTablesListPage";
import NavigationManagementPage from "@/pages/admin/NavigationManagementPage";
import { AppearanceSettings } from "@/features/settings/components/AppearanceSettings";
import { AccountSettings } from "@/features/settings/components/AccountSettings";
import { ProfileSettings } from "@/features/settings/components/ProfileSettings";
import ExpenseCategoriesListPage from "@/pages/expenses/ExpenseCategoriesListPage";
import KanbanPage from "@/pages/orders/KanbanPage";
import POSPage from '@/pages/pos/POSPage';
import DiningManagementPage from '@/pages/dining/DiningManagementPage';
import NewInventoryItemPage from '@/pages/inventory/NewInventoryItemPage';
import ViewInventoryItemPage from '@/pages/inventory/ViewInventoryItemPage';
import EditInventoryItemPage from '@/pages/inventory/EditInventoryItemPage';

// Test Error Page for demonstrating ErrorBoundary
const TestErrorPage = React.lazy(() => import("@/pages/TestErrorPage"));

// --- Page Imports (Lazy Loaded) ---

// General Pages
const DashboardPage = React.lazy(() => import("@/pages/DashboardPage"));
const SuppliersListPage = React.lazy(() => import('@/pages/suppliers/SuppliersListPage'));
const SettingsPage = React.lazy(() => import("@/pages/admin/SettingsPage"));
const NotFoundPage = React.lazy(() => import("@/pages/NotFoundPage"));
const ExpensesListPage = React.lazy(() => import('@/pages/expenses/ExpensesListPage'));

// Inventory Pages
const InventoryDashboard = React.lazy(() => import('@/pages/inventory/InventoryDashboard'));
const InventoryManagement = React.lazy(() => import('@/pages/inventory/InventoryManagement'));
const InventoryTransactions = React.lazy(() => import('@/pages/inventory/InventoryTransactions'));
const InventoryCategories = React.lazy(() => import('@/pages/inventory/InventoryCategories'));

// Purchase Pages
const PurchasesListPage = React.lazy(() => import('@/pages/purchases/PurchasesListPage'));
const NewPurchasePage = React.lazy(() => import('@/pages/purchases/NewPurchasePage'));
const PurchaseDetailsPage = React.lazy(() => import('@/pages/purchases/PurchaseDetailsPage'));
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
const MenuPage = React.lazy(
  () => import("@/pages/services/offerings/MenuPage")
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
const CustomerLedgerPage = React.lazy(() => import('@/pages/customers/CustomerLedgerPage'));
const SalesSummaryPage = React.lazy(() => import('@/pages/reports/SalesSummaryPage'));
const DailyRevenuePage = React.lazy(() => import('@/pages/reports/DailyRevenuePage'));
const CostSummaryPage = React.lazy(() => import('@/pages/reports/CostSummaryPage'));
const ReportsMainPage = React.lazy(() => import('@/pages/reports/ReportsMainPage'));
const DetailedReportsMainPage = React.lazy(() => import('@/pages/reports/DetailedReportsMainPage'));
const DetailedOrdersReport = React.lazy(() => import('@/pages/reports/DetailedOrdersReport'));
const OverduePickupsReport = React.lazy(() => import('@/pages/reports/OverduePickupsReport'));
const DailyCostsPage = React.lazy(() => import('@/pages/reports/DailyCostsPage'));
const OrdersReportPage = React.lazy(() => import('@/pages/reports/OrdersReportPage'));

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

export const router = createHashRouter([
  {
    // Routes that use the MainLayout (typically protected)
    element: (
      <ErrorBoundary componentName="MainLayout">
        <MainLayout />
      </ErrorBoundary>
    ), // MainLayout itself is not protected here, but its Outlet will be.
    children: [
      {
        element: (
          <ErrorBoundary componentName="ProtectedRoute">
            <ProtectedRoute />
          </ErrorBoundary>
        ), // This component protects all its nested children
        children: [
          {
            path: "/",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <ErrorBoundary componentName="DashboardPage">
                  <DashboardPage />
                </ErrorBoundary>
              </React.Suspense>
            ),
          },
          {
            path: 'reports/daily-costs',
            element: <React.Suspense fallback={<RouteSuspenseFallback />}><DailyCostsPage /></React.Suspense>,
          },
          {
            path: 'expenses',
            element: <React.Suspense fallback={<RouteSuspenseFallback />}><ExpensesListPage /></React.Suspense>,
          },
          { // --- ADD THE NEW EXPENSE CATEGORIES ROUTE HERE ---
            path: 'admin/expense-categories',
            element: <React.Suspense fallback={<RouteSuspenseFallback />}><ExpenseCategoriesListPage /></React.Suspense>,
          },
          {
            path: 'reports',
            element: <React.Suspense fallback={<RouteSuspenseFallback />}><ReportsMainPage /></React.Suspense>,
          },
          {
            path: 'reports/detailed',
            element: <React.Suspense fallback={<RouteSuspenseFallback />}><DetailedReportsMainPage /></React.Suspense>,
          },
          {
            path: 'reports/sales',
            element: <React.Suspense fallback={<RouteSuspenseFallback />}><SalesSummaryPage /></React.Suspense>,
          },
          {
            path: 'reports/daily-revenue',
            element: <React.Suspense fallback={<RouteSuspenseFallback />}><DailyRevenuePage /></React.Suspense>,
          },
          {
            path: 'reports/costs',
            element: <React.Suspense fallback={<RouteSuspenseFallback />}><CostSummaryPage /></React.Suspense>,
          },
          {
            path: 'reports/detailed/overdue-pickups',
            element: <React.Suspense fallback={<RouteSuspenseFallback />}><OverduePickupsReport /></React.Suspense>,
          },
          {
            path: 'reports/detailed-orders',
            element: <React.Suspense fallback={<RouteSuspenseFallback />}><DetailedOrdersReport /></React.Suspense>,
          },
          {
            path: 'reports/orders',
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <OrdersReportPage />
              </React.Suspense>
            ),
          },
          // Suppliers
          {
            path: 'suppliers',
            element: <React.Suspense fallback={<RouteSuspenseFallback />}><SuppliersListPage /></React.Suspense>,
          },
          // Purchases
          {
            path: 'purchases',
            element: <React.Suspense fallback={<RouteSuspenseFallback />}><PurchasesListPage /></React.Suspense>,
          },
          {
            path: 'purchases/new',
            element: <React.Suspense fallback={<RouteSuspenseFallback />}><NewPurchasePage /></React.Suspense>,
          },
          {
            path: 'purchases/:id',
            element: <React.Suspense fallback={<RouteSuspenseFallback />}><PurchaseDetailsPage /></React.Suspense>,
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
          {
            path: "customers/:id/ledger",
            element: <React.Suspense fallback={<RouteSuspenseFallback />}><CustomerLedgerPage /></React.Suspense>,
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
          // POS Route
          {
            path: "pos",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <POSPage />
              </React.Suspense>
            ),
          },
          // Dining Management Route
          {
            path: "dining",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <DiningManagementPage />
              </React.Suspense>
            ),
          },
          // --- Settings Routes ---
          {
            path: "settings",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <SettingsPage />
              </React.Suspense>
            ),
            children: [
              // Default redirect handled within SettingsPage component
              {
                path: "profile", //  /settings/profile
                element: (
                  <React.Suspense fallback={<RouteSuspenseFallback />}>
                    <ProfileSettings />
                  </React.Suspense>
                ),
              },
              {
                path: "account", // /settings/account
                element: (
                  <React.Suspense fallback={<RouteSuspenseFallback />}>
                    <AccountSettings />
                  </React.Suspense>
                ),
              },
              {
                path: "appearance", // /settings/appearance
                element: (
                  <React.Suspense fallback={<RouteSuspenseFallback />}>
                    <AppearanceSettings />
                  </React.Suspense>
                ),
              },
              {
                // Admin only application settings, nested under settings for UI consistency
                path: "application", // /settings/application
                element: (
                  // <AdminRoute> // If you implement a specific AdminRoute wrapper
                  <React.Suspense fallback={<RouteSuspenseFallback />}>
                    <ApplicationSettingsAdmin />
                  </React.Suspense>
                  // </AdminRoute>
                ),
              },
            ],
          },

          // --- Admin Management Routes (linked from settings but can be separate top-level) ---
          // These might already exist if you followed previous steps
          {
            path: "admin/users",
            // element: <AdminRoute><React.Suspense fallback={<RouteSuspenseFallback />}><UsersListPage /></React.Suspense></AdminRoute>, // Example with AdminRoute
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <ErrorBoundary componentName="UsersListPage">
                  <UsersListPage />
                </ErrorBoundary>
              </React.Suspense>
            ), // Assuming UsersListPage handles its own auth check or ProtectedRoute covers it
          },
          {
            path: "admin/users/new",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <UserFormPage />
              </React.Suspense>
            ),
          },
          {
            path: "admin/users/:id/edit",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <UserFormPage />
              </React.Suspense>
            ),
          },
          {
            path: "admin/roles",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <RolesListPage />
              </React.Suspense>
            ),
          },
          {
            path: "admin/roles/new",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <RoleFormPage />
              </React.Suspense>
            ),
          },
          {
            path: "admin/roles/:id/edit",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <RoleFormPage />
              </React.Suspense>
            ),
          },
          {
            path: "admin/restaurant-tables",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <RestaurantTablesListPage />
              </React.Suspense>
            ),
          },
          {
            path: "admin/navigation",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <ErrorBoundary componentName="NavigationManagementPage">
                  <NavigationManagementPage />
                </ErrorBoundary>
              </React.Suspense>
            ),
          },
          {
            path: "test-error",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <ErrorBoundary componentName="TestErrorPage">
                  <TestErrorPage />
                </ErrorBoundary>
              </React.Suspense>
            ),
          },
          // ... (other admin service management routes: product-categories, etc.)

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
            path: "menu",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <MenuPage />
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
          { path: 'orders/kanban', element: <React.Suspense fallback={<RouteSuspenseFallback />}><KanbanPage /></React.Suspense> },

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
          {
            path: "orders/:id/edit",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <EditOrderPage />
              </React.Suspense>
            ),
          },
          // Inventory Routes
          {
            path: "inventory",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <InventoryDashboard />
              </React.Suspense>
            ),
          },
          {
            path: "inventory/items",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <InventoryManagement />
              </React.Suspense>
            ),
          },
          {
            path: "inventory/items/new",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <ErrorBoundary componentName="NewInventoryItemPage">
                  <NewInventoryItemPage />
                </ErrorBoundary>
              </React.Suspense>
            ),
          },
          {
            path: "inventory/items/:id",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <ViewInventoryItemPage />
              </React.Suspense>
            ),
          },
          {
            path: "inventory/items/:id/view",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <ViewInventoryItemPage />
              </React.Suspense>
            ),
          },
          {
            path: "inventory/items/:id/edit",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <EditInventoryItemPage />
              </React.Suspense>
            ),
          },
          {
            path: "inventory/transactions",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <InventoryTransactions />
              </React.Suspense>
            ),
          },
          {
            path: "inventory/categories",
            element: (
              <React.Suspense fallback={<RouteSuspenseFallback />}>
                <InventoryCategories />
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
    element: (
      <ErrorBoundary componentName="AuthLayout">
        <AuthLayout />
      </ErrorBoundary>
    ),
    children: [
      {
        path: "login",
        element: (
          <React.Suspense fallback={<RouteSuspenseFallback />}>
            <ErrorBoundary componentName="LoginPage">
              <LoginPage />
            </ErrorBoundary>
          </React.Suspense>
        ),
      },
      {
        path: "register",
        element: (
          <React.Suspense fallback={<RouteSuspenseFallback />}>
            <ErrorBoundary componentName="RegisterPage">
              <RegisterPage />
            </ErrorBoundary>
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
        <ErrorBoundary componentName="NotFoundPage">
          <NotFoundPage />
        </ErrorBoundary>
      </React.Suspense>
    ),
  },
]);
