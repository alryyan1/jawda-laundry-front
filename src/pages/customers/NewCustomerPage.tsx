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

import type { CustomerFormData, Customer } from "@/types";
import { createCustomer } from "@/api/customerService";

// Updated Zod schema
const customerSchema = z.object({
  name: z
    .string()
    .nonempty({ message: "validation.nameRequired" })
    .min(2, { message: "validation.nameMin" }),
  phone: z
    .string()
    .nonempty({ message: "validation.phoneRequired" })
    .min(7, { message: "validation.phoneInvalid" }), // Phone is now required
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
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", phone: "", address: "", notes: "" },
  });

  const mutation = useMutation<Customer, Error, CustomerFormData>({
    mutationFn: createCustomer,
    onSuccess: (data) => {
      toast.success(
        t("customerCreatedSuccess", { ns: "customers", name: data.name }),
      );
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customersForSelect"] });
      navigate("/customers");
    },
    onError: (error) => {
      toast.error(
        error.message || t("customerCreationFailed", { ns: "customers" }),
      );
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    const payload: CustomerFormData = {
      ...data,
    };
    mutation.mutate(payload);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
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
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <div className="grid gap-2">
                  <Label htmlFor="phone">
                    {t("phone", { ns: "customers" })}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input id="phone" type="tel" {...register("phone")} />
                  {errors.phone && (
                    <p className="text-sm text-destructive">
                      {t(errors.phone.message as string)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">
                  {t("addressOptional", { ns: "customers" })}
                </Label>
                <Textarea id="address" {...register("address")} rows={3} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">{t("notesOptional")}</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  rows={3}
                  placeholder={t("customerNotesPlaceholder", {
                    ns: "customers",
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
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
                )}
                {t("createCustomerBtn", { ns: "customers" })}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
};
export default NewCustomerPage;
