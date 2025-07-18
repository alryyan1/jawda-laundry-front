import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { materialColors } from "@/lib/colors";
import { Loader2, Calendar, Plus, Check } from "lucide-react";
import { format } from "date-fns";

// --- MUI Import ---
import MuiBadge from '@mui/material/Badge';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

import { getTodayOrders } from "@/api/orderService";
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
  onNewOrder?: () => void;
  isOrderViewMode?: boolean;
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
  onNewOrder,
  isOrderViewMode = false,
}) => {
  const { t } = useTranslation(["common", "orders"]);

  const { data: orders = [], isLoading } = useQuery<Order[], Error>({
    queryKey: ["todayOrders"],
    queryFn: getTodayOrders,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="w-[120px] bg-background rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-3 border-b flex-shrink-0" style={{ borderColor: materialColors.divider }}>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{t("todayOrders", { ns: "orders" })}</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <MuiThemeProvider theme={muiTheme}>
      <div className="w-[120px] bg-background rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="p-3 border-b flex-shrink-0" style={{ borderColor: materialColors.divider }}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{t("todayOrders", { ns: "orders" })}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {format(new Date(), 'MMM dd, yyyy')}
          </p>
          {onNewOrder && (
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "w-full h-8 text-xs relative",
                isOrderViewMode && "animate-pulse border-primary"
              )}
              onClick={onNewOrder}
            >
              <Plus className="h-3 w-3 mr-1" />
              {t("newOrder", { ns: "orders", defaultValue: "New Order" })}
              {isOrderViewMode && (
                <div className="absolute inset-0 rounded-md border-2 border-primary animate-ping opacity-20" />
              )}
            </Button>
          )}
        </div>

        {/* Orders List */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2 space-y-1">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  {t("noOrdersToday", { ns: "orders", defaultValue: "No orders today" })}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-1">
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
                            ? "border-primary bg-primary/5 shadow-md"
                            : getStatusBorderColor(order.status)
                        )}
                        onClick={() => onOrderSelect(order)}
                      >
                        {/* Only show order number */}
                        <span className="text-sm font-bold text-foreground">
                          {order.daily_order_number || order.order_number}
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
          <div className="p-2 border-t flex-shrink-0" style={{ borderColor: materialColors.divider }}>
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