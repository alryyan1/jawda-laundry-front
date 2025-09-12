import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
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
  Printer
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { ORDER_STATUSES } from "@/lib/constants";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { OrderStatusBadgeComponent } from './OrderStatusBadge';
import { updateOrderStatus, enqueueOrderPrintJob } from "@/api/orderService";
import type { Order, Payment, OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

interface ActionsComponentProps {
  order: Order;
  onPaymentClick: () => void;
  onInvoiceClick: () => void;
  onPdfClick: () => void;
  isProcessing: boolean;
  isSendingInvoice?: boolean;
  onOrderUpdate?: (updatedOrder: Order | null) => void;
}

export const ActionsComponent: React.FC<ActionsComponentProps> = ({
  order,
  onPaymentClick,
  onInvoiceClick,
  onPdfClick,
  isProcessing,
  isSendingInvoice = false,
  onOrderUpdate,
}) => {
  const { t, i18n } = useTranslation(["common", "orders"]);
  const { can } = useAuth();
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Mutation for updating order status
  const updateStatusMutation = useMutation<
    { order: Order },
    Error,
    { orderId: string | number; status: OrderStatus }
  >({
    mutationFn: ({ orderId, status }) => updateOrderStatus(orderId, status),
    onSuccess: async (response) => {
      toast.success(t("orderStatusUpdatedSuccess", {
        ns: "orders",
        status: t(`status_${response.order.status}`, { ns: "orders" }),
      }));
      
      // Update the selected order if it's the same one
      if (order && order.id === response.order.id) {
        onOrderUpdate?.(response.order);
        
        // If the order was completed, automatically reset to new order mode after a short delay
        if (response.order.status === 'completed') {
          setTimeout(() => {
            onOrderUpdate?.(null);
          }, 2000); // 2 second delay to show completion status
        }
      }
    },
    onError: (error) => {
      toast.error(
        error.message || t("orderStatusUpdateFailed", { ns: "orders" })
      );
    },
  });

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (order && newStatus !== order.status) {
      updateStatusMutation.mutate({ orderId: order.id, status: newStatus });
    }
  };

  // Calculate payment totals from actual payments array
  const totalAmount = order.total_amount || 0;
  const payments = order.payments || [];
   console.log(order,'order in actions component')
  // Calculate paid amount from payments array (more accurate)
  const paidAmountFromPayments = payments
    .filter(payment => payment.type === 'payment')
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);
  
  // Use the higher value between order.paid_amount and calculated payments
  const paidAmount = Math.max(order.paid_amount || 0, paidAmountFromPayments);
  const remainingAmount = totalAmount - paidAmount;
  
  // More accurate payment status calculation
  const isFullyPaid = totalAmount > 0 && paidAmount >= totalAmount;
  const hasPartialPayment = paidAmount > 0 && paidAmount < totalAmount;

  // Get payment status for display
  const getPaymentStatusDisplay = () => {
    if (isFullyPaid) return { text: t("fullyPaid", { ns: "orders", defaultValue: "Fully Paid" }), variant: "success" as const };
    if (hasPartialPayment) return { text: t("partiallyPaid", { ns: "orders", defaultValue: "Partially Paid" }), variant: "default" as const };
    return { text: t("unpaid", { ns: "orders", defaultValue: "Unpaid" }), variant: "destructive" as const };
  };

  const paymentStatus = getPaymentStatusDisplay();

  return (
    <ScrollArea className="h-[calc(100vh-200px)] max-w-[400px] w-full">
      <div className="flex flex-col space-y-3 divide-y divide-gray-200 dark:divide-gray-800">
      {/* Order Status and Actions Section */}
      <div className="shadow-sm rounded-md bg-white dark:bg-gray-900">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              {t("orderStatus", { ns: "orders", defaultValue: "Order Status" })}
            </h3>
            <OrderStatusBadgeComponent
              status={order.status}
              className="text-sm px-2 py-1"
            />
          </div>
          
          {/* Status Change Section */}
          {can("order:update-status") && (
            <div className="flex items-center gap-2 mb-3">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">
                {t("changeStatus", { ns: "orders", defaultValue: "Change Status" })}:
              </Label>
              <Select
                value={order.status}
                onValueChange={(newStatus: OrderStatus) =>
                  handleStatusChange(newStatus)
                }
                disabled={updateStatusMutation.isPending || order.status === 'completed' || order.status === 'cancelled'}
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue
                    placeholder={t("changeStatus", { ns: "orders" })}
                  />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`status.${status}`, { ns: "services" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {updateStatusMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </div>
          )}

          {/* Print and Download Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onPdfClick}
              variant="outline"
              className="flex-1 h-8 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              disabled={isProcessing}
            >
              <Printer className="h-4 w-4 mr-1" />
              {t("printReceipt", { ns: "orders", defaultValue: "Print Receipt" })}
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await enqueueOrderPrintJob(order.id);
                  toast.success(t("printJobQueued", { ns: "orders", defaultValue: "Print job queued" }));
                } catch (e) {
                  const message = e instanceof Error ? e.message : String(e);
                  toast.error(message || t("printJobFailed", { ns: "orders", defaultValue: "Failed to queue print job" }));
                }
              }}
              className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white"
              disabled={isProcessing}
            >
              <Printer className="h-4 w-4 mr-1" />
              {t("sendToPrinter", { ns: "orders", defaultValue: "Send to Printer" })}
            </Button>
          </div>
        </div>
      </div>

      {/* Order Details Toggle Button */}
      <Button
        onClick={() => setShowOrderDetails(!showOrderDetails)}
        variant="outline"
        className="w-full h-12 flex items-center justify-between px-4 font-medium border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-purple-600" />
          <span className="text-base">
            {t("orderDetails", { ns: "orders", defaultValue: "Order Details" })}
          </span>
          <Badge variant="secondary" className="text-xs">
            #{order.id}
          </Badge>
        </div>
        {showOrderDetails ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </Button>

      {/* Order Details Section - Conditionally Rendered */}
      {showOrderDetails && (
        <div className="shadow-sm rounded-md bg-white dark:bg-gray-900">
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("createdAt", { ns: "orders", defaultValue: "Created" })}
                  </div>
                  <div className="text-sm font-medium">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleString(i18n.language)
                      : t("notAvailable", { ns: "common", defaultValue: "N/A" })}
                  </div>
                </div>
              </div>
        
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("completedAt", { ns: "orders", defaultValue: "Completed" })}
                  </div>
                  <div className="text-sm font-medium">
                    {order.completed_at
                      ? new Date(order.completed_at).toLocaleString(i18n.language)
                      : t("notAvailable", { ns: "common", defaultValue: "N/A" })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("deliveredDate", { ns: "orders", defaultValue: "Delivered" })}
                  </div>
                  <div className="text-sm font-medium">
                    {order.delivered_date
                      ? new Date(order.delivered_date).toLocaleString(i18n.language)
                      : t("notAvailable", { ns: "common", defaultValue: "N/A" })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Status Section */}
      <div className="shadow-sm rounded-md bg-white">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              {t("paymentStatus", { ns: "orders", defaultValue: "Payment Status" })}
            </h3>
            <Badge 
              variant={paymentStatus.variant}
              className={cn(
                "font-medium",
                paymentStatus.variant === "success" && "bg-green-100 text-green-800 border-green-200",
                paymentStatus.variant === "default" && "bg-yellow-100 text-yellow-800 border-yellow-200",
                paymentStatus.variant === "destructive" && "bg-red-100 text-red-800 border-red-200"
              )}
            >
              {paymentStatus.text}
            </Badge>
          </div>
          
          {/* Payment Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3">
              <div className="text-sm text-muted-foreground mb-1">
                {t("totalAmount", { ns: "orders", defaultValue: "Total" })}
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(totalAmount, "USD", i18n.language, 3)}
              </div>
            </div>
            <div className="text-center p-3">
              <div className="text-sm text-muted-foreground mb-1">
                {t("paidAmount", { ns: "orders", defaultValue: "Paid" })}
              </div>
              <div className="text-lg font-bold text-green-700 dark:text-green-400">
                {formatCurrency(paidAmount, "USD", i18n.language, 3)}
              </div>
            </div>
            <div className="text-center p-3">
              <div className="text-sm text-muted-foreground mb-1">
                {t("remainingAmount", { ns: "orders", defaultValue: "Due" })}
              </div>
              <div className="text-lg font-bold text-red-700 dark:text-red-400">
                {formatCurrency(remainingAmount, "USD", i18n.language, 3)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={onPaymentClick}
              disabled={isProcessing || isFullyPaid}
              className={cn(
                "h-11 flex items-center justify-center gap-2 font-medium flex-1 min-w-[120px]",
                isFullyPaid 
                  ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" 
                  : "bg-blue-600 hover:bg-blue-700"
              )}
              variant={isFullyPaid ? "outline" : "default"}
            >
              {isFullyPaid ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <DollarSign className="h-4 w-4" />
              )}
              <span className="text-sm">
                {isFullyPaid 
                  ? t("fullyPaid", { ns: "orders", defaultValue: "Fully Paid" })
                  : t("recordPayment", { ns: "orders", defaultValue: "Record Payment" })
                }
              </span>
            </Button>

            {/* <Button
              onClick={onInvoiceClick}
              disabled={isProcessing || order.whatsapp_pdf_sent || isSendingInvoice}
              variant={order.whatsapp_pdf_sent ? "default" : "outline"}
              className={cn(
                "h-11 flex items-center justify-center gap-2 font-medium flex-1 min-w-[120px]",
                order.whatsapp_pdf_sent 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              )}
            >
              {isSendingInvoice ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : order.whatsapp_pdf_sent ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <WhatsAppIcon className="h-4 w-4" />
              )}
              <span className="text-sm">
                {isSendingInvoice 
                  ? t("sending", { ns: "common", defaultValue: "Sending..." })
                  : order.whatsapp_pdf_sent 
                  ? t("invoiceSent", { ns: "orders", defaultValue: "Invoice Sent" })
                  : t("sendInvoice", { ns: "orders", defaultValue: "Send Invoice" })
                }
              </span>
            </Button> */}

            {/* WhatsApp Text Button */}
         
          </div>
         
        </div>
      </div>

      {/* Payment History Toggle Button */}
      <Button
        onClick={() => setShowPaymentHistory(!showPaymentHistory)}
        variant="outline"
        className="w-full h-12 flex items-center justify-between px-4 font-medium border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-gray-600" />
          <span className="text-base">
            {t("paymentHistory", { ns: "orders", defaultValue: "Payment History" })}
          </span>
          <Badge variant="secondary" className="text-xs">
            {payments.length} {t("payments", { ns: "orders", defaultValue: "payments" })}
          </Badge>
        </div>
        {showPaymentHistory ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </Button>

      {/* Payment History Card - Conditionally Rendered */}
      {showPaymentHistory && (
        <div className="flex-1 shadow-sm rounded-md bg-white dark:bg-gray-900">
          <div className="p-4 h-full flex flex-col">
            <ScrollArea className="flex-1">
              {payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment: Payment, index: number) => (
                    <div key={payment.id || index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-full",
                            payment.type === 'payment' ? "bg-green-100" : "bg-red-100"
                          )}>
                            {payment.type === 'payment' ? (
                              <DollarSign className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(payment.amount, "USD", i18n.language, 3)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {payment.type === 'payment' 
                                ? t("payment", { ns: "orders", defaultValue: "Payment" })
                                : t("refund", { ns: "orders", defaultValue: "Refund" })
                              }
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="text-xs font-medium border-gray-300 dark:border-gray-700"
                        >
                          {payment.method}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {payment.payment_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(payment.payment_date).toLocaleDateString(i18n.language, {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}</span>
                          </div>
                        )}
                        
                        {payment.transaction_id && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-3 w-3" />
                            <span className="font-mono text-xs">
                              {t("transactionId", { ns: "orders", defaultValue: "Transaction" })}: {payment.transaction_id}
                            </span>
                          </div>
                        )}
                        
                        {payment.notes && (
                          <div className="text-xs italic bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            "{payment.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <DollarSign className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {t("noPaymentsYet", { ns: "orders", defaultValue: "No payments recorded yet" })}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                    {t("recordFirstPayment", { ns: "orders", defaultValue: "Record the first payment using the button above" })}
                  </p>
                </div>
              )}
            </ScrollArea>

            {/* Quick Actions Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={onPdfClick}
                variant="outline"
                size="sm"
                className="w-full h-10 flex items-center justify-center gap-2 font-medium border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                disabled={isProcessing}
              >
                <Download className="h-4 w-4" />
                {t("viewReceipt", { ns: "orders", defaultValue: "View Receipt" })}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ScrollArea>
  );
}; 