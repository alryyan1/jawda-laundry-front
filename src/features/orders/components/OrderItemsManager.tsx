// src/features/orders/components/OrderItemsManager.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { OrderItemFormLine as OrderItemFormLineComponent } from './OrderItemFormLine';

import type {
    ProductType,
    ServiceAction,
    ServiceOffering,
    NewOrderFormData
} from '@/types';

interface OrderItemsManagerProps {
  productTypes: ProductType[];
  serviceActions: ServiceAction[];
  allServiceOfferings: ServiceOffering[];
  isSubmittingOrder: boolean;
  isLoadingDropdowns: boolean; // Overall loading state for product/service data
  // errors object for items array, specifically array-level or root errors for items
  itemsArrayErrors?: FieldErrors<NewOrderFormData>['items'];
}

export const OrderItemsManager: React.FC<OrderItemsManagerProps> = ({
  productTypes,
  serviceActions,
  allServiceOfferings,
  isSubmittingOrder,
  isLoadingDropdowns,
  itemsArrayErrors,
}) => {
  const { t } = useTranslation(['common', 'orders']);
  const { control, watch } = useFormContext<NewOrderFormData>(); // Get parent form context

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedCustomerId = watch("customer_id"); // Needed to enable "Add Item"

  const addNewItem = () => {
    append({
      id: uuidv4(),
      product_type_id: '',
      service_action_id: '',
      quantity: 1,
      product_description_custom: '',
      length_meters: '', // Use empty string for controlled inputs that can be numbers
      width_meters: '',
      notes: '',
      _derivedServiceOffering: null,
      _pricingStrategy: null,
      _quoted_price_per_unit_item: null,
      _quoted_sub_total: null,
      _quoted_applied_unit: null,
      _isQuoting: false,
      _quoteError: null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pt-4 border-t">
        <h3 className="text-xl font-semibold">{t('orderItems', { ns: 'orders' })}</h3>
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={addNewItem}
          disabled={isSubmittingOrder || !watchedCustomerId}
          aria-label={t('addItem', { ns: 'orders' })}
        >
          <PlusCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
          {t('addItem', { ns: 'orders' })}
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {t('noItemsAddedClickToAdd', { ns: 'orders', defaultValue: 'No items added yet. Click "Add Item" to begin.' })}
        </p>
      )}

      <div className="space-y-6">
        {fields.map((field, index) => {
          // Get specific item values for props directly from parent form state via watch or getValues
          // This ensures OrderItemFormLineComponent gets the most up-to-date quote info
          const currentItemWatched = watch(`items.${index}`);
          const isQuoting = currentItemWatched?._isQuoting ?? false;
          const quotedSubtotal = currentItemWatched?._quoted_sub_total ?? null;
          const quotedPricePerUnit = currentItemWatched?._quoted_price_per_unit_item ?? null;
          const quotedAppliedUnit = currentItemWatched?._quoted_applied_unit ?? null;
          const quoteError = currentItemWatched?._quoteError ?? null;

          return (
            <OrderItemFormLineComponent
              key={field.id}
              index={index}
              onRemove={remove}
              productTypes={productTypes}
              serviceActions={serviceActions}
              allServiceOfferings={allServiceOfferings}
              isSubmittingOrder={isSubmittingOrder}
              isLoadingDropdowns={isLoadingDropdowns}
              // Pass quoting state for this specific item
              isQuotingItem={isQuoting}
              quotedSubtotal={quotedSubtotal}
              quotedPricePerUnit={quotedPricePerUnit}
              quotedAppliedUnit={quotedAppliedUnit}
              quoteError={quoteError}
            />
          );
        })}
      </div>
      {/* Display array-level errors (e.g., "at least one item required") */}
      {itemsArrayErrors && typeof itemsArrayErrors.message === 'string' && (
        <p className="text-sm text-destructive mt-2">{t(itemsArrayErrors.message as string)}</p>
      )}
       {itemsArrayErrors && Array.isArray(itemsArrayErrors) && itemsArrayErrors.some(itemErr => itemErr?.root) && (
        <p className="text-sm text-destructive mt-2">{t('checkItemErrors', {ns:'orders'})}</p>
      )}
    </div>
  );
};