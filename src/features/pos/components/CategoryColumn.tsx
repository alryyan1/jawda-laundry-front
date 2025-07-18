import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { materialColors } from "@/lib/colors";
import { Loader2 } from "lucide-react";

import { getProductCategories } from "@/api/productCategoryService";
import type { ProductCategory } from "@/types";

interface CategoryColumnProps {
  onSelectCategory: (categoryId: string) => void;
  selectedCategoryId: string | null;
}

export const CategoryColumn: React.FC<CategoryColumnProps> = ({
  onSelectCategory,
  selectedCategoryId,
}) => {
  const { t } = useTranslation(["common", "services"]);

  const { data: categories = [], isLoading } = useQuery<ProductCategory[], Error>({
    queryKey: ["productCategories"],
    queryFn: getProductCategories,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-13rem)]">
      <div className="grid grid-cols-1 gap-2 p-2">
        <button
          onClick={() => onSelectCategory("")}
          className={cn(
            "flex flex-col items-center justify-center h-[85px] rounded-lg transition-all",
            "bg-gradient-to-br shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
            selectedCategoryId === "" || !selectedCategoryId
              ? "from-sky-400 to-sky-600 text-white border-2 border-sky-500 ring-2 ring-sky-400/30"
              : "from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-800 border border-transparent hover:border-sky-400/20",
          )}
          style={{
            '--tw-gradient-from': selectedCategoryId === "" || !selectedCategoryId ? '#38BDF8' : materialColors.grey[50],
            '--tw-gradient-to': selectedCategoryId === "" || !selectedCategoryId ? '#0284C7' : materialColors.grey[100],
          }}
        >
          <div className="w-10 h-10 mb-2 rounded-full bg-white/90 flex items-center justify-center">
            <span className="text-xl">🏷️</span>
          </div>
          <span className="text-sm font-medium line-clamp-1 px-2">
            {t("allCategories", { ns: "common" })}
          </span>
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id.toString())}
            className={cn(
              "flex flex-col items-center justify-center h-[85px] rounded-lg transition-all",
              "bg-gradient-to-br shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
              selectedCategoryId === category.id.toString()
                ? "from-sky-400 to-sky-600 text-white border-2 border-sky-500 ring-2 ring-sky-400/30"
                : "from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-800 border border-transparent hover:border-sky-400/20",
            )}
            style={{
              '--tw-gradient-from': selectedCategoryId === category.id.toString() ? '#38BDF8' : materialColors.grey[50],
              '--tw-gradient-to': selectedCategoryId === category.id.toString() ? '#0284C7' : materialColors.grey[100],
            }}
          >
            <div className="w-10 h-10 mb-2 rounded-full bg-white/90 flex items-center justify-center overflow-hidden">
              {category.image_url ? (
                <img 
                  src={category.image_url} 
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl">{category.name[0].toUpperCase()}</span>
              )}
            </div>
            <span className="text-sm font-medium line-clamp-1 px-2">
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}; 