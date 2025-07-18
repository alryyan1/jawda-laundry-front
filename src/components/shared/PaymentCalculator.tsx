import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useSettings } from "@/context/SettingsContext";
import { getOrderStatistics } from "@/api/orderService";
import { PAYMENT_METHODS } from "@/lib/constants";
import { getTodayDate } from "@/lib/dateUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown, ChevronUp, Loader2, RefreshCw } from "lucide-react";

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
  const currencySymbol = getSetting('currency_symbol', '$');

  // State for date inputs
  const [selectedDateFrom, setSelectedDateFrom] = useState(dateFrom || getTodayDate());
  const [selectedDateTo, setSelectedDateTo] = useState(dateTo || getTodayDate());
  const [isPaymentMethodsExpanded, setIsPaymentMethodsExpanded] = useState(false);

  // Use selected dates or provided dates or default to today
  const effectiveDateFrom = selectedDateFrom;
  const effectiveDateTo = selectedDateTo;

  // Update selected dates when props change
  useEffect(() => {
    if (dateFrom) setSelectedDateFrom(dateFrom);
    if (dateTo) setSelectedDateTo(dateTo);
  }, [dateFrom, dateTo]);

  // Fetch order statistics
  const { data: todayStatistics, refetch, isLoading, isRefetching } = useQuery({
    queryKey: ["orderStatistics", effectiveDateFrom, effectiveDateTo],
    queryFn: () => getOrderStatistics(effectiveDateFrom, effectiveDateTo),
  });

  // Refetch data when dialog opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  // Use backend-calculated data
  const totalPaid = todayStatistics?.totalAmountPaid || 0;
  const breakdown = PAYMENT_METHODS.map(method => {
    const paymentData = todayStatistics?.paymentBreakdown[method as keyof typeof todayStatistics.paymentBreakdown];
    return {
      method,
      amount: paymentData?.amount || 0,
      percentage: paymentData?.percentage || 0
    };
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5" />
              {t("paymentCalculator", { defaultValue: "Payment Calculator" })}
              {(isLoading || isRefetching) && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Date Range Selection */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Label className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {t("selectDateRange", { defaultValue: "Select Date Range" })}
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="dateFrom" className="text-xs text-blue-600 dark:text-blue-400">
                    {t("from", { defaultValue: "From" })}
                  </Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={selectedDateFrom}
                    max={selectedDateTo}
                    onChange={(e) => setSelectedDateFrom(e.target.value)}
                    className="text-sm h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dateTo" className="text-xs text-blue-600 dark:text-blue-400">
                    {t("to", { defaultValue: "To" })}
                  </Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={selectedDateTo}
                    min={selectedDateFrom}
                    onChange={(e) => setSelectedDateTo(e.target.value)}
                    className="text-sm h-8"
                  />
                </div>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {t("dateRange", { defaultValue: "Date Range" })}: {selectedDateFrom} - {selectedDateTo}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const today = getTodayDate();
                    setSelectedDateFrom(today);
                    setSelectedDateTo(today);
                  }}
                  className="text-xs h-6 px-2"
                >
                  {t("today", { defaultValue: "Today" })}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Total Paid Summary */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    {t("totalAmountPaid", { defaultValue: "Total Amount Paid" })}
                  </p>
                  <p className="text-xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(totalPaid, currencySymbol, i18n.language)}
                  </p>
                </div>
                <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {t("paymentBreakdown", { defaultValue: "Payment Breakdown" })}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPaymentMethodsExpanded(!isPaymentMethodsExpanded)}
                  className="h-6 w-6 p-0"
                >
                  {isPaymentMethodsExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            {isPaymentMethodsExpanded && (
              <CardContent className="pt-0 space-y-2">
                {breakdown.map((item) => (
                  <div key={item.method} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                        {t(`paymentMethod_${item.method}`, { defaultValue: item.method })}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.amount, currencySymbol, i18n.language)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          {/* Orders Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {t("ordersSummary", { defaultValue: "Orders Summary" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t("totalOrders", { defaultValue: "Total Orders" })}
                </span>
                <span className="text-sm font-semibold">
                  {todayStatistics?.totalOrders || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t("totalAmountPaid", { defaultValue: "Total Amount Paid" })}
                </span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-500">
                  {formatCurrency(totalPaid, currencySymbol, i18n.language)}
                </span>
              </div>
              {todayStatistics && (
                <div className="flex justify-between border-t pt-1.5">
                  <span className="text-sm font-medium">
                    {t("averagePerOrder", { defaultValue: "Average Per Order" })}
                  </span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-500">
                    {formatCurrency(
                      todayStatistics.averagePerOrder, 
                      currencySymbol, 
                      i18n.language
                    )}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentCalculator; 