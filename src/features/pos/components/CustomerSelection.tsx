import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

// MUI imports
import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { UserPlus, AlertCircle } from "lucide-react";

import type { Customer, PaginatedResponse, Order } from "@/types";
import { getCustomers } from "@/api/customerService";

import { useTheme } from "@/context/ThemeContext";

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
  console.log(disabled, "disabled");
  const { t } = useTranslation(["common", "orders", "customers"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getSecondaryColor } = useTheme();
  const [showAnimation, setShowAnimation] = useState(false);

  const { data: customersResponse, isLoading: isLoadingCustomers } = useQuery<
    PaginatedResponse<Customer>,
    Error
  >({
    queryKey: ["customersForSelect"],
    queryFn: () => getCustomers(1, 1000),
    staleTime: 5 * 60 * 1000,
  });

  // Check if order has items (to determine if customer can be changed)
  const orderHasItems =
    selectedOrder && selectedOrder.items && selectedOrder.items.length > 0;
  // Previously restricted changing customer if orderHasItems. Now removed per user request.

  // MUI theme
  const muiTheme = createTheme({
    palette: {
      primary: {
        main: getSecondaryColor(),
      },
    },
  });

  // Show animation when order has no customer or when in new order mode
  useEffect(() => {
    if (
      (selectedOrder && !selectedOrder.customer && !disabled) ||
      (!selectedCustomerId && selectedOrder && !disabled)
    ) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowAnimation(false);
    }
  }, [selectedOrder, selectedCustomerId, disabled]);

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer | null) => {
    if (!customer) {
      onCustomerSelected("");
      return;
    }

    onCustomerSelected(customer.id.toString());
  };

  // Get current selected customer
  const getCurrentCustomer = () => {
    if (forcedCustomer) return forcedCustomer;
    if (!selectedCustomerId) return null;
    return (
      customersResponse?.data.find(
        (cust) => cust.id.toString() === selectedCustomerId,
      ) || null
    );
  };

  // Determine if we should show the animation
  const shouldShowAnimation =
    showAnimation &&
    selectedOrder &&
    (!selectedOrder.customer || !selectedCustomerId);

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {isLoadingCustomers ? (
            <Skeleton className="h-10 flex-grow" />
          ) : (
            <div
              className={`relative flex-grow ${shouldShowAnimation ? "animate-pulse" : ""}`}
            >
              {shouldShowAnimation && (
                <div className="absolute -top-8 left-0 right-0 flex items-center justify-center">
                  <div className="bg-yellow-500 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1 animate-bounce">
                    <AlertCircle className="h-3 w-3" />
                    {t("selectCustomerForOrder", {
                      ns: "orders",
                      defaultValue: "Select customer for this order",
                    })}
                  </div>
                </div>
              )}
              <div
                className={`${shouldShowAnimation ? "ring-2 ring-yellow-500 ring-opacity-50" : ""} ${!selectedCustomerId && !disabled && !selectedOrder?.customer ? "ring-2 ring-red-500" : ""} rounded-md transition-all duration-300`}
              >
                <Autocomplete
                  options={customersResponse?.data || []}
                  getOptionLabel={(option) =>
                    `${option.name} (${option.phone})`
                  }
                  value={getCurrentCustomer()}
                  onChange={(_, newValue) => {
                    if (!disabled) {
                      handleCustomerSelect(newValue);
                    }
                  }}
                  sx={{ minWidth: "400px" }}
                  filterOptions={(options, { inputValue }) => {
                    const searchTerm = inputValue.toLowerCase();
                    return options.filter(
                      (option) =>
                        option.name.toLowerCase().includes(searchTerm) ||
                        option.phone.toLowerCase().includes(searchTerm),
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={
                        shouldShowAnimation
                          ? t("selectCustomerRequired", {
                              ns: "orders",
                              defaultValue: "Select customer (required)",
                            })
                          : t("selectOrSearchCustomer", { ns: "customers" })
                      }
                      disabled={disabled}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingCustomers ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <div>
                        <div className="font-medium">{option.name}</div>
                        <div className="text-sm text-gray-500">
                          {option.phone}
                        </div>
                      </div>
                    </li>
                  )}
                  noOptionsText={t("noCustomerFound", { ns: "customers" })}
                  loading={isLoadingCustomers}
                  loadingText={t("loading", { ns: "common" })}
                />
              </div>
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

        {/* Show loading state when updating order customer */}
      </div>
    </ThemeProvider>
  );
};
