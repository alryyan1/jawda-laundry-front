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
}

export const CustomerSelection: React.FC<CustomerSelectionProps> = ({
  selectedCustomerId,
  onCustomerSelected,
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

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        {isLoadingCustomers ? (
          <Skeleton className="h-10 flex-grow" />
        ) : (
          <Combobox
            options={customerOptions}
            value={selectedCustomerId || ""}
            onChange={onCustomerSelected}
            placeholder={t("selectOrSearchCustomer", {
              ns: "customers",
            })}
            searchPlaceholder={t("searchCustomerByNameOrPhone", {
              ns: "customers",
              defaultValue: "Search by name or phone...",
            })}
            emptyResultText={t("noCustomerFound", { ns: "customers" })}
            disabled={isLoadingCustomers || customerOptions.length === 0}
          />
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/customers/new")}
          title={t("createNewCustomer", { ns: "customers" })}
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}; 