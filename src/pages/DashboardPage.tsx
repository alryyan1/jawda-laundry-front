// src/pages/DashboardPage.tsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ComposedChart,
  Area,
} from "recharts";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  DollarSign,
  Package,
  Hourglass,
  XCircle,
  TrendingUp,
  BarChart3,
} from "lucide-react";

import {
  fetchDashboardSummary,
  fetchOrderItemsTrend,
} from "@/api/dashboardService";
import type { DashboardSummary, OrderItemTrendItem } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { useSettings } from "@/context/SettingsContext";

// A reusable StatCard component specific to this dashboard
const StatCard: React.FC<{
  title: string;
  value?: string | number;
  icon: React.ElementType;
  description?: string;
  isLoading?: boolean;
}> = ({ title, value, icon: Icon, description, isLoading: cardIsLoading }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {cardIsLoading ? (
        <>
          <Skeleton className="h-8 w-24 mb-1" />
          <Skeleton className="h-4 w-32" />
        </>
      ) : (
        <>
          <div className="text-3xl font-bold">
            {value !== undefined ? value : "-"}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation(["common", "dashboard", "orders"]);
  const { getSetting } = useSettings();
  const currencySymbol = getSetting('currency_symbol', '$');

  const {
    data: summary,
    isLoading: isLoadingSummary,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery<DashboardSummary, Error>({
    queryKey: ["dashboardSummary"],
    queryFn: fetchDashboardSummary,
    staleTime: 5 * 60 * 1000, // Cache summary for 5 minutes
  });

  const {
    data: orderItemsTrend,
    isLoading: isLoadingOrderItemsTrend,
    refetch: refetchOrderItemsTrend,
  } = useQuery<OrderItemTrendItem[], Error>({
    queryKey: ["orderItemsTrend", 7],
    queryFn: () => fetchOrderItemsTrend(7),
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = () => {
    refetchSummary();
    refetchOrderItemsTrend();
  };

  const orderStatusChartData = useMemo(() => {
    if (!summary) return [];
    return [
      {
        name: t("status_pending", { ns: "orders" }),
        count: summary.pendingOrders || 0,
        fill: "hsl(var(--chart-1))",
      },
      {
        name: t("status_processing", { ns: "orders" }),
        count: summary.processingOrders || 0,
        fill: "hsl(var(--chart-2))",
      },
      {
        name: t("status_cancelled", { ns: "orders" }),
        count: summary.cancelledOrders || 0,
        fill: "hsl(var(--chart-4))",
      },
    ];
  }, [summary, t]);

  return (
    <div>
      <PageHeader
        title={t("dashboard", { ns: "common" })}
        description={t("dashboardWelcome", { ns: "dashboard" })}
        showRefreshButton
        onRefresh={handleRefresh}
        isRefreshing={isLoadingSummary || isLoadingOrderItemsTrend}
      />

      {summaryError && (
        <p className="text-destructive mb-4">
          {t("errorLoadingSummary", { ns: "dashboard" })}:{" "}
          {summaryError.message}
        </p>
      )}

      {/* --- Stats Cards --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("monthlyRevenue", { ns: "dashboard" })}
          value={
            summary?.monthlyRevenue !== undefined
              ? formatCurrency(summary.monthlyRevenue, currencySymbol, i18n.language)
              : undefined
          }
          icon={DollarSign}
          description={t("totalRevenueForCurrentMonth", { ns: "dashboard" })}
          isLoading={isLoadingSummary}
        />
        <StatCard
          title={t("pendingOrders", { ns: "dashboard" })}
          value={summary?.pendingOrders}
          icon={Hourglass}
          description={t("ordersAwaitingProcessing", { ns: "dashboard" })}
          isLoading={isLoadingSummary}
        />
        <StatCard
          title={t("processingOrders", { ns: "dashboard" })}
          value={summary?.processingOrders}
          icon={Package}
          description={t("ordersInProcessing", { ns: "dashboard" })}
          isLoading={isLoadingSummary}
        />
        <StatCard
          title={t("cancelledOrders", { ns: "dashboard" })}
          value={summary?.cancelledOrders}
          icon={XCircle}
          description={t("ordersCancelled", { ns: "dashboard" })}
          isLoading={isLoadingSummary}
        />
      </div>

      {/* --- Charts --- */}
      <div className="mt-6 grid gap-6 md:grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              {t("orderItemsLast7Days", { ns: "dashboard" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoadingOrderItemsTrend ? (
              <Skeleton className="w-full h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={orderItemsTrend}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(dateStr) =>
                      format(parseISO(dateStr), "MMM d")
                    }
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalQuantity"
                    name={t("totalQuantity", { ns: "dashboard" })}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.1}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name={t("orderItems")}
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              {t("orderStatusOverview", { ns: "dashboard" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="w-full h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={orderStatusChartData}>
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={30}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name={t("count", { ns: "common", defaultValue: "Count" })}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
