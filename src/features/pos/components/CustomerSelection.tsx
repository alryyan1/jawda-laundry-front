import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Combobox } from "@/components/ui/combobox";
import type { ComboboxOption } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { UserPlus, AlertCircle } from "lucide-react";

import type { Customer, PaginatedResponse, Order } from "@/types";
import { getCustomers } from "@/api/customerService";
import { updateOrderDetails } from "@/api/orderService";
import { getTodayDate } from "@/lib/dateUtils";

interface CustomerSelectionProps {
  selectedCustomerId: string | null;
  onCustomerSelected: (customerId: string) => void;
  onNewCustomerClick?: () => void;
  disabled?: boolean;
  forcedCustomer?: Customer | null;
  selectedOrder?: Order | null;
  onOrderUpdate?: (updatedOrder: Order) => void;
}

export const CustomerSelection: React.FC<CustomerSelectionProps> = ({
  selectedCustomerId,
  onCustomerSelected,
  onNewCustomerClick,
  disabled = false,
  forcedCustomer = null,
  selectedOrder = null,
  onOrderUpdate,
}) => {
  const { t } = useTranslation(["common", "orders", "customers"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAnimation, setShowAnimation] = useState(false);

  const { data: customersResponse, isLoading: isLoadingCustomers } = useQuery<
    PaginatedResponse<Customer>,
    Error
  >({
    queryKey: ["customersForSelect"],
    queryFn: () => getCustomers(1, 1000),
    staleTime: 5 * 60 * 1000,
  });

  // Mutation to update order customer
  const updateOrderCustomerMutation = useMutation({
    mutationFn: async ({ orderId, customerId }: { orderId: number; customerId: string }) => {
      return await updateOrderDetails(orderId, {
        customer_id: parseInt(customerId, 10),
      });
    },
    onSuccess: (updatedOrder) => {
      toast.success(t("customerUpdatedSuccessfully", { 
        ns: "orders", 
        defaultValue: "Customer updated successfully" 
      }));
      onOrderUpdate?.(updatedOrder);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["todayOrders", getTodayDate()] });
    },
    onError: (error) => {
      console.error('Failed to update order customer:', error);
      toast.error(t("failedToUpdateCustomer", { 
        ns: "orders", 
        defaultValue: "Failed to update customer" 
      }));
    },
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

  // Show animation when order has no customer or when in new order mode
  useEffect(() => {
    if ((selectedOrder && !selectedOrder.customer && !disabled) || 
        (!selectedCustomerId && selectedOrder && !disabled)) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowAnimation(false);
    }
  }, [selectedOrder, selectedCustomerId, disabled]);

  // Handle customer selection
  const handleCustomerSelect = (customerId: string) => {
    onCustomerSelected(customerId);
    
    // If we have a selected order without a customer, update it in the backend
    if (selectedOrder && !selectedOrder.customer) {
      updateOrderCustomerMutation.mutate({
        orderId: selectedOrder.id,
        customerId: customerId,
      });
    }
  };



  // Determine if we should show the animation
  const shouldShowAnimation = showAnimation && selectedOrder && (!selectedOrder.customer || !selectedCustomerId);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {isLoadingCustomers ? (
          <Skeleton className="h-10 flex-grow" />
        ) : (
          <div className={`relative flex-grow ${shouldShowAnimation ? 'animate-pulse' : ''}`}>
            {shouldShowAnimation && (
              <div className="absolute -top-8 left-0 right-0 flex items-center justify-center">
                <div className="bg-yellow-500 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1 animate-bounce">
                  <AlertCircle className="h-3 w-3" />
                  {t("selectCustomerForOrder", { 
                    ns: "orders", 
                    defaultValue: "Select customer for this order" 
                  })}
                </div>
              </div>
            )}
            <div className={`${shouldShowAnimation ? 'ring-2 ring-yellow-500 ring-opacity-50' : ''} ${!selectedCustomerId && !disabled && !selectedOrder?.customer ? 'ring-2 ring-red-500' : ''} rounded-md transition-all duration-300`}>
              <Combobox
                options={finalCustomerOptions}
                value={forcedCustomer ? forcedCustomer.id.toString() : (selectedCustomerId || "")}
                onChange={disabled ? () => {} : handleCustomerSelect}
                placeholder={shouldShowAnimation 
                  ? t("selectCustomerRequired", { ns: "orders", defaultValue: "Select customer (required)" })
                  : t("selectOrSearchCustomer", { ns: "customers" })
                }
                searchPlaceholder={t("searchCustomerByNameOrPhone", {
                  ns: "customers",
                  defaultValue: "Search by name or phone...",
                })}
                emptyResultText={t("noCustomerFound", { ns: "customers" })}
                disabled={disabled || isLoadingCustomers || finalCustomerOptions.length === 0 || updateOrderCustomerMutation.isPending}
              />
            </div>
          </div>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={onNewCustomerClick || (() => navigate("/customers/new"))}
          title={t("createNewCustomer", { ns: "customers" })}
          disabled={disabled || updateOrderCustomerMutation.isPending}
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Show loading state when updating order customer */}
      {updateOrderCustomerMutation.isPending && (
        <div className="text-xs text-muted-foreground animate-pulse">
          {t("updatingCustomer", { ns: "orders", defaultValue: "Updating customer..." })}
        </div>
      )}
    </div>
  );
}; 