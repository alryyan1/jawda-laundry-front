// src/features/orders/components/OrderItemFormLine.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useFormContext, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";

import type {
  ProductType,
  ServiceAction,
  OrderItemFormLine as OrderItemFormLineType,
} from "@/types";
import { getAvailableServiceActionsForProductType } from "@/api/productTypeService"; // API call
import { cn } from "@/lib/utils";

interface OrderItemFormLineProps {
  index: number;
  onRemove: (index: number) => void;
  productTypes: ProductType[];
  isSubmittingOrder: boolean;
  isLoadingProductTypes: boolean;
  isQuotingItem: boolean;
  quotedSubtotal: number | null | undefined;
  quotedPricePerUnit: number | null | undefined;
  quotedAppliedUnit: string | null | undefined;
  quoteError: string | null | undefined;
}

export const OrderItemFormLine: React.FC<OrderItemFormLineProps> = ({
  index,
  onRemove,
  productTypes,
  isSubmittingOrder,
  isLoadingProductTypes,
  isQuotingItem,
  quotedSubtotal,
  quotedPricePerUnit,
  quotedAppliedUnit,
  quoteError,
}) => {
  const { t, i18n } = useTranslation([
    "common",
    "orders",
    "services",
    "validation",
  ]);
  const {
    control,
    register,
    formState: { errors: allFormErrors },
    watch,
  } = useFormContext<{ items: OrderItemFormLineType[] }>();

  const itemPathPrefix = `items.${index}` as const;

  // Watch fields specific to *this* item line from the parent form's context
  const productTypeId = watch(`${itemPathPrefix}.product_type_id`);
  const derivedServiceOffering = watch(
    `${itemPathPrefix}._derivedServiceOffering`
  ); // Set by parent
  const pricingStrategy = watch(`${itemPathPrefix}._pricingStrategy`); // Set by parent

  // Type assertion for errors specific to this item line
  const itemErrors = (allFormErrors.items?.[index] || {}) as Record<
    keyof OrderItemFormLineType,
    { message?: string } | undefined
  >;

  // Fetch available service actions based on selected productTypeId FOR THIS ITEM
  const {
    data: availableServiceActions = [],
    isLoading: isLoadingServiceActions,
  } = useQuery<ServiceAction[]>({
    queryKey: ["availableServiceActions", productTypeId],
    queryFn: () => getAvailableServiceActionsForProductType(productTypeId!),
    enabled: !!productTypeId,
    staleTime: 5 * 60 * 1000,
  });

  // When product type changes, the service_action_id is reset by the parent's useEffect,
  // which also clears _derivedServiceOffering. This component just reacts to those changes.

  return (
    <div className="p-4 border rounded-md space-y-4 bg-muted/20 dark:bg-muted/50 relative shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <p className="font-semibold text-md text-foreground">
          {t("itemWithNum", { ns: "common", num: index + 1 })}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 absolute top-3 right-3 rtl:left-3 rtl:right-auto"
          disabled={isSubmittingOrder}
          aria-label={t("removeItem", { ns: "common" })}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Type Select */}
        <div className="grid gap-1.5">
          <Label htmlFor={`${itemPathPrefix}.product_type_id`}>
            {t("productType", { ns: "services" })}{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Controller
            name={`${itemPathPrefix}.product_type_id`}
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  // Parent's (NewOrderPage) useEffect will now handle resetting service_action_id,
                  // _derivedServiceOffering, quote, etc., because it watches product_type_id changes.
                }}
                value={field.value}
                disabled={isLoadingProductTypes || isSubmittingOrder}
              >
                <SelectTrigger
                  id={`${itemPathPrefix}.product_type_id`}
                  className={cn(
                    itemErrors?.product_type_id && "border-destructive"
                  )}
                >
                  <SelectValue
                    placeholder={
                      isLoadingProductTypes
                        ? t("loadingProductTypes", { ns: "services" })
                        : t("selectProductType", { ns: "services" })
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map((pt) => (
                    <SelectItem key={pt.id} value={pt.id.toString()}>
                      {pt.name}{" "}
                      {pt.category?.name ? `(${pt.category.name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {itemErrors?.product_type_id && (
            <p className="text-xs text-destructive">
              {t(itemErrors.product_type_id.message as string)}
            </p>
          )}
        </div>

        {/* Service Action Select (Dynamically Populated) */}
        <div className="grid gap-1.5">
          <Label htmlFor={`${itemPathPrefix}.service_action_id`}>
            {t("serviceAction", { ns: "services" })}{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Controller
            name={`${itemPathPrefix}.service_action_id`}
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange} // Parent's useEffect handles deriving offering
                value={field.value}
                disabled={
                  isLoadingServiceActions ||
                  isSubmittingOrder ||
                  !productTypeId ||
                  availableServiceActions.length === 0
                }
              >
                <SelectTrigger
                  id={`${itemPathPrefix}.service_action_id`}
                  className={cn(
                    itemErrors?.service_action_id && "border-destructive"
                  )}
                >
                  <SelectValue
                    placeholder={
                      !productTypeId
                        ? t("selectProductTypeFirst", { ns: "services" })
                        : isLoadingServiceActions
                        ? t("loadingActions", { ns: "services" })
                        : availableServiceActions.length === 0
                        ? t("noActionsForProduct", { ns: "services" })
                        : t("selectServiceAction", { ns: "services" })
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableServiceActions.map((sa) => (
                    <SelectItem key={sa.id} value={sa.id.toString()}>
                      {sa.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {itemErrors?.service_action_id && (
            <p className="text-xs text-destructive">
              {t(itemErrors.service_action_id.message as string)}
            </p>
          )}
        </div>
      </div>

      {derivedServiceOffering && (
        <div className="mt-2 p-2 text-xs bg-primary/10 dark:bg-primary/20 rounded border border-primary/20 dark:border-primary/30">
          {t("selectedOfferingInfo", {
            ns: "orders",
            defaultValue: "Selected Offering:",
          })}{" "}
          <strong>{derivedServiceOffering.display_name}</strong>
          <span className="ml-2 rtl:mr-2">
            (
            {t(`strategy.${derivedServiceOffering.pricing_strategy}`, {
              ns: "services",
            })}
            )
          </span>
        </div>
      )}
      {itemErrors?._derivedServiceOffering && (
        <p className="mt-1 text-xs text-destructive">
          {t(itemErrors._derivedServiceOffering.message as string)}
        </p>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor={`${itemPathPrefix}.product_description_custom`}>
          {t("itemDescriptionOptional", { ns: "orders" })}
        </Label>
        <Input
          id={`${itemPathPrefix}.product_description_custom`}
          {...register(`${itemPathPrefix}.product_description_custom`)}
          placeholder={t("itemDescriptionPlaceholder", { ns: "orders" })}
          disabled={isSubmittingOrder}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3 items-start">
        <div className="grid gap-1.5">
          <Label htmlFor={`${itemPathPrefix}.quantity`}>
            {t("quantity", { ns: "services" })}{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${itemPathPrefix}.quantity`}
            type="number"
            {...register(`${itemPathPrefix}.quantity`)}
            min="1"
            className={cn(itemErrors?.quantity && "border-destructive")}
            disabled={isSubmittingOrder}
          />
          {itemErrors?.quantity && (
            <p className="text-xs text-destructive">
              {t(itemErrors.quantity.message as string)}
            </p>
          )}
        </div>

        {pricingStrategy === "dimension_based" && (
          <>
            <div className="grid gap-1.5">
              <Label htmlFor={`${itemPathPrefix}.length_meters`}>
                {t("lengthMeters", { ns: "orders" })}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`${itemPathPrefix}.length_meters`}
                type="number"
                step="0.01"
                {...register(`${itemPathPrefix}.length_meters`)}
                placeholder="e.g., 2.5"
                className={cn(
                  itemErrors?.length_meters && "border-destructive"
                )}
                disabled={isSubmittingOrder}
              />
              {itemErrors?.length_meters && (
                <p className="text-xs text-destructive">
                  {t(itemErrors.length_meters.message as string)}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`${itemPathPrefix}.width_meters`}>
                {t("widthMeters", { ns: "orders" })}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`${itemPathPrefix}.width_meters`}
                type="number"
                step="0.01"
                {...register(`${itemPathPrefix}.width_meters`)}
                placeholder="e.g., 1.8"
                className={cn(itemErrors?.width_meters && "border-destructive")}
                disabled={isSubmittingOrder}
              />
              {itemErrors?.width_meters && (
                <p className="text-xs text-destructive">
                  {t(itemErrors.width_meters.message as string)}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`${itemPathPrefix}.notes`}>
          {t("itemNotesOptional", { ns: "orders" })}
        </Label>
        <Textarea
          id={`${itemPathPrefix}.notes`}
          {...register(`${itemPathPrefix}.notes`)}
          rows={1}
          placeholder={t("itemNotesPlaceholder", { ns: "orders" })}
          disabled={isSubmittingOrder}
        />
      </div>

      {/* Quoting Display */}
      <div className="mt-3 pt-3 border-t border-border/60">
        {isQuotingItem && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" />
            {t("calculatingPrice", { ns: "orders" })}
          </div>
        )}
        {quoteError && !isQuotingItem && (
          <p className="text-sm text-destructive">{quoteError}</p>
        )}
        {quotedSubtotal !== null &&
          quotedSubtotal !== undefined &&
          !isQuotingItem &&
          !quoteError && (
            <div className="text-sm">
              <span className="font-semibold">
                {t("itemSubtotal", { ns: "orders" })}:{" "}
              </span>
              <span className="text-primary font-bold">
                {new Intl.NumberFormat(i18n.language, {
                  style: "currency",
                  currency: "USD",
                }).format(quotedSubtotal)}{" "}
                {/* TODO: Currency */}
              </span>
              {quotedAppliedUnit &&
                quotedPricePerUnit !== null &&
                quotedPricePerUnit !== undefined && (
                  <span className="text-xs text-muted-foreground ml-1 rtl:mr-1">
                    (
                    {new Intl.NumberFormat(i18n.language, {
                      style: "currency",
                      currency: "USD",
                    }).format(quotedPricePerUnit)}{" "}
                    {/* TODO: Currency */}
                    {" / "}
                    {t(`units.${quotedAppliedUnit}`, {
                      ns: "services",
                      defaultValue: quotedAppliedUnit,
                    })}
                    )
                  </span>
                )}
            </div>
          )}
        {(quotedSubtotal === null || quotedSubtotal === undefined) &&
          !isQuotingItem &&
          !quoteError &&
          derivedServiceOffering && (
            <p className="text-xs text-muted-foreground">
              {t("enterDetailsForQuote", { ns: "orders" })}
            </p>
          )}
      </div>
    </div>
  );
};
