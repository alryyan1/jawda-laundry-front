// src/features/orders/components/CategoryColumn.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import type { ProductCategory } from "@/types";
import { getProductCategories } from "@/api/productCategoryService";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";

interface CategoryColumnProps {
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
}

export const CategoryColumn: React.FC<CategoryColumnProps> = ({
  selectedCategoryId,
  onSelectCategory,
}) => {
  const { t } = useTranslation(["services", "common"]);

  // Fetch product categories for the list
  const { data: categories = [], isLoading } = useQuery<
    ProductCategory[],
    Error
  >({
    queryKey: ["productCategoriesForSelect"], // This key can be reused across the app
    queryFn: getProductCategories,
    staleTime: 10 * 60 * 1000, // Cache categories for 10 minutes
  });

  return (
    <div className="flex flex-col h-full bg-muted/30 border-r dark:bg-card">
      <header className="p-4 text-lg font-semibold border-b shrink-0 flex items-center gap-2">
        <Layers className="h-5 w-5" />
        {t("productCategoriesTitle", { ns: "services" })}
      </header>
      <ScrollArea className="flex-grow">
        {isLoading ? (
          // Skeleton loader for when categories are being fetched
          <div className="p-2 space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <nav className="p-2 space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id.toString())}
                aria-current={
                  selectedCategoryId === category.id.toString()
                    ? "page"
                    : undefined
                }
                className={cn(
                  "w-full text-left rtl:text-right flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  selectedCategoryId === category.id.toString()
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {/* Could add icons per category if you add an 'icon' field to the model */}
                <span className="truncate">{category.name}</span>
                {category.product_types_count !== undefined && (
                  <span
                    className={cn(
                      "ml-auto rtl:mr-auto text-xs font-mono px-1.5 rounded-sm",
                      selectedCategoryId === category.id.toString()
                        ? "bg-primary-foreground/20"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    )}
                  >
                    {category.product_types_count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        )}
      </ScrollArea>
    </div>
  );
};
