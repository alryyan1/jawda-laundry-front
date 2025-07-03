// src/features/orders/components/wizard/OrderCartItem.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormContext, useWatch } from "react-hook-form";

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
import { Loader2, Trash2, Edit, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

import type { NewOrderFormData, OrderItemFormLine } from "@/types";

interface OrderCartItemProps {
  index: number;
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  isSubmittingOrder: boolean;
}

export const OrderCartItem: React.FC<OrderCartItemProps> = ({
  index,
  onRemove,
  onEdit,
  isSubmittingOrder,
}) => {
  const { t, i18n } = useTranslation(["common", "orders", "services"]);
  const {
    register,
    formState: { errors },
  } = useFormContext<NewOrderFormData>();

  const itemPathPrefix = `items.${index}` as const;
  const itemData = useWatch({ name: itemPathPrefix });
  const [isDetailsOpen, setIsDetailsOpen] = useState(false); // State to toggle details view

  // Fallback in case of data inconsistency
  if (!itemData?._derivedServiceOffering) {
    return (
      <div className="p-3 border rounded-lg bg-destructive/10 text-destructive text-sm flex justify-between items-center">
        <span>{t("itemDataMissingError", { ns: "orders" })}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="h-7 w-7"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const {
    _derivedServiceOffering: offering,
    _isQuoting: isQuoting,
    _quoteError: quoteError,
    _quoted_sub_total: subtotal,
    _quoted_price_per_unit_item: pricePerUnit,
  } = itemData;

  const isDimensionBased = offering.productType?.is_dimension_based;
  const hasDetails = itemData.product_description_custom || itemData.notes;

  return (
    <div className="p-3 border rounded-lg bg-background shadow-sm space-y-2 text-sm">
      {/* --- Main Item Row --- */}
      <div className="flex items-start gap-2">
        {/* Item Name */}
        <div className="flex-grow">
          <p className="font-semibold leading-tight">{offering.display_name}</p>
          <p className="text-xs text-muted-foreground">
            {offering.productType?.name}
          </p>
        </div>

        {/* Quantity Input */}
        <div className="w-16">
          <Label htmlFor={`${itemPathPrefix}.quantity`} className="sr-only">
            {t("quantity")}
          </Label>
          <Input
            id={`${itemPathPrefix}.quantity`}
            type="number"
            {...register(`${itemPathPrefix}.quantity`)}
            min="1"
            disabled={isSubmittingOrder}
            className="h-8 text-center"
          />
        </div>

        {/* Unit Price */}
        <div className="w-20 text-right rtl:text-left">
          {pricePerUnit !== null && pricePerUnit !== undefined ? (
            <span className="font-mono">
              {formatCurrency(pricePerUnit, "USD", i18n.language)}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>

        {/* Subtotal & Actions */}
        <div className="w-24 text-right rtl:text-left font-semibold">
          {isQuoting ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : quoteError ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-destructive font-bold">Error</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{quoteError}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : subtotal !== null && subtotal !== undefined ? (
            <span>{formatCurrency(subtotal, "USD", i18n.language)}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
        <div className="w-8 flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* --- Collapsible Details Section --- */}
      {(isDimensionBased || hasDetails || isDetailsOpen) && (
        <div className="pt-2 border-t border-dashed">
          <div className="flex items-end gap-2">
            {/* Dimension Inputs */}
            {isDimensionBased && (
              <div className="flex items-end gap-2 flex-grow">
                <div className="grid gap-1 w-full">
                  <Label
                    htmlFor={`${itemPathPrefix}.length_meters`}
                    className="text-xs"
                  >
                    {t("lengthMeters", { ns: "orders" })}
                  </Label>
                  <Input
                    id={`${itemPathPrefix}.length_meters`}
                    type="number"
                    step="0.01"
                    {...register(`${itemPathPrefix}.length_meters`)}
                    placeholder="L"
                    disabled={isSubmittingOrder}
                    className="h-8"
                  />
                </div>
                <div className="text-muted-foreground text-xs pb-2">x</div>
                <div className="grid gap-1 w-full">
                  <Label
                    htmlFor={`${itemPathPrefix}.width_meters`}
                    className="text-xs"
                  >
                    {t("widthMeters", { ns: "orders" })}
                  </Label>
                  <Input
                    id={`${itemPathPrefix}.width_meters`}
                    type="number"
                    step="0.01"
                    {...register(`${itemPathPrefix}.width_meters`)}
                    placeholder="W"
                    disabled={isSubmittingOrder}
                    className="h-8"
                  />
                </div>
              </div>
            )}
            {/* Toggle Button for other details */}
            {!isDimensionBased && (
              <div className="flex-grow">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-8"
                  onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                >
                  {isDetailsOpen ? t("hideDetails") : t("addDetails")}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 ml-1 transition-transform",
                      isDetailsOpen && "rotate-180"
                    )}
                  />
                </Button>
              </div>
            )}
            {/* Edit Service Offering Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(index)}
                    className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("changeService", { ns: "orders" })}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {/* Description and Notes appear when toggled or if they have content */}
          {(isDetailsOpen || hasDetails) && (
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div className="grid gap-1.5">
                <Label
                  htmlFor={`${itemPathPrefix}.product_description_custom`}
                  className="text-xs"
                >
                  {t("itemDescriptionOptional", { ns: "orders" })}
                </Label>
                <Input
                  id={`${itemPathPrefix}.product_description_custom`}
                  {...register(`${itemPathPrefix}.product_description_custom`)}
                  placeholder={t("itemDescriptionPlaceholder", {
                    ns: "orders",
                  })}
                  disabled={isSubmittingOrder}
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`${itemPathPrefix}.notes`} className="text-xs">
                  {t("itemNotesOptional", { ns: "orders" })}
                </Label>
                <Input
                  id={`${itemPathPrefix}.notes`}
                  {...register(`${itemPathPrefix}.notes`)}
                  placeholder={t("itemNotesPlaceholder", { ns: "orders" })}
                  disabled={isSubmittingOrder}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
