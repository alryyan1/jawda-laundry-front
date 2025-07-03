import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

import { getProductCategories } from "@/api/productCategoryService";
import type { ProductCategory } from "@/types";

interface CategoryColumnProps {
  onSelectCategory: (categoryId: string) => void;
  selectedCategoryId: string | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const CategoryColumn: React.FC<CategoryColumnProps> = ({
  onSelectCategory,
  selectedCategoryId,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { t } = useTranslation(["common", "services"]);

  const { data: categories = [], isLoading } = useQuery<ProductCategory[], Error>({
    queryKey: ["productCategories"],
    queryFn: getProductCategories,
  });

  if (isLoading) {
    return <div className="p-4">{t("loading", { ns: "common" })}</div>;
  }

  return (
    <div className={cn(
      "transition-all duration-300 ease-in-out",
      isCollapsed ? "w-12" : "w-full"
    )}>
      {isCollapsed ? (
        <Button
          variant="ghost"
          className="w-full h-12 flex items-center justify-center"
          onClick={onToggleCollapse}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      ) : (
        <ScrollArea className="h-[calc(100vh-13rem)]">
          <div className="grid grid-cols-2 gap-2 p-2">
            {categories.map((category) => (
              <Card
                key={category.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-accent",
                  selectedCategoryId === category.id.toString() && "bg-accent"
                )}
                onClick={() => onSelectCategory(category.id.toString())}
              >
                <CardContent className="p-3 text-center">
                  <h3 className="font-medium text-sm">{category.name}</h3>
                  {category.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}; 