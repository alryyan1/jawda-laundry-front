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
  PieChart,
  Pie,
  Cell,
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
  TrendingUp,
  BarChart3,
  Calendar,
  Clock,
  CalendarDays,
} from "lucide-react";

import {
  fetchDashboardSummary,
  fetchOrderItemsTrend,
  fetchTopProducts,
} from "@/api/dashboardService";
import type { DashboardSummary, OrderItemTrendItem, TopProductItem } from "@/types";
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

  const {
    data: topProducts,
    isLoading: isLoadingTopProducts,
    refetch: refetchTopProducts,
  } = useQuery<TopProductItem[], Error>({
    queryKey: ["topProducts"],
    queryFn: fetchTopProducts,
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = () => {
    refetchSummary();
    refetchOrderItemsTrend();
    refetchTopProducts();
  };

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];



  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <PageHeader
        title={t("dashboard", { ns: "common" })}
        description={t("dashboardWelcome", { ns: "dashboard" })}
        showRefreshButton
        onRefresh={handleRefresh}
        isRefreshing={isLoadingSummary || isLoadingOrderItemsTrend || isLoadingTopProducts}
      />

      {summaryError && (
        <p className="text-destructive mb-4">
          {t("errorLoadingSummary", { ns: "dashboard" })}:{" "}
          {summaryError.message}
        </p>
      )}

      {/* --- Order Count Cards --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard
          title={t("ordersToday", { ns: "dashboard", defaultValue: "Orders Today" })}
          value={summary?.totalOrdersToday || 0}
          icon={Clock}
          description={t("totalOrdersForToday", { ns: "dashboard", defaultValue: "Total orders for today" })}
          isLoading={isLoadingSummary}
        />
        <StatCard
          title={t("ordersThisWeek", { ns: "dashboard", defaultValue: "Orders This Week" })}
          value={summary?.totalOrdersThisWeek || 0}
          icon={CalendarDays}
          description={t("totalOrdersForThisWeek", { ns: "dashboard", defaultValue: "Total orders for this week" })}
          isLoading={isLoadingSummary}
        />
        <StatCard
          title={t("ordersThisMonth", { ns: "dashboard", defaultValue: "Orders This Month" })}
          value={summary?.totalOrdersThisMonth || 0}
          icon={Calendar}
          description={t("totalOrdersForThisMonth", { ns: "dashboard", defaultValue: "Total orders for this month" })}
          isLoading={isLoadingSummary}
        />
      </div>

      {/* --- Revenue Cards --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard
          title={t("revenueToday", { ns: "dashboard", defaultValue: "Revenue Today" })}
          value={
            summary?.totalRevenueToday !== undefined
              ? formatCurrency(summary.totalRevenueToday, currencySymbol, i18n.language)
              : undefined
          }
          icon={DollarSign}
          description={t("totalRevenueForToday", { ns: "dashboard", defaultValue: "Total revenue for today" })}
          isLoading={isLoadingSummary}
        />
        <StatCard
          title={t("revenueThisWeek", { ns: "dashboard", defaultValue: "Revenue This Week" })}
          value={
            summary?.totalRevenueThisWeek !== undefined
              ? formatCurrency(summary.totalRevenueThisWeek, currencySymbol, i18n.language)
              : undefined
          }
          icon={DollarSign}
          description={t("totalRevenueForThisWeek", { ns: "dashboard", defaultValue: "Total revenue for this week" })}
          isLoading={isLoadingSummary}
        />
        <StatCard
          title={t("revenueThisMonth", { ns: "dashboard", defaultValue: "Revenue This Month" })}
          value={
            summary?.totalRevenueThisMonth !== undefined
              ? formatCurrency(summary.totalRevenueThisMonth, currencySymbol, i18n.language)
              : undefined
          }
          icon={DollarSign}
          description={t("totalRevenueForThisMonth", { ns: "dashboard", defaultValue: "Total revenue for this month" })}
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
              {t("topProducts", { ns: "dashboard", defaultValue: "Top 5 Requested Products" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTopProducts ? (
              <Skeleton className="w-full h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topProducts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {topProducts?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} orders`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
