import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

import { CheckCircle, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useSettings } from "@/context/SettingsContext";
import type { Order } from "@/types";

interface OrderSuccessComponentProps {
  order: Order;
  onCreateNewOrder: () => void;
  onCancel?: () => void;
}

export const OrderSuccessComponent: React.FC<OrderSuccessComponentProps> = ({
  order,
  onCreateNewOrder,
  onCancel,
}) => {
  const { t, i18n } = useTranslation(["common", "orders"]);
  const { getSetting } = useSettings();
  
  // Get currency from settings, fallback to USD
  const currency = getSetting('currency_symbol', 'USD');

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {/* Success Animation */}
      <div className="mb-8">
        <div className="relative">
          <CheckCircle className="w-24 h-24 text-green-500 animate-bounce" />
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
        </div>
      </div>

      {/* Success Message */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-green-700 mb-2">
          {t("orderCompletedSuccessfully", { ns: "orders", defaultValue: "Order Completed!" })}
        </h2>
        <p className="text-muted-foreground">
          {t("orderHasBeenCompleted", { ns: "orders", defaultValue: "Your order has been completed successfully" })}
        </p>
      </div>

      {/* Order Details Card */}
      <div className="w-full max-w-md mb-8 border rounded-lg bg-card">
        <div className="p-6">
          <div className="space-y-4">
            {/* Order Number */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">
                {t("orderNumber", { ns: "orders", defaultValue: "Order Number" })}
              </div>
              <div className="text-xl font-bold text-primary">
                {order.category_sequences_string || order.daily_order_number?.toString() || order.order_number}
              </div>
            </div>

            {/* Customer Name */}
            {order.customer && (
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  {t("customer", { ns: "common", defaultValue: "Customer" })}
                </div>
                <div className="text-lg font-semibold">
                  {order.customer.name}
                </div>
              </div>
            )}

            {/* Total Amount */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">
                {t("totalAmount", { ns: "orders", defaultValue: "Total Amount" })}
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(order.total_amount || 0, currency, i18n.language, 3)}
              </div>
            </div>

            {/* Items Count */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">
                {t("items", { ns: "common", defaultValue: "Items" })}
              </div>
              <div className="text-lg font-semibold">
                {order.items?.length || 0} {t("item", { ns: "common", defaultValue: "item" })}
                {(order.items?.length || 0) !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create New Order Button */}
      <Button
        size="lg"
        className="w-full max-w-md h-16 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        onClick={onCreateNewOrder}
      >
        <Plus className="w-6 h-6 mr-3" />
        {t("createNewOrder", { ns: "orders", defaultValue: "Create New Order" })}
      </Button>

      {/* Cancel Button - Show only if onCancel is provided */}
      {onCancel && (
        <Button
          size="lg"
          variant="outline"
          className="w-full max-w-md h-12 text-base font-semibold mt-3 border-gray-300 hover:bg-gray-50"
          onClick={onCancel}
        >
          {t("cancel", { ns: "common", defaultValue: "Cancel" })}
        </Button>
      )}

      {/* Additional Info */}
      <div className="mt-6 text-sm text-muted-foreground">
        <p>
          {t("orderReadyForPickup", { ns: "orders", defaultValue: "Order is ready for pickup or delivery" })}
        </p>
      </div>
    </div>
  );
};
