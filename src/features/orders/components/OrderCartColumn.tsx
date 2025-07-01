// src/features/orders/components/OrderCartColumn.tsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext, useWatch } from 'react-hook-form';
import type { FieldArrayWithId, UseFieldArrayRemove } from 'react-hook-form';
import type { NewOrderFormData } from '@/types';
import { OrderCartItem } from '@/features/orders/components/OrderCartItem';
import { OrderSummaryAndActions } from '@/features/orders/components/OrderSummaryAndActions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface OrderCartColumnProps {
  fields: FieldArrayWithId<NewOrderFormData, "items", "id">[];
  onRemove: UseFieldArrayRemove;
  isSubmitting: boolean;
  isQuotingAnyItem: boolean;
  isLoadingDropdowns: boolean; // For disabling submit button
  isCustomerSelected: boolean;
}

export const OrderCartColumn: React.FC<OrderCartColumnProps> = ({
    fields, onRemove, isSubmitting, isQuotingAnyItem, isLoadingDropdowns, isCustomerSelected
}) => {
  const { t } = useTranslation(['common', 'orders']);
  const { control } = useFormContext<NewOrderFormData>();
  
  const watchedItems = useWatch({ control, name: 'items' });

  const orderTotal = useMemo(() => {
    return watchedItems.reduce((total, item) => total + (item._quoted_sub_total || 0), 0);
  }, [watchedItems]);

  return (
    <div className="flex flex-col h-full bg-card">
      <header className="p-4 border-b shrink-0">
        <h3 className="text-lg font-semibold">{t('orderCart', { ns: 'orders', defaultValue: 'Order Cart' })}</h3>
      </header>

      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-4">
          {fields.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground min-h-[200px]">
              <p className="max-w-[250px]">{t('cartIsEmpty', { ns: 'orders' })}</p>
            </div>
          ) : (
            fields.map((field, index) => (
              <OrderCartItem
                key={field.id}
                index={index}
                onRemove={onRemove}
                isSubmittingOrder={isSubmitting}
              />
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="shrink-0">
        <Separator/>
        <OrderSummaryAndActions
            orderTotal={orderTotal}
            isSubmitting={isSubmitting}
            isQuotingAnyItem={isQuotingAnyItem}
            isLoadingDropdowns={isLoadingDropdowns}
            isCustomerSelected={isCustomerSelected}
            hasItems={fields.length > 0}
        />
      </div>
    </div>
  );
};