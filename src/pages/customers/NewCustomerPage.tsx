// src/pages/customers/NewCustomerPage.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft } from "lucide-react";

import { CustomerFormData, createCustomer } from "@/api/customerService";
import { Customer } from "@/types";

// Zod schema using translation keys
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
  // Add regex for phone if desired: .regex(/^\+?[0-9\s\-()]*$/, { message: "validation.phoneInvalid" })
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

const NewCustomerPage: React.FC = () => {
  const { t } = useTranslation(["common", "customers", "validation"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", email: "", phone: "", address: "", notes: "" },
  });

  const mutation = useMutation<Customer, Error, CustomerFormData>({
    mutationFn: createCustomer,
    onSuccess: (data) => {
      toast.success(
        t("customerCreatedSuccess", { ns: "customers", name: data.name })
      );
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customersForSelect"] });
      reset(); // Reset form
      navigate("/customers");
    },
    onError: (error) => {
      // You might want to parse Laravel validation errors here if backend returns them
      // For now, a generic message or error.message
      toast.error(
        error.message || t("customerCreationFailed", { ns: "customers" })
      );
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/customers">
            <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t("backToCustomers", { ns: "customers" })}
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("newCustomerTitle", { ns: "customers" })}</CardTitle>
          <CardDescription>
            {t("newCustomerDescription", { ns: "customers" })}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="name">
                {t("name", { ns: "common" })}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {t(errors.name.message as string)}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email">
                  {t("emailOptional", {
                    ns: "common",
                    defaultValue: "Email (Optional)",
                  })}
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {t(errors.email.message as string)}
                  </p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="phone">
                  {t("phoneOptional", {
                    ns: "customers",
                    defaultValue: "Phone (Optional)",
                  })}
                </Label>
                <Input id="phone" type="tel" {...register("phone")} />
                {/* Add phone validation error display if schema includes it */}
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {t(errors.phone.message as string)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="address">
                {t("addressOptional", {
                  ns: "customers",
                  defaultValue: "Address (Optional)",
                })}
              </Label>
              <Textarea id="address" {...register("address")} rows={3} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="notes">
                {t("notesOptional", {
                  ns: "common",
                  defaultValue: "Notes (Optional)",
                })}
              </Label>
              <Textarea
                id="notes"
                {...register("notes")}
                rows={3}
                placeholder={t("customerNotesPlaceholder", {
                  ns: "customers",
                  defaultValue: "Any specific details about this customer...",
                })}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/customers")}
              disabled={mutation.isPending}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
              )}
              {t("createCustomerBtn", {
                ns: "customers",
                defaultValue: "Create Customer",
              })}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default NewCustomerPage;
