// src/features/pos/components/TodayOrders.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Package } from "lucide-react";

import type { Order, PaginatedResponse } from "@/types";
import { getOrders } from "@/api/orderService";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";

interface TodayOrdersProps {
  onOrderSelect: (order: Order) => void;
  selectedOrderId?: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TodayOrders: React.FC<TodayOrdersProps> = ({
  onOrderSelect,
  selectedOrderId,
  isOpen,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation(["common", "orders"]);
  const [currentPage, setCurrentPage] = useState(0);
  const ordersPerPage = 9; // Show 9 orders (3x3 grid) at a time

  // Get today's date in YYYY-MM-DD format for the API filter
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ["todayOrders", today],
    queryFn: () => getOrders(1, 100, { created_date: today }), // Fetch up to 100 orders created today
    enabled: isOpen, // Only fetch when the dialog is open
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes while open
  });

  const orders = ordersResponse?.data || [];
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const currentOrders = orders.slice(
    currentPage * ordersPerPage,
    (currentPage + 1) * ordersPerPage
  );

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const handleOrderClick = (order: Order) => {
    onOrderSelect(order);
    onOpenChange(false); // Close dialog after selection
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("todaysOrders", { ns: "orders" })} ({orders.length})
          </DialogTitle>
          <DialogDescription>
            {t("selectOrderToViewOrEdit", { ns: "orders", defaultValue: "Select an order to view its details or add new items." })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-hidden">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {[...Array(9)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {currentOrders.length > 0 ? currentOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleOrderClick(order)}
                    className={cn(
                      "relative cursor-pointer rounded-lg border-2 p-4 space-y-3 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-card",
                      selectedOrderId === order.id.toString()
                        ? "border-primary ring-2 ring-primary/20 shadow-lg"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">#{order.order_number}</h3>
                        <OrderStatusBadge status={order.status} size="sm"/>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate font-medium">{order.customer.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{format(parseISO(order.order_date), "p")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{t("itemCount", { count: order.items?.length || 0, ns: "orders" })}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("total")}</span>
                        <span className="font-semibold text-lg">
                          {formatCurrency(order.total_amount, "USD", i18n.language)}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                    <div className="col-span-full flex items-center justify-center h-full text-center text-muted-foreground min-h-[200px]">
                        <p>{t('noOrdersToday', { ns: 'orders', defaultValue: 'No orders have been created today.' })}</p>
                    </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("previous")}
            </Button>
            
            <span className="text-sm text-muted-foreground px-4">
              {t("pageWithTotal", { currentPage: currentPage + 1, totalPages })}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
            >
              {t("next")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};