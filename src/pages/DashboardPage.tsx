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
  CardDescription,
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
  CalendarRange,
} from "lucide-react";

import {
  fetchDashboardSummary,
  fetchOrderItemsTrend,
} from "@/api/dashboardService";
import type { DashboardSummary, OrderItemTrendItem } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";

// Enhanced StatCard Component
const StatCard: React.FC<{
  title: string;
  value?: string | number;
  icon: React.ElementType;
  description?: string;
  isLoading?: boolean;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string; // Allow custom styling
}> = ({
  title,
  value,
  icon: Icon,
  description,
  isLoading: cardIsLoading,
  className,
}) => (
  <Card
    className={cn(
      "overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow",
      className,
    )}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </CardTitle>
      <div className="p-2 bg-primary/10 rounded-full">
        <Icon className="h-4 w-4 text-primary" />
      </div>
    </CardHeader>
    <CardContent>
      {cardIsLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-2xl font-bold tracking-tight">
            {value !== undefined ? value : "-"}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {description}
            </p>
          )}
        </div>
      )}
    </CardContent>
  </Card>
);

const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation(["common", "dashboard", "orders"]);
  const { getSetting } = useSettings();
  const currencySymbol = getSetting("currency_symbol", "$");

  const {
    data: summary,
    isLoading: isLoadingSummary,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery<DashboardSummary, Error>({
    queryKey: ["dashboardSummary"],
    queryFn: fetchDashboardSummary,
    staleTime: 5 * 60 * 1000,
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
        fill: "hsl(var(--yellow-500))", // Customized colors
      },
      {
        name: t("status_processing", { ns: "orders" }),
        count: summary.processingOrders || 0,
        fill: "hsl(var(--blue-500))",
      },
      {
        name: t("status_delivered", { ns: "orders" }),
        // Assuming deliveredOrders is part of summary in real data, but using completed as proxy if needed, or keeping existing logic
        count: (summary as any).deliveredOrders || 0,
        fill: "hsl(var(--green-500))",
      },
      {
        name: t("status_cancelled", { ns: "orders" }),
        count: summary.cancelledOrders || 0,
        fill: "hsl(var(--destructive))",
      },
    ].filter((item) => item.count > 0); // Only show statuses with data
  }, [summary, t]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title={t("dashboard", { ns: "common" })}
        description={t("dashboardWelcome", { ns: "dashboard" })}
        showRefreshButton
        onRefresh={handleRefresh}
        isRefreshing={isLoadingSummary || isLoadingOrderItemsTrend}
        className="mb-8"
      />

      {summaryError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md mb-6 flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          <p>
            {t("errorLoadingSummary", { ns: "dashboard" })}:{" "}
            {summaryError.message}
          </p>
        </div>
      )}

      {/* --- Stats Cards Grid --- */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("monthlyRevenue", { ns: "dashboard" })}
          value={
            summary?.monthlyRevenue !== undefined
              ? formatCurrency(
                  summary.monthlyRevenue,
                  currencySymbol,
                  i18n.language,
                )
              : undefined
          }
          icon={DollarSign}
          description={t("totalRevenueForCurrentMonth", { ns: "dashboard" })}
          isLoading={isLoadingSummary}
          className="border-l-green-500" // Green accent for money
        />
        <StatCard
          title={t("pendingOrders", { ns: "dashboard" })}
          value={summary?.pendingOrders}
          icon={Hourglass}
          description={t("ordersAwaitingProcessing", { ns: "dashboard" })}
          isLoading={isLoadingSummary}
          className="border-l-yellow-500" // Yellow accent for pending
        />
        <StatCard
          title={t("processingOrders", { ns: "dashboard" })}
          value={summary?.processingOrders}
          icon={Package}
          description={t("ordersInProcessing", { ns: "dashboard" })}
          isLoading={isLoadingSummary}
          className="border-l-blue-500" // Blue accent for processing
        />
        <StatCard
          title={t("cancelledOrders", { ns: "dashboard" })}
          value={summary?.cancelledOrders}
          icon={XCircle}
          description={t("ordersCancelled", { ns: "dashboard" })}
          isLoading={isLoadingSummary}
          className="border-l-red-500" // Red accent for cancelled
        />
      </div>

      {/* --- Charts Section --- */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
        {/* Trend Chart */}
        <Card className="lg:col-span-4 shadow-sm border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t("orderItemsLast7Days", { ns: "dashboard" })}
                </CardTitle>
                <CardDescription>Weekly volume analysis</CardDescription>
              </div>
              <CalendarRange className="h-5 w-5 text-muted-foreground opacity-50" />
            </div>
          </CardHeader>
          <CardContent className="pl-0">
            {isLoadingOrderItemsTrend ? (
              <Skeleton className="w-full h-[350px] m-4" />
            ) : (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={orderItemsTrend}
                    margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorQuantity"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                      tickFormatter={(dateStr) =>
                        format(parseISO(dateStr), "EEE")
                      }
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        boxShadow: "var(--shadow-md)",
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                      labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                      cursor={{
                        stroke: "hsl(var(--muted-foreground))",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalQuantity"
                      name={t("totalQuantity", { ns: "dashboard" })}
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorQuantity)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name={t("orderItems")}
                      stroke="hsl(var(--secondary))"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "hsl(var(--secondary))",
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                      }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Chart */}
        <Card className="lg:col-span-3 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t("orderStatusOverview", { ns: "dashboard" })}
            </CardTitle>
            <CardDescription>Current distribution of orders</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="w-full h-[350px]" />
            ) : (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={orderStatusChartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                      interval={0} // Show all labels
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
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        boxShadow: "var(--shadow-md)",
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Bar
                      dataKey="count"
                      name={t("count", { ns: "common", defaultValue: "Count" })}
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
