// src/features/orders/components/OrderOverallDetails.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import type { FieldError } from 'react-hook-form';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import type { NewOrderFormData } from '@/types';

interface OrderOverallDetailsProps {
  disabled?: boolean;
  notesError?: FieldError;
  dueDateError?: FieldError;
}

export const OrderOverallDetails: React.FC<OrderOverallDetailsProps> = ({ disabled, notesError, dueDateError }) => {
  const { t } = useTranslation(['orders', 'common', 'validation']);
  const { register } = useFormContext<NewOrderFormData>();

  return (
    <div className="pt-4 border-t space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="order-notes">{t('overallOrderNotesOptional', { ns: 'orders' })}</Label>
        <Textarea
          id="order-notes"
          {...register('notes')}
          rows={3}
          placeholder={t('overallOrderNotesPlaceholder', {ns:'orders', defaultValue:'Any special instructions for the entire order...' })}
          disabled={disabled}
        />
        {notesError && <p className="text-sm text-destructive">{t(notesError.message as string)}</p>}
      </div>
      <div className="grid gap-1.5 max-w-xs">
        <Label htmlFor="order-due_date">{t('dueDateOptional', { ns: 'orders' })}</Label>
        <Input
          id="order-due_date"
          type="date"
          {...register('due_date')}
          disabled={disabled}
        />
        {dueDateError && <p className="text-sm text-destructive">{t(dueDateError.message as string)}</p>}
      </div>
    </div>
  );
};