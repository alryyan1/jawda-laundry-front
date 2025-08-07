import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, CheckCircle, CreditCard, Eye, MoreHorizontal, Package, FileText } from "lucide-react";
import type { Order } from "@/types";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { formatCurrency } from "@/lib/formatters";
import { downloadOrderInvoice } from "@/api/orderService";

type MobileOrderCardProps = {
  order: Order;
  isSelected: boolean;
  isFullyPaid: boolean;
  onNavigate: (path: string) => void;
  onOpenItems: (order: Order) => void;
  onOpenPayments: (order: Order) => void;
  onEdit: (order: Order) => void;
  can: (permission: string) => boolean;
  t: (key: string, options?: any) => string;
  currentLocale: any;
  currencySymbol: string;
};

export const MobileOrderCard: React.FC<MobileOrderCardProps> = ({
  order,
  isSelected,
  isFullyPaid,
  onNavigate,
  onOpenItems,
  onOpenPayments,
  onEdit,
  can,
  t,
  currentLocale,
  currencySymbol,
}) => {
  return (
    <Card
      className={`mb-2 sm:mb-4 p-1 sm:p-2 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20" : ""
      } ${isFullyPaid ? "border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10" : ""}`}
      onClick={() => onNavigate(`/orders/${order.id}`)}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm font-mono text-muted-foreground">#{order.id}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <h3 className="font-semibold text-sm sm:text-base mb-1">
              {order.customer?.name || t("notAvailable")}
            </h3>
            <div className="text-xs sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(order.order_date).toLocaleDateString(undefined)}</span>
              </div>
              {order.pickup_date && (
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  <span>{new Date(order.pickup_date).toLocaleDateString(undefined)}</span>
                </div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onNavigate(`/orders/${order.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                {t("viewDetails")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenItems(order);
                }}
              >
                <Package className="mr-2 h-4 w-4" />
                {t("viewItems", { defaultValue: "View Items" })}
              </DropdownMenuItem>
              {can("order:record-payment") && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPayments(order);
                  }}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t("viewPayments")}
                </DropdownMenuItem>
              )}
              {can("order:update") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onEdit(order)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {t("editOrder")}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  downloadOrderInvoice(order.id);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                {t("downloadPdf", { defaultValue: "Download PDF" })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-4 mb-2 sm:mb-3">
          <div className="text-center p-1.5 sm:p-2 bg-muted rounded-lg min-w-0">
            <div className="text-xs text-muted-foreground mb-0.5 sm:mb-1 truncate">
              {t("totalItems", { defaultValue: "Total Items" })}
            </div>
            <div className="font-semibold text-sm sm:text-base truncate">
              {(order.items || []).reduce((total, item) => total + item.quantity, 0)} / {(order.items || []).reduce((total, item) => total + (item.picked_up_quantity || 0), 0)}
            </div>
          </div>
          <div className="text-center p-1.5 sm:p-2 bg-muted rounded-lg min-w-0">
            <div className="text-xs text-muted-foreground mb-0.5 sm:mb-1 truncate">
              {t("totalAmount", { ns: "orders" })}
            </div>
            <div className="font-semibold text-sm sm:text-base truncate">
              {formatCurrency(order.total_amount, currencySymbol, "en", 3)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-1.5 sm:p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
            {t("amountPaid")}
          </span>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm sm:text-base text-green-600 dark:text-green-400">
              {formatCurrency(order.paid_amount, currencySymbol, "en", 3)}
            </span>
            {isFullyPaid && (
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-500" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileOrderCard;

