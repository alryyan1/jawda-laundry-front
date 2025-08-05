// src/features/pos/components/ProductColumn.tsx
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { ProductType } from "@/types";
import { getAllProductTypes } from "@/api/productTypeService";
// import { getProductTypeInventory } from "@/api/inventoryService"; // Removed inventory import
import { useDebounce } from "@/hooks/useDebounce";
import { useSearch } from "@/context/SearchContext";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// --- MUI Import ---
import Badge from '@mui/material/Badge';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

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
  const { searchTerm } = useSearch();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: allProducts = [], isLoading, error } = useQuery<ProductType[], Error>({
    queryKey: ["productTypes"],
    queryFn: () => getAllProductTypes(),
    staleTime: 5 * 60 * 1000,
  });

  // const { data: inventoryData = {} } = useQuery({ // Removed inventory data query
  //   queryKey: ["productTypeInventory"],
  //   queryFn: getProductTypeInventory,
  // });

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
        <ScrollArea className="flex-grow h-[calc(100vh-100px)]">
          <div className="p-0">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground min-h-[50px]">
                {/* ... empty state message ... */}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2" 
                   style={{ 
                     gridTemplateColumns: "repeat(3, 1fr)",
                     maxWidth: "100%"
                   }}>
                {filteredProducts.map((product) => (
                  <div key={product.id}>
                    <button
                      onClick={() => onSelectProduct(product)}
                      className={cn(
                        "w-full flex flex-col items-center justify-center p-1 rounded-lg transition-all text-center cursor-pointer",
                        "bg-card hover:bg-card/90",
                        "shadow-sm hover:shadow-md",
                        "transform hover:-translate-y-0.5",
                        "border border-border hover:border-primary/50",
                        activeProductId === product.id.toString() && "border-2 border-primary bg-primary/5 shadow-primary/20"
                      )}
                      style={{ minHeight: "130px" }}
                    >
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
                      </Badge>
                      <span className="text-sm font-medium line-clamp-2 px-1 text-card-foreground">
                        {product.name}
                      </span>
                      {/* Inventory Quantity Display */}
                      {/* Removed inventory data display */}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </MuiThemeProvider>
  );
};