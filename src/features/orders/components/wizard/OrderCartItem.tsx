import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext, useWatch, Controller } from 'react-hook-form';
import type { UseFieldArrayRemove } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

import type { NewOrderFormData } from '@/types';

interface OrderCartItemProps {
  index: number;
  onRemove: UseFieldArrayRemove;
  onEdit: (index: number) => void;
  isSubmittingOrder: boolean;
}

export const OrderCartItem: React.FC<OrderCartItemProps> = ({
  index,
  onRemove,
  onEdit,
  isSubmittingOrder,
}) => {
  const { t, i18n } = useTranslation(['orders', 'common']);
  const { control } = useFormContext<NewOrderFormData>();

  const watchedItem = useWatch({ control, name: `items.${index}` });
  const offering = watchedItem?._derivedServiceOffering;

  if (!offering) {
    return (
      <div className="p-3 border border-destructive/20 rounded-lg bg-destructive/5">
        <p className="text-sm text-destructive">
          {t('serviceOfferingNotFound', { ns: 'orders' })}
        </p>
      </div>
    );
  }

  const isQuoting = watchedItem._isQuoting;
  const quoteError = watchedItem._quoteError;
  const subTotal = watchedItem._quoted_sub_total;
  const appliedUnit = watchedItem._quoted_applied_unit;
  const isDimensionBased = offering.productType?.is_dimension_based;

  return (
    <div className={cn(
      "border rounded-lg p-4 space-y-3 bg-card",
      isQuoting && "border-blue-200 bg-blue-50/50",
      quoteError && "border-destructive/20 bg-destructive/5"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-tight">
            {offering.display_name}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {offering.productType?.name} • {offering.serviceAction?.name}
          </p>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(index)}
            disabled={isSubmittingOrder}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">{t('editItem', { ns: 'orders' })}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onRemove(index)}
            disabled={isSubmittingOrder}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">{t('removeItem', { ns: 'orders' })}</span>
          </Button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`quantity-${index}`} className="text-xs">
              {t('quantity', { ns: 'orders' })}
            </Label>
            <Controller
              name={`items.${index}.quantity`}
              control={control}
              render={({ field }) => (
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  min="1"
                  step="1"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value) || 1)}
                  disabled={isSubmittingOrder}
                  className="h-8"
                />
              )}
            />
          </div>

          {isDimensionBased && (
            <>
              <div>
                <Label htmlFor={`length-${index}`} className="text-xs">
                  {t('lengthMeters', { ns: 'orders' })}
                </Label>
                <Controller
                  name={`items.${index}.length_meters`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      id={`length-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      {...field}
                      disabled={isSubmittingOrder}
                      className="h-8"
                      placeholder="0.00"
                    />
                  )}
                />
              </div>
              <div>
                <Label htmlFor={`width-${index}`} className="text-xs">
                  {t('widthMeters', { ns: 'orders' })}
                </Label>
                <Controller
                  name={`items.${index}.width_meters`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      id={`width-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      {...field}
                      disabled={isSubmittingOrder}
                      className="h-8"
                      placeholder="0.00"
                    />
                  )}
                />
              </div>
            </>
          )}
        </div>

        <div>
          <Label htmlFor={`description-${index}`} className="text-xs">
            {t('productDescription', { ns: 'orders' })} ({t('optional', { ns: 'common' })})
          </Label>
          <Controller
            name={`items.${index}.product_description_custom`}
            control={control}
            render={({ field }) => (
              <Input
                id={`description-${index}`}
                {...field}
                disabled={isSubmittingOrder}
                className="h-8"
                placeholder={t('describeTheItem', { ns: 'orders', defaultValue: 'Describe the item...' })}
              />
            )}
          />
        </div>

        <div>
          <Label htmlFor={`notes-${index}`} className="text-xs">
            {t('itemNotes', { ns: 'orders' })} ({t('optional', { ns: 'common' })})
          </Label>
          <Controller
            name={`items.${index}.notes`}
            control={control}
            render={({ field }) => (
              <Textarea
                id={`notes-${index}`}
                {...field}
                rows={2}
                disabled={isSubmittingOrder}
                className="resize-none"
                placeholder={t('addNotesForThisItem', { ns: 'orders', defaultValue: 'Add notes for this item...' })}
              />
            )}
          />
        </div>
      </div>

      {/* Quote Status */}
      <div className="pt-2 border-t">
        {isQuoting ? (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('calculatingPrice', { ns: 'orders' })}
          </div>
        ) : quoteError ? (
          <div className="text-sm text-destructive">
            {t('priceCalculationError', { ns: 'orders' })}: {quoteError}
          </div>
        ) : subTotal !== null ? (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {t('subtotal', { ns: 'orders' })}:
            </span>
            <div className="text-right">
              <span className="font-semibold text-primary">
                {formatCurrency(subTotal, 'USD', i18n.language)}
              </span>
              {appliedUnit && (
                <span className="text-xs text-muted-foreground block">
                  {t('per', { ns: 'orders' })} {appliedUnit}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {t('priceWillBeCalculated', { ns: 'orders', defaultValue: 'Price will be calculated automatically' })}
          </div>
        )}
      </div>
    </div>
  );
}; 