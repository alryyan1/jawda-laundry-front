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
import { Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, TextField } from "@mui/material";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
 
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

import type { Expense, ExpenseFormData } from "@/types";
import {
  createExpense,
  updateExpense,
  getExpenseCategories,
} from "@/api/expenseService";
import { EXPENSE_PAYMENT_METHODS } from "@/lib/constants";
import { ExpenseCategoryFormModal } from "./ExpenseCategoryFormModal";

// Zod schema for form validation
const expenseSchema = z.object({
  name: z.string().nonempty({ message: "validation.expenseNameRequired" }),
  expense_category_id: z.coerce.number({ invalid_type_error: "validation.categoryRequired" }).positive({ message: "validation.categoryRequired" }),
  amount: z.coerce.number({ invalid_type_error: "validation.amountRequired" }).positive({ message: "validation.amountMustBePositive" }),
  payment_method: z
    .string()
    .min(1, { message: "validation.paymentMethodRequired" }),
  expense_date: z.string().nonempty({ message: "validation.dateRequired" }),
  description: z
    .string()
    .max(1000, { message: "validation.descriptionTooLong" })
    .optional()
    .or(z.literal("")),
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
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<
    { id: number; name: string; description?: string }[],
    Error
  >({
    queryKey: ["expenseCategories"],
    queryFn: () => getExpenseCategories().then(cats => Array.isArray(cats) ? cats : []),
  });

  const muiCategoryOptions = useMemo(
    () => categories.map((cat) => ({ id: cat.id, name: cat.name })),
    [categories]
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: "",
      expense_category_id: undefined,
      amount: undefined,
      payment_method: "cash",
      expense_date: format(new Date(), "yyyy-MM-dd"),
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        reset({
          name: editingExpense.name,
          expense_category_id: editingExpense.expense_category_id || undefined,
          amount: editingExpense.amount,
          payment_method: editingExpense.payment_method || "cash",
          expense_date: editingExpense.expense_date,
          description: editingExpense.description || "",
        });
      } else {
        reset({
          name: "",
          expense_category_id: undefined,
          amount: undefined,
          payment_method: "cash",
          expense_date: format(new Date(), "yyyy-MM-dd"),
          description: "",
        });
      }
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
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseCategories"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error.message || t("expenseActionFailed", { ns: "expenses" })
      );
    },
  });

  const onSubmit = (formData: ExpenseFormValues) => {
    mutation.mutate(formData as ExpenseFormData);
  };

  const handleCategoryCreated = (categoryId: number) => {
    // Update the category field with the newly created category ID
    setValue("expense_category_id", categoryId);
  };

  return (
    <>
    <Dialog
      open={isOpen}
      onClose={() => onOpenChange(false)}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        className: "bg-background text-foreground dark:bg-background dark:text-foreground",
      }}
    >
      <DialogTitle>
        {editingExpense
          ? t("editExpenseTitle", { ns: "expenses" })
          : t("newExpenseTitle", { ns: "expenses" })}
      </DialogTitle>
      <DialogContent>
        <p className="text-sm text-muted-foreground mb-2">
          {editingExpense
            ? t("editExpenseDescription", { ns: "expenses" })
            : t("newExpenseDescription", { ns: "expenses" })}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="expense-category">
                  {t("category", { ns: "common" })}
                  <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="h-8 px-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {t("newCategory", { ns: "expenses", defaultValue: "New" })}
                </Button>
              </div>
              <Controller
                name="expense_category_id"
                control={control}
                render={({ field }) => {
                  const selected = muiCategoryOptions.find((opt) => opt.id === field.value) || null;
                  return (
                    <Autocomplete
                      options={muiCategoryOptions}
                      getOptionLabel={(option) => option.name}
                      value={selected}
                      isOptionEqualToValue={(o, v) => o.id === v.id}
                      onChange={(_, value) => field.onChange(value ? value.id : undefined)}
                      loading={isLoadingCategories}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={
                            isLoadingCategories
                              ? t("loading")
                              : t("selectOrAddCategory", { ns: "expenses" })
                          }
                          size="small"
                          fullWidth
                        />
                      )}
                    />
                  );
                }}
              />
              {errors.expense_category_id && (
                <p className="text-sm text-destructive">
                  {t(errors.expense_category_id.message as string)}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="payment_method">
                {t("paymentMethod", { ns: "expenses" })}
                <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="payment_method"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="payment_method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(EXPENSE_PAYMENT_METHODS as readonly string[]).map(
                        (opt) => (
                          <SelectItem key={opt} value={opt}>
                            {t(`method_${opt}`, { ns: "expenses" })}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.payment_method && (
                <p className="text-sm text-destructive">
                  {t(errors.payment_method.message as string)}
                </p>
              )}
            </div>
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
                          <span>{t("pickADate")}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
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
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="expense-description">
              {t("descriptionOptional")}
            </Label>
            <Textarea
              id="expense-description"
              {...register("description")}
              rows={3}
              placeholder={t("expenseDescriptionPlaceholder", {
                ns: "expenses",
              })}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {t(errors.description.message as string)}
              </p>
            )}
          </div>

          <DialogActions className="gap-2">
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
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
    {/* Category Creation Modal */}
    <ExpenseCategoryFormModal
      isOpen={isCategoryModalOpen}
      onOpenChange={setIsCategoryModalOpen}
      onCategoryCreated={handleCategoryCreated}
    />
    </>
  );
};
