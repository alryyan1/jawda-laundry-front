// src/features/orders/components/wizard/StepCategory.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import type { ProductCategory } from "@/types";
import { getProductCategories } from "@/api/productCategoryService";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StepCategoryProps {
  onSelectCategory: (id: string) => void;
  selectedCategoryId: string | null; // To highlight selection if user goes back and forth
}

export const StepCategory: React.FC<StepCategoryProps> = ({
  onSelectCategory,
  selectedCategoryId,
}) => {
  const { t } = useTranslation(["services", "orders"]);

  const { data: categories = [], isLoading } = useQuery<
    ProductCategory[],
    Error
  >({
    queryKey: ["productCategoriesForSelect"],
    queryFn: getProductCategories,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b shrink-0">
        <h2 className="text-lg font-semibold">
          {t("step2_selectCategory", { ns: "orders" })}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("selectCategoryDescription", { ns: "orders" })}
        </p>
      </header>

      <ScrollArea className="flex-grow">
        <div className="p-4 sm:p-6">
          {isLoading ? (
            // Skeleton loader for when categories are being fetched
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  onClick={() => onSelectCategory(category.id.toString())}
                  className={cn(
                    "cursor-pointer hover:border-primary transition-all duration-200 group",
                    selectedCategoryId === category.id.toString()
                      ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "border-border"
                  )}
                  aria-pressed={selectedCategoryId === category.id.toString()}
                  tabIndex={0} // Make the card focusable
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      onSelectCategory(category.id.toString());
                  }}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-3 aspect-[4/3] group-hover:bg-muted/50 rounded-lg">
                    <div className="p-3 bg-primary/10 text-primary rounded-full transition-transform duration-300 group-hover:scale-110">
                      <Layers className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm sm:text-base">
                        {category.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {category.description}
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
