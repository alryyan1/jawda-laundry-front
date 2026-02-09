// src/pages/reports/SalesSummaryPage.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, startOfWeek, endOfWeek, startOfDay } from "date-fns";

import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as DollarSignIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as Building2Icon,
} from "@mui/icons-material";

import type { DailyRevenueReport } from "@/types";
import { getDailyRevenueReport } from "@/api/reportService";
import { useCurrency } from "@/hooks/useCurrency";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatCurrency } from "@/lib/formatters";

const StatCard: React.FC<{
  title: string;
  value?: string | number;
  isLoading?: boolean;
  icon: React.ElementType;
  description?: string;
}> = ({ title, value, isLoading, icon: Icon, description }) => (
  <Card>
    <CardHeader
      avatar={
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            bgcolor: "primary.main",
            opacity: 0.1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ color: "primary.main", fontSize: 20 }} />
        </Box>
      }
      title={
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
      }
    />
    <CardContent>
      {isLoading ? (
        <Skeleton variant="text" width={120} height={40} />
      ) : (
        <>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value ?? "-"}
          </Typography>
          {description && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {description}
            </Typography>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

export type ReportPeriod = "day" | "week" | "month";

const SalesSummaryPage: React.FC = () => {
  const { t, i18n } = useTranslation(["reports", "common"]);
  const queryClient = useQueryClient();
  const { currencyCode } = useCurrency();

  const currentDate = new Date();
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(currentDate, "yyyy-MM"),
  );

  const monthYear = selectedMonth.split("-");
  const month = parseInt(monthYear[1], 10);
  const year = parseInt(monthYear[0], 10);

  const getQueryParams = (): { month: number; year: number } | { dateFrom: string; dateTo: string } => {
    const today = new Date();
    if (period === "day") {
      const d = format(startOfDay(today), "yyyy-MM-dd");
      return { dateFrom: d, dateTo: d };
    }
    if (period === "week") {
      const weekStart = startOfWeek(today, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
      return {
        dateFrom: format(weekStart, "yyyy-MM-dd"),
        dateTo: format(weekEnd, "yyyy-MM-dd"),
      };
    }
    return { month, year };
  };

  const queryParams = getQueryParams();
  const queryKey = ["dailyRevenueReport", period, ...(period === "month" ? [month, year] : [queryParams])];
  const {
    data: report,
    isLoading,
    isFetching,
  } = useQuery<DailyRevenueReport, Error>({
    queryKey,
    queryFn: () => getDailyRevenueReport(queryParams),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Box sx={{ maxWidth: "1400px", mx: "auto", p: 3 }}>
      <PageHeader
        title={t("incomeReportTitle", { defaultValue: "Income Report" })}
        description={t("incomeReportDescription", {
          defaultValue: "Daily income breakdown by payment method",
        })}
        showRefreshButton
        onRefresh={() => queryClient.invalidateQueries({ queryKey })}
        isRefreshing={isFetching}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="report-period-label">
              {t("reportPeriod", { ns: "reports", defaultValue: "Report by" })}
            </InputLabel>
            <Select
              labelId="report-period-label"
              id="report-period"
              value={period}
              label={t("reportPeriod", { ns: "reports", defaultValue: "Report by" })}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            >
              <MenuItem value="day">
                {t("reportByDay", { ns: "reports", defaultValue: "Current day" })}
              </MenuItem>
              <MenuItem value="week">
                {t("reportByWeek", { ns: "reports", defaultValue: "This week" })}
              </MenuItem>
              <MenuItem value="month">
                {t("reportByMonth", { ns: "reports", defaultValue: "This month" })}
              </MenuItem>
            </Select>
          </FormControl>
          {period === "month" && (
            <TextField
              id="month"
              label={t("selectMonth", { ns: "reports", defaultValue: "Select Month" })}
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              size="small"
              sx={{ width: 200 }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          )}
        </Box>
      </PageHeader>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t("totalIncome", { defaultValue: "Total Income" })}
            icon={TrendingUpIcon}
            value={
              report?.summary?.total_income !== undefined
                ? formatCurrency(
                    report.summary.total_income,
                    currencyCode,
                    i18n.language,
                    3,
                  )
                : undefined
            }
            isLoading={isLoading}
            description={t("totalIncomeDescription", {
              defaultValue: "Total income from all payment methods",
            })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t("totalCash", { defaultValue: "Total Cash" })}
            icon={DollarSignIcon}
            value={
              report?.summary?.total_cash !== undefined
                ? formatCurrency(
                    report.summary.total_cash,
                    currencyCode,
                    i18n.language,
                    3,
                  )
                : undefined
            }
            isLoading={isLoading}
            description={t("cashDescription", {
              defaultValue: "Total cash payments",
            })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t("totalVisa", { defaultValue: "Total Visa" })}
            icon={CreditCardIcon}
            value={
              report?.summary?.total_visa !== undefined
                ? formatCurrency(
                    report.summary.total_visa,
                    currencyCode,
                    i18n.language,
                    3,
                  )
                : undefined
            }
            isLoading={isLoading}
            description={t("visaDescription", {
              defaultValue: "Total visa card payments",
            })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t("totalBankTransfer", { defaultValue: "Total Bank Transfer" })}
            icon={Building2Icon}
            value={
              report?.summary?.total_bank_transfer !== undefined
                ? formatCurrency(
                    report.summary.total_bank_transfer,
                    currencyCode,
                    i18n.language,
                    3,
                  )
                : undefined
            }
            isLoading={isLoading}
            description={t("bankTransferDescription", {
              defaultValue: "Total bank transfer payments",
            })}
          />
        </Grid>
      </Grid>

      {/* Daily Breakdown Table */}
      <Card>
        <CardHeader
          title={t("dailyIncomeBreakdown", { defaultValue: "Daily Income Breakdown" })}
          subheader={t("dailyIncomeBreakdownDescription", {
            defaultValue: "Daily income by payment method",
          })}
        />
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {t("date", { ns: "reports" })}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {t("totalOrders", { ns: "reports" })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {t("totalIncome", { defaultValue: "Total Income" })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {t("totalCash", { defaultValue: "Cash" })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {t("totalVisa", { defaultValue: "Visa" })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {t("totalBankTransfer", { defaultValue: "Bank Transfer" })}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton variant="rectangular" height={40} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : report?.daily_data?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{ py: 4 }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {t("noDataForPeriod")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  report.daily_data.map((day) => (
                    <TableRow
                      key={day.date}
                      sx={{
                        "&:hover": { bgcolor: "action.hover" },
                        transition: "background-color 0.2s",
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {format(parseISO(day.date), "MMM dd, yyyy")}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontFamily="monospace">
                          {day.order_count}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                          {formatCurrency(
                            day.total_income,
                            currencyCode,
                            i18n.language,
                            3,
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontFamily="monospace">
                          {formatCurrency(
                            day.total_cash,
                            currencyCode,
                            i18n.language,
                            3,
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontFamily="monospace">
                          {formatCurrency(
                            day.total_visa,
                            currencyCode,
                            i18n.language,
                            3,
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontFamily="monospace">
                          {formatCurrency(
                            day.total_bank_transfer,
                            currencyCode,
                            i18n.language,
                            3,
                          )}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};
export default SalesSummaryPage;
