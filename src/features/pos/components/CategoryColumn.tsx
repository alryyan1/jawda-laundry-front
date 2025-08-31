import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { getProductCategories } from "@/api/productCategoryService";
import type { ProductCategory } from "@/types";
import { loadFromCache, saveToCache, CACHE_KEYS, CACHE_DURATIONS } from "@/lib/cacheUtils";

interface CategoryColumnProps {
  onSelectCategory: (categoryId: string) => void;
  selectedCategoryId: string | null;
  selectedCustomerId?: string | null;
  enabled?: boolean; // Add prop to control when query should run
}

export const CategoryColumn: React.FC<CategoryColumnProps> = ({
  onSelectCategory,
  selectedCategoryId,
  selectedCustomerId,
  enabled = true, // Default to true for backward compatibility
}) => {
  const [cachedCategories, setCachedCategories] = useState<ProductCategory[]>([]);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(true);

  // Load categories from localStorage on component mount
  useEffect(() => {
    const cachedCategories = loadFromCache<ProductCategory[]>(
      CACHE_KEYS.PRODUCT_CATEGORIES, 
      CACHE_DURATIONS.PRODUCT_CATEGORIES
    );
    
    if (cachedCategories) {
      setCachedCategories(cachedCategories);
    }
    setIsLoadingFromCache(false);
  }, []);

  // Fetch product categories only when enabled and not in cache
  const { data: fetchedCategories = [], isLoading: isLoadingFromAPI } = useQuery<ProductCategory[], Error>({
    queryKey: ["productCategories"],
    queryFn: async () => {
      const categories = await getProductCategories();
      
      // Cache the fetched data in localStorage
      saveToCache(CACHE_KEYS.PRODUCT_CATEGORIES, categories);
      
      return categories;
    },
    staleTime: Infinity, // Never refetch automatically
    enabled: enabled && cachedCategories.length === 0, // Only fetch if not in cache and enabled
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  // Use cached data if available, otherwise use fetched data
  const allCategories = cachedCategories.length > 0 ? cachedCategories : fetchedCategories;
  const isLoadingCategories = isLoadingFromCache || (cachedCategories.length === 0 && isLoadingFromAPI);

  // Removed customer-specific pricing rules usage
  const isLoadingCustomerProducts = false;

  // Determine which categories to show
  const categoriesToShow = React.useMemo(() => {
    // Always show all categories
    return allCategories;
  }, [allCategories]);

  const isLoading = isLoadingCategories || (selectedCustomerId ? isLoadingCustomerProducts : false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <ScrollArea className="h-[calc(100vh-100px)] md:h-[calc(100vh-120px)]">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-1 gap-2 p-1">
        {categoriesToShow.map((category) => (
          <Tooltip key={category.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelectCategory(category.id.toString())}
                className={cn(
                  "relative overflow-hidden flex flex-col h-[100px] md:h-[80px] lg:h-[100px] rounded-lg transition-all cursor-pointer",
                  "bg-gradient-to-br shadow-md hover:shadow-lg transform hover:-translate-y-0.5 dark:shadow-black/30",
                  selectedCategoryId === category.id.toString()
                    ? "from-sky-400 to-sky-600 text-white ring-2 ring-sky-400/30"
                    : "from-gray-50 to-gray-100 text-gray-800 dark:from-slate-800 dark:to-slate-900 dark:text-gray-100 border border-transparent hover:border-sky-400/20",
                )}
              >
                  {category.image_url ? (
                    <>
                      <img 
                        src={category.image_url} 
                        alt={category.name}
                        className="w-full h-full object-contain "
                        style={{ objectPosition: 'center' }}
                      />
                      <span
                        className="absolute left-1/2 bottom-2 whitespace-nowrap overflow-visible -translate-x-1/2 px-2 md:px-1 lg:px-4 py-1 bg-white/80 dark:bg-black/50 border border-gray-300 dark:border-gray-600 rounded text-xs md:text-xs lg:text-xs font-semibold text-gray-800 dark:text-gray-100 shadow"
                        style={{ pointerEvents: 'none' }}
                      >
                        {category.name}
                      </span>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <span className="text-sm md:text-xs lg:text-sm font-medium text-gray-800 dark:text-gray-100 text-center line-clamp-2 overflow-hidden">
                        {category.name}
                      </span>
                    </div>
                  )}
               
                {/* <span className="text-sm font-medium line-clamp-1 p-1">
                  {category.name}
                </span> */}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{category.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </ScrollArea>
    </TooltipProvider>
  );
}; 