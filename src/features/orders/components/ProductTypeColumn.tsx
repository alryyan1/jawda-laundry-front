// src/features/orders/components/ProductTypeColumn.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import type { ProductType } from "@/types";
import { getAllProductTypes } from "@/api/productTypeService";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Coffee, Package } from "lucide-react"; // Package is a good generic icon

interface ProductTypeColumnProps {
  selectedCategoryId: string | null;
  selectedProductTypeId: string | null;
  onSelectProductType: (productType: ProductType) => void;
}

export const ProductTypeColumn: React.FC<ProductTypeColumnProps> = ({
  selectedCategoryId,
  selectedProductTypeId,
  onSelectProductType,
}) => {
  const { t } = useTranslation(["services", "common"]);

  // Fetch product types based on the selected category ID
  const { data: products = [], isLoading } = useQuery<ProductType[], Error>({
    queryKey: ["allProductTypesForSelect", selectedCategoryId], // Query key includes the category ID
    queryFn: () => getAllProductTypes(selectedCategoryId!), // Pass the ID to the API service
    enabled: !!selectedCategoryId, // IMPORTANT: Only run this query if a category is actually selected
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return (
    <div className="flex flex-col h-full bg-muted/50 border-r dark:bg-muted/30">
      <header className="p-4 text-lg font-semibold border-b shrink-0 flex items-center gap-2">
        <Package className="h-5 w-5" />
        {t("productTypesTitle", { ns: "services" })}
      </header>
      <ScrollArea className="flex-grow">
        <div className="p-4">
          {isLoading ? (
            // Skeleton loader for when products are being fetched
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : !selectedCategoryId ? (
            // Message when no category is selected
            <div className="flex items-center justify-center text-center text-muted-foreground min-h-[200px]">
              <p className="max-w-[200px]">
                {t("selectCategoryToViewProducts", { ns: "services" })}
              </p>
            </div>
          ) : products.length === 0 ? (
            // Message when a category is selected but has no products
            <div className="flex items-center justify-center text-center text-muted-foreground min-h-[200px]">
              <p>{t("noProductsInCategory", { ns: "services" })}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card
                  key={product.id}
                  onClick={() => onSelectProductType(product)}
                  className={cn(
                    "cursor-pointer hover:border-primary transition-all duration-200 ease-in-out transform hover:scale-105",
                    selectedProductTypeId === product.id.toString()
                      ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "border-border"
                  )}
                  aria-pressed={selectedProductTypeId === product.id.toString()}
                >
                  <CardContent className="p-2 flex flex-col items-center justify-center gap-2 aspect-square">
                    <Avatar className="h-12 w-12 rounded-md">
                      <AvatarImage
                        src={product.image_url || undefined}
                        alt={product.name}
                      />
                      <AvatarFallback className="rounded-md bg-secondary">
                        <Coffee className="h-6 w-6 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs sm:text-sm font-medium text-center leading-tight">
                      {product.name}
                    </p>
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
