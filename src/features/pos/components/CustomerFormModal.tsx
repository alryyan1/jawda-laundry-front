import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

import type { CustomerFormData, Customer } from '@/types';
import { createCustomer } from '@/api/customerService';

const customerSchema = z.object({
  name: z.string().nonempty({ message: "validation.nameRequired" }).min(2, { message: "validation.nameMin" }),
  car_plate_number: z.string().optional().or(z.literal('')),
  phone: z.string().nonempty({ message: "validation.phoneRequired" }).min(7, { message: "validation.phoneInvalid" }),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  is_default: z.boolean().optional(),
});

interface CustomerFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customer: Customer) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation(['common', 'customers', 'validation']);
  const queryClient = useQueryClient();

  const { control, register, handleSubmit, formState: { errors }, reset } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', car_plate_number: '', phone: '', address: '', notes: '', is_default: false },
  });

  const mutation = useMutation<Customer, Error, CustomerFormData>({
    mutationFn: createCustomer,
    onSuccess: (data) => {
      toast.success(t('customerCreatedSuccess', { ns: 'customers', name: data.name }));
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customersForSelect'] });
      onSuccess?.(data);
      onOpenChange(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.message || t('customerCreationFailed', { ns: 'customers' }));
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      onOpenChange(false);
      reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('newCustomerTitle', { ns: 'customers' })}</DialogTitle>
          <DialogDescription>
            {t('newCustomerDescription', { ns: 'customers' })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="car_plate_number">{t('carPlateNumber', { ns: 'customers', defaultValue: 'Car Plate Number' })}</Label>
              <Input id="car_plate_number" {...register('car_plate_number')} placeholder={t('carPlateNumberPlaceholder', { ns: 'customers', defaultValue: 'Enter car plate number (optional)' })} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('name')}<span className="text-destructive">*</span></Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{t(errors.name.message as string)}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">{t('phone', { ns: 'customers' })}<span className="text-destructive">*</span></Label>
                <Input id="phone" type="tel" {...register('phone')} />
                {errors.phone && <p className="text-sm text-destructive">{t(errors.phone.message as string)}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">{t('addressOptional', { ns: 'customers' })}</Label>
              <Textarea id="address" {...register('address')} rows={2} />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">{t('notesOptional')}</Label>
              <Textarea id="notes" {...register('notes')} rows={2} placeholder={t('customerNotesPlaceholder', { ns: 'customers' })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="is_default" className="flex items-center gap-2">
                <Controller
                  name="is_default"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="is_default"
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                {t('setAsDefault', { ns: 'customers', defaultValue: 'Set as default customer' })}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('createCustomerBtn', { ns: 'customers' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 