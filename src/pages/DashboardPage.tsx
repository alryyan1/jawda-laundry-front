// src/pages/DashboardPage.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Package,
  Users,
  Hourglass,
  CheckCircle,
  Zap,
} from "lucide-react"; // Example icons
import { PageHeader } from "@/components/shared/PageHeader";
// Fallback Skeleton component if '@/components/ui/skeleton' does not exist
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-muted rounded ${className}`} />
);

// Assume an API endpoint /api/dashboard-summary exists
// and returns data like: { pendingOrders: 5, processingOrders: 3, readyOrders: 2, totalCustomers: 50, monthlyRevenue: 1234.56 }
interface DashboardSummary {
  pendingOrders: number;
  processingOrders: number;
  readyForPickupOrders: number;
  completedTodayOrders: number;
  totalActiveCustomers: number;
  // Add more stats as needed
}

const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  // const { data } = await apiClient.get('/dashboard-summary'); // Replace with your actual endpoint
  // return data;
  // Mock data for now:
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          pendingOrders: Math.floor(Math.random() * 10) + 1,
          processingOrders: Math.floor(Math.random() * 10),
          readyForPickupOrders: Math.floor(Math.random() * 5),
          completedTodayOrders: Math.floor(Math.random() * 15),
          totalActiveCustomers: Math.floor(Math.random() * 50) + 20,
        }),
      1000
    )
  );
};

const DashboardPage: React.FC = () => {
  const { t } = useTranslation(["common", "dashboard"]);

  const {
    data: summary,
    isLoading,
    error,
  } = useQuery<DashboardSummary, Error>({
    queryKey: ["dashboardSummary"],
    queryFn: fetchDashboardSummary,
  });

  const StatCard: React.FC<{
    title: string;
    value?: string | number;
    icon: React.ElementType;
    description?: string;
    isLoading?: boolean;
  }> = ({
    title,
    value,
    icon: Icon,
    description,
    isLoading: cardIsLoading,
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {cardIsLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title={t("dashboard", { ns: "common" })}
        description={t("dashboardWelcome", {
          ns: "dashboard",
          defaultValue:
            "Welcome back! Here's an overview of your laundry business.",
        })}
      />
      {error && (
        <p className="text-destructive">
          {t("errorLoadingSummary", {
            ns: "dashboard",
            defaultValue: "Could not load summary data.",
          })}
          : {error.message}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title={t("pendingOrders", { ns: "dashboard" })}
          value={summary?.pendingOrders}
          icon={Hourglass}
          description={t("ordersAwaitingProcessing", { ns: "dashboard" })}
          isLoading={isLoading}
        />
        <StatCard
          title={t("processingOrders", { ns: "dashboard" })}
          value={summary?.processingOrders}
          icon={Zap} // Zap for fast processing, or a different icon
          description={t("ordersCurrentlyInProgress", { ns: "dashboard" })}
          isLoading={isLoading}
        />
        <StatCard
          title={t("readyForPickup", { ns: "dashboard" })}
          value={summary?.readyForPickupOrders}
          icon={Package}
          description={t("ordersReadyForCustomer", { ns: "dashboard" })}
          isLoading={isLoading}
        />
        <StatCard
          title={t("completedToday", { ns: "dashboard" })}
          value={summary?.completedTodayOrders}
          icon={CheckCircle}
          description={t("ordersCompletedTodayDesc", { ns: "dashboard" })}
          isLoading={isLoading}
        />
        <StatCard
          title={t("totalCustomers", { ns: "dashboard" })}
          value={summary?.totalActiveCustomers} // Assuming this refers to active customers
          icon={Users}
          description={t("activeCustomerAccounts", { ns: "dashboard" })}
          isLoading={isLoading}
        />
        {/* Add more StatCards: e.g., Revenue Today/Month, etc. */}
      </div>

      {/* TODO: Add charts here later using Recharts or similar */}
      {/* <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
            <CardContent> <p>Order List Table (mini version) </p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Revenue Overview</CardTitle></CardHeader>
            <CardContent> <p>Chart placeholder</p> </CardContent>
        </Card>
      </div> */}
    </div>
  );
};
export default DashboardPage;
