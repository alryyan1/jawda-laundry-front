// src/pages/reports/SalesSummaryPage.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import type { SalesSummaryReport } from "@/types";
import { getSalesSummaryReport } from "@/api/reportService";
import { useAuth } from "@/features/auth/hooks/useAuth";

import { PageHeader } from "@/components/shared/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { TrendingUp, FileText, Package } from "lucide-react";

const StatCard: React.FC<{
  title: string;
  value?: string | number;
  isLoading?: boolean;
  icon: React.ElementType;
}> = ({ title, value, isLoading, icon: Icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div className="text-2xl font-bold">{value ?? "-"}</div>
      )}
    </CardContent>
  </Card>
);

const SalesSummaryPage: React.FC = () => {
  const { t, i18n } = useTranslation(["reports", "common"]);
  const { can } = useAuth();
  const queryClient = useQueryClient();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 29)), // Default to last 30 days
    to: new Date(),
  });

  const queryKey = ["salesSummaryReport", dateRange];
  const {
    data: report,
    isLoading,
    isFetching,
  } = useQuery<SalesSummaryReport, Error>({
    queryKey,
    queryFn: () =>
      getSalesSummaryReport(
        dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined
      ),
    enabled: can("report:view-financial"),
    staleTime: 5 * 60 * 1000,
  });

  if (!can("report:view-financial")) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-destructive">
          {t("accessDeniedTitle", { ns: "common" })}
        </h2>
        <p className="text-muted-foreground">
          {t("accessDeniedMessage", { ns: "common" })}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={t("salesSummaryTitle")}
        description={t("salesSummaryDescription")}
        showRefreshButton
        onRefresh={() => queryClient.invalidateQueries({ queryKey })}
        isRefreshing={isFetching}
      >
        <DatePickerWithRange
          date={dateRange}
          onDateChange={setDateRange}
          className="w-full sm:w-auto"
        />
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard
          title={t("totalRevenue")}
          icon={TrendingUp}
          value={
            report?.summary.total_revenue !== undefined
              ? formatCurrency(
                  report.summary.total_revenue,
                  "USD",
                  i18n.language
                )
              : undefined
          }
          isLoading={isLoading}
        />
        <StatCard
          title={t("totalCompletedOrders", {
            ns: "reports",
            defaultValue: "Completed Orders",
          })}
          icon={FileText}
          value={report?.summary.total_orders}
          isLoading={isLoading}
        />
        <StatCard
          title={t("averageOrderValue")}
          icon={Package}
          value={
            report?.summary.average_order_value !== undefined
              ? formatCurrency(
                  report.summary.average_order_value,
                  "USD",
                  i18n.language
                )
              : undefined
          }
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("topServicesByRevenue")}</CardTitle>
          <CardDescription>
            {t("topServicesDescription", {
              dateFrom: report?.date_range.from
                ? format(parseISO(report.date_range.from), "PPP")
                : "...",
              dateTo: report?.date_range.to
                ? format(parseISO(report.date_range.to), "PPP")
                : "...",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("service", { ns: "services" })}</TableHead>
                  <TableHead className="text-center w-[120px]">
                    {t("quantitySold", { ns: "reports" })}
                  </TableHead>
                  <TableHead className="text-right w-[150px]">
                    {t("revenue")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : report?.top_services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      {t("noDataForPeriod")}
                    </TableCell>
                  </TableRow>
                ) : (
                  report?.top_services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium text-sm">
                        {service.display_name}
                      </TableCell>
                      <TableCell className="text-center">
                        {service.total_quantity}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(
                          service.total_revenue,
                          "USD",
                          i18n.language
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="pl-2">
            {isLoading ? (
              <Skeleton className="w-full h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={report?.top_services}
                  layout="vertical"
                  margin={{ left: 10, right: 30, top: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="display_name"
                    width={150}
                    tick={{ fontSize: 12 }}
                    interval={0}
                    reversed={true}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    formatter={(value: number) =>
                      formatCurrency(value, "USD", i18n.language)
                    }
                    labelStyle={{
                      color: "hsl(var(--foreground))",
                      fontWeight: "bold",
                    }}
                  />
                  <Bar
                    dataKey="total_revenue"
                    name={t("revenue")}
                    radius={[0, 4, 4, 0]}
                    fill="hsl(var(--primary))"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default SalesSummaryPage;
