import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/formatters";
import { useSettings } from "@/context/SettingsContext";
import { getOrderStatistics } from "@/api/orderService";
import { PAYMENT_METHODS } from "@/lib/constants";
import { getTodayDate } from "@/lib/dateUtils";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Calculator,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Wallet,
  TrendingUp,
  CreditCard,
  Banknote,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentCalculatorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dateFrom?: string;
  dateTo?: string;
}

const PaymentCalculator: React.FC<PaymentCalculatorProps> = ({
  isOpen,
  onOpenChange,
  dateFrom,
  dateTo,
}) => {
  const { t, i18n } = useTranslation(["common", "orders"]);
  const { getSetting } = useSettings();
  const currencySymbol = getSetting("currency_symbol", "$");

  const [selectedDateFrom, setSelectedDateFrom] = useState(
    dateFrom || getTodayDate(),
  );
  const [selectedDateTo, setSelectedDateTo] = useState(
    dateTo || getTodayDate(),
  );
  const [isPaymentMethodsExpanded, setIsPaymentMethodsExpanded] =
    useState(true);

  // Update selected dates when props change
  useEffect(() => {
    if (dateFrom) setSelectedDateFrom(dateFrom);
    if (dateTo) setSelectedDateTo(dateTo);
  }, [dateFrom, dateTo]);

  // Fetch order statistics
  const {
    data: todayStatistics,
    refetch,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ["orderStatistics", selectedDateFrom, selectedDateTo],
    queryFn: () => getOrderStatistics(selectedDateFrom, selectedDateTo),
  });

  // Refetch data when dialog opens
  useEffect(() => {
    if (isOpen) refetch();
  }, [isOpen, refetch]);

  const totalPaid = todayStatistics?.totalAmountPaid || 0;
  const breakdown = PAYMENT_METHODS.map((method) => {
    const paymentData =
      todayStatistics?.paymentBreakdown[
        method as keyof typeof todayStatistics.paymentBreakdown
      ];
    return {
      method,
      amount: paymentData?.amount || 0,
      percentage: paymentData?.percentage || 0,
    };
  }).sort((a, b) => b.amount - a.amount); // Sort by amount descending

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-slate-50">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center justify-between shadow-sm">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Calculator className="h-5 w-5" />
            </div>
            {t("paymentCalculator", { defaultValue: "Payment Calculator" })}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors"
            title="Refresh Data"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Date Range Controls */}
          <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="space-y-1.5">
              <Label
                htmlFor="dateFrom"
                className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                From Date
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={selectedDateFrom}
                max={selectedDateTo}
                onChange={(e) => setSelectedDateFrom(e.target.value)}
                className="h-9 text-sm font-medium border-slate-200 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="dateTo"
                className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                To Date
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={selectedDateTo}
                min={selectedDateFrom}
                onChange={(e) => setSelectedDateTo(e.target.value)}
                className="h-9 text-sm font-medium border-slate-200 focus:ring-primary/20"
              />
            </div>

            <div className="col-span-2 flex justify-end pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const today = getTodayDate();
                  setSelectedDateFrom(today);
                  setSelectedDateTo(today);
                }}
                className="text-xs h-7 px-3 border-dashed border-slate-300 text-slate-600 hover:text-primary hover:border-primary"
              >
                Reset to Today
              </Button>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Total Paid */}
            <Card className="border-0 shadow-md bg-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Wallet className="h-16 w-16 text-primary" />
              </div>
              <CardContent className="p-4 relative">
                <p className="text-sm font-medium text-slate-500 mb-1">
                  {t("totalAmountPaid", { defaultValue: "Total Received" })}
                </p>
                <p className="text-2xl font-bold text-primary tracking-tight">
                  {formatCurrency(totalPaid, currencySymbol, i18n.language)}
                </p>
                <div className="mt-2 text-xs flex items-center gap-1 text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full font-medium">
                  <TrendingUp className="h-3 w-3" />
                  Net Revenue
                </div>
              </CardContent>
            </Card>

            {/* Orders Overview */}
            <Card className="border-0 shadow-sm bg-white border border-slate-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Total Orders</span>
                  <Badge
                    variant="secondary"
                    className="font-bold text-slate-700"
                  >
                    {todayStatistics?.totalOrders || 0}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 pt-1">
                    Avg. Ticket
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(
                      todayStatistics?.averagePerOrder || 0,
                      currencySymbol,
                      i18n.language,
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Breakdown */}
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
            <div
              className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() =>
                setIsPaymentMethodsExpanded(!isPaymentMethodsExpanded)
              }
            >
              <div className="flex items-center gap-2 font-semibold text-slate-700 text-sm">
                <Receipt className="h-4 w-4 text-slate-500" />
                {t("paymentBreakdown", { defaultValue: "Payment Methods" })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-full"
              >
                {isPaymentMethodsExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {isPaymentMethodsExpanded && (
              <div className="divide-y divide-slate-50 bg-white">
                {breakdown.length > 0 ? (
                  breakdown.map((item) => (
                    <div
                      key={item.method}
                      className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center border",
                            item.amount > 0
                              ? "bg-blue-50 border-blue-100 text-blue-600"
                              : "bg-slate-50 border-slate-100 text-slate-400",
                          )}
                        >
                          {item.method === "cash" ? (
                            <Banknote className="h-4 w-4" />
                          ) : (
                            <CreditCard className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 capitalize">
                            {t(`paymentMethod_${item.method}`, {
                              defaultValue: item.method,
                            })}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {item.percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-bold tabular-nums",
                          item.amount > 0 ? "text-slate-900" : "text-slate-300",
                        )}
                      >
                        {formatCurrency(
                          item.amount,
                          currencySymbol,
                          i18n.language,
                        )}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No payment data available for this period.
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentCalculator;
