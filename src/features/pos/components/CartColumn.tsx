import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Users, X } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { CartItemComponent, type CartItem } from "./CartItem";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";

interface CartColumnProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateDimensions: (id: string, dimensions: { length?: number; width?: number }) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onCheckout: () => void;
  onCancelOrder?: () => void;
  isProcessing: boolean;
  mode?: 'cart' | 'order_view' | 'order_edit';
  orderNumber?: string;
  isReadOnly?: boolean;
  isReceived?: boolean;
  paymentStatus?: 'pending' | 'paid' | 'partially_paid' | 'refunded' | string | null;
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
  mode = 'cart',
  orderNumber,
  isReadOnly = false,
  isReceived = false,
  paymentStatus,
}) => {
  const { t, i18n } = useTranslation(["common", "orders"]);
  const { getSetting } = useSettings();
  
  // State for managing which items to show
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Get currency from settings, fallback to USD
  const currency = getSetting('currency_symbol', 'USD');

  const total = items.reduce((sum, item) => sum + (item._quotedSubTotal || (item.price * item.quantity)), 0);

  // Determine which items to display
  const itemsToShow = selectedItemId 
    ? items.filter(item => item.id === selectedItemId)
    : items;

  // Handle avatar click
  const handleAvatarClick = (itemId: string) => {
    setSelectedItemId(selectedItemId === itemId ? null : itemId);
  };

  // Handle show all button
  const handleShowAll = () => {
    setSelectedItemId(null);
  };

    return (
    <div 
      className={cn(
        "flex flex-col h-full relative",
        isReceived && "bg-gradient-to-br  border-sky-200 rounded-lg"
      )}
    >
      {/* Cart Items Avatar Header - Positioned at top border */}
     

      <ScrollArea className="flex-grow h-[calc(100vh-500px)] ">
        <div className={cn(
          "p-1 space-y-4",
          isReceived && ""
        )}>
          {itemsToShow.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground min-h-[200px]">
              <p>{t("cartIsEmpty", { ns: "orders" })}</p>
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
                isReadOnly={isReadOnly || mode === 'order_view'}
              />
            ))
          )}
        </div>
      </ScrollArea>
      
      {mode === 'cart' && (
        <div className="p-1 border-t space-y-4">
          <Separator />

          <div className="flex justify-between items-center text-lg font-bold">
            <span>{t("total", { ns: "common" })}:</span>
            <span className="text-primary">
              {formatCurrency(total, currency, i18n.language, 3)}
            </span>
          </div>

          <div className="flex flex-col gap-2">
             <Button
              className="w-full h-12 text-base font-semibold"
              onClick={onCheckout}
              disabled={items.length === 0 || isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("receiveOrder", { ns: "orders", defaultValue: "Receive Order" })}
            </Button>
          </div>
        </div>
      )}

      {mode === 'order_edit' && (
        <div className="p-4 border-t space-y-4">
          <Separator />

          <div className="flex justify-between items-center text-lg font-bold">
            <span>{t("total", { ns: "common" })}:</span>
            <span className="text-primary">
              {formatCurrency(total, currency, i18n.language, 3)}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {/* Show Complete Order button when order is NOT received */}
            {!isReceived && (
              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={onCheckout}
                disabled={isProcessing}
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("receiveOrder", { ns: "orders", defaultValue: "Receive Order" })}
              </Button>
            )}
            
            {/* Show Cancel Order button when order IS received */}
            {isReceived && onCancelOrder && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant="ghost"
                        className="w-full h-12 text-base font-semibold"
                        onClick={onCancelOrder}
                        disabled={isProcessing || paymentStatus === 'paid'}
                      >
                        <X className="mr-2 h-4 w-4" />
                        {t("cancelOrder", { ns: "orders", defaultValue: "Cancel Order" })}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {paymentStatus === 'paid' && (
                    <TooltipContent>
                      <p>{t("cannotCancelPaidOrder", { ns: "orders", defaultValue: "Cannot cancel a fully paid order" })}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      )}

      {mode === 'order_view' && (
        <div className="p-4 border-t">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>{t("total", { ns: "common" })}:</span>
            <span className="text-primary">
              {formatCurrency(total, currency, i18n.language, 3)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}; 