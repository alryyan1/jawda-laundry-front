import React from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { getProductCategories } from "@/api/productCategoryService";
import type { ProductCategory } from "@/types";

interface CategoryColumnProps {
  onSelectCategory: (categoryId: string) => void;
  selectedCategoryId: string | null;
  selectedCustomerId?: string | null;
}

export const CategoryColumn: React.FC<CategoryColumnProps> = ({
  onSelectCategory,
  selectedCategoryId,
  selectedCustomerId,
}) => {
  const { data: allCategories = [], isLoading } = useQuery<
    ProductCategory[],
    Error
  >({
    queryKey: ["productCategories"],
    queryFn: getProductCategories,
  });

  if (isLoading) {
    return (
      <div className="w-[110px] bg-white border-r border-slate-100 flex flex-col h-full shadow-sm">
        <div className="p-3 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2 space-y-2 flex flex-col items-center">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="w-[110px] bg-white border-r border-slate-100 flex flex-col h-full shadow-[2px_0_5px_-3px_rgba(0,0,0,0.05)] relative z-20">
      {/* Header */}
      <div className="p-3 border-b border-slate-100 bg-white/80 backdrop-blur-sm text-center">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Categories
        </h3>
      </div>

      {/* Categories List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-2">
          {/* All Categories Button */}
          <button
            onClick={() => onSelectCategory("")}
            className={cn(
              "group w-full flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 border-2",
              !selectedCategoryId
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-slate-100 bg-slate-50 hover:border-primary/30 hover:bg-slate-100",
            )}
          >
            <div
              className={cn(
                "p-2 rounded-full mb-1 transition-colors",
                !selectedCategoryId
                  ? "bg-primary text-white shadow-sm"
                  : "bg-slate-200 text-slate-500 group-hover:bg-slate-300",
              )}
            >
              <LayoutGrid className="h-5 w-5" />
            </div>
            <span
              className={cn(
                "text-[10px] font-bold uppercase text-center leading-tight",
                !selectedCategoryId ? "text-primary" : "text-slate-600",
              )}
            >
              All
            </span>
          </button>

          {/* Dynamic Categories */}
          {allCategories.map((category) => {
            const isSelected = selectedCategoryId === category.id.toString();

            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id.toString())}
                className={cn(
                  "group relative w-full aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-200 border-2 overflow-hidden",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20 scale-105 z-10"
                    : "border-transparent bg-white shadow-sm hover:border-slate-200 hover:shadow-md hover:-translate-y-0.5",
                )}
              >
                {category.image_url ? (
                  <>
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className={cn(
                        "absolute inset-0 w-full h-full object-cover transition-all duration-300",
                        isSelected
                          ? "opacity-20 mix-blend-multiply scale-110"
                          : "opacity-100 group-hover:scale-105",
                      )}
                    />
                    {/* Overlay for selected state to make text readable */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/90" />
                    )}
                  </>
                ) : (
                  <div
                    className={cn(
                      "absolute inset-0 w-full h-full opacity-10",
                      isSelected ? "bg-white" : "bg-slate-200",
                    )}
                  />
                )}

                <span
                  className={cn(
                    "relative z-10 text-[10px] font-bold uppercase text-center leading-tight line-clamp-2 px-1 break-words w-full",
                    isSelected
                      ? "text-white"
                      : "text-slate-700 bg-white/90 rounded py-0.5 shadow-sm backdrop-blur-[2px]",
                  )}
                >
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer Decoration */}
      <div className="h-4 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
    </div>
  );
};
