// src/features/pos/components/ProductListColumn.tsx
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import type { ProductType } from "@/types";
import { getAllProductTypes } from "@/api/productTypeService";
import { useDebounce } from "@/hooks/useDebounce";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ProductListColumnProps {
  categoryId: string | null;
  onSelectProduct: (product: ProductType) => void;
  activeProductId?: string | null;
}

export const ProductListColumn: React.FC<ProductListColumnProps> = ({
  categoryId,
  onSelectProduct,
  activeProductId,
}) => {
  const { t } = useTranslation(["services", "common"]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: allProducts = [], isLoading, error } = useQuery<ProductType[], Error>({
    queryKey: ["productTypes"],
    queryFn: () => getAllProductTypes(),
    staleTime: 5 * 60 * 1000,
  });

  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const lowerCaseSearch = debouncedSearchTerm.toLowerCase();
      const matchesSearch = product.name.toLowerCase().includes(lowerCaseSearch) || product.id.toString() === lowerCaseSearch;
      const matchesCategory = !categoryId || product.category?.id.toString() === categoryId;
      return matchesSearch && matchesCategory;
    });
  }, [allProducts, categoryId, debouncedSearchTerm]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-grow h-[calc(100vh-400px)]">
          <div className="p-1 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>{t("errorLoadingProducts", { ns: "services" })}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow h-[calc(100vh-400px)]">
        <div className="p-1">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground min-h-[200px]">
              <Search className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">{t("noProductsFound", { ns: "services" })}</p>
              <p className="text-sm">{t("tryAdjustingSearch", { ns: "services" })}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <TooltipProvider key={product.id} delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onSelectProduct(product)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer",
                          "bg-card hover:bg-card/90",
                          "shadow-sm hover:shadow-md",
                          "border border-border hover:border-primary/50",
                          activeProductId === product.id.toString() && "border-2 border-primary bg-primary/5 shadow-primary/20"
                        )}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-muted-foreground">
                              {product.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-card-foreground truncate">
                              {product.name}
                            </div>
                            {product.category && (
                              <div className="text-xs text-muted-foreground truncate">
                                {product.category.name}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {product.service_offerings_count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {product.service_offerings_count}
                            </Badge>
                          )}
                          {product.is_dimension_based && (
                            <Badge variant="outline" className="text-xs">
                              {t("dimensionBased", { ns: "services" })}
                            </Badge>
                          )}
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-medium">{product.name}</p>
                        {product.category && (
                          <p className="text-muted-foreground">{product.category.name}</p>
                        )}
                        <p className="text-muted-foreground">
                          {t("offeringsCount", { ns: "services", count: product.service_offerings_count })}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}; 