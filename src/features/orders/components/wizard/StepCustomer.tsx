// src/features/orders/components/wizard/StepCustomer.tsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Controller } from "react-hook-form";
import type { Control, FieldError } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import type { ComboboxOption } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

import type { Customer, PaginatedResponse, NewOrderFormData } from "@/types";
import { getCustomers } from "@/api/customerService";

interface StepCustomerProps {
  onCustomerSelected: (customerId: string) => void;
  control: Control<NewOrderFormData>;
  error?: FieldError;
}

export const StepCustomer: React.FC<StepCustomerProps> = ({
  control,
  error,
  onCustomerSelected,
}) => {
  const { t } = useTranslation(["common", "orders", "customers", "validation"]);
  const navigate = useNavigate();

  const { data: customersResponse, isLoading: isLoadingCustomers } = useQuery<
    PaginatedResponse<Customer>,
    Error
  >({
    queryKey: ["customersForSelect"],
    queryFn: () => getCustomers(1, 1000), // Fetch a large list for the combobox
    staleTime: 5 * 60 * 1000,
  });

  const customerOptions: ComboboxOption[] = useMemo(
    () =>
      customersResponse?.data.map((cust) => ({
        value: cust.id.toString(),
        label: `${cust.name} (${cust.phone})`, // Using phone is a good unique identifier in the label
      })) || [],
    [customersResponse]
  );

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b shrink-0">
        <h2 className="text-lg font-semibold">
          {t("step1_selectCustomer", { ns: "orders" })}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("selectCustomerDescription", { ns: "orders" })}
        </p>
      </header>

      <div className="flex-grow p-6 flex items-center justify-center">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              {t("whoIsThisOrderFor", {
                ns: "orders",
                defaultValue: "Who is this order for?",
              })}
            </h3>
            <p className="text-muted-foreground mt-2">
              {t("findOrCreateCustomer", {
                ns: "orders",
                defaultValue:
                  "Find an existing customer or create a new profile.",
              })}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customer-selection-combobox" className="sr-only">
              {t("customer", { ns: "customers" })}
            </Label>
            {isLoadingCustomers ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Controller
                name="customer_id"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={customerOptions}
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value); // Update form state
                      onCustomerSelected(value); // Notify parent to move to next step
                    }}
                    placeholder={t("selectOrSearchCustomer", {
                      ns: "customers",
                    })}
                    searchPlaceholder={t("searchCustomerByNameOrPhone", {
                      ns: "customers",
                      defaultValue: "Search by name or phone...",
                    })}
                    emptyResultText={t("noCustomerFound", { ns: "customers" })}
                    disabled={
                      isLoadingCustomers || customerOptions.length === 0
                    }
                  />
                )}
              />
            )}
            {error && (
              <p className="text-sm text-destructive mt-1">
                {t(error.message as string)}
              </p>
            )}
          </div>

          <div className="flex items-center">
            <div className="flex-grow border-t"></div>
            <span className="mx-4 text-xs uppercase text-muted-foreground">
              {t("or", { ns: "common" })}
            </span>
            <div className="flex-grow border-t"></div>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate("/customers/new")}
          >
            <UserPlus className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t("createNewCustomer", { ns: "customers" })}
          </Button>
        </div>
      </div>
    </div>
  );
};
