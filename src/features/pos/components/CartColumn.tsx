import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { ServiceOffering, ProductType } from "@/types";

interface CartItem {
  id: string;
  productType: ProductType;
  serviceOffering: ServiceOffering;
  quantity: number;
  price: number;
}

interface CartColumnProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onCheckout: () => void;
  isProcessing: boolean;
}

export const CartColumn: React.FC<CartColumnProps> = ({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onCheckout,
  isProcessing,
}) => {
  const { t, i18n } = useTranslation(["common", "orders"]);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground min-h-[200px]">
              <p>{t("cartIsEmpty", { ns: "orders" })}</p>
            </div>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="relative group">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-grow">
                      <h3 className="font-medium text-sm">{item.productType.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.serviceOffering.display_name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(item.price * item.quantity, "USD", i18n.language)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-4">
        <div className="flex justify-between items-center text-lg font-bold">
          <span>{t("total", { ns: "common" })}:</span>
          <span className="text-primary">
            {formatCurrency(total, "USD", i18n.language)}
          </span>
        </div>

        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={onCheckout}
          disabled={items.length === 0 || isProcessing}
        >
          {isProcessing && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {t("checkout", { ns: "orders" })}
        </Button>
      </div>
    </div>
  );
}; 