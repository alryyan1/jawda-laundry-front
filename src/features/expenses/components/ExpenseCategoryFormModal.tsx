// src/features/expenses/components/ExpenseCategoryFormModal.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

import type { ExpenseCategory } from "@/types";
import { createExpenseCategory } from "@/api/expenseCategoryService";

// Zod schema for form validation
const categorySchema = z.object({
  name: z.string().min(1, { message: "validation.categoryNameRequired" }),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface ExpenseCategoryFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCategoryCreated?: (categoryId: number) => void;
}

export const ExpenseCategoryFormModal: React.FC<ExpenseCategoryFormModalProps> = ({
  isOpen,
  onOpenChange,
  onCategoryCreated,
}) => {
  const { t } = useTranslation(["common", "expenses", "validation"]);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const mutation = useMutation<ExpenseCategory, Error, CategoryFormValues>({
    mutationFn: (data) => createExpenseCategory(data),
    onSuccess: (data) => {
      toast.success(
        t("categoryCreatedSuccess", { 
          ns: "expenses", 
          name: data.name,
          defaultValue: `Category "${data.name}" created successfully.`
        })
      );
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["expenseCategories"] });
      
      // Call the callback to update the parent form
      if (onCategoryCreated) {
        onCategoryCreated(data.id);
      }
      
      // Reset form and close modal
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error.message ||
          t("categoryCreationFailed", {
            ns: "expenses",
            defaultValue: "Failed to create category. Please try again.",
          })
      );
    },
  });

  const onSubmit = (formData: CategoryFormValues) => {
    mutation.mutate(formData);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("newCategoryTitle", { 
              ns: "expenses", 
              defaultValue: "New Expense Category" 
            })}
          </DialogTitle>
          <DialogDescription>
            {t("newCategoryDescription", { 
              ns: "expenses", 
              defaultValue: "Add a new expense category to organize your expenses." 
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Name Field */}
          <div className="grid gap-1.5">
            <Label htmlFor="category-name">
              {t("categoryName", { ns: "expenses" })}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="category-name"
              {...register("name")}
              placeholder={t("categoryNamePlaceholder", { 
                ns: "expenses", 
                defaultValue: "e.g., Utilities, Rent, Supplies" 
              })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {t(errors.name.message as string)}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="category-description">
              {t("descriptionOptional")}
            </Label>
            <Textarea
              id="category-description"
              {...register("description")}
              rows={3}
              placeholder={t("categoryDescriptionPlaceholder", { 
                ns: "expenses", 
                defaultValue: "Optional description for this category..." 
              })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              )}
              {t("createCategoryBtn", { 
                ns: "expenses", 
                defaultValue: "Create Category" 
              })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};