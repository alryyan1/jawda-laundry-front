import React from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

// MUI imports for order ID display
import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles";

import { useTheme } from "@/context/ThemeContext";

import type { Order } from "@/types";
import { CustomerSelection } from "./CustomerSelection";
import { updateOrderType } from "@/api/orderService";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, Tags } from "lucide-react";

interface POSHeaderProps {
  selectedCustomerId: string | null;
  onCustomerSelected: (customerId: string | null) => void;
  onNewCustomerClick: () => void;
  selectedOrder: Order | null;
  onCalculatorClick: () => void;
  onOrderSelect: (order: Order | null) => void;
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string) => void;
  isNewOrderMode: boolean;
  onOrderUpdate?: (updatedOrder: Order) => void;
  // Add missing props for order type and table selection
  orderType?: "in_house" | "take_away" | "delivery";
  onOrderTypeChange?: (
    orderType: "in_house" | "take_away" | "delivery"
  ) => void;
  // selectedTableId?: string | null;
  onTableIdChange?: (tableId: string) => void;
  // isProcessing?: boolean;
  // diningTables?: Array<{
  //   id: number;
  //   name: string;
  //   capacity: number;
  //   status: string;
  // }>;
  // todayOrders?: Order[];
}

export const POSHeader: React.FC<POSHeaderProps> = ({
  selectedCustomerId,
  onCustomerSelected,
  onNewCustomerClick,
  selectedOrder,
  onCalculatorClick,
  onOrderSelect,
  selectedCategoryId,
  onCategorySelect,
  isNewOrderMode,
  onOrderUpdate,
  orderType = "in_house",
  onOrderTypeChange,
  // selectedTableId,
  onTableIdChange,
  // isProcessing = false,
  // diningTables = [],
  // todayOrders = [],
}) => {
  const { t } = useTranslation(["common", "orders", "dining"]);
  const { getSecondaryColor } = useTheme();

  // MUI theme for order ID display
  const muiTheme = createTheme({
    palette: {
      primary: {
        main: getSecondaryColor(),
      },
      secondary: {
        main: "#1976d2",
      },
    },
    typography: {
      h4: {
        fontWeight: 700,
        fontSize: "2rem",
      },
    },
  });

  // Mutation for updating order type
  const updateOrderTypeMutation = useMutation<
    Order,
    Error,
    {
      orderId: string | number;
      orderType: "in_house" | "take_away" | "delivery";
    }
  >({
    mutationFn: ({ orderId, orderType }) => updateOrderType(orderId, orderType),
    onSuccess: async (updatedOrder) => {
      toast.success(
        t("orderTypeUpdatedSuccess", {
          ns: "orders",
          defaultValue: "Order type updated successfully",
        })
      );

      // Update the selected order if it's the same one
      if (selectedOrder && selectedOrder.id === updatedOrder.id) {
        onOrderSelect(updatedOrder);
      }
    },
    onError: (error) => {
      toast.error(
        error.message ||
          t("orderTypeUpdateFailed", {
            ns: "orders",
            defaultValue: "Failed to update order type",
          })
      );
    },
  });

  // Mutation for sending WhatsApp invoice - commented out since not used
  // const sendWhatsAppInvoiceMutation = useMutation<
  //   { message: string },
  //   Error,
  //   string | number
  // >({
  //   mutationFn: (orderId) => sendOrderWhatsAppInvoice(orderId),
  //   onSuccess: (data) => {
  //     toast.success(t("whatsappInvoiceSentSuccess", { ns: "orders" }), {
  //       description: data.message
  //     });
  //   },
  //   onError: (error: Error) => {
  //     // Extract detailed error message from backend response
  //     const errorMessage = (error as any)?.response?.data?.details ||
  //                         (error as any)?.response?.data?.message ||
  //                         error?.message ||
  //                         t("whatsappInvoiceSendFailed", { ns: "orders" });
  //
  //     toast.error(t("whatsappInvoiceSendFailed", { ns: "orders" }), {
  //       description: errorMessage
  //     });
  //   },
  // });

  const handleOrderTypeChange = (
    newOrderType: "in_house" | "take_away" | "delivery"
  ) => {
    if (selectedOrder && newOrderType !== selectedOrder.order_type) {
      updateOrderTypeMutation.mutate({
        orderId: selectedOrder.id,
        orderType: newOrderType,
      });
    }
  };

  return (
    <MuiThemeProvider theme={muiTheme}>
      <div className="border-b shadow-sm flex-shrink-0 p-1">
        <div className="p-1 ">
         <div className="flex justify-between items-center ">
         <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* All Categories Button */}
            <Button
              size="sm"
              variant={
                selectedCategoryId === "" || !selectedCategoryId
                  ? "default"
                  : "outline"
              }
              onClick={() => onCategorySelect("")}
              style={{
                backgroundColor:
                  selectedCategoryId === "" || !selectedCategoryId
                    ? getSecondaryColor()
                    : "transparent",
                borderColor: getSecondaryColor(300),
                color:
                  selectedCategoryId === "" || !selectedCategoryId
                    ? "white"
                    : getSecondaryColor(),
              }}
              className="hover:opacity-90 transition-opacity h-7 px-2"
              title={t("allCategories", { ns: "common" })}
            >
              <Tags className="h-3 w-3" />
              <span className="hidden sm:inline ml-1">
                {t("allCategories", { ns: "common" })}
              </span>
            </Button>

            {/* Order ID Display - Show when there's a selected order */}
            {selectedOrder && (
              <div className="bg-secondary p-1  text-bold border rounded-lg">
                #{selectedOrder.id}
              </div>
            )}

            {/* Show CustomerSelection when there's a selected order OR when we're in new order mode */}
            {(selectedOrder || isNewOrderMode) && (
              <CustomerSelection
                selectedCustomerId={selectedCustomerId}
                onCustomerSelected={onCustomerSelected}
                onNewCustomerClick={onNewCustomerClick}
                forcedCustomer={selectedOrder?.customer || null}
                selectedOrder={selectedOrder}
                onOrderUpdate={onOrderUpdate}
              />
            )}

            {/* Order Type Selection */}
            {selectedOrder && (
              <Select
                value={selectedOrder ? selectedOrder.order_type : orderType}
                onValueChange={(
                  newOrderType: "in_house" | "take_away" | "delivery"
                ) => {
                  if (selectedOrder) {
                    handleOrderTypeChange(newOrderType);
                  } else {
                    onOrderTypeChange?.(newOrderType);
                  }
                  onTableIdChange?.(" "); // Reset table selection when order type changes
                }}
              >
                <SelectTrigger className="w-20 sm:w-28 h-7">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_house">
                    {t("inHouse", { ns: "orders", defaultValue: "In House" })}
                  </SelectItem>
                  <SelectItem value="take_away">
                    {t("takeAway", { ns: "orders", defaultValue: "Take Away" })}
                  </SelectItem>
                  <SelectItem value="delivery">
                    {t("delivery", { ns: "orders", defaultValue: "Delivery" })}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Table Selection
          {selectedOrder && (
           
              <Select
                value={selectedTableId || ''}
                onValueChange={(tableId) => onTableIdChange?.(tableId || ' ')}
                disabled={isProcessing}
              >
                <SelectTrigger 
                  className="w-20 sm:w-28 h-7"
                >
                  <SelectValue placeholder={t("selectSection", { ns: "dining", defaultValue: "Select Section" })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">{t("noTable", { ns: "dining", defaultValue: "No Table" })}</SelectItem>
                  {diningTables
                    .filter(table => {
                      // Only show tables that are available or reserved
                      const isStatusAvailable = table.status === 'available' || table.status === 'reserved';
                      
                      // Check if this table has any incomplete orders
                      const hasIncompleteOrders = todayOrders.some((order: Order) => 
                        order.table_id === table.id && 
                        order.status !== 'completed' && 
                        order.status !== 'cancelled'
                      );
                      
                      return isStatusAvailable && !hasIncompleteOrders;
                    })
                    .map((table) => (
                      <SelectItem key={table.id} value={table.id.toString()}>
                        {table.name} ({table.capacity} {t("seats", { ns: "dining", defaultValue: "seats" })})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
          )}  */}
       
          </div>
          <Button
              size="sm"
              onClick={onCalculatorClick}
              style={{
                backgroundColor: getSecondaryColor(),
                borderColor: getSecondaryColor(700),
                color: "white",
              }}
              className="hover:opacity-90 transition-opacity h-7 px-2"
            >
              <Calculator className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">
                {t("calculator", { ns: "common", defaultValue: "Calculator" })}
              </span>
            </Button>
         </div>

          {/* Calculator Button - Always visible */}
        </div>
      </div>
    </MuiThemeProvider>
  );
};
