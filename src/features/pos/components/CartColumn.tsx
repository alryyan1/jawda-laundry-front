import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, PlusCircle, X, Plus, Minus, Edit, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { ServiceOffering, ProductType } from "@/types";
import { cn } from "@/lib/utils";

// Separate component for cart item to use hooks properly
const CartItemComponent: React.FC<{
  item: CartItem;
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateDimensions?: (id: string, dimensions: { length?: number; width?: number }) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onEditItem?: (itemId: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  i18n: { language: string };
  isReadOnly?: boolean;
}> = ({ item, onRemoveItem, onUpdateQuantity, onUpdateDimensions, onUpdateNotes, onEditItem, t, i18n, isReadOnly = false }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const hasDetails = item.notes;
  


  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card text-card-foreground shadow-sm",
        item._isQuoting && "opacity-70"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex-1">
          <h3 className="font-medium text-sm">{item.productType.name}</h3>
        
        </div>
        <div className="flex items-center gap-1">
          {!isReadOnly && onEditItem && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => onEditItem(item.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("changeService", { ns: "orders" })}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {!isReadOnly && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveItem(item.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Dimensions */}
        {item.productType.is_dimension_based && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs mb-1">{t("length", { ns: "orders" })} (m)</Label>
              {isReadOnly ? (
                <div className="h-8 px-3 py-2 text-sm bg-muted rounded border">
                  {item.length_meters || '-'}
                </div>
              ) : (
                <Input
                  type="number"
                  value={item.length_meters || ""}
                  onChange={(e) =>
                    onUpdateDimensions?.(item.id, {
                      length: parseFloat(e.target.value) || undefined,
                      width: item.width_meters,
                    })
                  }
                  className="h-8"
                  disabled={item._isQuoting}
                />
              )}
            </div>
            <div>
              <Label className="text-xs mb-1">{t("width", { ns: "orders" })} (m)</Label>
              {isReadOnly ? (
                <div className="h-8 px-3 py-2 text-sm bg-muted rounded border">
                  {item.width_meters || '-'}
                </div>
              ) : (
                <Input
                  type="number"
                  value={item.width_meters || ""}
                  onChange={(e) =>
                    onUpdateDimensions?.(item.id, {
                      length: item.length_meters,
                      width: parseFloat(e.target.value) || undefined,
                    })
                  }
                  className="h-8"
                  disabled={item._isQuoting}
                />
              )}
            </div>
            {!isReadOnly && item._isQuoting && (
              <div className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{t("calculatingPrice", { ns: "orders" })}</span>
              </div>
            )}
          </div>
        )}

        {/* Quantity and Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isReadOnly ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("quantity", { ns: "orders" })}:</span>
                <span className="font-medium">{item.quantity}</span>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1 || item._isQuoting}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    if (!isNaN(newValue) && newValue >= 1) {
                      onUpdateQuantity(item.id, newValue);
                    }
                  }}
                  className="w-16 h-7 px-2 text-center"
                  disabled={item._isQuoting}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={item._isQuoting}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
          <div className="text-right">
            {item._isQuoting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t("calculatingPrice", { ns: "orders" })}</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(item.price, "USD", i18n.language)} × {item.quantity}
                </p>
                <p className="font-medium">
                  {formatCurrency(item._quotedSubTotal || (item.price * item.quantity), "USD", i18n.language)}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Collapsible Details Section */}
        {(hasDetails || isDetailsOpen) && (
          <div className="pt-2 border-t border-dashed">
            <div className="flex items-end gap-2">
              {/* Toggle Button for details */}
              <div className="flex-grow">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-8"
                  onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                >
                  {isDetailsOpen ? t("hideDetails", { ns: "orders" }) : t("addDetails", { ns: "orders" })}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 ml-1 transition-transform",
                      isDetailsOpen && "rotate-180"
                    )}
                  />
                </Button>
              </div>
            </div>
            {/* Notes appear when toggled or if they have content */}
            {(isDetailsOpen || hasDetails) && onUpdateNotes && (
              <div className="pt-2">
                <div className="grid gap-1.5">
                  <Label className="text-xs">
                    {t("itemNotesOptional", { ns: "orders" })}
                  </Label>
                  <Textarea
                    value={item.notes || ""}
                    onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                    placeholder={t("itemNotesPlaceholder", { ns: "orders" })}
                    className="h-16 resize-none text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quote Error */}
        {item._quoteError && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm text-destructive cursor-help">{t("quoteError", { ns: "orders" })}</p>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item._quoteError}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

interface CartItem {
  id: string;
  productType: ProductType;
  serviceOffering: ServiceOffering;
  quantity: number;
  price: number;
  notes?: string;
  length_meters?: number;
  width_meters?: number;
  _isQuoting?: boolean;
  _quoteError?: string | null;
  _quotedSubTotal?: number;
}

interface CartColumnProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateDimensions?: (id: string, dimensions: { length?: number; width?: number }) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onUpdateOrderNotes?: (notes: string) => void;
  onUpdateDueDate?: (date: string) => void;
  onNewOrder?: () => void;
  orderNotes?: string;
  dueDate?: string;
  onCheckout: () => void;
  isProcessing: boolean;
  onEditItem?: (itemId: string) => void;
  mode?: 'cart' | 'order_view';
  orderNumber?: string;
  onBackToCart?: () => void;
}

export const CartColumn: React.FC<CartColumnProps> = ({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateDimensions,
  onUpdateNotes,
  onUpdateOrderNotes,
  onUpdateDueDate,
  onNewOrder,
  orderNotes,
  dueDate,
  onCheckout,
  isProcessing,
  onEditItem,
  mode = 'cart',
  orderNumber,
  onBackToCart,
}) => {
  const { t, i18n } = useTranslation(["common", "orders"]);

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
        {mode === 'order_view' && onBackToCart ? (
          <Button variant="outline" size="sm" onClick={onBackToCart}>
            {t("backToCart", { ns: "orders" })}
          </Button>
        ) : onNewOrder && (
          <Button variant="outline" size="sm" onClick={onNewOrder}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("newOrder", { ns: "orders" })}
          </Button>
        )}
      </header>

      <ScrollArea className="flex-grow">
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
                t={t}
                i18n={i18n}
                isReadOnly={mode === 'order_view'}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {mode === 'cart' && (
        <div className="p-4 border-t space-y-4">
          {/* Order-level notes */}
          {onUpdateOrderNotes && (
            <div>
              <Label className="text-xs font-medium">
                {t("overallOrderNotesOptional", { ns: "orders" })}
              </Label>
              <Textarea
                value={orderNotes || ""}
                onChange={(e) => onUpdateOrderNotes(e.target.value)}
                rows={2}
                placeholder={t("addNotesForThisOrder", { ns: "orders" })}
                className="resize-none"
              />
            </div>
          )}

          {/* Due date */}
          {onUpdateDueDate && (
            <div>
              <Label className="text-xs font-medium">
                {t("dueDateOptional", { ns: "orders" })}
              </Label>
              <Input
                type="date"
                value={dueDate || ""}
                onChange={(e) => onUpdateDueDate(e.target.value)}
              />
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center text-lg font-bold">
            <span>{t("total", { ns: "common" })}:</span>
            <span className="text-primary">
              {formatCurrency(total, "USD", i18n.language)}
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
            {onNewOrder && (
              <Button
                variant="outline"
                className="w-full"
                onClick={onNewOrder}
                disabled={isProcessing}
              >
                {t("startNewOrder", { ns: "orders" })}
              </Button>
            )}
          </div>
        </div>
      )}

      {mode === 'order_view' && (
        <div className="p-4 border-t">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>{t("total", { ns: "common" })}:</span>
            <span className="text-primary">
              {formatCurrency(total, "USD", i18n.language)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}; 