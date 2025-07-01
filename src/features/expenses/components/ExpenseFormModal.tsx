// src/features/expenses/components/ExpenseFormModal.tsx
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parse } from "date-fns";

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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Loader2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import type { Expense, ExpenseFormData } from "@/types";
import {
  createExpense,
  updateExpense,
  getExpenseCategories,
} from "@/api/expenseService";

// Zod schema for form validation
const expenseSchema = z.object({
  name: z.string().min(1, { message: "validation.expenseNameRequired" }),
  category: z.string().min(1, { message: "validation.categoryRequired" }),
  amount: z.coerce.number({ invalid_type_error: "validation.amountRequired" }).positive({ message: "validation.amountMustBePositive" }),
  expense_date: z.string().min(1, { message: "validation.dateRequired" }),
  description: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingExpense?: Expense | null;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onOpenChange,
  editingExpense,
}) => {
  const { t } = useTranslation(["common", "expenses", "validation"]);
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<
    string[],
    Error
  >({
    queryKey: ["expenseCategories"],
    queryFn: getExpenseCategories,
    staleTime: 5 * 60 * 1000,
  });

  const categoryOptions: ComboboxOption[] = useMemo(
    () => categories.map((cat) => ({ value: cat, label: cat })),
    [categories]
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: "",
      category: "",
      amount: 0,
      expense_date: "",
      description: "",
    },
  });

  // Effect to pre-fill the form when in "edit" mode
  useEffect(() => {
    if (editingExpense && isOpen) {
      reset({
        name: editingExpense.name,
        category: editingExpense.category || "",
        amount: editingExpense.amount,
        expense_date: editingExpense.expense_date, // Assumes YYYY-MM-DD format from API
        description: editingExpense.description || "",
      });
    } else if (!isOpen) {
      reset(); // Clear form when modal is closed
    }
  }, [editingExpense, isOpen, reset]);

  const mutation = useMutation<Expense, Error, ExpenseFormData>({
    mutationFn: (data) =>
      editingExpense
        ? updateExpense(editingExpense.id, data)
        : createExpense(data),
    onSuccess: (data) => {
      toast.success(
        editingExpense
          ? t("expenseUpdatedSuccess", { ns: "expenses", name: data.name })
          : t("expenseCreatedSuccess", { ns: "expenses", name: data.name })
      );
      // Invalidate queries to refetch data on the list page
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseCategories"] }); // In case a new category was added
      onOpenChange(false); // Close the modal
    },
    onError: (error) => {
      toast.error(
        error.message ||
          t("expenseActionFailed", {
            ns: "expenses",
            defaultValue: "The action failed. Please try again.",
          })
      );
    },
  });

  const onSubmit = (formData: ExpenseFormValues) => {
    mutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingExpense
              ? t("editExpenseTitle", { ns: "expenses" })
              : t("newExpenseTitle", { ns: "expenses" })}
          </DialogTitle>
          <DialogDescription>
            {editingExpense
              ? t("editExpenseDescription", { ns: "expenses" })
              : t("newExpenseDescription", { ns: "expenses" })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Name Field */}
          <div className="grid gap-1.5">
            <Label htmlFor="expense-name">
              {t("expenseName", { ns: "expenses" })}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="expense-name"
              {...register("name")}
              placeholder={t("expenseNamePlaceholder", { ns: "expenses" })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {t(errors.name.message as string)}
              </p>
            )}
          </div>

          {/* Category & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="expense-category">
                {t("category", { ns: "common" })}
                <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={categoryOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={
                      isLoadingCategories
                        ? t("loading")
                        : t("selectCategory", { ns: "expenses" })
                    }
                    searchPlaceholder={t("searchCategories", {
                      ns: "expenses",
                    })}
                    emptyResultText={t("noCategoriesFound", { ns: "expenses" })}
                    allowCustomValue={true} // Allow user to type a new category
                  />
                )}
              />
              {errors.category && (
                <p className="text-sm text-destructive">
                  {t(errors.category.message as string)}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="expense-amount">
                {t("amount", { ns: "expenses" })}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                {...register("amount")}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {t(errors.amount.message as string)}
                </p>
              )}
            </div>
          </div>

          {/* Expense Date */}
          <div className="grid gap-1.5">
            <Label htmlFor="expense-date">
              {t("expenseDate", { ns: "expenses" })}
              <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="expense_date"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(
                          parse(field.value, "yyyy-MM-dd", new Date()),
                          "PPP"
                        )
                      ) : (
                        <span>{t("pickADate", { ns: "common" })}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) =>
                        field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.expense_date && (
              <p className="text-sm text-destructive">
                {t(errors.expense_date.message as string)}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="expense-description">
              {t("descriptionOptional")}
            </Label>
            <Textarea
              id="expense-description"
              {...register("description")}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || (!isDirty && !!editingExpense)}
            >
              {mutation.isPending && (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              )}
              {editingExpense
                ? t("saveChanges")
                : t("createExpenseBtn", { ns: "expenses" })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
