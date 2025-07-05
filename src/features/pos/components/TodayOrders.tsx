import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

import type { Order, OrderItem } from "@/types";
import { getOrders } from "@/api/orderService";

interface TodayOrdersProps {
  onOrderSelect: (order: Order) => void;
  selectedOrderId?: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-500';
    case 'in_progress':
      return 'bg-blue-500';
    case 'completed':
      return 'bg-green-500';
    case 'cancelled':
      return 'bg-red-500';
    case 'ready_for_pickup':
      return 'bg-purple-500';
    case 'picked_up':
      return 'bg-gray-500';
    default:
      return 'bg-gray-400';
  }
};

export const TodayOrders: React.FC<TodayOrdersProps> = ({
  onOrderSelect,
  selectedOrderId,
  isOpen,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation(["common", "orders"]);
  const [currentPage, setCurrentPage] = useState(0);
  const ordersPerPage = 12; // Show 12 orders at a time in dialog

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ["todayOrders", today],
    queryFn: () => getOrders(1, 100, { created_date: today }),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const orders = ordersResponse?.data || [];
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const currentOrders = orders.slice(
    currentPage * ordersPerPage,
    (currentPage + 1) * ordersPerPage
  );

  const handlePreviousPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  const handleOrderClick = (order: Order) => {
    onOrderSelect(order);
    onOpenChange(false); // Close dialog after selection
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (status: string) => {
    return t(`status.${status}`, { ns: "orders", defaultValue: status });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("todayOrders", { ns: "orders" })} ({orders.length})
          </DialogTitle>
          <DialogDescription>
            {t("selectOrderToView", { ns: "orders", defaultValue: "Select an order to view its details" })}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {currentOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleOrderClick(order)}
                    className={cn(
                      "relative cursor-pointer rounded-lg border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
                      selectedOrderId === order.id.toString()
                        ? "border-primary ring-2 ring-primary/20 shadow-lg"
                        : "border-border hover:border-primary/50",
                      "bg-card p-4"
                    )}
                  >
                    {/* Status indicator */}
                    <div className={cn(
                      "absolute top-2 right-2 w-3 h-3 rounded-full",
                      getStatusColor(order.status)
                    )} />

                    <div className="space-y-3">
                      {/* Order header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">#{order.order_number}</h3>
                          <p className="text-sm text-muted-foreground">
                            {getStatusText(order.status)}
                          </p>
                        </div>
                      </div>

                      {/* Customer info */}
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{order.customer.name}</span>
                      </div>

                      {/* Order details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(order.order_date)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{order.items?.length || 0} {t("items", { ns: "common" })}</span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{t("total", { ns: "common" })}</span>
                          <span className="font-semibold text-lg">
                            {formatCurrency(order.total_amount, "USD", i18n.language)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t("previous", { ns: "common" })}
                </Button>
                
                <span className="text-sm text-muted-foreground px-4">
                  {t("pageWithTotal", { 
                    ns: "common", 
                    currentPage: currentPage + 1, 
                    totalPages 
                  })}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                >
                  {t("next", { ns: "common" })}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}; 