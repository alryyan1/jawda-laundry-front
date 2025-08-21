import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { materialColors } from "@/lib/colors";
import { Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { getProductCategories } from "@/api/productCategoryService";
import { pricingRuleService } from "@/api/pricingRuleService";
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
  // Returns a representative online image based on category name (fallback when no image_url provided)
  const getDefaultImageForCategoryName = React.useCallback((name: string): string | null => {
    const n = (name || "").toLowerCase();

    const src = (query: string) => `https://source.unsplash.com/featured/600x400?${encodeURIComponent(query)}`;

    if (n.includes("بوكس") || n.includes("box")) return src("combo meal,food box");
    if (n.includes("سندويش") || n.includes("sandwich") || n.includes("shawarma")) return src("shawarma,sandwich,wrap");
    if (n.includes("فرايز") || n.includes("fries")) return src("french fries");
    if (n.includes("عراقي")) return src("kebab,grill,iraqi food");
    if (n.includes("صاروق")) return src("wrap,sandwich");
    if (n.includes("شبس") || n.includes("chips")) return src("potato chips");
    if (n.includes("مشروبات باردة") || n.includes("cold drinks")) return src("iced drink,juice,cold beverage");
    if (n.includes("مشروبات ساخنة") || n.includes("hot drinks") || n.includes("tea") || n.includes("coffee")) return src("tea,coffee,hot drink");
    if (n.includes("مشروبات") || n.includes("drinks")) return src("beverage,drink");
    if (n.includes("وجبات التوفير") || n.includes("value")) return src("combo meal");
    if (n.includes("اللقيمات") || n.includes("luqaimat")) return src("luqaimat,arabic dessert,sweet dumplings");
    if (n.includes("مندازي") || n.includes("mandazi")) return src("mandazi,african pastry,donut");
    if (n.includes("فطاير") || n.includes("fatair")) return src("pastry,manakeesh");
    if (n.includes("رقاق") || n.includes("khubz")) return src("flatbread,khubz");
    if (n.includes("توست") || n.includes("toast")) return src("toast bread");

    return src("restaurant food");
  }, []);
  const { data: allCategories = [], isLoading: isLoadingAllCategories } = useQuery<ProductCategory[], Error>({
    queryKey: ["productCategories"],
    queryFn: getProductCategories,
  });

  const { data: customerProductsWithPricingRules, isLoading: isLoadingCustomerProducts } = useQuery({
    queryKey: ["customerProductsWithPricingRules", selectedCustomerId],
    queryFn: () => pricingRuleService.getCustomerProductsWithPricingRules(parseInt(selectedCustomerId!)),
    enabled: !!selectedCustomerId,
  });

  // Determine which categories to show
  const categoriesToShow = React.useMemo(() => {
    if (!selectedCustomerId || !customerProductsWithPricingRules?.product_types?.length) {
      return allCategories;
    }

    // Get unique category IDs from customer's products with pricing rules
    const customerCategoryIds = new Set(
      customerProductsWithPricingRules.product_types
        .map(productType => productType.category?.id)
        .filter(Boolean)
    );

    // Filter categories to only show those that have customer products with pricing rules
    return allCategories.filter(category => customerCategoryIds.has(category.id));
  }, [selectedCustomerId, customerProductsWithPricingRules, allCategories]);

  const isLoading = isLoadingAllCategories || (selectedCustomerId ? isLoadingCustomerProducts : false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <ScrollArea className="h-[calc(100vh-100px)]">
        <div className="grid grid-cols-1 gap-2 p-1">
        {categoriesToShow.map((category) => (
          <Tooltip key={category.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelectCategory(category.id.toString())}
                className={cn(
                  "flex flex-col h-[100px]    rounded-lg transition-all cursor-pointer",
                  "bg-gradient-to-br shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
                  selectedCategoryId === category.id.toString()
                    ? "from-sky-400 to-sky-600 text-white  ring-sky-400/30"
                    : "hover:border-sky-400/20",
                )}
                style={{
                  '--tw-gradient-from': selectedCategoryId === category.id.toString() ? '#38BDF8' : materialColors.grey[50],
                  '--tw-gradient-to': selectedCategoryId === category.id.toString() ? '#0284C7' : materialColors.grey[100],
                } as React.CSSProperties}
              >
                <div className="relative  mb-2 rounded-lg bg-white/90 flex items-center justify-center overflow-hidden">
                  {category.image_url || getDefaultImageForCategoryName(category.name) ? (
                    <>
                      <img 
                        src={category.image_url || getDefaultImageForCategoryName(category.name)!} 
                        alt={category.name}
                        className="w-full h-full object-contain "
                        style={{ objectPosition: 'center' }}
                      />
                      <span
                        className="absolute left-1/2 bottom-2 whitespace-nowrap overflow-visible -translate-x-1/2 px-4 py-1 bg-white/80 border border-gray-300 rounded text-xs font-semibold text-gray-800 shadow"
                        style={{ pointerEvents: 'none' }}
                      >
                        {category.name}
                      </span>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <span className="text-sm font-medium text-gray-800 text-center line-clamp-2 overflow-hidden">
                        {category.name}
                      </span>
                    </div>
                  )}
                </div>
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