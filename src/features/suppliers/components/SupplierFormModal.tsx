// src/features/suppliers/components/SupplierFormModal.tsx
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

import type { Supplier, SupplierFormData } from '@/types';
import { createSupplier, updateSupplier } from '@/api/supplierService';

const supplierSchema = z.object({
  name: z.string().nonempty({ message: "validation.nameRequired" }),
  contact_person: z.string().optional().or(z.literal('')),
  email: z.string().email({ message: "validation.emailInvalid" }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

interface SupplierFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingSupplier?: Supplier | null;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({ isOpen, onOpenChange, editingSupplier }) => {
  const { t } = useTranslation(['common', 'suppliers', 'validation']);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
  });

  useEffect(() => {
    if (editingSupplier && isOpen) {
      reset(editingSupplier);
    } else if (!isOpen) {
      reset({ name: '', contact_person: '', email: '', phone: '', address: '', notes: '' });
    }
  }, [editingSupplier, isOpen, reset]);

  const mutation = useMutation<Supplier, Error, SupplierFormData>({
    mutationFn: (data) => editingSupplier ? updateSupplier(editingSupplier.id, data) : createSupplier(data),
    onSuccess: (data) => {
      toast.success(editingSupplier ? t('supplierUpdatedSuccess', { ns: 'suppliers', name: data.name }) : t('supplierCreatedSuccess', { ns: 'suppliers', name: data.name }));
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['allSuppliers'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || t('supplierActionFailed', { ns: 'suppliers' }));
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingSupplier ? t('editSupplierTitle', { ns: 'suppliers' }) : t('newSupplierTitle', { ns: 'suppliers' })}</DialogTitle>
          <DialogDescription>{editingSupplier ? t('editSupplierDescription', { ns: 'suppliers' }) : t('newSupplierDescription', { ns: 'suppliers' })}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="supplier-name">{t('name')}<span className="text-destructive">*</span></Label>
            <Input id="supplier-name" {...register('name')} placeholder={t('supplierNamePlaceholder', { ns: 'suppliers' })} />
            {errors.name && <p className="text-sm text-destructive">{t(errors.name.message as string)}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="grid gap-1.5">
                <Label htmlFor="contact_person">{t('contactPerson', {ns:'suppliers'})}</Label>
                <Input id="contact_person" {...register('contact_person')} />
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor="phone">{t('phone', {ns:'common'})}</Label>
                <Input id="phone" type="tel" {...register('phone')} />
            </div>
          </div>
          
          <div className="grid gap-1.5">
            <Label htmlFor="email">{t('email')}</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{t(errors.email.message as string)}</p>}
          </div>
          
          <div className="grid gap-1.5">
            <Label htmlFor="address">{t('address', {ns:'common'})}</Label>
            <Textarea id="address" {...register('address')} rows={2} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes">{t('notes')}</Label>
            <Textarea id="notes" {...register('notes')} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>{t('cancel')}</Button>
            <Button type="submit" disabled={mutation.isPending || (!isDirty && !!editingSupplier)}>
              {mutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              {editingSupplier ? t('saveChanges') : t('createSupplierBtn', {ns:'suppliers'})}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};