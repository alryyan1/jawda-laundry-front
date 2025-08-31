import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// MUI imports
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { UserPlus, AlertCircle } from "lucide-react";

import type { Customer, PaginatedResponse, Order } from "@/types";
import { getCustomers } from "@/api/customerService";
import { updateOrderDetails } from "@/api/orderService";
import { useTheme } from "@/context/ThemeContext";

interface CustomerSelectionProps {
  selectedCustomerId: string | null;
  onCustomerSelected: (customerId: string) => void;
  onNewCustomerClick?: () => void;
  forcedCustomer?: Customer | null;
  selectedOrder?: Order | null;
  onOrderUpdate?: (updatedOrder: Order) => void;
  preventCustomerUpdates?: boolean; // Add prop to prevent customer updates
}

export const CustomerSelection: React.FC<CustomerSelectionProps> = ({
  selectedCustomerId,
  onCustomerSelected,
  onNewCustomerClick,
  forcedCustomer = null,
  selectedOrder = null,
  onOrderUpdate,
  preventCustomerUpdates = false, // Default to false for backward compatibility
}) => {
  const { t } = useTranslation(["common", "orders", "customers"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getSecondaryColor } = useTheme();
  const [isDark, setIsDark] = useState(false);
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
      // queryClient.invalidateQueries({ queryKey: ["orders"] });
      // queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
    },
    onError: (error) => {
      console.error('Failed to update order customer:', error);
      toast.error(t("failedToUpdateCustomer", { 
        ns: "orders", 
        defaultValue: "Failed to update customer" 
      }));
    },
  });



  // Detect tailwind dark mode class and sync to MUI
  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains('dark'));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // MUI theme
  const muiTheme = createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: getSecondaryColor(),
      },
    },
  });

  // Auto-select default customer when no customer is selected
  useEffect(() => {
    if (!selectedCustomerId && customersResponse?.data) {
      const defaultCustomer = customersResponse.data.find(customer => customer.is_default);
      if (defaultCustomer) {
        onCustomerSelected(defaultCustomer.id.toString());
        
        // If we have a selected order without a customer, update it in the backend
        // BUT only if customer updates are not prevented
        if (selectedOrder && !selectedOrder.customer && !preventCustomerUpdates) {
          updateOrderCustomerMutation.mutate({
            orderId: selectedOrder.id,
            customerId: defaultCustomer.id.toString(),
          });
        }
      }
    }
  }, [selectedCustomerId, customersResponse?.data, selectedOrder, onCustomerSelected, updateOrderCustomerMutation, preventCustomerUpdates]);

  // Handle when a new customer is created and should be selected
  useEffect(() => {
    if (selectedCustomerId && customersResponse?.data) {
      // Check if the selected customer exists in the current data
      const customerExists = customersResponse.data.find(customer => customer.id.toString() === selectedCustomerId);
      
      // If customer doesn't exist in current data but we have a selectedCustomerId,
      // it might be a newly created customer that hasn't been fetched yet
      if (!customerExists && selectedCustomerId) {
        // Invalidate and refetch customers to get the latest data including the new customer
        queryClient.invalidateQueries({ queryKey: ["customersForSelect"] });
      }
    }
  }, [selectedCustomerId, customersResponse?.data, queryClient]);

  // Show animation when order has no customer and no default customer is available
  useEffect(() => {
    if (selectedOrder && !selectedOrder.customer && !selectedCustomerId) {
      // Check if there's a default customer available
      const hasDefaultCustomer = customersResponse?.data?.some(customer => customer.is_default);
      if (!hasDefaultCustomer) {
        setShowAnimation(true);
        const timer = setTimeout(() => setShowAnimation(false), 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setShowAnimation(false);
    }
  }, [selectedOrder, selectedCustomerId, customersResponse?.data]);

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer | null) => {
    if (!customer) {
      onCustomerSelected("");
      return;
    }
    
    onCustomerSelected(customer.id.toString());
    
    // If we have a selected order, update it in the backend (allow changing customer)
    // BUT only if customer updates are not prevented
    if (selectedOrder && !preventCustomerUpdates) {
      updateOrderCustomerMutation.mutate({
        orderId: selectedOrder.id,
        customerId: customer.id.toString(),
      });
    }
  };

  // Get current selected customer
  const getCurrentCustomer = () => {
    if (forcedCustomer) return forcedCustomer;
    if (!selectedCustomerId) return null;
    
    // First try to find the customer in the current data
    const customer = customersResponse?.data.find(cust => cust.id.toString() === selectedCustomerId);
    if (customer) return customer;
    
    // If customer not found in current data but we have selectedCustomerId,
    // it might be a newly created customer that hasn't been fetched yet
    // Return a temporary customer object to show the selection
    if (selectedCustomerId && customersResponse?.data) {
      // This is a fallback - the customer should be fetched soon
      return {
        id: parseInt(selectedCustomerId, 10),
        name: `Customer #${selectedCustomerId}`,
        phone: '',
        email: null,
        address: null,
        notes: null,
        customer_type_id: null,
        user_id: null,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        registered_date: new Date().toISOString(),
        customerType: undefined,
      } as unknown as Customer;
    }
    
    return null;
  };

  // Determine if we should show the animation
  const shouldShowAnimation = showAnimation && selectedOrder && (!selectedOrder.customer || !selectedCustomerId);

  return (
    <ThemeProvider theme={muiTheme}>
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
              <div className={`${shouldShowAnimation ? 'ring-2 ring-yellow-500 ring-opacity-50' : ''} ${!selectedCustomerId && !selectedOrder?.customer && !customersResponse?.data?.some(c => c.is_default) ? 'ring-2 ring-red-500' : ''} rounded-md transition-all duration-300`}>
                <Autocomplete
                  options={customersResponse?.data || []}
                  getOptionLabel={(option) => `${option.name} (${option.phone || 'No phone'}) - ${option.car_plate_number}`}
                  value={getCurrentCustomer()}
                  onChange={(_, newValue) => {
                    handleCustomerSelect(newValue);
                  }}
                  sx={
                    { minWidth: '200px' }
                  }
                  slotProps={{
                    paper: {
                      sx: {
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        border: '1px solid',
                        borderColor: 'divider',
                      },
                    },
                    listbox: { sx: { bgcolor: 'background.paper' } },
                    popper: { sx: { zIndex: (theme) => theme.zIndex.modal } },
                  }}
                  filterOptions={(options, { inputValue }) => {
                    const searchTerm = inputValue.toLowerCase();
                    return options.filter(option => 
                      option.name.toLowerCase().includes(searchTerm) ||
                      (option.phone && option.phone.toLowerCase().includes(searchTerm)) ||
                      option.car_plate_number.toLowerCase().includes(searchTerm)
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={shouldShowAnimation 
                        ? t("selectCustomerRequired", { ns: "orders", defaultValue: "Select customer (required)" })
                        : selectedCustomerId 
                          ? t("changeCustomer", { ns: "customers", defaultValue: "Change customer" })
                          : t("selectOrSearchCustomer", { ns: "customers" })
                      }
                      disabled={updateOrderCustomerMutation.isPending}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'background.paper',
                          color: 'text.primary',
                          '& fieldset': { borderColor: 'divider' },
                          '&:hover fieldset': { borderColor: 'primary.main' },
                          '&.Mui-focused fieldset': { borderColor: 'primary.main', boxShadow: (theme) => `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 3px` },
                        },
                        '& .MuiInputLabel-root': { color: 'text.secondary' },
                      }}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingCustomers ? <CircularProgress color="inherit" size={20} /> : null}
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
                          {option.phone || 'No phone'} - {option.car_plate_number}
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
            disabled={updateOrderCustomerMutation.isPending}
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
    </ThemeProvider>
  );
}; 