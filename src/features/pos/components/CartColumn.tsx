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
import type { Order } from "@/types";

interface CartColumnProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateDimensions: (id: string, dimensions: { length?: number; width?: number }) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onUpdateCompositions: (id: string, excludedIds: number[]) => void;
  onSaveNotesToBackend?: (orderItemId: string | number, notes: string) => Promise<void>;
  selectedOrder?: Order | null;
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
  onUpdateCompositions,
  onSaveNotesToBackend,
  selectedOrder,
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

  // Sort items by newest first (by _addedAt timestamp, fallback to array order for items without timestamp)
  const sortedItems = [...items].sort((a, b) => {
    const aTime = a._addedAt || 0;
    const bTime = b._addedAt || 0;
    return bTime - aTime; // Newest first
  });

  // Determine which items to display
  const itemsToShow = selectedItemId 
    ? sortedItems.filter(item => item.id === selectedItemId)
    : sortedItems;
console.log(itemsToShow,'itemsToShow',items,'items')

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
        isReceived && "bg-gradient-to-br from-sky-50 to-green-50 border border-sky-200 rounded-lg"
      )}
    >
      {/* Cart Items Avatar Header - Positioned at top border */}
      {items.length > 0 && (
        <div className={cn(
          "rounded-lg p-1 shadow-lg",
          isReceived 
            ? "bg-gradient-to-br from-sky-100 to-green-100 border border-sky-300 shadow-sky-200/50" 
            : "bg-white border border-gray-200"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center ">
              <span className="text-sm font-medium text-muted-foreground">
                {selectedItemId 
                  ? t("cartItem", { ns: "orders", defaultValue: "Cart Item" })
                  : t("cartItems", { ns: "orders", defaultValue: "Cart Items" })
                }:
              </span>
              <span className="text-sm text-muted-foreground">
                ({selectedItemId ? 1 : items.length})
              </span>
            </div>
            {selectedItemId && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleShowAll}
                className="h-6 px-2 text-xs"
              >
                <Users className="h-3 w-3 mr-1" />
                {t("showAll", { ns: "common", defaultValue: "Show All" })}
              </Button>
            )}
          </div>
          
          {/* Avatar Numbers */}
          <div className="flex flex-wrap gap-1">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleAvatarClick(item.id)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all hover:scale-110 hover:shadow-md cursor-pointer",
                  selectedItemId === item.id
                    ? "bg-sky-500 text-white border-sky-500 shadow-md"
                    : selectedItemId === null
                    ? "bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200"
                    : "bg-gray-100 text-gray-600 border-sky-200 hover:bg-gray-200"
                )}
                title={`${item.productType.name} - ${item.serviceOffering.display_name} (${item.quantity}x)`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          {/* Order Category Sequence Display */}
          {orderNumber && (
            <div className="mt-2 text-center">
              <div className={cn(
                "text-lg font-bold",
                isReceived ? "text-green-700" : "text-sky-700"
              )}>
                {orderNumber}
                {isReceived && (
                  <span className="ml-2 text-green-600">✓</span>
                )}
              </div>
            </div>
          )}
          
    
        </div>
      )}

      <ScrollArea className="flex-grow h-[calc(100vh-500px)] ">
        <div className={cn(
          "p-1 space-y-4",
          isReceived && "bg-gradient-to-br from-sky-50/50 to-green-50/50 rounded-lg"
        )}>
          {itemsToShow.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground min-h-[200px]">
              <p>{t("cartIsEmpty", { ns: "orders" })}</p>
            </div>
          ) : (
            itemsToShow.map((item, index) => (
              <CartItemComponent
                key={item.id}
                item={item}
                onRemoveItem={onRemoveItem}
                onUpdateQuantity={onUpdateQuantity}
                onUpdateDimensions={onUpdateDimensions}
                onUpdateNotes={onUpdateNotes}
                onUpdateCompositions={onUpdateCompositions}
                onSaveNotesToBackend={onSaveNotesToBackend}
                isReadOnly={isReadOnly || mode === 'order_view'}
                itemNumber={index + 1}
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
                        variant="default"
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