import React from "react";
import { useTranslation } from "react-i18next";

import type { Order } from "@/types";
import { CustomerSelection } from "./CustomerSelection";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Tags,
  Printer,
  Hash,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { clearServiceOfferingsCache } from "@/api/serviceOfferingService";

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
  onOrderSelect,
  selectedCategoryId,
  onCategorySelect,
  isNewOrderMode,
  onOrderUpdate,
}) => {
  const { t } = useTranslation(["common", "orders"]);

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

          {/* New Order Button (Local Reset) */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOrderSelect(null)}
            className="h-9 px-3 gap-2 font-medium text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("newOrder", { ns: "orders", defaultValue: "New Order" })}
            </span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              clearServiceOfferingsCache();
              toast.success(
                t("cacheCleared", {
                  ns: "common",
                  defaultValue: "Cache cleared successfully",
                }),
              );
              window.location.reload(); // Reload to fetch fresh data
            }}
            className="h-9 px-3 gap-2 font-medium text-slate-600 border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
            title="Clear Service Offerings Cache"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("refresh", { ns: "common", defaultValue: "Refresh" })}
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

        {selectedOrder && (
          <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 rounded-lg border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md border border-blue-400/30">
                <Hash className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t("order", { ns: "orders", defaultValue: "Order" })}
                </span>
                <span className="font-bold text-lg text-slate-900 leading-tight">
                  #{selectedOrder.id}
                </span>
              </div>
            </div>
         
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
