import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, CheckCircle, Shirt } from "lucide-react";

import { getAllProductTypes } from "@/api/productTypeService";
import type { ProductType } from "@/types";
import type { CartItem } from "./CartItem";

import { useDebounce } from "@/hooks/useDebounce";
import { useSearch } from "@/context/SearchContext";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getImageUrl } from "@/lib/utils";

interface ProductColumnProps {
  categoryId: string | null;
  onSelectProduct: (product: ProductType) => void;
  activeProductId?: string | null;
  selectedCustomerId?: string | null; // Kept for compatibility but unused
  cartItems?: CartItem[];
}

export const ProductColumn: React.FC<ProductColumnProps> = ({
  categoryId,
  onSelectProduct,
  activeProductId,
  selectedCustomerId,
  cartItems = [],
}) => {
  const { searchTerm } = useSearch();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch all products - simplified logic, no customer pricing rules
  const {
    data: allProducts = [],
    isLoading,
    error,
  } = useQuery<ProductType[], Error>({
    queryKey: ["productTypes"],
    queryFn: () => getAllProductTypes(),
    staleTime: 5 * 60 * 1000,
  });

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = allProducts;

    // Filter by Category
    if (categoryId) {
      result = result.filter((p) => p.category?.id.toString() === categoryId);
    }

    // Filter by Search
    const query = debouncedSearchTerm.toLowerCase().trim();
    if (query) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) || p.id.toString() === query,
      );
    }

    return result;
  }, [allProducts, categoryId, debouncedSearchTerm]);

  const isProductInCart = (productId: number) =>
    cartItems.some((item) => item.productType.id === productId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center text-destructive">
          <p className="font-semibold">Error loading products</p>
          <p className="text-sm opacity-80">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50/50">
      <ScrollArea className="flex-1 h-[calc(100vh-100px)]">
        <div className="p-4">
          {filteredProducts.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              <Search className="h-10 w-10 opacity-20 mb-2" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-4">
              {filteredProducts.map((product) => {
                const inCart = isProductInCart(product.id);
                const isActive = activeProductId === product.id.toString();
                const offeringCount = product.service_offerings_count || 0;

                return (
                  <button
                    key={product.id}
                    onClick={() => onSelectProduct(product)}
                    className={cn(
                      "group relative flex flex-col items-center overflow-hidden rounded-xl border bg-white p-3 text-center shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      isActive
                        ? "border-primary ring-1 ring-primary"
                        : "border-slate-200 hover:border-slate-300",
                      inCart && "bg-sky-50/50 border-sky-200",
                    )}
                  >
                    {/* Badge for offering count */}
                    {offeringCount > 0 && (
                      <span
                        className={cn(
                          "absolute right-2 top-2 z-10 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-bold shadow-sm",
                          inCart
                            ? "bg-sky-500 text-white"
                            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
                        )}
                      >
                        {offeringCount}
                      </span>
                    )}

                    {/* In Cart Indicator */}
                    {inCart && (
                      <div className="absolute left-2 top-2 z-10 text-sky-500 bg-white rounded-full shadow-sm">
                        <CheckCircle className="h-5 w-5 fill-sky-100" />
                      </div>
                    )}

                    {/* Image Container */}
                    <div className="mb-3 cursor-pointer flex aspect-square w-full items-center justify-center rounded-lg bg-slate-50 p-2 group-hover:bg-slate-100 transition-colors">
                      {product.image_url ? (
                        <img
                          src={getImageUrl(product.image_url)}
                          alt={product.name}
                          className="h-full w-full object-contain mix-blend-multiply"
                          loading="lazy"
                        />
                      ) : (
                        <Shirt className="h-10 w-10 text-slate-300" />
                      )}
                    </div>

                    {/* Name */}
                    <span className="line-clamp-2 text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                      {product.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
