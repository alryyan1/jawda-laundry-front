import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, X, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { CartItemComponent, type CartItem } from "./CartItem";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";

interface CartColumnProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateDimensions: (
    id: string,
    dimensions: { length?: number; width?: number },
  ) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onCheckout: () => void;
  onCancelOrder?: () => void;
  isProcessing: boolean;
  isLoading?: boolean;
  mode?: "cart" | "order_view" | "order_edit";
  orderNumber?: string;
  isReadOnly?: boolean;
  isReceived?: boolean;
  paymentStatus?:
    | "pending"
    | "paid"
    | "partially_paid"
    | "refunded"
    | string
    | null;
}

export const CartColumn: React.FC<CartColumnProps> = ({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateDimensions,
  onUpdateNotes,
  onCheckout,
  onCancelOrder,
  isProcessing,
  isLoading = false,
  mode = "cart",
  orderNumber,
  isReadOnly = false,
  isReceived = false,
  paymentStatus,
}) => {
  const { t, i18n } = useTranslation(["common", "orders"]);
  const { getSetting } = useSettings();

  // State for managing which items to show - keeping for future feature (avatar filter)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Get currency from settings, fallback to USD
  const currency = getSetting("currency_symbol", "USD");

  const total = items.reduce(
    (sum, item) => sum + (item._quotedSubTotal || item.price * item.quantity),
    0,
  );

  // Determine which items to display
  const itemsToShow = selectedItemId
    ? items.filter((item) => item.id === selectedItemId)
    : items;

  return (
    <div
      className={cn(
        "flex flex-col h-full relative bg-white border-l w-[400px]  border-slate-100 shadow-sm",
        isReceived && "bg-slate-50/50",
      )}
    >
     

      {/* Items List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className={cn("p-4 space-y-3", isReceived && "opacity-90")}>
          {isLoading ? (
            // Skeleton loading state
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border border-slate-200 rounded-lg p-4 space-y-3 animate-pulse"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-8 w-8 bg-slate-200 rounded"></div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : itemsToShow.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-slate-200" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-slate-900">
                  {t("cartIsEmpty", { ns: "orders" })}
                </p>
                <p className="text-xs text-muted-foreground max-w-[180px] mx-auto">
                  Select products from the list to add them to this order
                </p>
              </div>
            </div>
          ) : (
            itemsToShow.map((item) => (
              <CartItemComponent
                key={item.id}
                item={item}
                onRemoveItem={onRemoveItem}
                onUpdateQuantity={onUpdateQuantity}
                onUpdateDimensions={onUpdateDimensions}
                onUpdateNotes={onUpdateNotes}
                isReadOnly={isReadOnly || mode === "order_view"}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer / Checkout Section */}
      <div className="mt-auto bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="p-4 space-y-4">
          {/* Totals */}
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                {t("total", { ns: "common" })}
              </p>
            </div>
            <div className="text-2xl font-bold text-primary tabular-nums tracking-tight">
              {formatCurrency(total, currency, i18n.language, 3)}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            {mode === "cart" && (
              <Button
                className="w-full h-12 text-base font-semibold shadow-md active:shadow-sm transition-all"
                size="lg"
                onClick={onCheckout}
                disabled={items.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  t("receiveOrder", {
                    ns: "orders",
                    defaultValue: "Receive Order",
                  })
                )}
              </Button>
            )}

            {mode === "order_edit" && (
              <>
                {!isReceived && (
                  <Button
                    className="w-full h-12 text-base font-semibold shadow-md active:shadow-sm transition-all"
                    onClick={onCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("updateOrder", {
                      ns: "orders",
                      defaultValue: "Update Order",
                    })}
                  </Button>
                )}

                {isReceived && onCancelOrder && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <Button
                            variant="outline"
                            className="w-full h-12 text-base font-medium text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20 hover:border-destructive/30"
                            onClick={onCancelOrder}
                            disabled={isProcessing || paymentStatus === "paid"}
                          >
                            <X className="mr-2 h-4 w-4" />
                            {t("cancelOrder", {
                              ns: "orders",
                              defaultValue: "Cancel Order",
                            })}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {paymentStatus === "paid" && (
                        <TooltipContent>
                          <p>
                            {t("cannotCancelPaidOrder", {
                              ns: "orders",
                              defaultValue: "Cannot cancel a fully paid order",
                            })}
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}
              </>
            )}

            {mode === "order_view" && (
              <div className="text-center">
                <span className="text-xs text-muted-foreground bg-slate-50 px-3 py-1 rounded-full">
                  View Only Mode
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
