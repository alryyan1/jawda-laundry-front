// src/features/customers/components/EditCustomerDialog.tsx
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

import type { CustomerFormData, Customer } from "@/types";
import { getCustomerById, updateCustomer } from "@/api/customerService";

const customerSchema = z.object({
  name: z
    .string()
    .nonempty({ message: "validation.nameRequired" })
    .min(2, { message: "validation.nameMin" }),
  email: z
    .string()
    .email({ message: "validation.emailInvalid" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  is_default: z.boolean().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface EditCustomerDialogProps {
  customerId: number | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customer: Customer) => void;
}

export const EditCustomerDialog: React.FC<EditCustomerDialogProps> = ({
  customerId,
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation(["common", "customers", "validation"]);
  const queryClient = useQueryClient();

  // Fetch customer data
  const {
    data: customer,
    isLoading: isLoadingCustomer,
    error: loadingError,
  } = useQuery<Customer, Error>({
    queryKey: ["customer", customerId],
    queryFn: () => getCustomerById(customerId!),
    enabled: !!customerId && isOpen,
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  // Reset form when customer data loads
  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        notes: customer.notes || "",
        is_default: customer.is_default || false,
      });
    }
  }, [customer, reset]);

  const mutation = useMutation<Customer, Error, CustomerFormData>({
    mutationFn: (data) => {
      const payload = { ...data };
      return updateCustomer(customerId!, payload);
    },
    onSuccess: (data) => {
      toast.success(
        t("customerUpdatedSuccess", { ns: "customers", name: data.name }),
      );
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customersForSelect"] });
      onSuccess?.(data);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error.message || t("customerUpdateFailed", { ns: "customers" }),
      );
    },
  });

  const onSubmit = (data: CustomerFormValues) => {
    const payload: CustomerFormData = {
      ...data,
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {t("editCustomerTitle", {
              ns: "customers",
              name: customer?.name || "",
            })}
          </DialogTitle>
          <DialogDescription>
            {t("editCustomerDescription", { ns: "customers" })}
          </DialogDescription>
        </DialogHeader>

        {isLoadingCustomer ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : loadingError ? (
          <div className="py-4 text-center text-destructive">
            {t("errorLoading", { ns: "common" })}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  {t("name")}
                  <span className="text-destructive">*</span>
                </Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {t(errors.name.message as string)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">{t("emailOptional")}</Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {t(errors.email.message as string)}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">
                    {t("phoneOptional", { ns: "customers" })}
                  </Label>
                  <Input id="phone" type="tel" {...register("phone")} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">
                  {t("addressOptional", { ns: "customers" })}
                </Label>
                <Textarea id="address" {...register("address")} rows={2} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">{t("notesOptional")}</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  rows={2}
                  placeholder={t("customerNotesPlaceholder", {
                    ns: "customers",
                  })}
                />
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
                  {t("setAsDefault", {
                    ns: "customers",
                    defaultValue: "Set as default customer",
                  })}
                </Label>
              </div>
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
              <Button type="submit" disabled={mutation.isPending || !isDirty}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
