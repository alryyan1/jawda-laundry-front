// src/pages/dashboard/components/OrderDetailsDialog.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

import { getOrderById } from "@/api/orderService";
import type { Order, OrderItem as OrderItemType } from "@/types";
import { ProductImage } from "@/components/ProductImage";
import { useCurrency } from "@/hooks/useCurrency";

interface OrderDetailsDialogProps {
  orderId: number | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({
  orderId,
  isOpen,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation([
    "common",
    "orders",
    "customers",
    "services",
  ]);
  const currentLocale = i18n.language.startsWith("ar") ? arSA : enUS;
  const { currencyCode } = useCurrency();

  const {
    data: order,
    isLoading,
    error,
  } = useQuery<Order, Error>({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById(orderId!),
    enabled: !!orderId && isOpen,
  });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("orderDetails", { ns: "orders", defaultValue: "Order Details" })}
            {order && (
              <span className="ml-2 text-slate-500">#ORD-{order.id}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            {t("errorLoading", { ns: "common" })}: {error.message}
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Customer & Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">
                  {order.customer?.name}
                </h3>
                <p className="text-sm text-slate-500">
                  {order.customer?.phone}
                </p>
                {order.notes && (
                  <p className="text-sm text-slate-600 mt-2 bg-yellow-50 p-2 rounded border border-yellow-100">
                    <span className="font-semibold">
                      {t("notes", { ns: "common" })}:
                    </span>{" "}
                    {order.notes}
                  </p>
                )}
              </div>
              <div className="text-right space-y-1 text-sm">
                <div className="flex justify-end gap-2">
                  <span className="text-slate-500">
                    {t("orderDate", { ns: "orders" })}:
                  </span>
                  <span className="font-medium">
                    {format(new Date(order.order_date), "dd/MM/yyyy", {
                      locale: currentLocale,
                    })}
                  </span>
                </div>
                <div className="flex justify-end gap-2">
                  <span className="text-slate-500">
                    {t("deliveryDate", { ns: "orders" })}:
                  </span>
                  <span className="font-medium">
                    {order.pickup_date
                      ? format(new Date(order.pickup_date), "dd/MM/yyyy", {
                          locale: currentLocale,
                        })
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-end gap-2 items-center mt-2">
                  <span className="text-slate-500">
                    {t("status", { ns: "common" })}:
                  </span>
                  <Badge className="capitalize">{order.status}</Badge>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-100">
                  <TableRow>
                    <TableHead>{t("serviceName", { ns: "orders" })}</TableHead>
                    <TableHead className="text-center">
                      {t("qty", { ns: "common" })}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("total", { ns: "common" })}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item: OrderItemType) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 border rounded bg-slate-50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <ProductImage
                              url={item.serviceOffering?.productType?.image_url}
                              alt={
                                item.serviceOffering?.productType?.name || ""
                              }
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium">
                              {item.serviceOffering?.productType?.name ||
                                item.serviceOffering?.display_name}
                            </div>
                            <div className="text-xs text-blue-500 uppercase">
                              {item.serviceOffering?.serviceAction?.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat(i18n.language, {
                          style: "currency",
                          currency: currencyCode,
                        }).format(item.sub_total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Payment Summary */}
            <div className="flex justify-end">
              <div className="w-full md:w-1/3 bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    {t("subtotal", { ns: "common", defaultValue: "Subtotal" })}
                  </span>
                  <span className="font-medium">
                    {new Intl.NumberFormat(i18n.language, {
                      style: "currency",
                      currency: currencyCode,
                    }).format(order.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    {t("paid", { ns: "common", defaultValue: "Paid" })}
                  </span>
                  <span className="font-medium text-green-600">
                    {new Intl.NumberFormat(i18n.language, {
                      style: "currency",
                      currency: currencyCode,
                    }).format(order.paid_amount || 0)}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>{t("total", { ns: "common" })}</span>
                  <span>
                    {new Intl.NumberFormat(i18n.language, {
                      style: "currency",
                      currency: currencyCode,
                    }).format(order.total_amount)}
                  </span>
                </div>
                <div className="text-xs text-right text-slate-400 uppercase font-medium mt-1">
                  {t(`payment_status_${order.payment_status}`, {
                    defaultValue: order.payment_status,
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
