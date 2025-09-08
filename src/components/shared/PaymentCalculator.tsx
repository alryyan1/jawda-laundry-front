import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useSettings } from "@/context/SettingsContext";
import { getOrderStatistics, getCurrentShift, openShift, closeShift, getPreviousShift, getNextShift, getLatestShift } from "@/api/orderService";
import { PAYMENT_METHODS } from "@/lib/constants";
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
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

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

  // Shift navigation state only
  const [isPaymentMethodsExpanded, setIsPaymentMethodsExpanded] = useState(false);
  const [currentShift, setCurrentShift] = useState<{ id: number; opened_at: string; closed_at: string | null; opening_cash: number; closing_cash: number | null } | null>(null);
  const [openShiftInfo, setOpenShiftInfo] = useState<{ id: number; opened_at: string; closed_at: string | null; opening_cash: number; closing_cash: number | null } | null>(null);
  const [openingCash, setOpeningCash] = useState<string>("");
  const [closingCash, setClosingCash] = useState<string>("");
  const [isShiftActionLoading, setIsShiftActionLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    // Load open shift, and select it; if none, select latest
    getCurrentShift()
      .then(async (s) => {
        setOpenShiftInfo(s);
        if (s) {
          setCurrentShift(s);
        } else {
          const latest = await getLatestShift();
          setCurrentShift(latest);
        }
      })
      .catch(() => {
        setOpenShiftInfo(null);
        setCurrentShift(null);
      });
  }, [isOpen]);

  // Fetch order statistics
  const { data: todayStatistics, refetch, isLoading, isRefetching } = useQuery({
    queryKey: ["orderStatistics", currentShift?.id ?? null],
    queryFn: () => getOrderStatistics(undefined, undefined, currentShift?.id ?? undefined),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    enabled: isOpen, // Only fetch when dialog is open
  });

  // Refetch each time dialog opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  // Only refetch data when dialog opens if explicitly needed
  // Removed automatic refetch to prevent unnecessary statistics requests

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
          <div className="grid grid-cols-3 items-center">
            <div className="flex items-center gap-2">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5" />
                {t("paymentCalculator", { defaultValue: "Payment Calculator" })}
                {(isLoading || isRefetching) && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </DialogTitle>
            </div>
            <div className="flex flex-col items-center justify-center">
              {currentShift ? (
                <>
                  <span className="text-sm font-semibold">
                    {t("shift", { defaultValue: "Shift" })} #{currentShift.id}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("opened", { defaultValue: "Opened" })}: {new Date(currentShift.opened_at).toLocaleString()}{currentShift.closed_at ? `  •  ${t("closed", { defaultValue: "Closed" })}: ${new Date(currentShift.closed_at).toLocaleString()}` : ''}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">{t("noOpenShift", { defaultValue: "No open shift" })}</span>
              )}
            </div>
            <div className="flex items-center justify-end">
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
          </div>
        </DialogHeader>
        {/* Shift Controls */}
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 mb-2">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  {t("shiftStatus", { defaultValue: "Shift Status" })}
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                  {currentShift ? t("openSince", { defaultValue: "Open since" }) + ` ${new Date(currentShift.opened_at).toLocaleString()}` : t("noOpenShift", { defaultValue: "No open shift" })}
                </p>
                {currentShift && (
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                    {t("openingCash", { defaultValue: "Opening cash" })}: {formatCurrency(Number(currentShift.opening_cash || 0), currencySymbol, i18n.language)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!openShiftInfo ? (
                  <>
                    <Input
                      placeholder={t("openingCash", { defaultValue: "Opening cash" })}
                      value={openingCash}
                      onChange={(e) => setOpeningCash(e.target.value)}
                      className="h-8 w-28"
                      type="number"
                      min="0"
                    />
                    <Button
                      size="sm"
                      onClick={async () => {
                        setIsShiftActionLoading(true);
                        try {
                          const cash = openingCash.trim() === '' ? undefined : Number(openingCash);
                          await openShift({ opening_cash: cash });
                          const s = await getCurrentShift();
                          setOpenShiftInfo(s);
                          setCurrentShift(s);
                        } finally {
                          setIsShiftActionLoading(false);
                        }
                      }}
                      disabled={isShiftActionLoading}
                      className="h-8"
                    >
                      {t("openShift", { defaultValue: "Open Shift" })}
                    </Button>
                  </>
                ) : (currentShift && openShiftInfo && currentShift.id === openShiftInfo.id ? (
                  <>
                    <Input
                      placeholder={t("closingCash", { defaultValue: "Closing cash" })}
                      value={closingCash}
                      onChange={(e) => setClosingCash(e.target.value)}
                      className="h-8 w-28"
                      type="number"
                      min="0"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        setIsShiftActionLoading(true);
                        try {
                          const cash = closingCash.trim() === '' ? undefined : Number(closingCash);
                          await closeShift({ closing_cash: cash });
                          const s = await getCurrentShift();
                          setOpenShiftInfo(s);
                          setCurrentShift(s || currentShift);
                        } finally {
                          setIsShiftActionLoading(false);
                        }
                      }}
                      disabled={isShiftActionLoading}
                      className="h-8"
                    >
                      {t("closeShift", { defaultValue: "Close Shift" })}
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">{t("viewingClosedShift", { defaultValue: "Viewing closed shift" })}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {/* Shift Navigator Card */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={!currentShift}
                  onClick={async () => {
                    if (!currentShift) return;
                    const prev = await getPreviousShift(currentShift.id);
                    if (prev) setCurrentShift(prev);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <div className="text-2xl font-bold leading-none">{currentShift ? `#${currentShift.id}` : '--'}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={!currentShift}
                  onClick={async () => {
                    if (!currentShift) return;
                    const nxt = await getNextShift(currentShift.id);
                    if (nxt) setCurrentShift(nxt);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
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

      
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentCalculator; 