// src/pages/reports/OverduePickupsReport.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

import type { Order, PaginatedResponse } from "@/types";
import { getOverduePickupOrders } from "@/api/reportService";
// سنحتاج إلى دالة لإرسال رسالة واتساب مخصصة
// import { sendOverdueReminder } from '@/api/whatsappService'; // TODO: Create this service function

import { PageHeader } from "@/components/shared/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquareWarning } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Link } from "react-router-dom";

const OverduePickupsReport: React.FC = () => {
  const { t } = useTranslation(["reports", "common", "orders"]);

  const [overdueDaysFilter, setOverdueDaysFilter] = useState<number | "">(7); // Default to overdue by 7 days
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messageContent, setMessageContent] = useState("");

  const {
    data: paginatedData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<PaginatedResponse<Order>, Error>({
    queryKey: ["overdueOrders", overdueDaysFilter],
    queryFn: () =>
      getOverduePickupOrders(1, 15, overdueDaysFilter || undefined),
  });

  // TODO: Create a mutation for sending the reminder
  const sendReminderMutation = useMutation<void, Error, Order>({
    mutationFn: async (order) => {
      /* TODO: call sendOverdueReminder(order.id) */
      toast.info(`Sending reminder for #${order.id}...`);
    },
    onSuccess: () => {
      toast.success(t("reminderSentSuccess", { ns: "reports" }));
    },
    onError: (error) => {
      toast.error(error.message || t("reminderSentFailed", { ns: "reports" }));
    },
  });

  const orders = paginatedData?.data || [];

  // دالة لتوليد رسالة افتراضية
  const generateDefaultMessage = (order: Order) => {
    const customerName = order.customer.name;
    const orderNumber = order.id;
    const overdueDays = order.overdue_days;

    return `مرحباً ${customerName}،

نود تذكيركم أن طلبكم رقم ${orderNumber} جاهز للاستلام منذ ${overdueDays} يوم/أيام.

يرجى التواصل معنا لترتيب موعد الاستلام.

شكراً لكم،
فريق العمل`;
  };

  // دالة لفتح ديالوق الرسالة
  const handleSendReminder = (order: Order) => {
    setSelectedOrder(order);
    setMessageContent(generateDefaultMessage(order));
    setShowMessageDialog(true);
  };

  // دالة لإرسال الرسالة
  const handleConfirmSendMessage = () => {
    if (selectedOrder) {
      sendReminderMutation.mutate(selectedOrder);
      setShowMessageDialog(false);
      setSelectedOrder(null);
      setMessageContent("");
    }
  };

  return (
    <div>
      <PageHeader
        title={t("overduePickupsTitle")}
        description={t("overduePickupsDescription")}
        showRefreshButton
        onRefresh={refetch}
        isRefreshing={isFetching}
      />

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="overdue-days">
                {t("showOrdersOverdueBy", { ns: "reports" })}
              </Label>
              <Input
                id="overdue-days"
                type="number"
                placeholder={t("egDays", { ns: "reports", days: 7 })}
                value={overdueDaysFilter}
                onChange={(e) =>
                  setOverdueDaysFilter(
                    e.target.value === "" ? "" : parseInt(e.target.value, 10),
                  )
                }
                className="w-48"
              />
            </div>
            <p className="text-sm text-muted-foreground pb-2">
              {t("daysOrMore", { ns: "reports" })}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Order #</TableHead>
              <TableHead>{t("customerName")}</TableHead>
              <TableHead>{t("customerPhone", { ns: "customers" })}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("pickupDate")}</TableHead>
              <TableHead className="text-center">
                {t("daysOverduePickup", { ns: "reports" })}
              </TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {order.id}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/orders/${order.id}`}
                      className="font-medium hover:underline text-primary"
                    >
                      #{order.id}
                    </Link>
                  </TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.customer.phone || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === "completed"
                          ? "default"
                          : order.status === "ready_for_pickup"
                            ? "secondary"
                            : order.status === "processing"
                              ? "outline"
                              : "destructive"
                      }
                    >
                      {t(`status_${order.status}`, { ns: "orders" })}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.pickup_date!), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="destructive">{order.overdue_days}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendReminder(order)}
                      disabled={sendReminderMutation.isPending}
                    >
                      <MessageSquareWarning className="mr-2 h-4 w-4" />
                      {t("sendReminder", { ns: "reports" })}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  {t("noOverdueOrdersFound")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Controls */}

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("sendReminder", { ns: "reports" })}</DialogTitle>
            <DialogDescription>
              {t("sendReminderDescription", {
                ns: "reports",
                defaultValue:
                  "Send a reminder message to the customer about their overdue order.",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedOrder && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">
                  {t("orderDetails", {
                    ns: "reports",
                    defaultValue: "Order Details",
                  })}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      {t("orderNumber", { ns: "orders" })}:
                    </span>
                    <span className="ml-2 font-medium">
                      #{selectedOrder.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {t("customerName")}:
                    </span>
                    <span className="ml-2 font-medium">
                      {selectedOrder.customer.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {t("pickupDate")}:
                    </span>
                    <span className="ml-2 font-medium">
                      {format(
                        new Date(selectedOrder.pickup_date!),
                        "dd/MM/yyyy",
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {t("daysOverduePickup", { ns: "reports" })}:
                    </span>
                    <span className="ml-2 font-medium text-destructive">
                      {selectedOrder.overdue_days}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message-content">
                {t("messageContent", {
                  ns: "reports",
                  defaultValue: "Message Content",
                })}
              </Label>
              <Textarea
                id="message-content"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder={t("messagePlaceholder", {
                  ns: "reports",
                  defaultValue: "Enter your message here...",
                })}
                className="min-h-[200px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMessageDialog(false)}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button
              onClick={handleConfirmSendMessage}
              disabled={
                sendReminderMutation.isPending || !messageContent.trim()
              }
            >
              {sendReminderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("sending", { ns: "reports", defaultValue: "Sending..." })}
                </>
              ) : (
                <>
                  <MessageSquareWarning className="mr-2 h-4 w-4" />
                  {t("sendMessage", {
                    ns: "reports",
                    defaultValue: "Send Message",
                  })}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OverduePickupsReport;
