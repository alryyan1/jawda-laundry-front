import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CheckCircle, CreditCard, Edit3, Eye, MoreHorizontal, FileText } from "lucide-react";
import type { Order } from "@/types";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { formatCurrency } from "@/lib/formatters";
import { downloadOrderInvoice } from "@/api/orderService";
import dayjs from "dayjs";

type OrdersTableRowProps = {
  order: Order;
  selectedOrderId?: number | null;
  onNavigate: (path: string) => void;
  onOpenItems: (order: Order) => void;
  onOpenPayments: (order: Order) => void;
  onEdit: (order: Order) => void;
  can: (permission: string) => boolean;
  t: (key: string, options?: any) => string;
  currencySymbol: string;
  language: string;
};

const OrdersTableRow: React.FC<OrdersTableRowProps> = ({
  order,
  selectedOrderId,
  onNavigate,
  onOpenItems,
  onOpenPayments,
  onEdit,
  can,
  t,
  currencySymbol,
  language,
}) => {
  const isFullyPaid = order.amount_due === 0 || (order.total_amount > 0 && order.paid_amount >= order.total_amount);
  const totalQty = (order.items || []).reduce((sum, i) => sum + i.quantity, 0);
  const pickedQty = (order.items || []).reduce((sum, i) => sum + (i.picked_up_quantity || 0), 0);

  return (
    <TableRow
      key={order.id}
      className={`cursor-pointer hover:bg-muted/50 ${
        selectedOrderId === order.id ? "bg-green-50 dark:bg-green-950/20 border-l-4 border-l-green-500" : ""
      } ${isFullyPaid ? "bg-green-50/50 dark:bg-green-950/10 border-l-2 border-l-green-400" : ""}`}
      onClick={() => onNavigate(`/orders/${order.id}`)}
    >
      <TableCell className="font-mono text-xs text-muted-foreground text-center">{order.id}</TableCell>
      <TableCell className="text-center">{order.customer?.name || t("notAvailable")}</TableCell>
      <TableCell className="text-center">{dayjs(order.order_date).format('DD/MM/YYYY')}</TableCell>
      <TableCell className="text-center font-mono text-xs">
        {order.category_sequences_string || order.category_sequences ? 
          (order.category_sequences_string || Object.values(order.category_sequences || {}).join(', ')) : 
          "-"
        }
      </TableCell>
      <TableCell className="text-center">
        <OrderStatusBadge status={order.status} />
      </TableCell>
      <TableCell className="text-center font-semibold">{totalQty} / {pickedQty}</TableCell>
      <TableCell className="text-center font-semibold">{formatCurrency(order.total_amount, currencySymbol, language, 3)}</TableCell>
      <TableCell className="text-center font-semibold text-green-600 dark:text-green-500">
        <div className="flex items-center justify-center gap-1">
          {formatCurrency(order.paid_amount, currencySymbol, language, 3)}
          {isFullyPaid && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />}
        </div>
      </TableCell>
      <TableCell className="text-center w-12" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t("openMenu")}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onNavigate(`/orders/${order.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              {t("viewDetails")}
            </DropdownMenuItem>
            {can("order:record-payment") && (
              <DropdownMenuItem onClick={() => onOpenPayments(order)}>
                <CreditCard className="mr-2 h-4 w-4" />
                {t("viewPayments")}
              </DropdownMenuItem>
            )}
            {can("order:update") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(order)}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  {t("editOrder")}
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => downloadOrderInvoice(order.id)}>
              <FileText className="mr-2 h-4 w-4" />
              {t("downloadPdf", { defaultValue: "Download PDF" })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default OrdersTableRow;

