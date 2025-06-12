// src/features/orders/components/OrderItemFormLine.tsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext, Controller } from 'react-hook-form'; // useFormContext is key here

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trash2 } from 'lucide-react';

import type {
    ProductType, ServiceAction, ServiceOffering, OrderItemFormLine as OrderItemFormLineType
} from '@/types'; // Or from specific type files

interface OrderItemFormLineProps {
  index: number;
  onRemove: (index: number) => void;
  productTypes: ProductType[];
  serviceActions: ServiceAction[];
  allServiceOfferings: ServiceOffering[]; // Passed down for matching
  isSubmittingOrder: boolean; // To disable fields during main order submission
  isLoadingDropdowns: boolean;
  // Props for quoting logic (passed from NewOrderPage)
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
  serviceActions,
  allServiceOfferings,
  isSubmittingOrder,
  isLoadingDropdowns,
  isQuotingItem,
  quotedSubtotal,
  quotedPricePerUnit,
  quotedAppliedUnit,
  quoteError,
}) => {
  const { t, i18n } = useTranslation(['common', 'orders', 'services', 'validation']);
  const { control, register, formState: { errors }, setValue, watch } = useFormContext< { items: OrderItemFormLineType[] }>(); // Access parent form context

  const itemPathPrefix = `items.${index}` as const; // `items.0`, `items.1`, etc.

  // Watch specific fields for THIS item line to trigger logic
  const productTypeId = watch(`${itemPathPrefix}.product_type_id`);

  // Get the derived offering and strategy from the form state (set by parent NewOrderPage)
  const derivedServiceOffering = watch(`${itemPathPrefix}._derivedServiceOffering`);
  const pricingStrategy = watch(`${itemPathPrefix}._pricingStrategy`);

  // Filter available service actions based on the selected product type and available offerings
  const availableServiceActions = useMemo(() => {
    if (!productTypeId || !allServiceOfferings.length) return [];
    const relevantOfferings = allServiceOfferings.filter(
      so => so.productType?.id.toString() === productTypeId
    );
    const uniqueActionIds = [...new Set(relevantOfferings.map(so => so.serviceAction?.id))];
    return serviceActions.filter(sa => uniqueActionIds.includes(sa.id));
  }, [productTypeId, allServiceOfferings, serviceActions]);


  return (
    <div className="p-4 border rounded-md space-y-3 bg-muted/20 dark:bg-muted/50 relative">
      <div className="flex justify-between items-start mb-2">
        <p className="font-semibold text-base text-foreground">
          {t('itemWithNum', { ns: 'common', num: index + 1 })}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="h-7 w-7 text-destructive hover:text-destructive absolute top-2 right-2 rtl:left-2 rtl:right-auto"
          disabled={isSubmittingOrder}
          aria-label={t('removeItem', {ns:'common'})}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Type */}
        <div className="grid gap-1.5">
          <Label htmlFor={`${itemPathPrefix}.product_type_id`}>{t('productType', { ns: 'services' })} <span className="text-destructive">*</span></Label>
          <Controller name={`${itemPathPrefix}.product_type_id`} control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  setValue(`${itemPathPrefix}.service_action_id`, ''); // Reset action on PT change
                  // Parent useEffect in NewOrderPage will handle setting _derivedServiceOffering & _pricingStrategy
                }}
                value={field.value}
                disabled={isLoadingDropdowns || isSubmittingOrder}
              >
                <SelectTrigger id={`${itemPathPrefix}.product_type_id`}><SelectValue placeholder={productTypes.length === 0 && !isLoadingDropdowns ? t('noProductTypesAvailable', {ns:'services'}) : t('selectProductType', { ns: 'services' })} /></SelectTrigger>
                <SelectContent>{productTypes.map(pt => <SelectItem key={pt.id} value={pt.id.toString()}>{pt.name} {pt.category?.name ? `(${pt.category.name})` : ''}</SelectItem>)}</SelectContent>
              </Select>
            )}
          />
          {errors.items?.[index]?.product_type_id && <p className="text-xs text-destructive">{t(errors.items[index]?.product_type_id?.message as string)}</p>}
        </div>

        {/* Service Action */}
        <div className="grid gap-1.5">
          <Label htmlFor={`${itemPathPrefix}.service_action_id`}>{t('serviceAction', { ns: 'services' })} <span className="text-destructive">*</span></Label>
          <Controller name={`${itemPathPrefix}.service_action_id`} control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoadingDropdowns || isSubmittingOrder || !productTypeId || availableServiceActions.length === 0}
              >
                <SelectTrigger id={`${itemPathPrefix}.service_action_id`}><SelectValue placeholder={!productTypeId ? t('selectProductTypeFirst', { ns: 'services' }) : (availableServiceActions.length === 0 ? t('noActionsForProduct', {ns:'services'}) : t('selectServiceAction', { ns: 'services' }))} /></SelectTrigger>
                <SelectContent>{availableServiceActions.map(sa => <SelectItem key={sa.id} value={sa.id.toString()}>{sa.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
          />
          {errors.items?.[index]?.service_action_id && <p className="text-xs text-destructive">{t(errors.items[index]?.service_action_id?.message as string)}</p>}
        </div>
      </div>

      {derivedServiceOffering && (
        <div className="mt-2 p-2 text-xs bg-primary/10 dark:bg-primary/20 rounded border border-primary/20 dark:border-primary/30">
          {t('selectedOffering', {ns:'orders', defaultValue:'Selected Offering'})}: <strong>{derivedServiceOffering.display_name}</strong>
          <span className="ml-2 rtl:mr-2">({t(`strategy.${derivedServiceOffering.pricing_strategy}`, { ns: 'services' })})</span>
        </div>
      )}
      {errors.items?.[index]?._derivedServiceOffering && <p className="mt-1 text-xs text-destructive">{t(errors.items[index]?._derivedServiceOffering?.message as string)}</p>}


      <div className="grid gap-1.5">
        <Label htmlFor={`${itemPathPrefix}.product_description_custom`}>{t('itemDescriptionOptional', { ns: 'orders' })}</Label>
        <Input id={`${itemPathPrefix}.product_description_custom`} {...register(`${itemPathPrefix}.product_description_custom`)} placeholder={t('itemDescriptionPlaceholder', { ns: 'orders' })} disabled={isSubmittingOrder} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3 items-end">
        <div className="grid gap-1.5">
          <Label htmlFor={`${itemPathPrefix}.quantity`}>{t('quantity', { ns: 'services' })} <span className="text-destructive">*</span></Label>
          <Input id={`${itemPathPrefix}.quantity`} type="number" {...register(`${itemPathPrefix}.quantity`)} min="1" disabled={isSubmittingOrder} />
          {errors.items?.[index]?.quantity && <p className="text-xs text-destructive">{t(errors.items[index]?.quantity?.message as string)}</p>}
        </div>

        {pricingStrategy === 'dimension_based' && (
          <>
            <div className="grid gap-1.5">
              <Label htmlFor={`${itemPathPrefix}.length_meters`}>{t('lengthMeters', { ns: 'orders' })}</Label>
              <Input id={`${itemPathPrefix}.length_meters`} type="number" step="0.01" {...register(`${itemPathPrefix}.length_meters`)} placeholder="e.g., 2.5" disabled={isSubmittingOrder} />
              {errors.items?.[index]?.length_meters && <p className="text-xs text-destructive">{t(errors.items[index]?.length_meters?.message as string)}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`${itemPathPrefix}.width_meters`}>{t('widthMeters', { ns: 'orders' })}</Label>
              <Input id={`${itemPathPrefix}.width_meters`} type="number" step="0.01" {...register(`${itemPathPrefix}.width_meters`)} placeholder="e.g., 1.8" disabled={isSubmittingOrder} />
              {errors.items?.[index]?.width_meters && <p className="text-xs text-destructive">{t(errors.items[index]?.width_meters?.message as string)}</p>}
            </div>
          </>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`${itemPathPrefix}.notes`}>{t('itemNotesOptional', { ns: 'orders' })}</Label>
        <Textarea id={`${itemPathPrefix}.notes`} {...register(`${itemPathPrefix}.notes`)} rows={1} placeholder={t('itemNotesPlaceholder', {ns:'orders', defaultValue:'e.g., Handle with care, specific stain location'})} disabled={isSubmittingOrder} />
      </div>

      {/* Quoting Display */}
      <div className="mt-3 pt-3 border-t border-dashed">
        {isQuotingItem && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" />
            {t('calculatingPrice', { ns: 'orders' })}
          </div>
        )}
        {quoteError && !isQuotingItem && (
          <p className="text-sm text-destructive">{quoteError}</p>
        )}
        {quotedSubtotal !== null && quotedSubtotal !== undefined && !isQuotingItem && !quoteError && (
          <div className="text-sm">
            <span className="font-semibold">{t('itemSubtotal', { ns: 'orders' })}: </span>
            <span className="text-primary font-bold">
              {new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(quotedSubtotal)}
            </span>
            {quotedAppliedUnit && quotedPricePerUnit !== null && quotedPricePerUnit !== undefined && (
              <span className="text-xs text-muted-foreground ml-1 rtl:mr-1">
                ({new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(quotedPricePerUnit)}
                {" / "}
                {t(`units.${quotedAppliedUnit}`, { ns: 'services', defaultValue: quotedAppliedUnit })})
              </span>
            )}
          </div>
        )}
        {/* Message if quote cannot be calculated yet */}
        { (quotedSubtotal === null || quotedSubtotal === undefined) && !isQuotingItem && !quoteError && derivedServiceOffering && (
             <p className="text-xs text-muted-foreground">{t('enterDetailsForQuote', {ns:'orders'})}</p>
        )}
      </div>
    </div>
  );
};