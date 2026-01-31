import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";

import type { Order } from "@/types";
import { CustomerSelection } from "./CustomerSelection";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Tags,
  Printer,
  Hash,
  FileText,
  UserPlus,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="border-b bg-white shadow-sm flex-shrink-0 z-20 relative">
      <div className="px-4 h-16 flex justify-between items-center gap-4">
        {/* Left Section: Controls & Customer */}
        <div className="flex items-center gap-3">
          {/* All Categories Filter */}
          <Button
            size="sm"
            variant={!selectedCategoryId ? "default" : "outline"}
            onClick={() => onCategorySelect("")}
            className={`h-9 px-3 gap-2 font-medium transition-all ${
              !selectedCategoryId
                ? "bg-slate-800 hover:bg-slate-700 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 border-slate-200"
            }`}
          >
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("allCategories", { ns: "common" })}
            </span>
          </Button>

          <Separator orientation="vertical" className="h-8 hidden sm:block" />

          {/* Customer Selection */}
          {(selectedOrder || isNewOrderMode) && (
            <div className="flex items-center gap-2">
              <CustomerSelection
                selectedCustomerId={selectedCustomerId}
                onCustomerSelected={onCustomerSelected}
                onNewCustomerClick={onNewCustomerClick}
                disabled={!!selectedOrder?.received}
                forcedCustomer={selectedOrder?.customer || null}
                selectedOrder={selectedOrder}
                onOrderUpdate={onOrderUpdate}
              />
            </div>
          )}
        </div>

        {/* Center Section: Order ID (if selected) */}
        {selectedOrder && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100 shadow-inner">
            <div className="bg-primary/10 p-1 rounded-full">
              <Hash className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-lg text-slate-700">
              {selectedOrder.id}
            </span>
            {selectedOrder.status && (
              <Badge variant="secondary" className="ml-2 capitalize">
                {selectedOrder.status.replace("_", " ")}
              </Badge>
            )}
          </div>
        )}

        {/* Right Section: Tools */}
        <div className="flex items-center gap-2">
          {/* Calculator */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onCalculatorClick}
            className="h-9 px-3 gap-2 text-slate-600 hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <Calculator className="h-4 w-4" />
            <span className="hidden lg:inline font-medium">
              {t("calculator", { ns: "common", defaultValue: "Calculator" })}
            </span>
          </Button>

          {/* New Order / Print Actions */}
          {selectedOrder && (
            <>
              <Separator orientation="vertical" className="h-8 mx-1" />

              <Button
                size="sm"
                variant="outline"
                onClick={onPdfClick}
                className="h-9 w-9 p-0 rounded-full border-slate-200 text-slate-600 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all shadow-sm"
                title="Print Invoice"
              >
                <Printer className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Order ID for mobile (layout shift fallback) */}
          {selectedOrder && (
            <div className="md:hidden ml-2 font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
              #{selectedOrder.id}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
