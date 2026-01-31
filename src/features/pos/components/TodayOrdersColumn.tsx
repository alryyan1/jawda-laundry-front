import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  Loader2,
  ListOrdered,
  ShoppingBag,
  User,
} from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { getTodayOrders } from "@/api/orderService";
import { useDate } from "@/context/DateContext";
import type { Order } from "@/types";

interface TodayOrdersColumnProps {
  onOrderSelect: (order: Order) => void;
  selectedOrderId?: string | null;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "border-yellow-500 text-yellow-600 bg-yellow-50/50";
    case "in_progress":
      return "border-blue-500 text-blue-600 bg-blue-50/50";
    case "completed":
      return "border-green-500 text-green-600 bg-green-50/50";
    case "cancelled":
      return "border-red-500 text-red-600 bg-red-50/50";
    case "delivered":
      return "border-purple-500 text-purple-600 bg-purple-50/50";
    default:
      return "border-slate-300 text-slate-600 bg-slate-50";
  }
};

export const TodayOrdersColumn: React.FC<TodayOrdersColumnProps> = ({
  onOrderSelect,
  selectedOrderId,
}) => {
  const { t } = useTranslation(["common", "orders"]);
  const { selectedDate } = useDate();

  const { data: queryData, isLoading } = useQuery<Order[], Error>({
    queryKey: ["todayOrders", selectedDate],
    queryFn: () => getTodayOrders(selectedDate),
    staleTime: 5 * 60 * 1000,
  });

  // Ensure orders is always an array
  const orders = useMemo(() => {
    if (Array.isArray(queryData)) return queryData;
    if (
      queryData &&
      typeof queryData === "object" &&
      "data" in queryData &&
      Array.isArray((queryData as any).data)
    ) {
      return (queryData as any).data as Order[];
    }
    return [];
  }, [queryData]);

  if (isLoading) {
    return (
      <div className="w-[120px] bg-white border-r border-slate-100 flex flex-col h-full shadow-sm">
        <div className="p-3 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
          <Skeleton className="h-4 w-20" />
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2 space-y-2 flex flex-col items-center">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-14 rounded-xl" />
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="w-[140px] bg-white border-r border-slate-100 flex flex-col h-full shadow-[2px_0_5px_-3px_rgba(0,0,0,0.05)] relative z-10">
      {/* Header */}
      <div className="p-3 border-b border-slate-100 bg-white/80 backdrop-blur-sm text-center">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
          {t("today", { ns: "common", defaultValue: "Today" })}
        </h3>
        <Badge variant="secondary" className="px-2 py-0.5 text-[10px] h-5">
          {orders.length} <span className="ml-1 opacity-70">orders</span>
        </Badge>
      </div>

      {/* Orders List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 py-3">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <Calendar className="h-8 w-8 text-slate-200" />
              <p className="text-xs text-muted-foreground">
                {t("noOrdersForDate", {
                  ns: "orders",
                  defaultValue: "No orders",
                })}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              {orders.map((order) => {
                const isSelected = selectedOrderId === order.id.toString();
                const statusStyles = getStatusColor(order.status || "pending");
                const itemCount = order.items?.length || 0;

                return (
                  <button
                    key={order.id}
                    onClick={() => onOrderSelect(order)}
                    className={cn(
                      "group relative w-20 h-20 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-lg scale-105 z-10 ring-2 ring-primary/20"
                        : `${statusStyles} hover:border-slate-400 hover:shadow-md hover:-translate-y-0.5`,
                    )}
                  >
                    {/* Item Count Badge */}
                    {itemCount > 0 && (
                      <span
                        className={cn(
                          "absolute -top-2 -right-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-bold shadow-sm border border-white",
                          isSelected
                            ? "bg-white text-primary"
                            : "bg-slate-800 text-white",
                        )}
                      >
                        {itemCount}
                      </span>
                    )}

                    {/* Paid Indicator */}
                    {order.payment_status === "paid" && (
                      <div className="absolute -bottom-1 -left-1 bg-green-500 rounded-full p-0.5 shadow-sm border border-white">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}

                    {/* Order Number */}
                    <span
                      className={cn(
                        "text-lg font-bold tabular-nums leading-none",
                        isSelected ? "text-white" : "text-slate-700",
                      )}
                    >
                      {order.daily_order_number || order.id}
                    </span>

                    {/* Customer Icon Indicator - NEW FEATURE */}
                    {order.customer_id && (
                      <div
                        className={cn(
                          "absolute bottom-1 right-1",
                          isSelected
                            ? "text-primary-foreground/80"
                            : "text-slate-400",
                        )}
                        title={order.customer?.name}
                      >
                        <User className="h-3 w-3" />
                      </div>
                    )}

                    {/* Status Label (Tiny) */}
                    <span
                      className={cn(
                        "text-[9px] font-medium uppercase tracking-tight max-w-full truncate px-1",
                        isSelected
                          ? "text-primary-foreground/90"
                          : "text-slate-500",
                      )}
                    >
                      {order.status?.replace("_", " ") || "Order"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Decoration */}
      <div className="h-4 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
    </div>
  );
};
