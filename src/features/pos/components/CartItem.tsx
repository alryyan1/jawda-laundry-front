// src/features/pos/components/CartItem.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  X,
  Plus,
  Minus,
  Edit,
  ChevronDown,
  Ruler,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { ServiceOffering, ProductType } from "@/types";
import { cn } from "@/lib/utils";
import { SelectSizeDialog } from "./SelectSizeDialog"; // Import the size selection dialog

// The CartItem type definition should ideally live in a types file (e.g., src/types/pos.types.ts)
// but exporting it here makes this component self-describing.
export interface CartItem {
  id: string; // Client-side UUID
  productType: ProductType;
  serviceOffering: ServiceOffering;
  quantity: number;
  price: number; // The base unit price
  notes?: string;
  length_meters?: number;
  width_meters?: number;
  _isQuoting?: boolean;
  _quoteError?: string | null;
  _quotedSubTotal?: number;
}

interface CartItemProps {
  item: CartItem;
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateDimensions: (
    id: string,
    dimensions: { length?: number; width?: number }
  ) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onEditItem: (itemId: string) => void;
  isReadOnly?: boolean;
}

export const CartItemComponent: React.FC<CartItemProps> = ({
  item,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateDimensions,
  onUpdateNotes,
  onEditItem,
  isReadOnly = false,
}) => {
  const { t, i18n } = useTranslation(["common", "orders", "services"]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(!!item.notes);
  const [isSizeDialogOpen, setIsSizeDialogOpen] = useState(false);

  const isDimensionBased = item.productType.is_dimension_based;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty input for user to clear it, but treat as 1 for logic.
    // A value of 0 or less will be invalid if using min(1)
    if (value === "" || /^[1-9]\d*$/.test(value)) {
      onUpdateQuantity(item.id, value === "" ? 1 : parseInt(value, 10));
    }
  };

  return (
    <>
      <div
        className={cn(
          "relative rounded-lg border bg-card text-card-foreground shadow-sm",
          item._isQuoting && "opacity-70 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-3 border-b">
          <div className="flex-1 pr-2">
            <p className="font-semibold text-sm leading-tight">
              {item.serviceOffering.display_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.productType.name}
            </p>
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
          {isDimensionBased && (
            <div className="grid grid-cols-5 gap-2 items-end">
              <div className="col-span-2">
                <Label className="text-xs mb-1 font-normal">
                  {t("length", { ns: "orders" })} (m)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.length_meters || ""}
                  onChange={(e) =>
                    onUpdateDimensions(item.id, {
                      length: parseFloat(e.target.value) || undefined,
                      width: item.width_meters,
                    })
                  }
                  className="h-8"
                  disabled={isReadOnly || item._isQuoting}
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs mb-1 font-normal">
                  {t("width", { ns: "orders" })} (m)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.width_meters || ""}
                  onChange={(e) =>
                    onUpdateDimensions(item.id, {
                      length: item.length_meters,
                      width: parseFloat(e.target.value) || undefined,
                    })
                  }
                  className="h-8"
                  disabled={isReadOnly || item._isQuoting}
                />
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setIsSizeDialogOpen(true)}
                  disabled={isReadOnly || item._isQuoting}
                >
                  <Ruler className="h-4 w-4" />
                  <span className="sr-only">
                    {t("selectPredefinedSize", { ns: "services" })}
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Quantity and Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isReadOnly ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t("quantity", { ns: "orders" })}:
                  </span>
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
                    onChange={handleQuantityChange}
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
                <div className="flex items-center gap-2 h-10">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(item.price, "USD", i18n.language)} ×{" "}
                    {item.quantity}
                  </p>
                  <p className="font-medium">
                    {formatCurrency(
                      item._quotedSubTotal || item.price * item.quantity,
                      "USD",
                      i18n.language
                    )}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Collapsible Details Button */}
          {!isReadOnly && (
            <div className="pt-2 border-t border-dashed">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-8 p-1"
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              >
                {isDetailsOpen
                  ? t("hideDetails", { ns: "orders" })
                  : t("addNotes", { ns: "orders", defaultValue: "Add Notes" })}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 ml-1 transition-transform",
                    isDetailsOpen && "rotate-180"
                  )}
                />
              </Button>
            </div>
          )}

          {/* Notes appear when toggled or if they already have content */}
          {(isDetailsOpen || item.notes) && (
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
                  disabled={isReadOnly || item._isQuoting}
                />
              </div>
            </div>
          )}

          {/* Quote Error Display */}
          {item._quoteError && !item._isQuoting && (
            <div className="pt-2 border-t border-destructive/50 flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p>{item._quoteError}</p>
            </div>
          )}
        </div>
      </div>

      {item.productType && isDimensionBased && !isReadOnly && (
        <SelectSizeDialog
          isOpen={isSizeDialogOpen}
          onOpenChange={setIsSizeDialogOpen}
          productType={item.productType}
          onSelect={(size) => {
            onUpdateDimensions(item.id, {
              length: size.length_meters,
              width: size.width_meters,
            });
          }}
        />
      )}
    </>
  );
};
