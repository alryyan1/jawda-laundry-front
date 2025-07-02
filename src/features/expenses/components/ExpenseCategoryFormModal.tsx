// src/features/expenses/components/ExpenseCategoryFormModal.tsx
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

import type { ExpenseCategory } from '@/types';
import {
    createExpenseCategory,
    updateExpenseCategory,
    // Define this type if not already globally available
    // For now, we'll define it here based on the form
} from '@/api/expenseCategoryService';

// Define the shape of the form data
interface CategoryFormData {
    name: string;
    description?: string;
}

// Define the Zod schema for validation
const categorySchema = z.object({
  name: z.string().nonempty({ message: "validation.nameRequired" }).max(100, { message: "validation.nameTooLong" }),
  description: z.string().max(500, { message: "validation.descriptionTooLong" }).optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface ExpenseCategoryFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingCategory?: ExpenseCategory | null; // Pass category data for editing
}

export const ExpenseCategoryFormModal: React.FC<ExpenseCategoryFormModalProps> = ({ isOpen, onOpenChange, editingCategory }) => {
  const { t } = useTranslation(['common', 'expenses', 'validation']);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
        name: '',
        description: '',
    }
  });

  // Pre-fill form when in edit mode
  useEffect(() => {
    if (editingCategory && isOpen) {
      reset({
        name: editingCategory.name,
        description: editingCategory.description || '',
      });
    } else if (!isOpen) {
      // Clear form when modal is closed
      reset({ name: '', description: '' });
    }
  }, [editingCategory, isOpen, reset]);

  const mutation = useMutation<ExpenseCategory, Error, CategoryFormData>({
    mutationFn: (data) =>
        editingCategory
        ? updateExpenseCategory(editingCategory.id, data)
        : createExpenseCategory(data),
    onSuccess: (data) => {
      toast.success(editingCategory
        ? t('categoryUpdatedSuccess', { ns: 'expenses', name: data.name })
        : t('categoryCreatedSuccess', { ns: 'expenses', name: data.name })
      );
      // Invalidate queries to refetch data on the list page
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      onOpenChange(false); // Close modal on success
    },
    onError: (error) => {
      toast.error(error.message || t('categoryActionFailed', { ns: 'expenses', defaultValue: 'Action failed. Please try again.' }));
    }
  });

  const onSubmit = (formData: CategoryFormValues) => {
    mutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingCategory ? t('editExpenseCategoryTitle', { ns: 'expenses' }) : t('newExpenseCategoryTitle', { ns: 'expenses' })}</DialogTitle>
          <DialogDescription>{editingCategory ? t('editExpenseCategoryDescription', { ns: 'expenses' }) : t('newExpenseCategoryDescription', { ns: 'expenses' })}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="category-name">{t('name')}<span className="text-destructive">*</span></Label>
            <Input
              id="category-name"
              {...register('name')}
              placeholder={t('egCategoryName', { ns: 'expenses', defaultValue: 'e.g., Utilities, Supplies, Rent' })}
            />
            {errors.name && <p className="text-sm text-destructive">{t(errors.name.message as string)}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="category-description">{t('descriptionOptional')}</Label>
            <Textarea
              id="category-description"
              {...register('description')}
              rows={3}
              placeholder={t('categoryDescriptionPlaceholder', { ns: 'expenses', defaultValue: 'A short description of this category...' })}
            />
             {errors.description && <p className="text-sm text-destructive">{t(errors.description.message as string)}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending || (!isDirty && !!editingCategory)}>
              {mutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              {editingCategory ? t('saveChanges') : t('createCategoryBtn', { ns: 'expenses', defaultValue: 'Create Category' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};