// src/features/orders/components/ServiceOfferingColumn.tsx
import React from "react"; // Removed useState, useEffect
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import type { ServiceOffering, ProductType } from "@/types";
import { getAllServiceOfferingsForSelect } from "@/api/serviceOfferingService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
// Checkbox is no longer needed
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Tag, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface ServiceOfferingColumnProps {
  selectedProductType: ProductType | null;
  onAddItemToCart: (offeringId: string) => void; // Changed to handle a single item
  onBack: () => void;
  // Edit mode props can be removed if edit is handled differently, or kept for consistency
  isEditing?: boolean;
}

export const ServiceOfferingColumn: React.FC<ServiceOfferingColumnProps> = ({
  selectedProductType,
  onAddItemToCart,
  onBack,
}) => {
  const { t, i18n } = useTranslation(["services", "common", "orders"]);

  const selectedProductTypeId = selectedProductType?.id || null;

  const { data: offerings = [], isLoading } = useQuery<
    ServiceOffering[],
    Error
  >({
    queryKey: ["allServiceOfferingsForSelect", selectedProductTypeId],
    queryFn: () => getAllServiceOfferingsForSelect(selectedProductTypeId!),
    enabled: !!selectedProductTypeId,
    staleTime: 1 * 60 * 1000,
  });

  const getPriceDisplay = (offering: ServiceOffering): string => {
    // We now get is_dimension_based from the prop, not the offering's nested type
    if (selectedProductType?.is_dimension_based) {
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
            {t("step4_selectServices", { ns: "orders" })}
            <span className="text-primary ml-1 rtl:mr-1">
              {selectedProductType?.name}
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("clickServiceToAdd", {
              ns: "orders",
              defaultValue: "Click a service to add it to the order.",
            })}
          </p>
        </div>
      </header>
      <div className="flex-grow">
        <ScrollArea className="h-[calc(100vh-150px)]">
          {" "}
          {/* Adjusted height */}
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
              <div className="space-y-3">
                {offerings.map((offering) => (
                  <button
                    key={offering.id}
                    onClick={() => onAddItemToCart(offering.id.toString())}
                    className="w-full text-left rtl:text-right p-3 rounded-lg border bg-background hover:border-primary/50 hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm block">
                        {offering.display_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getPriceDisplay(offering)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      {/* Footer with "Add Selected" button is now removed */}
    </div>
  );
};
