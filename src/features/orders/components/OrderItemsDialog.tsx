import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/formatters";
import type { Order, OrderItem, OrderStatus } from "@/types";
import { updateOrderItemStatus } from "@/api/orderService";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderItemsDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderItemStatusChange?: (itemId: number, newStatus: string) => void;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

// Helper to get border color for status
function getStatusBorderColor(status: string) {
  switch (status) {
    case "pending":
      return "border-yellow-500";
    case "processing":
      return "border-blue-500";
    case "completed":
      return "border-green-500";
    case "cancelled":
      return "border-red-500";
    default:
      return "border-gray-300";
  }
}

const OrderItemsDialog: React.FC<OrderItemsDialogProps> = ({ order, open, onOpenChange, onOrderItemStatusChange }) => {
  const { t, i18n } = useTranslation(["orders", "services", "common"]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItem[]>(order?.items || []);

  React.useEffect(() => {
    setItems(order?.items || []);
  }, [order]);

  const handleStatusChange = async (itemId: number, status: string) => {
    setLoadingId(itemId);
    setError(null);
    try {
      const updated = await updateOrderItemStatus(itemId, status);
      const newStatus = (updated.status || status) as OrderStatus;
      setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, status: newStatus } : it)));
      if (onOrderItemStatusChange) {
        onOrderItemStatusChange(itemId, newStatus);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update status";
      setError(errorMessage);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-7xl">
        <DialogHeader>
          <DialogTitle>
            {t("orderItems", { ns: "orders", defaultValue: "Order Items" })} #{order?.id}
          </DialogTitle>
        </DialogHeader>
        {order && (
          <Card className="mb-6 bg-muted/50 border border-muted-foreground/10 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                {t("orderDetailsTitle", { ns: "orders", defaultValue: "Order Details" })} #{order.id}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-base">
                <div>
                  <span className="font-semibold text-muted-foreground">{t("orderNumber", { ns: "orders", defaultValue: "Order #" })}:</span>
                  <span className="ml-2 text-xl font-bold text-primary">{order.id}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">{t("customerName", { ns: "orders", defaultValue: "Customer" })}:</span>
                  <span className="ml-2 text-xl font-bold">{order.customer?.name || "-"}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">{t("orderDate", { ns: "orders", defaultValue: "Order Date" })}:</span>
                  <span className="ml-2 text-lg font-bold">{order.order_date ? new Date(order.order_date).toLocaleString(i18n.language) : "-"}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">{t("pickupDate", { ns: "orders", defaultValue: "Pickup Date" })}:</span>
                  <span className="ml-2 text-lg font-bold">{order.pickup_date ? new Date(order.pickup_date).toLocaleString(i18n.language) : "-"}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">{t("status", { ns: "orders", defaultValue: "Status" })}:</span>
                  <span className="ml-2 text-lg font-bold">{t(`status_${order.status}`, { ns: "orders", defaultValue: order.status })}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">{t("totalAmount", { ns: "orders", defaultValue: "Total" })}:</span>
                  <span className="ml-2 text-xl font-bold text-green-700">{formatCurrency(order.total_amount, "USD", i18n.language)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {order && items && items.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">{t("productType", { ns: "services", defaultValue: "Product Type" })}</TableHead>
                <TableHead className="text-center"> {t("itemService", { ns: "orders", defaultValue: "Item / Service" })}</TableHead>
                <TableHead className="text-center">{t("quantity", { ns: "services", defaultValue: "Qty" })}</TableHead>
                <TableHead className="text-center">{t("unitPrice", { ns: "orders", defaultValue: "Unit Price" })}</TableHead>
                <TableHead className="text-center">{t("subtotal", { ns: "common", defaultValue: "Subtotal" })}</TableHead>
                <TableHead className="text-center">{t("status", { ns: "orders", defaultValue: "Status" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                    <TableCell className="text-center">{item.serviceOffering?.productType?.name || t("notAvailable", { ns: "common", defaultValue: "N/A" })}</TableCell>
                  <TableCell className="text-center">{item.serviceOffering?.display_name || t("serviceOfferingDetailsMissing", { ns: "orders" })}</TableCell>
                
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-center">{formatCurrency(item.calculated_price_per_unit_item, "USD", i18n.language)}</TableCell>
                  <TableCell className="text-center">{formatCurrency(item.sub_total, "USD", i18n.language)}</TableCell>
                  <TableCell className="text-center">
                    <Select
                      value={item.status || "pending"}
                      onValueChange={(val) => handleStatusChange(item.id, val)}
                      disabled={loadingId === item.id}
                    >
                      <SelectTrigger className={`w-32 border-2 ${getStatusBorderColor(item.status || "pending")}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {t(`status_${opt.value}`, { ns: "orders", defaultValue: opt.label })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {loadingId === item.id && <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            {t("noItemsAdded", { ns: "orders", defaultValue: "No items added to this order yet." })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderItemsDialog; 