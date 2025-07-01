// src/features/orders/components/OrderHeader.tsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { Control, FieldError } from "react-hook-form";
import { Controller } from "react-hook-form";

import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

import type { Customer, NewOrderFormData, PaginatedResponse } from "@/types";
import { getCustomers } from "@/api/customerService";

interface OrderHeaderProps {
  control: Control<NewOrderFormData>;
  customerError?: FieldError;
  isSubmitting: boolean;
  orderNumber?: string; // For display on edit page
  onNewOrderClick: () => void;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({
  control,
  customerError,
  isSubmitting,
  orderNumber,
  onNewOrderClick,
}) => {
  const { t } = useTranslation(["common", "orders", "customers", "validation"]);

  const { data: customersResponse, isLoading: isLoadingCustomers } = useQuery<
    PaginatedResponse<Customer>,
    Error
  >({
    queryKey: ["customersForSelect"],
    queryFn: () => getCustomers(1, 1000), // Fetch a large list for the combobox
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const customerOptions: ComboboxOption[] = useMemo(
    () =>
      customersResponse?.data.map((cust) => ({
        value: cust.id.toString(),
        label: `${cust.name} (${cust.phone})`,
      })) || [],
    [customersResponse]
  );

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b bg-card">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onNewOrderClick}
          aria-label={t("startNewOrder", {
            ns: "orders",
            defaultValue: "Start New Order",
          })}
          className="h-10 w-10 shrink-0"
        >
          <PlusCircle className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-7 w-7 text-primary" />
          <div>
            <h2 className="text-lg font-semibold leading-none">
              {orderNumber
                ? t("editingOrder", {
                    ns: "orders",
                    defaultValue: "Editing Order",
                  })
                : t("newOrder", { ns: "common" })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {orderNumber || t("newUnsavedOrder", { ns: "orders" })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
        <div className="grid gap-1.5 min-w-[250px] md:min-w-[300px]">
          <Label htmlFor="customer_id" className="text-xs font-semibold">
            {t("customer", { ns: "customers" })}{" "}
            <span className="text-destructive">*</span>
          </Label>
          {isLoadingCustomers ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <Controller
                name="customer_id"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={customerOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("selectOrSearchCustomer", {
                      ns: "customers",
                      defaultValue: "Select or search a customer...",
                    })}
                    searchPlaceholder={t("searchCustomer", { ns: "customers" })}
                    emptyResultText={t("noCustomerFound", { ns: "customers" })}
                    disabled={
                      isSubmitting ||
                      isLoadingCustomers ||
                      customerOptions.length === 0
                    }
                  />
                )}
              />
              {customerError && (
                <p className={cn("text-xs text-destructive")}>
                  {t(customerError.message as string)}
                </p>
              )}
            </>
          )}
        </div>
        {/* The status selector is best left for the Edit page, but this shows where it would go */}
      </div>
    </div>
  );
};
