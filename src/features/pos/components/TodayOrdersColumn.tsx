import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { materialColors } from "@/lib/colors";

import { Calendar, Check, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// --- MUI Import ---
import MuiBadge from '@mui/material/Badge';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

import { getOrders, getLatestShift } from "@/api/orderService";
import { useDate } from "@/context/DateContext";
import type { Order } from "@/types";

// A minimal MUI theme to make the badge fit the Shadcn theme
const muiTheme = createTheme({
  palette: {
    primary: {
      main: 'hsl(var(--primary))', // Use CSS variable from Shadcn
    },
    secondary: {
      main: 'hsl(var(--secondary))',
    },
  },
  components: {
    MuiBadge: {
        styleOverrides: {
            badge: {
                // Custom styles for the badge itself
                height: '16px',
                minWidth: '16px',
                fontSize: '0.65rem',
                padding: '0 4px',
                fontWeight: '600',
            }
        }
    }
  }
});

interface TodayOrdersColumnProps {
  onOrderSelect: (order: Order) => void;
  selectedOrderId?: string | null;
}

const getStatusBorderColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'border-yellow-500';
    case 'in_progress':
      return 'border-blue-500';
    case 'completed':
      return 'border-green-500';
    case 'cancelled':
      return 'border-red-500';
    case 'delivered':
      return 'border-purple-500';
    default:
      return 'border-gray-500';
  }
};

export const TodayOrdersColumn: React.FC<TodayOrdersColumnProps> = ({
  onOrderSelect,
  selectedOrderId,
}) => {
  const { t } = useTranslation(["common", "orders"]);
  const { selectedDate } = useDate();

  // Keep latest shift in a react-query so others can invalidate
  const { data: latestShift } = useQuery<{ id: number } | null, Error>({
    queryKey: ["latest-shift"],
    queryFn: getLatestShift,
    refetchOnWindowFocus: false,
  });

  const shiftId = latestShift?.id ?? null;

  const { data: orders = [], isLoading, refetch, isRefetching } = useQuery<Order[], Error>({
    queryKey: ["todayOrders", shiftId],
    queryFn: async () => {
      const res = await getOrders(1, 100, { shiftId: shiftId ?? undefined });
      return res.data;
    },
    enabled: shiftId !== null,
  });

  if (isLoading) {
    return (
      <div className="w-[120px] bg-background rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
        {/* Skeleton loading for orders */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-1 space-y-1">
            <div className="flex flex-col items-center space-y-1">
              {[...Array(8)].map((_, index) => (
                <React.Fragment key={index}>
                  <Skeleton className="w-[49px] h-[49px] rounded-lg" />
                  {index < 7 && (
                    <div className="w-8 h-px bg-border" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </ScrollArea>
        
        {/* Skeleton for footer */}
        <div className="p-1 border-t flex-shrink-0">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <MuiThemeProvider theme={muiTheme}>
      <div className="w-[120px] bg-background rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
        {/* Refresh */}
        <div className="p-1 border-b flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>


        {/* Orders List */}
        <ScrollArea className="flex-1 min-h-0 p-3" >
          <div className="p-1 space-y-1">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  {t("noOrdersForDate", { ns: "orders", defaultValue: "No orders for" })} {selectedDate}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-1 p-2">
                {orders.map((order, index) => (
                  <React.Fragment key={order.id}>
                    <MuiBadge
                      badgeContent={order.items?.length || 0}
                      color="info"
                      invisible={!order.items?.length || order.items.length === 0}
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                    >
                      <div
                        className={cn(
                          "relative w-[49px] h-[49px] rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105",
                          "flex flex-col items-center justify-center p-2",
                          selectedOrderId === order.id.toString()
                            ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/30 bg-gradient-to-br from-primary/5 to-primary/15 animate-pulse border-4"
                            : getStatusBorderColor(order.status)
                        )}
                        onClick={() => onOrderSelect(order)}
                      >
                        {/* Only show order number */}
                        <span className="text-sm font-bold text-foreground">
                          {order.daily_order_number || order.id}
                        </span>
                        
                        {/* Green check mark for fully paid orders */}
                        {order.payment_status === 'paid' && (
                          <div className="absolute -bottom-1 -left-1 bg-green-500 rounded-full p-0.5 shadow-sm">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </MuiBadge>
                    {index < orders.length - 1 && (
                      <div className="w-8 h-px bg-border" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with total count */}
        {orders.length > 0 && (
          <div className="p-1 border-t flex-shrink-0" style={{ borderColor: materialColors.divider }}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("total", { ns: "common" })}:</span>
              <Badge variant="secondary" className="text-xs">
                {orders.length} {t("orders", { ns: "orders" })}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </MuiThemeProvider>
  );
}; 