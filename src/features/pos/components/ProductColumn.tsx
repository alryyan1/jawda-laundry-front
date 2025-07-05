// src/features/pos/components/ProductColumn.tsx
import React, { useState, useMemo } from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shirt, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// --- MUI Import ---
import Badge from '@mui/material/Badge';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { materialColors } from "@/lib/colors";

// A minimal MUI theme to make the badge fit the Shadcn theme
// You could define this in a central place if you use more MUI components
const muiTheme = createTheme({
  palette: {
    primary: {
      main: 'hsl(var(--primary))', // Use CSS variable from Shadcn
    },
    secondary: {
      main: 'hsl(var(--secondary))',
    },
  },
  components: {
    MuiBadge: {
        styleOverrides: {
            badge: {
                // Custom styles for the badge itself
                height: '18px',
                minWidth: '18px',
                fontSize: '0.7rem',
                padding: '0 5px',
                fontWeight: '600',
            }
        }
    }
  }
});


interface ProductColumnProps {
  categoryId: string | null;
  onSelectProduct: (product: ProductType) => void;
  activeProductId?: string | null;
}

export const ProductColumn: React.FC<ProductColumnProps> = ({
  categoryId,
  onSelectProduct,
  activeProductId,
}) => {
  const { t } = useTranslation(["services", "common"]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: allProducts = [], isLoading, error } = useQuery<ProductType[], Error>({
    queryKey: ["productTypes"],
    queryFn: () => getAllProductTypes(),
    staleTime: 5 * 60 * 1000,
  });

  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const lowerCaseSearch = debouncedSearchTerm.toLowerCase();
      const matchesSearch = product.name.toLowerCase().includes(lowerCaseSearch) || product.id.toString() === lowerCaseSearch;
      const matchesCategory = !categoryId || product.category?.id.toString() === categoryId;
      return matchesSearch && matchesCategory;
    });
  }, [allProducts, categoryId, debouncedSearchTerm]);

  if (isLoading) { /* ... same as before ... */ }
  if (error) { /* ... same as before ... */ }

  return (
    <MuiThemeProvider theme={muiTheme}>
      <div className="flex flex-col h-full">
        {/* Search Bar remains the same */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("searchProductsByNameOrId", { ns: "services" })}
              className="pl-9 bg-muted/50 dark:bg-muted/20 border-border/50 focus:border-primary"
            />
          </div>
        </div>

        <ScrollArea className="flex-grow h-[calc(100vh-100px)]">
          <div className="p-4">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground min-h-[200px]">
                {/* ... empty state message ... */}
              </div>
            ) : (
              <div className="grid grid-cols-2 auto-rows-fr gap-2 sm:gap-3 lg:gap-4" 
                   style={{ 
                     gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                     maxWidth: "100%"
                   }}>
                {filteredProducts.map((product) => (
                  <TooltipProvider key={product.id} delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {/* --- MUI Badge Implementation --- */}
                        <Badge
                          badgeContent={product.service_offerings_count || 0}
                          color="info"
                         
                          // Use invisible prop to hide the badge if count is 0
                          invisible={!product.service_offerings_count || product.service_offerings_count === 0}
                          anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                          }}
                        >
                          <button
                            onClick={() => onSelectProduct(product)}
                            className={cn(
                              "w-full flex flex-col items-center justify-center p-2 rounded-lg transition-all text-center",
                              "bg-card hover:bg-card/90",
                              "shadow-sm hover:shadow-md",
                              "transform hover:-translate-y-0.5",
                              "border border-border hover:border-primary/50",
                              activeProductId === product.id.toString() && "border-2 border-primary bg-primary/5 shadow-primary/20"
                            )}
                            style={{ minHeight: "130px" }}
                          >
                            <div className="w-16 h-16 mb-2 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                  <span className="text-2xl font-medium text-muted-foreground">
                                    {product.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium line-clamp-2 px-1 text-card-foreground">
                              {product.name}
                            </span>
                          </button>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent><p>{product.name}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </MuiThemeProvider>
  );
};