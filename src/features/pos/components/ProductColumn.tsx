import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import type { ProductType } from "@/types";
import { getAllProductTypes } from "@/api/productTypeService";
import { useDebounce } from "@/hooks/useDebounce";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shirt, Search } from "lucide-react";

interface ProductColumnProps {
  categoryId: string | null;
  onSelectProduct: (product: ProductType) => void;
}

export const ProductColumn: React.FC<ProductColumnProps> = ({
  categoryId,
  onSelectProduct,
}) => {
  const { t } = useTranslation(["services", "common", "orders"]);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: products = [], isLoading } = useQuery<ProductType[], Error>({
    queryKey: ["allProductTypesForSelect", categoryId, debouncedSearchTerm],
    queryFn: () => getAllProductTypes(categoryId || "", debouncedSearchTerm),
    enabled: !!categoryId,
    staleTime: 1 * 60 * 1000,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchProductsByNameOrId", {
              ns: "services",
              defaultValue: "Search products by name or ID...",
            })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-grow">
        <div className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground min-h-[200px] gap-4">
              <p>
                {searchTerm
                  ? t("noProductsMatchSearch", { ns: "services" })
                  : categoryId
                  ? t("noProductsInCategory", { ns: "services" })
                  : t("selectCategoryFirst", { ns: "services" })}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {products.map((product) => (
                <Card
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="cursor-pointer hover:border-primary transition-all duration-200 ease-in-out transform hover:scale-105 group"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onSelectProduct(product);
                  }}
                >
                  <CardContent className="p-2 flex flex-col items-center justify-center gap-2 aspect-square group-hover:bg-muted/50 rounded-lg">
                    <Avatar className="h-14 w-14 rounded-md transition-transform duration-300 group-hover:scale-110">
                      <AvatarImage
                        src={product.image_url || undefined}
                        alt={product.name}
                      />
                      <AvatarFallback className="rounded-md bg-secondary">
                        <Shirt className="h-7 w-7 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium text-center leading-tight px-1">
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