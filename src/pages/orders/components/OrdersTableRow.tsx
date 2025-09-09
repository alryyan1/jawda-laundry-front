import React, { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, CreditCard, Eye, FileText, Package, Loader2, Printer } from "lucide-react";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { toast } from "sonner";
import type { Order } from "@/types";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { formatCurrency } from "@/lib/formatters";
import { sendOrderWhatsAppInvoice, enqueueOrderPrintJob } from "@/api/orderService";
import { printPosPdfReceipt } from "@/lib/printUtils";
import dayjs from "dayjs";

type OrdersTableRowProps = {
  order: Order;
  selectedOrderId?: number | null;
  onOpenPayments: (order: Order) => void;
  onRecordPayment: (order: Order) => void;
  onMarkCompleted: (order: Order) => void;
  onMarkDelivered: (order: Order) => void;
  onOpenTimeline: (order: Order) => void;
  isCompleting?: boolean;
  can: (permission: string) => boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
  currencySymbol: string;
  language: string;
  onOpenItems?: (order: Order) => void;
  onOpenWhatsApp?: (order: Order) => void;
};

const OrdersTableRow: React.FC<OrdersTableRowProps> = ({
  order,
  selectedOrderId,
  onOpenPayments,
  onRecordPayment,
  onMarkCompleted,
  onMarkDelivered,
  onOpenTimeline,
  isCompleting,
  can,
  t,
  currencySymbol,
  language,
  onOpenItems,
  onOpenWhatsApp,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const isFullyPaid = order.total_amount > 0 && order.paid_amount >= order.total_amount;

  const handleSendWhatsAppInvoice = async () => {
    if (order) {
      setIsSendingWhatsApp(true);
      try {
        await sendOrderWhatsAppInvoice(order.id);
        // You might want to show a success toast here
      } catch (error) {
        // Handle error
        console.error('Error sending WhatsApp invoice:', error);
      } finally {
        setIsSendingWhatsApp(false);
      }
    }
  };

  return (
    <>
             <TableRow
         key={order.id}
         className={`cursor-pointer hover:bg-muted/50 ${
           selectedOrderId === order.id ? "bg-green-50 dark:bg-green-950/20 border-l-4 border-l-green-500" : ""
         } ${isFullyPaid ? "bg-green-50/50 dark:bg-green-950/10 border-l-2 border-l-green-400" : ""}`}
         onClick={() => setIsDialogOpen(true)}
       >
        <TableCell className="font-mono text-sm font-bold text-center">{order.id}</TableCell>
        <TableCell className="font-mono text-sm font-bold text-center">{order.daily_order_number ?? '-'}</TableCell>
        <TableCell className="text-center">{order.customer?.name || t("notAvailable")}</TableCell>
                 <TableCell className="text-center">{dayjs(order.order_date).format('DD/MM/YYYY')}</TableCell>
         <TableCell className="text-center">
           <button type="button" onClick={(e) => { e.stopPropagation(); onOpenTimeline(order); }} className="inline-flex items-center gap-1 hover:opacity-80">
             <OrderStatusBadge status={order.status} />
           </button>
         </TableCell>
                   <TableCell className="text-center">
            <div className="max-w-xs truncate" title={order.items?.map(item => 
              `${item.serviceOffering?.productType?.name || 'Unknown Product'} (${item.quantity})`
            ).join(', ')}>
              {order.items?.slice(0, 2).map(item => 
                `${item.serviceOffering?.productType?.name || 'Unknown Product'} (${item.quantity})`
              ).join(', ')}
              {order.items && order.items.length > 2 && (
                <span className="text-muted-foreground text-xs"> +{order.items.length - 2} more</span>
              )}
            </div>
          </TableCell>
        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col gap-1">
            {!order.completed_at && can("order:update-status") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkCompleted(order)}
                disabled={!!isCompleting}
                className="h-7 text-xs"
              >
                {isCompleting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                {t("markComplete", { defaultValue: "Mark Complete" })}
              </Button>
            )}
            {order.status === 'completed' && can("order:update-status") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkDelivered(order)}
                className="h-7 text-xs"
              >
                {t("markDelivered", { defaultValue: "Mark Delivered" })}
              </Button>
            )}
            {order.status === 'delivered' && can("order:record-payment") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRecordPayment(order)}
                className="h-7 text-xs"
              >
                {t("recordPayment", { defaultValue: "Record Payment" })}
              </Button>
            )}
          </div>
        </TableCell>
        <TableCell className="text-center font-bold text-lg">{formatCurrency(order.total_amount, currencySymbol, language, 3)}</TableCell>
        <TableCell className={`text-center font-bold text-lg ${order.paid_amount > 0 ? 'text-green-600 dark:text-green-500' : ''}`}>
          <div className="flex items-center justify-center gap-1">
            {formatCurrency(order.paid_amount, currencySymbol, language, 3)}
            {isFullyPaid && order.paid_amount > 0 && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />}
          </div>
        </TableCell>
        <TableCell className="text-center w-12" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="h-8 w-8 p-0"
            title={t("viewDetails")}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t("orderActions", { defaultValue: "Order Actions" })} #{order.id}
            </DialogTitle>
          </DialogHeader>
          
                                           <div className="grid grid-cols-2 gap-3">
              {/* Print Receipt */}
             <Button
               variant="outline"
               onClick={() => {
                 setIsDialogOpen(false);
                 setIsPrintDialogOpen(true);
               }}
               className="flex items-center gap-2"
             >
               <Printer className="h-4 w-4" />
               {t("printReceipt", { defaultValue: "Print Receipt" })}
             </Button>

             {/* View Items */}
             {onOpenItems && (
               <Button
                 variant="outline"
                 onClick={() => {
                   setIsDialogOpen(false);
                   onOpenItems(order);
                 }}
                 className="flex items-center gap-2"
               >
                 <Package className="h-4 w-4" />
                 {t("orderedItems", { defaultValue: "View Items" })}
               </Button>
             )}

             {/* View Payments */}
             {can("order:record-payment") && (
               <Button
                 variant="outline"
                 onClick={() => {
                   setIsDialogOpen(false);
                   onOpenPayments(order);
                 }}
                 className="flex items-center gap-2"
               >
                 <CreditCard className="h-4 w-4" />
                 {t("viewPayments")}
               </Button>
             )}

             {/* Send WhatsApp Message */}
             {can("order:send-whatsapp") && order.customer?.phone && onOpenWhatsApp && (
               <Button
                 variant={order.whatsapp_text_sent ? "default" : "outline"}
                 className={order.whatsapp_text_sent ? "bg-green-600 hover:bg-green-700 text-white" : "flex items-center gap-2"}
                 onClick={() => {
                   setIsDialogOpen(false);
                   onOpenWhatsApp(order);
                 }}
               >
                 <WhatsAppIcon className="h-4 w-4" />
                 {order.whatsapp_text_sent ? t("messageSent", { defaultValue: "Message Sent" }) : t("sendMessage", { defaultValue: "Send Message" })}
               </Button>
             )}

             {/* Send WhatsApp Invoice */}
             {can("order:send-whatsapp") && order.customer?.phone && (
               <Button
                 variant={order.whatsapp_pdf_sent ? "default" : "outline"}
                 className={order.whatsapp_pdf_sent ? "bg-green-600 hover:bg-green-700 text-white" : "flex items-center gap-2"}
                 onClick={() => {
                   setIsDialogOpen(false);
                   handleSendWhatsAppInvoice();
                 }}
                 disabled={isSendingWhatsApp}
               >
                 <WhatsAppIcon className="h-4 w-4" />
                 {isSendingWhatsApp ? (
                   <Loader2 className="h-4 w-4 animate-spin" />
                 ) : order.whatsapp_pdf_sent ? (
                   t("invoiceSent", { defaultValue: "Invoice Sent" })
                 ) : (
                   t("sendInvoice", { defaultValue: "Send Invoice" })
                 )}
               </Button>
             )}
           </div>
                 </DialogContent>
       </Dialog>

       {/* Print Dialog */}
       <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Printer className="h-5 w-5" />
               {t("printOptions", { defaultValue: "Print Options" })} #{order.id}
             </DialogTitle>
           </DialogHeader>
           
           <div className="grid grid-cols-1 gap-3">
             {/* View Receipt */}
             <Button
               variant="outline"
               onClick={() => {
                 setIsPrintDialogOpen(false);
                 printPosPdfReceipt(order.id);
               }}
               className="flex items-center gap-2"
             >
               <FileText className="h-4 w-4" />
               {t("viewReceipt", { defaultValue: "View Receipt" })}
             </Button>

             {/* Send to Printer */}
             <Button
               variant="default"
               onClick={async () => {
                 try {
                   await enqueueOrderPrintJob(order.id);
                   toast.success(t("printJobQueued", { defaultValue: "Print job queued" }));
                   setIsPrintDialogOpen(false);
                 } catch (e) {
                   const message = e instanceof Error ? e.message : String(e);
                   toast.error(message || t("printJobFailed", { defaultValue: "Failed to queue print job" }));
                 }
               }}
               className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
             >
               <Printer className="h-4 w-4" />
               {t("sendToPrinter", { defaultValue: "Send to Printer" })}
             </Button>
           </div>
         </DialogContent>
       </Dialog>
     </>
   );
 };

export default OrdersTableRow;

