// src/pages/reports/SalesSummaryPage.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";

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
import { useCurrency } from "@/hooks/useCurrency";

import { PageHeader } from "@/components/shared/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  description?: string;
}> = ({ title, value, isLoading, icon: Icon, description }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <>
          <div className="text-2xl font-bold">{value ?? "-"}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

const SalesSummaryPage: React.FC = () => {
  const { t, i18n } = useTranslation(["reports", "common"]);
  const queryClient = useQueryClient();
  const { currencyCode } = useCurrency();

  const [viewType, setViewType] = useState<"monthly" | "custom">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM"),
  );
  const [dateFrom, setDateFrom] = useState<string>(
    format(
      new Date(new Date().setDate(new Date().getDate() - 29)),
      "yyyy-MM-dd",
    ),
  );
  const [dateTo, setDateTo] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );

  const queryKey = [
    "salesSummaryReport",
    viewType,
    selectedMonth,
    dateFrom,
    dateTo,
  ];
  const {
    data: report,
    isLoading,
    isFetching,
  } = useQuery<SalesSummaryReport, Error>({
    queryKey,
    queryFn: () => {
      if (viewType === "monthly") {
        return getSalesSummaryReport(undefined, undefined, selectedMonth);
      } else {
        return getSalesSummaryReport(
          dateFrom || undefined,
          dateTo || undefined,
        );
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title={t("salesSummaryTitle")}
        description={t("salesSummaryDescription")}
        showRefreshButton
        onRefresh={() => queryClient.invalidateQueries({ queryKey })}
        isRefreshing={isFetching}
      >
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-0 flex flex-col sm:flex-row gap-4 items-end">
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("viewType", { ns: "reports" })}
              </Label>
              <Select
                value={viewType}
                onValueChange={(value: "monthly" | "custom") =>
                  setViewType(value)
                }
              >
                <SelectTrigger className="w-[160px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">
                    {t("monthlyView", { ns: "reports" })}
                  </SelectItem>
                  <SelectItem value="custom">
                    {t("customRange", { ns: "reports" })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {viewType === "monthly" ? (
              <div className="grid gap-1.5">
                <Label
                  htmlFor="month"
                  className="text-xs font-medium text-muted-foreground"
                >
                  {t("selectMonth", { ns: "reports" })}
                </Label>
                <Input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-[180px] bg-background"
                />
              </div>
            ) : (
              <div className="flex gap-2 items-end">
                <div className="grid gap-1.5">
                  <Label
                    htmlFor="date-from"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {t("fromDate", { ns: "reports" })}
                  </Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-[160px] bg-background"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label
                    htmlFor="date-to"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {t("toDate", { ns: "reports" })}
                  </Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-[160px] bg-background"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t("totalRevenue")}
          icon={TrendingUp}
          value={
            report?.summary?.total_revenue !== undefined
              ? formatCurrency(
                  report.summary?.total_revenue,
                  currencyCode,
                  i18n.language,
                  3,
                )
              : undefined
          }
          isLoading={isLoading}
          description={t("revenueDescription", {
            ns: "reports",
            defaultValue: "Gross income from all orders",
          })}
        />
        <StatCard
          title={t("totalCompletedOrders", {
            ns: "reports",
            defaultValue: "Completed Orders",
          })}
          icon={FileText}
          value={report?.summary?.total_orders}
          isLoading={isLoading}
          description={t("ordersDescription", {
            ns: "reports",
            defaultValue: "Total orders processed",
          })}
        />
        <StatCard
          title={t("averageOrderValue")}
          icon={Package}
          value={
            report?.summary?.average_order_value !== undefined
              ? formatCurrency(
                  report.summary?.average_order_value,
                  currencyCode,
                  i18n.language,
                  3,
                )
              : undefined
          }
          isLoading={isLoading}
          description={t("aovDescription", {
            ns: "reports",
            defaultValue: "Average revenue per order",
          })}
        />
      </div>

      {/* Daily Breakdown for Monthly View */}
      {viewType === "monthly" &&
        report?.daily_breakdown &&
        report.daily_breakdown.length > 0 && (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>{t("dailyBreakdown", { ns: "reports" })}</CardTitle>
              <CardDescription>
                {t("dailyBreakdownDescription", { ns: "reports" })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={report.daily_breakdown}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => format(parseISO(val), "d")}
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
                      tickFormatter={(val) =>
                        formatCurrency(val, currencyCode, i18n.language, 0)
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      cursor={{ fill: "hsl(var(--muted)/0.2)" }}
                      labelFormatter={(val) => format(parseISO(val), "PPP")}
                      formatter={(val: number) => [
                        formatCurrency(val, currencyCode, i18n.language),
                        t("revenue"),
                      ]}
                    />
                    <Bar
                      dataKey="total_revenue"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>{t("date", { ns: "reports" })}</TableHead>
                      <TableHead className="text-center">
                        {t("totalOrders", { ns: "reports" })}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("totalRevenue", { ns: "reports" })}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.daily_breakdown.map((day) => (
                      <TableRow
                        key={day.date}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {format(parseISO(day.date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {day.total_orders}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(
                            day.total_revenue,
                            currencyCode,
                            i18n.language,
                            3,
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

      <Card>
        <CardHeader>
          <CardTitle>{t("topServicesByRevenue")}</CardTitle>
          <CardDescription>
            {t("topServicesDescription", {
              dateFrom: report?.date_range?.from
                ? format(parseISO(report.date_range.from), "PPP")
                : "...",
              dateTo: report?.date_range?.to
                ? format(parseISO(report.date_range.to), "PPP")
                : "...",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-10 lg:grid-cols-2">
          <div className="h-[350px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={report?.top_services || []}
                  layout="vertical"
                  margin={{ left: 0, right: 30, top: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="display_name"
                    width={140}
                    tick={{
                      fontSize: 12,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    interval={0}
                    reversed={true}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                    }}
                    cursor={{ fill: "hsl(var(--muted)/0.2)" }}
                    formatter={(value: number) =>
                      formatCurrency(value, currencyCode, i18n.language, 3)
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
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-md border h-full overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50%]">
                    {t("service", { ns: "services" })}
                  </TableHead>
                  <TableHead className="text-center w-[20%]">
                    {t("quantitySold", { ns: "reports" })}
                  </TableHead>
                  <TableHead className="text-right w-[30%]">
                    {t("revenue")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : report?.top_services?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {t("noDataForPeriod")}
                    </TableCell>
                  </TableRow>
                ) : (
                  report?.top_services?.map((service) => (
                    <TableRow key={service.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-sm">
                        {service.display_name}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {service.total_quantity}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(
                          service.total_revenue,
                          currencyCode,
                          i18n.language,
                          3,
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default SalesSummaryPage;
