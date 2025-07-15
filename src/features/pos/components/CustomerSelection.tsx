import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { Combobox } from "@/components/ui/combobox";
import type { ComboboxOption } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

import type { Customer, PaginatedResponse } from "@/types";
import { getCustomers } from "@/api/customerService";

interface CustomerSelectionProps {
  selectedCustomerId: string | null;
  onCustomerSelected: (customerId: string) => void;
  onNewCustomerClick?: () => void;
  disabled?: boolean;
  forcedCustomer?: Customer | null;
}

export const CustomerSelection: React.FC<CustomerSelectionProps> = ({
  selectedCustomerId,
  onCustomerSelected,
  onNewCustomerClick,
  disabled = false,
  forcedCustomer = null,
}) => {
  const { t } = useTranslation(["common", "orders", "customers"]);
  const navigate = useNavigate();

  const { data: customersResponse, isLoading: isLoadingCustomers } = useQuery<
    PaginatedResponse<Customer>,
    Error
  >({
    queryKey: ["customersForSelect"],
    queryFn: () => getCustomers(1, 1000),
    staleTime: 5 * 60 * 1000,
  });

  const customerOptions: ComboboxOption[] = customersResponse?.data.map((cust) => ({
    value: cust.id.toString(),
    label: `${cust.name} (${cust.phone})`,
  })) || [];

  // If forcedCustomer is provided, add it to options if not already present
  const finalCustomerOptions = forcedCustomer 
    ? [
        ...customerOptions.filter(opt => opt.value !== forcedCustomer.id.toString()),
        {
          value: forcedCustomer.id.toString(),
          label: `${forcedCustomer.name} (${forcedCustomer.phone})`,
        }
      ]
    : customerOptions;

  React.useEffect(() => {
    if (!selectedCustomerId && !disabled && customersResponse?.data) {
      const defaultCustomer = customersResponse.data.find(c => c.is_default);
      if (defaultCustomer) {
        onCustomerSelected(defaultCustomer.id.toString());
      }
    }
  }, [selectedCustomerId, disabled, customersResponse, onCustomerSelected]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        {isLoadingCustomers ? (
          <Skeleton className="h-10 flex-grow" />
        ) : (
          <div className={`${!selectedCustomerId && !disabled ? 'ring-2 ring-red-500 rounded-md' : ''}`}>
            <Combobox
              options={finalCustomerOptions}
              value={forcedCustomer ? forcedCustomer.id.toString() : (selectedCustomerId || "")}
              onChange={disabled ? undefined : onCustomerSelected}
              placeholder={t("selectOrSearchCustomer", {
                ns: "customers",
              })}
              searchPlaceholder={t("searchCustomerByNameOrPhone", {
                ns: "customers",
                defaultValue: "Search by name or phone...",
              })}
              emptyResultText={t("noCustomerFound", { ns: "customers" })}
              disabled={disabled || isLoadingCustomers || finalCustomerOptions.length === 0}
            />
          </div>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={onNewCustomerClick || (() => navigate("/customers/new"))}
          title={t("createNewCustomer", { ns: "customers" })}
          disabled={disabled}
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}; 