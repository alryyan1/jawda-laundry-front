import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export type PaymentBreakdownItem = { method: string; amount: number; percentage: number };

type PaymentBreakdownDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalPaid: number;
  breakdown: PaymentBreakdownItem[];
  currencySymbol: string;
  t: (key: string, options?: any) => string;
  language: string;
  dateFrom?: string;
  dateTo?: string;
};

export const PaymentBreakdownDialog: React.FC<PaymentBreakdownDialogProps> = ({
  isOpen,
  onOpenChange,
  totalPaid,
  breakdown,
  currencySymbol,
  t,
  language,
  dateFrom,
  dateTo,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t("paymentBreakdown", { defaultValue: "Payment Breakdown" })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    {t("totalAmountPaid", { defaultValue: "Total Amount Paid" })}
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(totalPaid, currencySymbol, language, 3)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("paymentMethods", { defaultValue: "Payment Methods" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {breakdown.map((item) => (
                <div key={item.method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                      {t(`paymentMethod_${item.method}`, { defaultValue: item.method })}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.amount, currencySymbol, language, 3)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {(dateFrom || dateTo) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("dateRange", { defaultValue: "Date Range" })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t("from", { defaultValue: "From" })}: {dateFrom || "-"}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t("to", { defaultValue: "To" })}: {dateTo || "-"}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentBreakdownDialog;

