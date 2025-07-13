import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle } from 'lucide-react';

import { CustomerTypeFormModal } from '@/features/customers/components/CustomerTypeFormModal';

import type { CustomerFormData, Customer, CustomerType } from '@/types';
import { createCustomer } from '@/api/customerService';
import { getCustomerTypes } from '@/api/customerTypeService';

const customerSchema = z.object({
  name: z.string().nonempty({ message: "validation.nameRequired" }).min(2, { message: "validation.nameMin" }),
  phone: z.string().nonempty({ message: "validation.phoneRequired" }).min(7, { message: "validation.phoneInvalid" }),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  customer_type_id: z.union([z.string(), z.number(), z.null()]).optional(),
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
  const [isTypeModalOpen, setIsTypeModalOpen] = React.useState(false);

  const { data: customerTypes, isLoading: isLoadingTypes } = useQuery<CustomerType[], Error>({
    queryKey: ['customerTypesForSelect'],
    queryFn: getCustomerTypes,
    retry: 1,
  });

  // Ensure customerTypesArray is always an array
  const customerTypesArray = Array.isArray(customerTypes) ? customerTypes : [];

  const { control, register, handleSubmit, formState: { errors }, setValue, reset } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', phone: '', address: '', notes: '', customer_type_id: '' },
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
    const payload: CustomerFormData = {
      ...data,
      customer_type_id: data.customer_type_id ? parseInt(data.customer_type_id as string, 10) : null,
    };
    mutation.mutate(payload);
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      onOpenChange(false);
      reset();
    }
  };

  return (
    <>
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
                <Label htmlFor="customer_type_id">{t('customerTypeOptional', { ns: 'customers' })}</Label>
                <div className="flex items-center gap-2">
                  <Controller
                    name="customer_type_id"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value?.toString() || ''} disabled={isLoadingTypes}>
                        <SelectTrigger id="customer_type_id" className="w-full">
                          <SelectValue placeholder={isLoadingTypes ? t('loading') : t('selectCustomerType', { ns: 'customers' })} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=" ">{t('noneUnit', { ns: 'services' })}</SelectItem>
                          {customerTypesArray.map(type => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsTypeModalOpen(true)}
                    aria-label={t('newCustomerTypeTitle', { ns: 'customers' })}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                {errors.customer_type_id && <p className="text-sm text-destructive">{t(errors.customer_type_id.message as string)}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">{t('addressOptional', { ns: 'customers' })}</Label>
                <Textarea id="address" {...register('address')} rows={2} />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="notes">{t('notesOptional')}</Label>
                <Textarea id="notes" {...register('notes')} rows={2} placeholder={t('customerNotesPlaceholder', { ns: 'customers' })} />
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
      
      <CustomerTypeFormModal
        isOpen={isTypeModalOpen}
        onOpenChange={setIsTypeModalOpen}
        onSuccess={(newType) => {
          setValue('customer_type_id', newType.id.toString(), { shouldDirty: true });
        }}
      />
    </>
  );
}; 