import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  CreditCard,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  Printer,
  User,
  Phone,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { Order, Payment } from "@/types";
import { cn } from "@/lib/utils";

interface ActionsComponentProps {
  order: Order;
  onPaymentClick: () => void;
  onInvoiceClick: () => void;
  onPdfClick: () => void;
  onWhatsAppTextClick?: () => void;
  isProcessing: boolean;
  isSendingInvoice?: boolean;
  isSendingMessage?: boolean;
}

export const ActionsComponent: React.FC<ActionsComponentProps> = ({
  order,
  onPaymentClick,
  onInvoiceClick,
  onPdfClick,
  onWhatsAppTextClick,
  isProcessing,
  isSendingInvoice = false,
  isSendingMessage = false,
}) => {
  const { t, i18n } = useTranslation(["common", "orders"]);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  const totalAmount = order.total_amount || 0;
  const payments = order.payments || [];

  const paidAmountFromPayments = payments
    .filter((payment) => payment.type === "payment")
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  const paidAmount = Math.max(order.paid_amount || 0, paidAmountFromPayments);
  const remainingAmount = totalAmount - paidAmount;

  const isFullyPaid = totalAmount > 0 && paidAmount >= totalAmount;
  const hasPartialPayment = paidAmount > 0 && paidAmount < totalAmount;

  const getPaymentStatusDisplay = () => {
    if (isFullyPaid)
      return {
        text: t("fullyPaid", { ns: "orders", defaultValue: "Fully Paid" }),
        variant: "success" as const,
        color: "text-green-700 bg-green-50 border-green-200",
      };
    if (hasPartialPayment)
      return {
        text: t("partiallyPaid", {
          ns: "orders",
          defaultValue: "Partially Paid",
        }),
        variant: "default" as const,
        color: "text-blue-700 bg-blue-50 border-blue-200",
      };
    return {
      text: t("unpaid", { ns: "orders", defaultValue: "Unpaid" }),
      variant: "destructive" as const,
      color: "text-red-700 bg-red-50 border-red-200",
    };
  };

  const paymentStatus = getPaymentStatusDisplay();

  const InfoRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: string;
  }) => (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 p-2 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/50 text-slate-600 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </div>
        <div className="text-sm font-semibold text-slate-900 leading-tight">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-5 max-w-2xl mx-auto px-2">
      {/* Order Status Card */}
      <Card className="shadow-md border-slate-200/80 overflow-hidden bg-white">
        <div className="bg-gradient-to-r from-slate-50 via-slate-50 to-white border-b border-slate-200/60 p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 flex items-center justify-center text-blue-600 shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 tracking-tight">
                Order #{order.id}
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                {order.created_at
                  ? new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "px-3 py-1.5 capitalize bg-white font-semibold text-xs shadow-sm border-2",
              paymentStatus.color,
            )}
          >
            {paymentStatus.text}
          </Badge>
        </div>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/60">
            <div className="p-5 space-y-1 bg-slate-50/30">
              <InfoRow
                icon={User}
                label={t("customer", {
                  ns: "common",
                  defaultValue: "Customer",
                })}
                value={
                  order.customer?.name || t("guest", { defaultValue: "Guest" })
                }
              />
              <InfoRow
                icon={Phone}
                label={t("phone", { ns: "common", defaultValue: "Phone" })}
                value={
                  order.customer?.phone ||
                  t("notAvailable", { defaultValue: "N/A" })
                }
              />
              <InfoRow
                icon={Clock}
                label={t("pickupDate", {
                  ns: "orders",
                  defaultValue: "Pickup Date",
                })}
                value={
                  order.pickup_date
                    ? new Date(order.pickup_date).toLocaleString(i18n.language, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : t("notSet", { ns: "common", defaultValue: "Not set" })
                }
              />
              <InfoRow
                icon={CheckCircle}
                label={t("completedAt", {
                  ns: "orders",
                  defaultValue: "Completed",
                })}
                value={
                  order.completed_at
                    ? new Date(order.completed_at).toLocaleString(i18n.language, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : t("pending", { ns: "common", defaultValue: "Pending" })
                }
              />
            </div>
            <div className="p-5 bg-white">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3.5 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/50 shadow-sm">
                  <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    Total
                  </span>
                  <span className="text-xl font-bold text-slate-900">
                    {formatCurrency(totalAmount, "USD", i18n.language, 3)}
                  </span>
                </div>
                <div className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-green-50/50 border border-green-200/50">
                  <span className="text-sm font-medium text-slate-600">Paid</span>
                  <span className="text-base font-bold text-green-700">
                    {formatCurrency(paidAmount, "USD", i18n.language, 3)}
                  </span>
                </div>
                <div className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-red-50/50 border border-red-200/50">
                  <span className="text-sm font-medium text-slate-600">Balance</span>
                  <span className="text-base font-bold text-red-700">
                    {formatCurrency(remainingAmount, "USD", i18n.language, 3)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 p-5 border-t border-slate-200/60 flex flex-wrap gap-3">
            <Button
              onClick={onPaymentClick}
              disabled={isProcessing || isFullyPaid}
              className={cn(
                "flex-1 h-11 font-semibold shadow-md transition-all duration-200",
                isFullyPaid
                  ? "bg-green-100 text-green-700 border-2 border-green-300 hover:bg-green-200 hover:shadow-lg cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50 hover:shadow-lg",
              )}
              variant={isFullyPaid ? "secondary" : "default"}
            >
              {isFullyPaid ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <DollarSign className="mr-2 h-4 w-4" />
              )}
              {isFullyPaid ? "Paid in Full" : "Add Payment"}
            </Button>

            <Button
              onClick={onInvoiceClick}
              disabled={isProcessing || isSendingInvoice}
              variant="outline"
              className="flex-1 h-11 font-semibold bg-white border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {isSendingInvoice ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <WhatsAppIcon className="mr-2 h-4 w-4 text-green-600" />
              )}
              WhatsApp Invoice
            </Button>

            <Button
              onClick={onPdfClick}
              variant="outline"
              size="icon"
              className="h-11 w-11 bg-white border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm hover:shadow-md transition-all duration-200"
              title="Print Receipt"
            >
              <Printer className="h-4 w-4 text-slate-700" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Section */}
      <Card className="shadow-md border-slate-200/80 flex-1 flex flex-col overflow-hidden bg-white">
        <div
          className="p-5 bg-gradient-to-r from-slate-50 via-slate-50 to-white border-b border-slate-200/60 flex justify-between items-center cursor-pointer hover:bg-slate-100/60 transition-all duration-200"
          onClick={() => setShowPaymentHistory(!showPaymentHistory)}
        >
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200/50">
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
            Payment History ({payments.length})
          </h3>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-200/50 rounded-lg">
            {showPaymentHistory ? (
              <ChevronUp className="h-4 w-4 text-slate-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-600" />
            )}
          </Button>
        </div>

        {showPaymentHistory && (
          <ScrollArea className="flex-1 bg-white">
            {payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/50 flex items-center justify-center mb-4 shadow-sm">
                  <DollarSign className="h-7 w-7 opacity-60" />
                </div>
                <p className="text-sm font-medium">No payments recorded</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200/60">
                {payments.map((payment, index) => (
                  <div
                    key={payment.id || index}
                    className="p-5 hover:bg-slate-50/50 transition-all duration-200 flex justify-between items-center group border-l-4 border-transparent hover:border-l-blue-400"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "mt-0.5 p-2.5 rounded-xl shadow-sm border",
                          payment.type === "payment"
                            ? "bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border-green-200/50"
                            : "bg-gradient-to-br from-red-50 to-rose-50 text-red-700 border-red-200/50",
                        )}
                      >
                        {payment.type === "payment" ? (
                          <DollarSign className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-base text-slate-900 mb-1">
                          {formatCurrency(
                            payment.amount,
                            "USD",
                            i18n.language,
                            3,
                          )}
                        </p>
                        <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600 mt-1.5">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                            {payment.method}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span>
                            {payment.payment_date
                              ? new Date(
                                  payment.payment_date,
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "N/A"}
                          </span>
                        </div>
                        {payment.notes && (
                          <p className="text-xs text-slate-500 mt-2 italic group-hover:text-slate-700 leading-relaxed">
                            "{payment.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    {payment.transaction_id && (
                      <div className="text-xs font-mono bg-slate-100/80 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200/50 shadow-sm">
                        {payment.transaction_id}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </Card>
    </div>
  );
};
