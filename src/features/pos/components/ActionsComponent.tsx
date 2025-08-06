import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Receipt, 
  DollarSign, 
  Calendar,
  User,
  FileText
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { Order, Payment } from "@/types";

interface ActionsComponentProps {
  order: Order;
  onPaymentClick: () => void;
  onInvoiceClick: () => void;
  onPdfClick: () => void;
  isProcessing: boolean;
}

export const ActionsComponent: React.FC<ActionsComponentProps> = ({
  order,
  onPaymentClick,
  onInvoiceClick,
  onPdfClick,
  isProcessing,
}) => {
  const { t, i18n } = useTranslation(["common", "orders"]);

  const totalAmount = order.total_amount || 0;
  const paidAmount = order.paid_amount || 0;
  const remainingAmount = totalAmount - paidAmount;
  const isFullyPaid = paidAmount >= totalAmount;

  return (
    <div className="flex flex-col h-full">
      {/* Top Section: Payment Actions */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("paymentActions", { ns: "orders", defaultValue: "Payment Actions" })}
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Record Payment Button */}
            <Button
              onClick={onPaymentClick}
              disabled={isProcessing || isFullyPaid}
              className="h-12 flex flex-col items-center justify-center gap-1"
              variant={isFullyPaid ? "secondary" : "default"}
            >
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">
                {isFullyPaid 
                  ? t("fullyPaid", { ns: "orders", defaultValue: "Fully Paid" })
                  : t("recordPayment", { ns: "orders", defaultValue: "Record Payment" })
                }
              </span>
            </Button>

            {/* Send Invoice Button */}
            <Button
              onClick={onInvoiceClick}
              disabled={isProcessing}
              variant="outline"
              className="h-12 flex flex-col items-center justify-center gap-1"
            >
              <Receipt className="h-4 w-4" />
              <span className="text-xs">
                {t("sendInvoice", { ns: "orders", defaultValue: "Send Invoice" })}
              </span>
            </Button>
          </div>

          {/* Payment Summary */}
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                {t("totalAmount", { ns: "orders", defaultValue: "Total Amount" })}:
              </span>
              <span className="font-semibold">
                {formatCurrency(totalAmount, "USD", i18n.language, 3)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                {t("paidAmount", { ns: "orders", defaultValue: "Paid Amount" })}:
              </span>
              <span className="font-semibold text-green-600">
                {formatCurrency(paidAmount, "USD", i18n.language, 3)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {t("remainingAmount", { ns: "orders", defaultValue: "Remaining" })}:
              </span>
              <span className={`font-semibold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(remainingAmount, "USD", i18n.language, 3)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section: Payment History */}
      <Card className="flex-1">
        <CardContent className="p-4 h-full flex flex-col">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("paymentHistory", { ns: "orders", defaultValue: "Payment History" })}
          </h3>

          <ScrollArea className="flex-1">
            {order.payments && order.payments.length > 0 ? (
              <div className="space-y-3">
                {order.payments.map((payment: Payment, index: number) => (
                  <div key={payment.id || index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">
                          {formatCurrency(payment.amount_paid, "USD", i18n.language, 3)}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {payment.payment_method}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      {payment.payment_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {payment.transaction_id && (
                        <div className="text-xs">
                          {t("transactionId", { ns: "orders", defaultValue: "Transaction ID" })}: {payment.transaction_id}
                        </div>
                      )}
                      
                      {payment.notes && (
                        <div className="text-xs italic">
                          {payment.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <DollarSign className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">
                  {t("noPaymentsYet", { ns: "orders", defaultValue: "No payments recorded yet" })}
                </p>
                <p className="text-xs mt-1">
                  {t("recordFirstPayment", { ns: "orders", defaultValue: "Record the first payment using the button above" })}
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Quick Actions Footer */}
          <div className="mt-4 pt-3 border-t">
            <Button
              onClick={onPdfClick}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={isProcessing}
            >
              <Receipt className="h-4 w-4 mr-2" />
              {t("viewReceipt", { ns: "orders", defaultValue: "View Receipt" })}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 