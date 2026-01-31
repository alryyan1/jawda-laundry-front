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
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 p-1.5 rounded-full bg-slate-100 text-slate-500">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 space-y-0.5">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </div>
        <div className="text-sm font-semibold text-slate-900">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-4 max-w-2xl mx-auto px-1">
      {/* Order Status Card */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Order #{order.id}</h3>
              <p className="text-xs text-slate-500">
                {order.created_at
                  ? new Date(order.created_at).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "px-2.5 py-0.5 capitalize bg-white",
              paymentStatus.color,
            )}
          >
            {paymentStatus.text}
          </Badge>
        </div>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="p-4 space-y-1">
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
                    ? new Date(order.pickup_date).toLocaleString(i18n.language)
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
                    ? new Date(order.completed_at).toLocaleString(i18n.language)
                    : t("pending", { ns: "common", defaultValue: "Pending" })
                }
              />
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded bg-slate-50/50">
                  <span className="text-sm text-slate-500">Total</span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency(totalAmount, "USD", i18n.language, 3)}
                  </span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-sm text-slate-500">Paid</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(paidAmount, "USD", i18n.language, 3)}
                  </span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-sm text-slate-500">Balance</span>
                  <span className="text-sm font-semibold text-red-600">
                    {formatCurrency(remainingAmount, "USD", i18n.language, 3)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex flex-wrap gap-3">
            <Button
              onClick={onPaymentClick}
              disabled={isProcessing || isFullyPaid}
              className={cn(
                "flex-1 h-10 font-medium shadow-sm",
                isFullyPaid
                  ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                  : "",
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
              className="flex-1 h-10 font-medium bg-white"
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
              className="h-10 w-10 bg-white"
              title="Print Receipt"
            >
              <Printer className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Section */}
      <Card className="shadow-sm border-slate-200 flex-1 flex flex-col overflow-hidden">
        <div
          className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-100/80 transition-colors"
          onClick={() => setShowPaymentHistory(!showPaymentHistory)}
        >
          <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment History ({payments.length})
          </h3>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {showPaymentHistory ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {showPaymentHistory && (
          <ScrollArea className="flex-1 bg-white">
            {payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <DollarSign className="h-6 w-6 opacity-50" />
                </div>
                <p className="text-sm">No payments recorded</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {payments.map((payment, index) => (
                  <div
                    key={payment.id || index}
                    className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center group"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-1 p-1.5 rounded-full",
                          payment.type === "payment"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600",
                        )}
                      >
                        {payment.type === "payment" ? (
                          <DollarSign className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(
                            payment.amount,
                            "USD",
                            i18n.language,
                            3,
                          )}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>{payment.method}</span>
                          <span>•</span>
                          <span>
                            {payment.payment_date
                              ? new Date(
                                  payment.payment_date,
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                        {payment.notes && (
                          <p className="text-xs text-slate-500 mt-1 italic group-hover:text-slate-700">
                            "{payment.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    {payment.transaction_id && (
                      <div className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
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
