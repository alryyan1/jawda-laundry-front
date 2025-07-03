import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Loader2, PlusCircle, X, Plus, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { ServiceOffering, ProductType } from "@/types";
import { cn } from "@/lib/utils";

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
}) => {
  const { t, i18n } = useTranslation(["common", "orders"]);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{t("cart", { ns: "orders" })}</h2>
          <span className="text-sm text-muted-foreground">
            {t("itemCount", { count: items.length, ns: "orders" })}
          </span>
        </div>
        {onNewOrder && (
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
              <div
                key={item.id}
                className={cn(
                  "relative rounded-lg border bg-card text-card-foreground shadow-sm",
                  item._isQuoting && "opacity-70"
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.productType.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.serviceOffering.display_name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content */}
                <div className="p-3 space-y-3">
                  {/* Dimensions */}
                  {item.productType.is_dimension_based && onUpdateDimensions && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs mb-1">{t("length", { ns: "orders" })} (m)</Label>
                        <Input
                          type="number"
                          value={item.length_meters || ""}
                          onChange={(e) =>
                            onUpdateDimensions(item.id, {
                              length: parseFloat(e.target.value) || undefined,
                              width: item.width_meters,
                            })
                          }
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1">{t("width", { ns: "orders" })} (m)</Label>
                        <Input
                          type="number"
                          value={item.width_meters || ""}
                          onChange={(e) =>
                            onUpdateDimensions(item.id, {
                              length: item.length_meters,
                              width: parseFloat(e.target.value) || undefined,
                            })
                          }
                          className="h-8"
                        />
                      </div>
                    </div>
                  )}

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || item._isQuoting}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={item._isQuoting}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price, "USD", i18n.language)} × {item.quantity}
                      </p>
                      <p className="font-medium">
                        {formatCurrency(item.price * item.quantity, "USD", i18n.language)}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {onUpdateNotes && (
                    <div>
                      <Label className="text-xs mb-1">{t("notes", { ns: "orders" })}</Label>
                      <Textarea
                        value={item.notes || ""}
                        onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                        placeholder={t("addNotesForThisItem", { ns: "orders" })}
                        className="h-16 resize-none"
                      />
                    </div>
                  )}

                  {/* Quote Error */}
                  {item._quoteError && (
                    <p className="text-sm text-destructive">{item._quoteError}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

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
    </div>
  );
}; 