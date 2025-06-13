// src/features/orders/components/CustomerSelection.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { Control, FieldError } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import type { ComboboxOption } from '@/components/ui/combobox';
import { Skeleton } from '@/components/ui/skeleton';

import type { Customer, PaginatedResponse, NewOrderFormData } from '@/types';
import { getCustomers } from '@/api/customerService';

interface CustomerSelectionProps {
  control: Control<NewOrderFormData>; // Pass the control object from the parent form
  error?: FieldError;
  disabled?: boolean;
}

export const CustomerSelection: React.FC<CustomerSelectionProps> = ({ control, error, disabled }) => {
  const { t } = useTranslation(['common', 'customers']);

  const { data: customersResponse, isLoading: isLoadingCustomers } = useQuery<PaginatedResponse<Customer>, Error>({
    queryKey: ['customersForSelect'],
    queryFn: () => getCustomers(1, 1000), // Fetch more for combobox
  });

  const customerOptions: ComboboxOption[] = React.useMemo(() =>
    customersResponse?.data.map(cust => ({
      value: cust.id.toString(),
      label: `${cust.name} (${cust.phone || cust.email || t('notAvailable', {ns:'common'})})`
    })) || [],
    [customersResponse, t]
  );

  return (
    <div className="grid gap-1.5">
      <Label htmlFor="customer_id">{t('customer', { ns: 'customers' })} <span className="text-destructive">*</span></Label>
      {isLoadingCustomers ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <Controller
          name="customer_id"
          control={control}
          render={({ field }) => (
            <Combobox
              options={customerOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('selectCustomer', { ns: 'customers' })}
              searchPlaceholder={t('searchCustomer', { ns: 'customers' })}
              emptyResultText={t('noCustomerFound', { ns: 'customers' })}
              disabled={disabled || isLoadingCustomers || customerOptions.length === 0}
            />
          )}
        />
      )}
      {error && <p className="text-sm text-destructive">{t(error.message as string)}</p>}
    </div>
  );
};