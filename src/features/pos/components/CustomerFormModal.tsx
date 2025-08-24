import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
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
  const { t } = useTranslation( 'validation');
  const queryClient = useQueryClient();

  const { control, register, handleSubmit, formState: { errors }, reset } = useForm<CustomerFormData>({
    defaultValues: { name: '', car_plate_number: '', phone: '', address: '', notes: '', is_default: false },
  });

    // Custom validation functions that evaluate translations at validation time
  const validateCarPlateNumber = (value: string) => {
    if (!value || value.trim() === '') {
      return t('validation.carPlateNumberRequired');
    }
    if (value.length < 1) {
      return t('validation.carPlateNumberMin');
    }
    return true;
  };

  const validateName = (value: string | undefined) => {
    if (value && value.trim() !== '' && value.length < 2) {
      return t('validation.nameMin');
    }
    return true;
  };

  const validatePhone = (value: string | undefined) => {
    if (value && value.trim() !== '' && value.length < 7) {
      return t('validation.phoneInvalid');
    }
    return true;
  };

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
              <Label htmlFor="car_plate_number">{t('carPlateNumber', { ns: 'customers', defaultValue: 'Car Plate Number' })}<span className="text-destructive">*</span></Label>
              <Input 
                id="car_plate_number" 
                {...register('car_plate_number', { 
                  validate: validateCarPlateNumber
                })} 
                placeholder={t('carPlateNumberPlaceholder', { ns: 'customers', defaultValue: 'Enter car plate number' })} 
              />
              {errors.car_plate_number && <p className="text-sm text-destructive">{errors.car_plate_number.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input 
                  id="name" 
                  {...register('name', { 
                    validate: validateName
                  })} 
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">{t('phone', { ns: 'customers' })}</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  {...register('phone', { 
                    validate: validatePhone
                  })} 
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
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