import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import type { ServiceOffering, ProductType } from "@/types";
import { getAllServiceOfferingsForSelect } from "@/api/serviceOfferingService";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/formatters";

interface ServiceOfferingColumnProps {
  productType: ProductType | null;
  onSelectOffering: (offering: ServiceOffering) => void;
  disabled?: boolean;
  disabledMessage?: string;
}

export const ServiceOfferingColumn: React.FC<ServiceOfferingColumnProps> = ({
  productType,
  onSelectOffering,
  disabled = false,
  disabledMessage,
}) => {
  const { t, i18n } = useTranslation(["services", "common", "orders"]);

  const { data: offerings = [], isLoading } = useQuery<ServiceOffering[], Error>({
    queryKey: ["allServiceOfferingsForSelect", productType?.id],
    queryFn: () => getAllServiceOfferingsForSelect(productType?.id || ""),
    enabled: !!productType?.id,
    staleTime: 1 * 60 * 1000,
  });

  const getPriceDisplay = (offering: ServiceOffering): string => {
    if (productType?.is_dimension_based) {
      return `${formatCurrency(
        offering.default_price_per_sq_meter,
        "USD",
        i18n.language
      )} / ${t("units.sq_meter")}`;
    }
    return formatCurrency(offering.default_price, "USD", i18n.language);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow">
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : disabled ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground min-h-[200px] gap-4">
              <p>{disabledMessage || t("selectCustomerFirst", { ns: "orders" })}</p>
            </div>
          ) : offerings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground min-h-[200px] gap-4">
              <p>
                {productType
                  ? t("noServicesForProduct", { ns: "services" })
                  : t("selectProductFirst", { ns: "services" })}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {offerings.map((offering) => (
                <Card
                  key={offering.id}
                  onClick={() => !disabled && onSelectOffering(offering)}
                  className={`transition-all duration-200 group ${
                    disabled 
                      ? "cursor-not-allowed opacity-50" 
                      : "cursor-pointer hover:border-primary"
                  }`}
                  tabIndex={disabled ? -1 : 0}
                  onKeyDown={(e) => {
                    if (!disabled && (e.key === "Enter" || e.key === " "))
                      onSelectOffering(offering);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-medium text-sm">
                        {offering.display_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {getPriceDisplay(offering)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}; 