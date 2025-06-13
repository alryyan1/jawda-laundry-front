// src/features/orders/components/OrderSummaryAndActions.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { CardFooter } from '@/components/ui/card'; // Using CardFooter for consistent styling

interface OrderSummaryAndActionsProps {
  orderTotal: number;
  isSubmitting: boolean; // Main order submission
  isQuotingAnyItem: boolean; // If any item is currently being quoted
  isLoadingDropdowns: boolean; // If dependent data is loading
  isCustomerSelected: boolean;
  hasItems: boolean;
}

export const OrderSummaryAndActions: React.FC<OrderSummaryAndActionsProps> = ({
  orderTotal,
  isSubmitting,
  isQuotingAnyItem,
  isLoadingDropdowns,
  isCustomerSelected,
  hasItems,
}) => {
  const { t, i18n } = useTranslation(['common', 'orders']);
  const navigate = useNavigate();

  const disableSubmit = isLoadingDropdowns || isSubmitting || isQuotingAnyItem || !isCustomerSelected || !hasItems;

  return (
    <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 mt-4 border-t">
      <div className="text-xl font-bold text-right sm:text-left w-full sm:w-auto">
        {t('estimatedTotal', { ns: 'orders' })}:
        <span className="text-primary ml-2 rtl:mr-2">
          {new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(orderTotal)}
          {/* TODO: Configurable currency */}
        </span>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/orders')}
          disabled={isSubmitting || isQuotingAnyItem}
          className="flex-grow sm:flex-grow-0"
        >
          {t('cancel', { ns: 'common' })}
        </Button>
        <Button
          type="submit"
          disabled={disableSubmit}
          className="flex-grow sm:flex-grow-0"
        >
          {(isSubmitting || isQuotingAnyItem) && <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />}
          {t('createOrderCta', { ns: 'orders' })}
        </Button>
      </div>
    </CardFooter>
  );
};