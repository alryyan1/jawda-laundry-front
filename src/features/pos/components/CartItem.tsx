// src/features/pos/components/CartItem.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X, Plus, Minus, AlertCircle } from "lucide-react";
import type { ServiceOffering, ProductType } from "@/types";
import { cn } from "@/lib/utils";
import { SelectSizeDialog } from "./SelectSizeDialog"; // Import the size selection dialog
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { useSettings } from "@/context/SettingsContext";

// The CartItem type definition should ideally live in a types file (e.g., src/types/pos.types.ts)
// but exporting it here makes this component self-describing.
export interface CartItem {
  id: string; // Client-side UUID
  backendId?: string; // ID from the database (for existing items)
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
  _isExistingOrderItem?: boolean; // Flag to identify existing order items
  _isAdding?: boolean; // Flag to show loading state while adding to backend
  _isDeleting?: boolean; // Flag to show loading state while deleting from backend
}

interface CartItemProps {
  item: CartItem;
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateDimensions: (
    id: string,
    dimensions: { length?: number; width?: number },
  ) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  isReadOnly?: boolean;
}

export const CartItemComponent: React.FC<CartItemProps> = ({
  item,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateDimensions,
  onUpdateNotes,
  isReadOnly = false,
}) => {
  // Only use the isReadOnly prop, don't make existing order items read-only
  const effectiveReadOnly = isReadOnly;
  const { i18n } = useTranslation(["common", "orders", "services"]);
  const { getSetting } = useSettings();
  const [isSizeDialogOpen, setIsSizeDialogOpen] = useState(false);

  const isDimensionBased = item.productType.is_dimension_based;
  const currency = getSetting("currency_symbol", "USD");
  
  // Calculate the item subtotal (use quoted subtotal if available, otherwise price * quantity)
  const itemSubtotal = item._quotedSubTotal || item.price * item.quantity;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty input for user to clear it, but treat as 1 for logic.
    // A value of 0 or less will be invalid if using min(1)
    if (value === "" || /^[1-9]\d*$/.test(value)) {
      onUpdateQuantity(item.id, value === "" ? 1 : parseInt(value, 10));
    }
  };
  // Calculate dimension display value (length × width or just length)
  const dimensionValue = isDimensionBased
    ? item.length_meters && item.width_meters
      ? `${item.length_meters} × ${item.width_meters}`
      : item.length_meters || item.width_meters || "0"
    : null;

  return (
    <>
      {item._isAdding ? (
        // Skeleton loading state while adding to backend
        <div className="flex items-center gap-3 p-2 border rounded-md bg-card">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      ) : (
        <div
          dir={i18n.language === "ar" ? "rtl" : "ltr"}
          className={cn(
            "flex items-center gap-3 p-2 border rounded-md bg-card hover:bg-card/80 transition-colors",
            item._isQuoting && "opacity-70 pointer-events-none",
          )}
        >
          {/* Left: Product Info */}
          <div className="flex-1 min-w-0">
            {/* Product Name - Bold */}
            <p className="text-base font-bold text-gray-800 truncate">
              {item.productType.name}
            </p>
            {/* Arabic Name / Display Name */}
            
            {/* Service Type - Blue */}
            <p className="text-xs font-medium text-blue-500 truncate">
              [{item.serviceOffering.serviceAction?.name || ""} {item.serviceOffering.serviceAction?.description || ""}]
            </p>
            {/* Price Display */}
            <p className="text-sm font-semibold text-gray-700">
              {formatCurrency(itemSubtotal, currency, i18n.language)}
            </p>
          </div>

          {/* Dimension Value */}
          {isDimensionBased && (
            <div className="h-10 w-16 rounded-md border border-gray-200 bg-white flex items-center justify-center flex-shrink-0">
              {effectiveReadOnly ? (
                <span className="text-xs text-gray-700 font-medium">
                  {dimensionValue || "-"}
                </span>
              ) : (
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
                  onFocus={(e) => e.target.select()}
                  className="h-8 w-full text-center text-xs px-1"
                  disabled={item._isQuoting}
                  placeholder="0"
                />
              )}
            </div>
          )}

          {/* Quantity Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {effectiveReadOnly ? (
              <span className="text-sm font-medium text-gray-700 w-8 text-center">
                {item.quantity}
              </span>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
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
                  className="w-10 h-8 px-1 text-center text-sm"
                  disabled={item._isQuoting}
                  onFocus={(e) => e.target.select()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={item._isQuoting}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>

          {/* Remove Button */}
          {!effectiveReadOnly && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-destructive flex-shrink-0"
              onClick={() => onRemoveItem(item.id)}
              disabled={item._isDeleting}
            >
              {item._isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Quote Loading Indicator */}
          {item._isQuoting && (
            <div className="flex-shrink-0">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Quote Error Display */}
          {item._quoteError && !item._isQuoting && (
            <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-destructive/10 border border-destructive/50 rounded text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              <p className="truncate">{item._quoteError}</p>
            </div>
          )}
        </div>
      )}

      {item.productType && isDimensionBased && !effectiveReadOnly && (
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
