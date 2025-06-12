// src/pages/services/product-categories/ProductCategoryFormModal.tsx
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

import type { ProductCategory } from '@/types';
import {
    createProductCategory,
    updateProductCategory,
} from '@/api/productCategoryService';
import type { ProductCategoryFormData } from '@/api/productCategoryService';

const categorySchema = z.object({
    name: z.string().nonempty({ message: "validation.nameRequired" }),
    description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface ProductCategoryFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingCategory?: ProductCategory | null; // Pass category data for editing
}

export const ProductCategoryFormModal: React.FC<ProductCategoryFormModalProps> = ({
  isOpen,
  onOpenChange,
  editingCategory,
}) => {
  const { t } = useTranslation(['common', 'services', 'validation']);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setValue, formState: { errors, isDirty } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
        name: '',
        description: '',
    }
  });

  useEffect(() => {
    if (editingCategory && isOpen) {
      setValue('name', editingCategory.name);
      setValue('description', editingCategory.description || '');
    } else if (!isOpen) { // Reset form when modal is closed or if not editing
      reset({ name: '', description: '' });
    }
  }, [editingCategory, isOpen, setValue, reset]);

  const formMutation = useMutation<ProductCategory, Error, ProductCategoryFormData>({
    mutationFn: (data) => editingCategory ? updateProductCategory(editingCategory.id, data) : createProductCategory(data),
    onSuccess: (data) => {
      toast.success(editingCategory ? t('categoryUpdatedSuccess', { ns: 'services', name: data.name }) : t('categoryCreatedSuccess', { ns: 'services', name: data.name }));
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
      onOpenChange(false); // Close modal on success
    },
    onError: (error) => {
      toast.error(error.message || (editingCategory ? t('categoryUpdateFailed', { ns: 'services' }) : t('categoryCreationFailed', { ns: 'services' })));
    }
  });

  const onSubmit = (formData: CategoryFormValues) => {
    // Only submit if form is dirty or it's a new item (editingCategory is null)
    // This prevents submitting an unchanged edit form, though backend might handle it.
    if(isDirty || !editingCategory) {
        formMutation.mutate(formData);
    } else {
        onOpenChange(false); // Close if no changes
    }
  };

  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
        // TODO: Parent should clear editingCategory when modal closes
        // setEditingCategory(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingCategory ? t('editCategoryTitle', { ns: 'services', defaultValue: 'Edit Product Category' }) : t('newCategoryTitle', { ns: 'services', defaultValue: 'New Product Category' })}</DialogTitle>
          <DialogDescription>
            {editingCategory ? t('editCategoryDescription', { ns: 'services', defaultValue: 'Update the details of this category.' }) : t('newCategoryDescription', { ns: 'services', defaultValue: 'Add a new category for your products.' })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div>
            <Label htmlFor="category-name">{t('name', { ns: 'common' })} <span className="text-destructive">*</span></Label>
            <Input id="category-name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{t(errors.name.message as string)}</p>}
          </div>
          <div>
            <Label htmlFor="category-description">{t('descriptionOptional', { ns: 'common' })}</Label>
            <Textarea id="category-description" {...register('description')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={formMutation.isPending}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={formMutation.isPending || (!isDirty && !!editingCategory) }>
              {formMutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />}
              {editingCategory ? t('saveChanges', { ns: 'common' }) : t('create', { ns: 'common' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};