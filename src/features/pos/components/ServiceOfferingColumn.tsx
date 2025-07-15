import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { UserPlus2 } from "lucide-react";

import type { ServiceOffering, ProductType } from "@/types";
import { getAllServiceOfferingsForSelect } from "@/api/serviceOfferingService";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";

interface ServiceOfferingColumnProps {
  productType: ProductType | null;
  onSelectOffering: (offering: ServiceOffering) => void;
  disabled?: boolean;
  disabledMessage?: string;
  activeOfferingId?: string | null;
}

export const ServiceOfferingColumn: React.FC<ServiceOfferingColumnProps> = ({
  productType,
  onSelectOffering,
  disabled = false,
  disabledMessage,
  activeOfferingId,
}) => {
  const { t, i18n } = useTranslation(["services", "common", "orders"]);
  const { getSetting } = useSettings();
  
  // Get currency from settings, fallback to USD
  const currency = getSetting('currency_symbol', 'USD');

  const { data: offerings = [], isLoading } = useQuery<ServiceOffering[], Error>({
    queryKey: ["allServiceOfferingsForSelect", productType?.id],
    queryFn: () => getAllServiceOfferingsForSelect(productType?.id || ""),
    enabled: !!productType?.id,
  });

  const getPriceDisplay = (offering: ServiceOffering): string => {
    if (productType?.is_dimension_based) {
      return `${formatCurrency(
        offering.default_price_per_sq_meter,
        currency,
        i18n.language
      )} / ${t("units.sq_meter")}`;
    }
    return formatCurrency(offering.default_price, currency, i18n.language);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow h-[calc(100vh-200px)]">
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : disabled ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center h-full text-center min-h-[300px] gap-6 p-4"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <UserPlus2 className="w-8 h-8 text-primary" />
              </motion.div>
              <div className="space-y-2">
                <motion.h3 
                  className="text-lg font-semibold text-primary"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {t("selectCustomerRequired", { ns: "orders", defaultValue: "Customer Selection Required" })}
                </motion.h3>
                <p className="text-muted-foreground text-sm max-w-[250px]">
                  {disabledMessage || t("selectCustomerFirst", { ns: "orders" })}
                </p>
              </div>
            </motion.div>
          ) : offerings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground min-h-[200px] gap-4">
              <p>
                {productType
                  ? t("noServicesForProduct", { ns: "services" })
                  : t("selectProductFirst", { ns: "services" })}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {offerings.map((offering) => (
                <li key={offering.id}>
                  <button
                    onClick={() => !disabled && onSelectOffering(offering)}
                    disabled={disabled}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all duration-200 group",
                      "hover:bg-accent hover:text-accent-foreground",
                      disabled 
                        ? "cursor-not-allowed opacity-50" 
                        : "cursor-pointer hover:border-primary hover:shadow-sm",
                      activeOfferingId === offering.id.toString() && 
                        "border-primary bg-primary/5 shadow-sm"
                    )}
                    tabIndex={disabled ? -1 : 0}
                    onKeyDown={(e) => {
                      if (!disabled && (e.key === "Enter" || e.key === " "))
                        onSelectOffering(offering);
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <h3 className={cn(
                        "font-medium text-sm",
                        activeOfferingId === offering.id.toString() && "text-primary"
                      )}>
                        {offering.display_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {getPriceDisplay(offering)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}; 