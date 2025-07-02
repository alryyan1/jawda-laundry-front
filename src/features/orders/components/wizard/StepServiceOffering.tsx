// src/features/orders/components/wizard/StepServiceOffering.tsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import type { ServiceOffering, ProductType, OrderItemFormLine } from "@/types";
import { getAllServiceOfferingsForSelect } from "@/api/serviceOfferingService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface StepServiceOfferingProps {
  productType: ProductType;
  onAddItemsToCart: (offeringIds: string[]) => void;
  onBack: () => void;
  // --- Optional props for "Edit Item" mode ---
  isEditing?: boolean;
  itemToEdit?: OrderItemFormLine;
  onItemUpdate?: (updatedItemData: Partial<OrderItemFormLine>) => void;
}

export const StepServiceOffering: React.FC<StepServiceOfferingProps> = ({
  productType,
  onAddItemsToCart,
  onBack,
  isEditing = false,
  itemToEdit,
  onItemUpdate,
}) => {
  const { t, i18n } = useTranslation(["services", "common", "orders"]);
  const [selectedOfferings, setSelectedOfferings] = useState<
    Record<string, boolean>
  >({});

  console.log("productType", productType);
  const { data: offerings = [], isLoading } = useQuery<
    ServiceOffering[],
    Error
  >({
    queryKey: ["allServiceOfferingsForSelect", productType.id],
    queryFn: () => getAllServiceOfferingsForSelect(productType.id),
    enabled: !!productType.id,
    staleTime: 1 * 60 * 1000,
  });

  // Effect to pre-select the checkbox if in edit mode
  useEffect(() => {
    if (isEditing && itemToEdit?._derivedServiceOffering) {
      setSelectedOfferings({ [itemToEdit._derivedServiceOffering.id]: true });
    } else {
      setSelectedOfferings({}); // Clear selection when not editing or productType changes
    }
  }, [isEditing, itemToEdit, productType.id]);

  const handleSelectOffering = (offeringId: string, checked: boolean) => {
    if (isEditing) {
      // In edit mode, allow only one selection to replace the current one
      setSelectedOfferings({ [offeringId]: checked });
    } else {
      // In add mode, allow multiple selections
      setSelectedOfferings((prev) => {
        const newSelection = { ...prev };
        if (checked) newSelection[offeringId] = true;
        else delete newSelection[offeringId];
        return newSelection;
      });
    }
  };

  const handleAddOrUpdateClick = () => {
    const selectedOfferingId = Object.keys(selectedOfferings)[0];
    if (isEditing && onItemUpdate && selectedOfferingId) {
      // When editing, we find the new full offering and pass it up
      const newOffering = offerings.find(
        (o) => o.id.toString() === selectedOfferingId
      );
      if (newOffering) {
        const updatedData: Partial<OrderItemFormLine> = {
          service_action_id: newOffering.service_action_id.toString(),
          _derivedServiceOffering: newOffering,
          _pricingStrategy: newOffering.productType?.is_dimension_based
            ? "dimension_based"
            : "fixed",
          // Reset quotes as price will change
          _quoted_sub_total: null,
          _quoted_price_per_unit_item: null,
        };
        onItemUpdate(updatedData);
      }
    } else if (!isEditing) {
      onAddItemsToCart(Object.keys(selectedOfferings));
    }
    setSelectedOfferings({}); // Clear selection after action
  };

  const getPriceDisplay = (offering: ServiceOffering): string => {
    if (productType.is_dimension_based) {
      return `${formatCurrency(
        offering.default_price_per_sq_meter,
        "USD",
        i18n.language
      )} / ${t("units.sq_meter")}`;
    }
    return formatCurrency(offering.default_price, "USD", i18n.language);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b shrink-0 flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={onBack}
          aria-label={t("goBack")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">
            {isEditing
              ? t("step4_editServices", { ns: "orders" })
              : t("step4_selectServices", { ns: "orders" })}
            <span className="text-primary ml-1 rtl:mr-1">
              {productType.name}
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? t("selectNewServiceHint", {
                  ns: "orders",
                  defaultValue:
                    "Select a new service to replace the current one.",
                })
              : t("selectServicesDescription", { ns: "orders" })}
          </p>
        </div>
      </header>
      <div className="flex-grow">
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : offerings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground min-h-[200px] gap-4">
              <p>{t("noServicesForProduct", { ns: "services" })}</p>
              <Button variant="outline" onClick={onBack}>
                {t("chooseAnotherProduct", { ns: "services" })}
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-320px)]">
              {" "}
              {/* Adjust height based on your layout */}
              <div className="space-y-3 p-1">
                {offerings.map((offering) => (
                  <div
                    key={offering.id}
                    className={cn(
                      "flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg border bg-background transition-colors",
                      "has-[:checked]:bg-primary/10 has-[:checked]:border-primary",
                      isEditing && !selectedOfferings[offering.id]
                        ? "opacity-60"
                        : "hover:border-primary/50" // Dim non-selected in edit mode
                    )}
                    data-state={
                      selectedOfferings[offering.id] ? "checked" : "unchecked"
                    }
                  >
                    <Checkbox
                      id={`offering-${offering.id}`}
                      checked={!!selectedOfferings[offering.id]}
                      onCheckedChange={(checked) =>
                        handleSelectOffering(offering.id.toString(), !!checked)
                      }
                      aria-label={offering.display_name}
                    />
                    <Label
                      htmlFor={`offering-${offering.id}`}
                      className="flex-grow cursor-pointer"
                    >
                      <span className="font-medium text-sm block">
                        {offering.display_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getPriceDisplay(offering)}
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      <div className="p-4 border-t shrink-0 bg-background">
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={handleAddOrUpdateClick}
          disabled={Object.keys(selectedOfferings).length === 0}
        >
          <PlusCircle className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
          {isEditing
            ? t("updateItem", { ns: "orders" })
            : t("addSelectedToOrder", { ns: "orders" })}
        </Button>
      </div>
    </div>
  );
};
