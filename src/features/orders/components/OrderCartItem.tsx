// src/features/orders/components/wizard/OrderCartItem.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Trash2, Edit3, Ruler, AlertCircle, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { SelectSizeDialog } from "../../pos/components/SelectSizeDialog"; // Fixed import path

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
  const { t, i18n } = useTranslation([
    "common",
    "orders",
    "services",
    "validation",
  ]);
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<NewOrderFormData>();

  const [isSizeDialogOpen, setIsSizeDialogOpen] = useState(false);

  const itemPathPrefix = `items.${index}` as const;
  const itemData = useWatch({ name: itemPathPrefix });
  const itemErrors = (errors.items?.[index] || {}) as Record<
    keyof OrderItemFormLine,
    { message?: string } | undefined
  >;

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
  } = itemData;

  const isDimensionBased = offering.productType?.is_dimension_based;

  return (
    <>
      <div className="p-3 border rounded-lg bg-background shadow-sm space-y-2 text-sm">
        {/* --- Main Item Row --- */}
        <div className="grid grid-cols-12 gap-x-2 items-center">
          {/* Item Name */}
          <div
            className={cn(
              "col-span-12 sm:col-span-6",
              isDimensionBased && "sm:col-span-4"
            )}
          >
            <p className="font-semibold leading-tight">
              {offering.display_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {offering.productType?.name}
            </p>
          </div>
          {/* Quantity Input */}
          <div className="col-span-4 sm:col-span-2">
            <Input
              id={`${itemPathPrefix}.quantity`}
              type="number"
              aria-label={t("quantity", { ns: "services" })}
              {...register(`${itemPathPrefix}.quantity`)}
              min="1"
              disabled={isSubmittingOrder}
              className={cn(
                "h-9 text-center",
                itemErrors?.quantity && "border-destructive"
              )}
            />
          </div>
          {/* Conditional Dimension Inputs */}
          {isDimensionBased ? (
            <>
              <div className="col-span-4 sm:col-span-2 relative">
                <Input
                  id={`${itemPathPrefix}.length_meters`}
                  type="number"
                  step="0.01"
                  aria-label={t("lengthMeters", { ns: "orders" })}
                  {...register(`${itemPathPrefix}.length_meters`)}
                  placeholder={t("lengthAbbr", {
                    ns: "orders",
                    defaultValue: "L",
                  })}
                  disabled={isSubmittingOrder}
                  className={cn(
                    "h-9 text-center",
                    itemErrors?.length_meters && "border-destructive"
                  )}
                />
              </div>
              <div className="col-span-4 sm:col-span-2 relative">
                <Input
                  id={`${itemPathPrefix}.width_meters`}
                  type="number"
                  step="0.01"
                  aria-label={t("widthMeters", { ns: "orders" })}
                  {...register(`${itemPathPrefix}.width_meters`)}
                  placeholder={t("widthAbbr", {
                    ns: "orders",
                    defaultValue: "W",
                  })}
                  disabled={isSubmittingOrder}
                  className={cn(
                    "h-9 text-center",
                    itemErrors?.width_meters && "border-destructive"
                  )}
                />
              </div>
            </>
          ) : (
            <div className="hidden sm:block sm:col-span-4"></div>
          )}{" "}
          {/* Placeholder to keep alignment */}
          {/* Subtotal */}
          <div className="col-span-8 sm:col-span-2 text-right rtl:text-left font-semibold">
            {isQuoting ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
            ) : quoteError ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-5 w-5 text-destructive mx-auto cursor-help" />
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
          {/* Actions */}
          <div className="col-span-4 sm:col-span-1 flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(index)}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  <span>{t("changeService", { ns: "orders" })}</span>
                </DropdownMenuItem>
                {isDimensionBased && (
                  <DropdownMenuItem onClick={() => setIsSizeDialogOpen(true)}>
                    <Ruler className="mr-2 h-4 w-4" />
                    <span>{t("selectPredefinedSize", { ns: "services" })}</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onRemove(index)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>{t("removeItem", { ns: "common" })}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Display validation errors below the row */}
        {(itemErrors?.quantity ||
          itemErrors?.length_meters ||
          itemErrors?.width_meters) && (
          <div className="text-xs text-destructive pl-1">
            {itemErrors?.quantity && (
              <p>{t(itemErrors.quantity.message as string)}</p>
            )}
            {itemErrors?.length_meters && (
              <p>{t(itemErrors.length_meters.message as string)}</p>
            )}
            {itemErrors?.width_meters && (
              <p>{t(itemErrors.width_meters.message as string)}</p>
            )}
          </div>
        )}
      </div>

      {offering.productType && (
        <SelectSizeDialog
          isOpen={isSizeDialogOpen}
          onOpenChange={setIsSizeDialogOpen}
          productType={offering.productType}
          onSelect={(size: { length_meters: number; width_meters: number }) => {
            setValue(
              `${itemPathPrefix}.length_meters`,
              size.length_meters.toString(),
              { shouldDirty: true }
            );
            setValue(
              `${itemPathPrefix}.width_meters`,
              size.width_meters.toString(),
              { shouldDirty: true, shouldValidate: true }
            );
          }}
        />
      )}
    </>
  );
};
