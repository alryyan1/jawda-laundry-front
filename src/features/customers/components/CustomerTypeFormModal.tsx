import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

import type { CustomerType } from '@/types';
import { createCustomerType, type CustomerTypeFormData } from '@/api/customerTypeService';

const customerTypeSchema = z.object({
  name: z.string().nonempty({ message: "validation.nameRequired" }),
  description: z.string().optional(),
});

type CustomerTypeFormValues = z.infer<typeof customerTypeSchema>;

interface CustomerTypeFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: (newType: CustomerType) => void; // Callback to set new type in parent form
}

export const CustomerTypeFormModal: React.FC<CustomerTypeFormModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation(['common', 'customers', 'validation']);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerTypeFormValues>({
    resolver: zodResolver(customerTypeSchema),
    defaultValues: { name: '', description: '' },
  });

  const mutation = useMutation<CustomerType, Error, CustomerTypeFormData>({
    mutationFn: createCustomerType,
    onSuccess: (newType) => {
      toast.success(t('customerTypeCreatedSuccess', { ns: 'customers', name: newType.name }));
      queryClient.invalidateQueries({ queryKey: ['customerTypesForSelect'] }); // Invalidate the dropdown list
      onSuccess?.(newType); // Pass the new type back to the parent
      onOpenChange(false); // Close the modal
    },
    onError: (error) => {
      toast.error(error.message || t('customerTypeCreationFailed', { ns: 'customers' }));
    }
  });

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('newCustomerTypeTitle', { ns: 'customers' })}</DialogTitle>
          <DialogDescription>{t('newCustomerTypeDescription', { ns: 'customers' })}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="type-name">{t('name')}<span className="text-destructive">*</span></Label>
            <Input id="type-name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{t(errors.name.message as string)}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="type-description">{t('descriptionOptional')}</Label>
            <Textarea id="type-description" {...register('description')} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>{t('cancel')}</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              {t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 