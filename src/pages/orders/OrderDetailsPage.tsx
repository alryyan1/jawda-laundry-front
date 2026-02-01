import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Order, OrderStatus, OrderItem as OrderItemType } from "@/types";
import {
  getOrderById,
  updateOrderStatus,
  type OrderResponseWithWarnings,
} from "@/api/orderService";
import { ORDER_STATUSES, BASE_URL } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { RecordPaymentModal } from "@/features/orders/components/RecordPaymentModal";
import { OrderPaymentsList } from "@/features/orders/components/OrderPaymentsList";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { WhatsAppMessageDialog } from "@/features/orders/components/WhatsAppMessageDialog";
import { useCurrency } from "@/hooks/useCurrency";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductImage } from "@/components/ProductImage";

const OrderDetailsPage: React.FC = () => {
  const { t, i18n } = useTranslation([
    "common",
    "orders",
    "customers",
    "services",
  ]);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentLocale = i18n.language.startsWith("ar") ? arSA : enUS;
  const { currencyCode } = useCurrency();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isPaymentsHistoryOpen, setIsPaymentsHistoryOpen] = useState(false);
  const { can } = useAuth();
  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useQuery<Order, Error>({
    queryKey: ["order", id],
    queryFn: () => getOrderById(id!),
    enabled: !!id,
  });

  // Mutation for updating order status
  const updateStatusMutation = useMutation<
    Order,
    Error,
    { orderId: string | number; status: OrderStatus }
  >({
    mutationFn: async ({ orderId, status }) => {
      const res: OrderResponseWithWarnings = await updateOrderStatus(
        orderId,
        status,
      );
      return res.order;
    },
    onSuccess: (updatedOrder) => {
      toast.success(
        t("orderStatusUpdatedSuccess", {
          ns: "orders",
          status: t(`status_${updatedOrder.status}`, { ns: "orders" }),
        }),
      );
      queryClient.setQueryData(["order", id], updatedOrder);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      toast.error(
        error.message || t("orderStatusUpdateFailed", { ns: "orders" }),
      );
    },
  });

  // Pickup date is fixed at creation and cannot be changed

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (order && newStatus !== order.status) {
      updateStatusMutation.mutate({ orderId: order.id, status: newStatus });
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ms-3 text-lg">{t("loadingOrder", { ns: "orders" })}</p>
      </div>
    );
  if (error)
    return (
      <div className="text-center py-10">
        <p className="text-destructive text-lg">
          {t("errorLoading", { ns: "common" })}
        </p>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={() => refetch()} className="mt-4">
          {t("retry", { ns: "common" })}
        </Button>
      </div>
    );
  if (!order)
    return (
      <div className="text-center py-10">
        <p className="text-destructive text-lg">
          {t("orderNotFound", { ns: "orders" })}
        </p>
        <Button onClick={() => navigate("/orders")} className="mt-4">
          {t("backToOrders", { ns: "orders" })}
        </Button>
      </div>
    );
  const apiBaseUrl = BASE_URL;
  const invoiceUrl = `${apiBaseUrl.replace(
    "/api",
    "",
  )}/orders/${order.id}/invoice/download`;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 min-h-screen bg-gray-50/50">
      {/* Left Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Order Header Card */}
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row justify-between gap-8">
              {/* Left Side: Customer Info */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-800">
                  {order.customer?.name || t("guest", { ns: "common" })}
                </h1>
                <div className="text-gray-500 space-y-1">
                  <p>{order.customer?.phone || "-"}</p>
                  {/* Address field is not directly available on Order type, defaulting to empty or Customer address if available in future */}
                  <p>{order.notes || "-"}</p>
                  <p className="pt-2 text-gray-400 text-sm">TAX: TAX@TAX</p>
                </div>
              </div>

              {/* Right Side: Order Meta */}
              <div className="md:text-right space-y-2">
                <div>
                  <span className="font-bold text-gray-700">
                    {t("orderId", { ns: "orders", defaultValue: "ORDER ID" })}
                    :{" "}
                  </span>
                  <span className="font-bold">#ORD-{order.id}</span>
                </div>
                <div className="text-gray-600">
                  <span>
                    {t("orderDate", {
                      ns: "orders",
                      defaultValue: "Order Date",
                    })}
                    :{" "}
                  </span>
                  <span>
                    {format(new Date(order.order_date), "dd/MM/yyyy", {
                      locale: currentLocale,
                    })}
                  </span>
                </div>
                <div className="text-gray-600 flex md:justify-end items-center gap-2">
                  <span>
                    {t("deliveryDate", {
                      ns: "orders",
                      defaultValue: "Delivery Date",
                    })}
                    :{" "}
                  </span>
                  <div className="flex items-center bg-gray-100 px-2 py-0.5 rounded text-sm">
                    {order.pickup_date
                      ? format(new Date(order.pickup_date), "dd/MM/yyyy", {
                          locale: currentLocale,
                        })
                      : "-"}
                  </div>
                </div>
                <div className="flex md:justify-end items-center gap-2 pt-2">
                  <span className="text-gray-600">
                    {t("orderStatus", {
                      ns: "orders",
                      defaultValue: "Order Status",
                    })}
                    :
                  </span>
                  {/* Status Dropdown */}
                  {can("order:update-status") ? (
                    <Select
                      value={order.status}
                      onValueChange={(newStatus: OrderStatus) =>
                        handleStatusChange(newStatus)
                      }
                      disabled={
                        updateStatusMutation.isPending ||
                        order.status === "completed"
                      }
                    >
                      <SelectTrigger className="w-[140px] h-9 bg-gray-500 text-white border-0 focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`status_${status}`, { ns: "orders" })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className="bg-gray-500">{order.status}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items List Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow className="border-none hover:bg-gray-100">
                <TableHead className="w-[50px] font-bold text-gray-500">
                  #
                </TableHead>
                <TableHead className="font-bold text-gray-500">
                  {t("serviceName", {
                    ns: "orders",
                    defaultValue: "SERVICE NAME",
                  })}
                </TableHead>
                <TableHead className="text-center font-bold text-gray-500">
                  {t("color", { ns: "common", defaultValue: "COLOR" })}
                </TableHead>
                <TableHead className="text-center font-bold text-gray-500">
                  {t("rate", { ns: "common", defaultValue: "RATE" })}
                </TableHead>
                <TableHead className="text-center font-bold text-gray-500">
                  {t("qty", { ns: "common", defaultValue: "QTY" })}
                </TableHead>
                <TableHead className="text-right font-bold text-gray-500 pr-6">
                  {t("total", { ns: "common", defaultValue: "TOTAL" })}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item: OrderItemType, index: number) => (
                <TableRow
                  key={item.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                >
                  <TableCell className="font-medium text-gray-500">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      {/* Product Image Placeholder or Actual Image */}
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100 flex items-center justify-center">
                        <ProductImage
                          url={item.serviceOffering?.productType?.image_url}
                          alt={item.serviceOffering?.productType?.name || ""}
                          className="h-full w-full object-cover"
                          isIconFallback={
                            item.serviceOffering?.productType?.id !== 1
                          }
                        />
                      </div>
                      <div>
                        {/* English Name - fallback to display_name or productType name */}
                        <div className="font-bold text-gray-800 uppercase">
                          {item.serviceOffering?.productType?.name ||
                            item.serviceOffering?.display_name}
                        </div>
                        {/* Arabic Name - Not explicitly available in current types, showing product type name as fallback */}
                        {/* 
                        <div className="text-sm font-medium text-gray-600 text-right w-full">
                           {item.serviceOffering?.name?.ar} 
                        </div> 
                        */}
                        {/* Service Type / Action */}
                        <div className="text-xs text-blue-500 font-semibold mt-1 uppercase">
                          [
                          {item.serviceOffering?.serviceAction?.name ||
                            "Service"}
                          ]
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-gray-500">
                    {item.color || "-"}
                  </TableCell>
                  <TableCell className="text-center font-medium text-gray-600">
                    {new Intl.NumberFormat(i18n.language, {
                      style: "currency",
                      currency: currencyCode,
                    }).format(item.calculated_price_per_unit_item)}
                  </TableCell>
                  <TableCell className="text-center font-medium text-gray-600">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right font-medium text-gray-600 pr-6">
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
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-[350px] space-y-6">
        <Card className="border-none shadow-sm bg-white h-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gray-700 font-medium">
              {t("payments", { ns: "orders", defaultValue: "Payments" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Payment Status Alert moved here if needed or kept minimal */}
            {order.payment_status !== "paid" && (
              <div className="text-sm text-red-500 font-medium mb-2">
                Status: {t(`payment_status_${order.payment_status}`)}
              </div>
            )}

            {/* Add Payment Button */}
            <Button
              className="w-full h-12 text-base font-semibold bg-[#a7f3d0] hover:bg-[#6ee7b7] text-green-800 border-none shadow-none transition-colors"
              onClick={() => setIsPaymentModalOpen(true)}
            >
              {t("addPayment", { ns: "orders", defaultValue: "ADD PAYMENT" })}
            </Button>

            {/* Print Invoice Button */}
            <Button
              className="w-full h-12 text-base font-semibold bg-[#fcd34d] hover:bg-[#fbbf24] text-yellow-900 border-none shadow-none transition-colors"
              onClick={() => window.open(invoiceUrl, "_blank")}
            >
              {t("printInvoice", {
                ns: "orders",
                defaultValue: "Print Invoice",
              })}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <Dialog
        open={isPaymentsHistoryOpen}
        onOpenChange={setIsPaymentsHistoryOpen}
      >
        <DialogContent className="!max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {t("viewPayments", { ns: "orders", defaultValue: "Payments" })}
            </DialogTitle>
          </DialogHeader>
          <OrderPaymentsList payments={order.payments || []} />
        </DialogContent>
      </Dialog>

      {can("order:record-payment") && (
        <RecordPaymentModal
          order={order}
          isOpen={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
        />
      )}
      {can("order:send-whatsapp") && (
        <WhatsAppMessageDialog
          order={order}
          isOpen={isWhatsAppModalOpen}
          onOpenChange={setIsWhatsAppModalOpen}
        />
      )}
    </div>
  );
};
export default OrderDetailsPage;
