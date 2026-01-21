import React from "react";
import { useTranslation } from "react-i18next";
// import { useMutation } from "@tanstack/react-query";
// import { toast } from "sonner";

// MUI imports for order ID display
import { Card } from "@mui/material";
import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";

import type { Order } from "@/types";
import { CustomerSelection } from "./CustomerSelection";
// import {
//   updateOrderStatus,
//   sendOrderWhatsAppInvoice,
// } from "@/api/orderService";
import { Button } from "@/components/ui/button";
import { Printer, Calculator, Tags } from "lucide-react";

interface POSHeaderProps {
  selectedCustomerId: string | null;
  onCustomerSelected: (customerId: string | null) => void;
  onNewCustomerClick: () => void;
  selectedOrder: Order | null;
  onCalculatorClick: () => void;
  onPdfClick: () => void;
  onOrderSelect: (order: Order | null) => void;
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string) => void;
  isNewOrderMode: boolean;
  onOrderUpdate?: (updatedOrder: Order) => void;
}

export const POSHeader: React.FC<POSHeaderProps> = ({
  selectedCustomerId,
  onCustomerSelected,
  onNewCustomerClick,
  selectedOrder,
  onCalculatorClick,
  onPdfClick,

  selectedCategoryId,
  onCategorySelect,
  isNewOrderMode,
  onOrderUpdate,
}) => {
  const { t } = useTranslation(["common", "orders"]);
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

  // Mutation for updating order status

  // Mutation for sending WhatsApp invoice

  return (
    <MuiThemeProvider theme={muiTheme}>
      <div className="border-b shadow-sm flex-shrink-0 p-1">
        <div className="container mx-auto px-2 py-0 flex justify-between items-center">
          <div className="flex items-center gap-3">
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
            </Button>

            {/* Order ID Display - Show when there's a selected order */}
            {selectedOrder && (
              <Card className="bg-secondary text-white p-2 text-2xl text-bold">
                #{selectedOrder.id}
              </Card>
            )}

            {/* Show CustomerSelection when there's a selected order OR when we're in new order mode */}
            {(selectedOrder || isNewOrderMode) && (
              <CustomerSelection
                selectedCustomerId={selectedCustomerId}
                onCustomerSelected={onCustomerSelected}
                onNewCustomerClick={onNewCustomerClick}
                disabled={!!(selectedOrder && selectedOrder.customer)}
                forcedCustomer={selectedOrder?.customer || null}
                selectedOrder={selectedOrder}
                onOrderUpdate={onOrderUpdate}
              />
            )}

            {/* Order Type Selection - Hidden as requested */}
            {/* {!selectedOrder && (
            <div className="flex items-center gap-1">
              <Label className="text-xs text-white whitespace-nowrap">
                {t("orderType", { ns: "orders", defaultValue: "Order Type" })}:
              </Label>
              <Select
                value={orderType}
                onValueChange={(newOrderType: 'in_house' | 'take_away' | 'delivery') => {
                  onOrderTypeChange(newOrderType);
                  onTableIdChange(' '); // Reset table selection when order type changes
                }}
                disabled={isProcessing}
              >
                <SelectTrigger 
                  className="w-28 h-7"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_house">{t('inHouse', { ns: 'orders', defaultValue: 'In House' })}</SelectItem>
                  <SelectItem value="take_away">{t('takeAway', { ns: 'orders', defaultValue: 'Take Away' })}</SelectItem>
                  <SelectItem value="delivery">{t('delivery', { ns: 'orders', defaultValue: 'Delivery' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )} */}

            {/* Table Selection - Hidden as requested */}
            {/* {!selectedOrder && orderType === 'in_house' && (
            <div className="flex items-center gap-1">
              <Label className="text-xs text-white whitespace-nowrap">
                {t("section", { ns: "dining", defaultValue: "Section" })}:
              </Label>
              <Select
                value={selectedTableId || ''}
                onValueChange={(tableId) => onTableIdChange(tableId || ' ')}
                disabled={isProcessing}
              >
                <SelectTrigger 
                  className="w-28 h-7"
                >
                  <SelectValue placeholder={t("selectSection", { ns: "dining", defaultValue: "Select Section" })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">{t("noSection", { ns: "dining", defaultValue: "No Section" })}</SelectItem>
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
            </div>
          )} */}
          </div>

          {/* Calculator Button - Always visible */}
          <div className="flex items-center gap-2">
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
              {t("calculator", { ns: "common", defaultValue: "Calculator" })}
            </Button>
          </div>

          {/* Order Action Buttons - Only show when an order is selected */}
          {selectedOrder && (
            <div className="flex items-center gap-1">
              {/* Print and Download Buttons */}
              <Button
                size="sm"
                onClick={onPdfClick}
                className="hover:opacity-90 transition-opacity h-7 px-2"
              >
                <Printer className="" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </MuiThemeProvider>
  );
};
