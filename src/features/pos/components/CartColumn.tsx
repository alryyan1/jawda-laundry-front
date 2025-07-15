import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { CartItemComponent, type CartItem } from "./CartItem";
import { useSettings } from "@/context/SettingsContext";

interface CartColumnProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateDimensions: (id: string, dimensions: { length?: number; width?: number }) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onCheckout: () => void;
  isProcessing: boolean;
  onEditItem: (itemId: string) => void;
  mode?: 'cart' | 'order_view';
  orderNumber?: string;
}

export const CartColumn: React.FC<CartColumnProps> = ({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateDimensions,
  onUpdateNotes,
  onCheckout,
  isProcessing,
  onEditItem,
  mode = 'cart',
  orderNumber,
}) => {
  const { t, i18n } = useTranslation(["common", "orders"]);
  const { getSetting } = useSettings();
  
  // Get currency from settings, fallback to USD
  const currency = getSetting('currency_symbol', 'USD');

  const total = items.reduce((sum, item) => sum + (item._quotedSubTotal || (item.price * item.quantity)), 0);

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">
            {mode === 'order_view' 
              ? `${t("order", { ns: "orders" })} #${orderNumber}` 
              : t("cart", { ns: "orders" })
            }
          </h2>
          <span className="text-sm text-muted-foreground">
            {t("itemCount", { count: items.length, ns: "orders" })}
          </span>
        </div>
      </header>

      <ScrollArea className="flex-grow  h-[calc(100vh-500px)]">
        <div className="p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground min-h-[200px]">
              <p>{t("cartIsEmpty", { ns: "orders" })}</p>
            </div>
          ) : (
            items.map((item) => (
              <CartItemComponent
                key={item.id}
                item={item}
                onRemoveItem={onRemoveItem}
                onUpdateQuantity={onUpdateQuantity}
                onUpdateDimensions={onUpdateDimensions}
                onUpdateNotes={onUpdateNotes}
                onEditItem={onEditItem}
                isReadOnly={mode === 'order_view'}
              />
            ))
          )}
        </div>
      </ScrollArea>
      
      {mode === 'cart' && (
        <div className="p-4 border-t space-y-4">
          <Separator />

          <div className="flex justify-between items-center text-lg font-bold">
            <span>{t("total", { ns: "common" })}:</span>
            <span className="text-primary">
              {formatCurrency(total, currency, i18n.language)}
            </span>
          </div>

          <div className="flex flex-col gap-2">
             <Button
              className="w-full h-12 text-base font-semibold"
              onClick={onCheckout}
              disabled={items.length === 0 || isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("completeOrder", { ns: "orders" })}
            </Button>
          </div>
        </div>
      )}

      {mode === 'order_view' && (
        <div className="p-4 border-t">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>{t("total", { ns: "common" })}:</span>
            <span className="text-primary">
              {formatCurrency(total, currency, i18n.language)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}; 