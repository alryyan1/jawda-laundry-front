// src/features/pos/components/ProductListColumn.tsx
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import type { ProductType } from "@/types";
import { getAllProductTypes } from "@/api/productTypeService";
import { customerProductTypeService } from "@/api/customerProductTypeService";
import type { CustomerProductTypesResponse } from "@/types/customerProductTypes.types";
import { useDebounce } from "@/hooks/useDebounce";

import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Search, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CartItem } from "./CartItem";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductListColumnProps {
  categoryId: string | null;
  onSelectProduct: (product: ProductType) => void;
  activeProductId?: string | null;
  selectedCustomerId?: string | null;
  cartItems?: CartItem[];
}

export const ProductListColumn: React.FC<ProductListColumnProps> = ({
  categoryId,
  onSelectProduct,
  activeProductId,
  selectedCustomerId,
  cartItems = [],
}) => {
  const { t } = useTranslation(["services", "common"]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch customer-specific product types if customer is selected
  const { data: customerProductTypes, isLoading: isLoadingCustomerProducts } = useQuery<CustomerProductTypesResponse>({
    queryKey: ["customerProductTypes", selectedCustomerId],
    queryFn: () => customerProductTypeService.getCustomerProductTypes(parseInt(selectedCustomerId!)),
    enabled: !!selectedCustomerId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all product types (fallback when no customer or no customer-specific products)
  const { data: allProducts = [], isLoading: isLoadingAllProducts, error } = useQuery<ProductType[], Error>({
    queryKey: ["productTypes"],
    queryFn: () => getAllProductTypes(),
    staleTime: 5 * 60 * 1000,
  });

  // Determine which products to show based on customer selection
  const productsToShow = useMemo(() => {
    if (selectedCustomerId && customerProductTypes?.product_types && customerProductTypes.product_types.length > 0) {
      // Use customer-specific product types - convert to ProductType format
      return customerProductTypes.product_types.map(cpt => ({
        id: cpt.product_type.id,
        product_category_id: cpt.product_type.category?.id || 0,
        name: cpt.product_type.name,
        is_dimension_based: cpt.product_type.is_dimension_based,
        is_active: true, // Customer product types are always active
        image_url: undefined, // Customer product types don't have image_url
        service_offerings_count: 0, // Will be calculated separately
        category: cpt.product_type.category,
      } as ProductType));
    } else {
      // Use all product types
      return allProducts;
    }
  }, [selectedCustomerId, customerProductTypes, allProducts]);

  const filteredProducts = useMemo(() => {
    return productsToShow.filter(product => {
      const lowerCaseSearch = debouncedSearchTerm.toLowerCase();
      const matchesSearch = product.name.toLowerCase().includes(lowerCaseSearch) || product.id.toString() === lowerCaseSearch;
      const matchesCategory = !categoryId || product.category?.id.toString() === categoryId;
      return matchesSearch && matchesCategory;
    });
  }, [productsToShow, categoryId, debouncedSearchTerm]);

  // Check if a product is in the cart
  const isProductInCart = (productId: number): boolean => {
    return cartItems.some(item => item.productType.id === productId);
  };

  const isLoading = isLoadingCustomerProducts || isLoadingAllProducts;

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
        <div>
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground min-h-[200px]">
              <Search className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">{t("noProductsFound", { ns: "services" })}</p>
              <p className="text-sm">{t("tryAdjustingSearch", { ns: "services" })}</p>
            </div>
          ) : (
            <div>
              {filteredProducts.map((product) => (
                <TooltipProvider key={product.id} delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onSelectProduct(product)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 transition-all cursor-pointer",
                          "hover:bg-muted/50",
                          "border-b border-border",
                          activeProductId === product.id.toString() && "bg-primary/10 border-primary"
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
                          {(product.service_offerings_count ?? 0) > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {product.service_offerings_count ?? 0}
                            </Badge>
                          )}
                          {product.is_dimension_based && (
                            <Badge variant="outline" className="text-xs">
                              {t("dimensionBased", { ns: "services" })}
                            </Badge>
                          )}
                          
                          {/* Green check circle for products in cart */}
                          {isProductInCart(product.id) && (
                            <div className="bg-green-500 rounded-full p-1">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
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
                          {t("offeringsCount", { ns: "services", count: product.service_offerings_count ?? 0 })}
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