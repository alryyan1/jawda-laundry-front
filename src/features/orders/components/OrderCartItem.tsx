// src/features/orders/components/OrderCartItem.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

import type { NewOrderFormData } from '@/types';

interface OrderCartItemProps {
  index: number;
  onRemove: (index: number) => void;
  isSubmittingOrder: boolean;
}

export const OrderCartItem: React.FC<OrderCartItemProps> = ({ index, onRemove, isSubmittingOrder }) => {
  const { t, i18n } = useTranslation(['common', 'orders', 'services']);
  const { register, formState: { errors } } = useFormContext<NewOrderFormData>();

  const itemPathPrefix = `items.${index}` as const;
  const itemData = useWatch({ name: itemPathPrefix }); // Watch all data for this item

  if (!itemData?._derivedServiceOffering) {
    // This shouldn't happen if items are added correctly, but it's a safe fallback.
    return (
        <div className="p-3 border rounded-md bg-destructive/10 text-destructive-foreground text-sm">
            {t('itemDataMissingError', { ns: 'orders', defaultValue: 'Error: Item data is missing.' })}
        </div>
    );
  }

  const {
    _derivedServiceOffering: offering,
    _isQuoting: isQuoting,
    _quoteError: quoteError,
    _quoted_sub_total: subtotal,
    _quoted_price_per_unit_item: pricePerUnit,
    _quoted_applied_unit: appliedUnit,
  } = itemData;

  const isDimensionBased = offering.productType?.is_dimension_based;

  return (
    <div className="p-3 border rounded-lg bg-background shadow-sm space-y-3">
      {/* Item Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-sm">{offering.display_name}</p>
          <p className="text-xs text-muted-foreground">{offering.productType?.name}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
          disabled={isSubmittingOrder}
          aria-label={t('removeItem')}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Inputs for Quantity & Dimensions */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-2 items-start">
        <div className="grid gap-1.5 col-span-1">
            <Label htmlFor={`${itemPathPrefix}.quantity`} className="text-xs">{t('quantity', { ns: 'services' })}</Label>
            <Input id={`${itemPathPrefix}.quantity`} type="number" {...register(`${itemPathPrefix}.quantity`)} min="1" disabled={isSubmittingOrder} className="h-8"/>
        </div>

        {isDimensionBased && (
          <>
            <div className="grid gap-1.5 col-span-1">
              <Label htmlFor={`${itemPathPrefix}.length_meters`} className="text-xs">{t('lengthMeters', { ns: 'orders' })}</Label>
              <Input id={`${itemPathPrefix}.length_meters`} type="number" step="0.01" {...register(`${itemPathPrefix}.length_meters`)} placeholder="L" disabled={isSubmittingOrder} className="h-8"/>
            </div>
            <div className="grid gap-1.5 col-span-1">
              <Label htmlFor={`${itemPathPrefix}.width_meters`} className="text-xs">{t('widthMeters', { ns: 'orders' })}</Label>
              <Input id={`${itemPathPrefix}.width_meters`} type="number" step="0.01" {...register(`${itemPathPrefix}.width_meters`)} placeholder="W" disabled={isSubmittingOrder} className="h-8"/>
            </div>
          </>
        )}
      </div>

      {/* Description & Notes */}
      <div className="grid gap-1.5">
          <Label htmlFor={`${itemPathPrefix}.product_description_custom`} className="text-xs">{t('itemDescriptionOptional', {ns:'orders'})}</Label>
          <Input id={`${itemPathPrefix}.product_description_custom`} {...register(`${itemPathPrefix}.product_description_custom`)} placeholder={t('itemDescriptionPlaceholder', {ns:'orders'})} disabled={isSubmittingOrder} className="h-8 text-xs"/>
      </div>
      <div className="grid gap-1.5">
          <Label htmlFor={`${itemPathPrefix}.notes`} className="text-xs">{t('itemNotesOptional', {ns:'orders'})}</Label>
          <Textarea id={`${itemPathPrefix}.notes`} {...register(`${itemPathPrefix}.notes`)} rows={1} disabled={isSubmittingOrder} className="text-xs" />
      </div>


      {/* Quote Display */}
      <div className={cn("mt-2 pt-2 border-t text-sm font-semibold h-5 flex items-center", quoteError && "text-destructive")}>
        {isQuoting ? (
          <div className="flex items-center text-muted-foreground font-normal">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>{t('calculatingPrice', { ns: 'orders' })}</span>
          </div>
        ) : quoteError ? (
          <span>{quoteError}</span>
        ) : (subtotal !== null && subtotal !== undefined) ? (
          <span>{formatCurrency(subtotal, 'USD', i18n.language)}</span>
        ) : null}
      </div>
    </div>
  );
};