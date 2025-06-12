// src/pages/services/product-types/ProductTypeFormModal.tsx
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'; // DialogClose is used by Button asChild
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

import type { ProductType, ProductCategory, ProductTypeFormData } from '@/types';
import { getProductCategories } from '@/api/productCategoryService';
import {
    createProductType,
    updateProductType
     // Ensure this is exported from productTypeService.ts
} from '@/api/productTypeService';

const measurementUnits = ['item', 'kg', 'sq_meter', 'set', 'piece', 'other']; // Example units

const productTypeSchema = z.object({
    name: z.string().nonempty({ message: "validation.nameRequired" }),
    product_category_id: z.string().min(1, { message: "validation.categoryRequired" }), // String from select
    description: z.string().optional().or(z.literal('')),
    base_measurement_unit: z.string().optional().or(z.literal('')),
});

// This type should match ProductTypeFormData if it's defined in your service
type ProductTypeFormValues = z.infer<typeof productTypeSchema>;


interface ProductTypeFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingProductType?: ProductType | null;
}

export const ProductTypeFormModal: React.FC<ProductTypeFormModalProps> = ({
  isOpen,
  onOpenChange,
  editingProductType,
}) => {
  const { t } = useTranslation(['common', 'services', 'validation']);
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<ProductCategory[], Error>({
    queryKey: ['productCategoriesForSelect'], // Re-use key if appropriate
    queryFn: getProductCategories,
  });

  const { control, register, handleSubmit, reset, setValue, formState: { errors, isDirty } } = useForm<ProductTypeFormValues>({
    resolver: zodResolver(productTypeSchema),
    defaultValues: {
        name: '',
        product_category_id: '',
        description: '',
        base_measurement_unit: '',
    }
  });

  useEffect(() => {
    if (editingProductType && isOpen) {
      setValue('name', editingProductType.name);
      setValue('product_category_id', editingProductType.product_category_id.toString());
      setValue('description', editingProductType.description || '');
      setValue('base_measurement_unit', editingProductType.base_measurement_unit || '');
    } else if (!isOpen) {
      reset({ name: '', product_category_id: '', description: '', base_measurement_unit: '' });
    }
  }, [editingProductType, isOpen, setValue, reset]);

  const formMutation = useMutation<ProductType, Error, ProductTypeFormData>({
    mutationFn: (data) => {
        // Ensure product_category_id is a number for the API
        const payload = { ...data, product_category_id: parseInt(data.product_category_id as string, 10) };
        return editingProductType ? updateProductType(editingProductType.id, payload) : createProductType(payload);
    },
    onSuccess: (data) => {
      toast.success(editingProductType ? t('productTypeUpdatedSuccess', { ns: 'services', name: data.name }) : t('productTypeCreatedSuccess', { ns: 'services', name: data.name }));
      queryClient.invalidateQueries({ queryKey: ['productTypes'] }); // For the list page
      queryClient.invalidateQueries({ queryKey: ['allProductTypesForSelect'] }); // For other dropdowns
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || (editingProductType ? t('productTypeUpdateFailed', { ns: 'services' }) : t('productTypeCreationFailed', { ns: 'services' })));
    }
  });

  const onSubmit = (formData: ProductTypeFormValues) => {
    if (isDirty || !editingProductType) {
        // Type assertion might be needed if ProductTypeFormData has number for category_id
        formMutation.mutate(formData as unknown as ProductTypeFormData);
    } else {
        onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{editingProductType ? t('editProductTypeTitle', { ns: 'services' }) : t('newProductTypeTitle', { ns: 'services' })}</DialogTitle>
          <DialogDescription>
            {editingProductType ? t('editProductTypeDescription', { ns: 'services' }) : t('newProductTypeDescription', { ns: 'services' })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div>
            <Label htmlFor="pt-name">{t('name', { ns: 'common' })} <span className="text-destructive">*</span></Label>
            <Input id="pt-name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{t(errors.name.message as string)}</p>}
          </div>

          <div>
            <Label htmlFor="pt-category">{t('category', { ns: 'services' })} <span className="text-destructive">*</span></Label>
            <Controller
              name="product_category_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCategories}>
                  <SelectTrigger id="pt-category">
                    <SelectValue placeholder={isLoadingCategories ? t('loadingCategories', {ns:'services'}) : t('selectCategory', { ns: 'services' })} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.product_category_id && <p className="text-sm text-destructive">{t(errors.product_category_id.message as string)}</p>}
          </div>

          <div>
            <Label htmlFor="pt-unit">{t('baseUnitOptional', { ns: 'services' })}</Label>
            <Controller
              name="base_measurement_unit"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="pt-unit">
                    <SelectValue placeholder={t('selectUnitOptional', { ns: 'services' })} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('noneUnit', {ns:'services', defaultValue:'None / Not Applicable'})}</SelectItem>
                    {measurementUnits.map(unit => (
                      <SelectItem key={unit} value={unit}>
                        {t(`units.${unit}`, { ns: 'services', defaultValue: unit.charAt(0).toUpperCase() + unit.slice(1) })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
             {/* No error display for optional field unless specific validation added */}
          </div>

          <div>
            <Label htmlFor="pt-description">{t('descriptionOptional', { ns: 'common' })}</Label>
            <Textarea id="pt-description" {...register('description')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={formMutation.isPending}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={formMutation.isPending || isLoadingCategories || (!isDirty && !!editingProductType)}>
              {formMutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />}
              {editingProductType ? t('saveChanges', { ns: 'common' }) : t('create', { ns: 'common' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};