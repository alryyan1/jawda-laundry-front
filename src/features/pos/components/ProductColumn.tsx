// src/features/pos/components/ProductColumn.tsx
import React, { useMemo, useRef, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { ProductType } from "@/types";
import { getAllProductTypes } from "@/api/productTypeService";
import type { CartItem } from "./CartItem";

import { useDebounce } from "@/hooks/useDebounce";
import { useSearch } from "@/context/SearchContext";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getImageUrl } from "@/lib/utils";
import { CheckCircle, Utensils } from "lucide-react";

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
  cartItems?: CartItem[];
}

export const ProductColumn: React.FC<ProductColumnProps> = ({
  categoryId,
  onSelectProduct,
  activeProductId,
  cartItems = [],
}) => {
  const { searchTerm } = useSearch();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Dynamic grid columns based on container width
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridColumns, setGridColumns] = useState(3);

  // Calculate grid columns based on container width
  useEffect(() => {
    const calculateGridColumns = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const minItemWidth = 100; // Reduced minimum width for each product item
      const gap = 8; // Gap between items (gap-2 = 8px)
      
      // Calculate how many columns can fit with padding
      const availableWidth = containerWidth - (gap * 2); // Account for gaps and padding
      const columns = Math.max(1, Math.floor(availableWidth / (minItemWidth + gap)));
      
      // Cap at 4 columns maximum to prevent horizontal overflow
      const maxColumns = Math.min(columns, 4);
      setGridColumns(maxColumns);
    };

    calculateGridColumns();
    
    // Add resize listener
    const resizeObserver = new ResizeObserver(calculateGridColumns);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Removed customer-specific pricing rules
  const isLoadingCustomerProducts = false;

  // Fetch all product types (fallback when no customer or no customer-specific products)
  const { data: allProducts = [], isLoading: isLoadingAllProducts, error } = useQuery<ProductType[], Error>({
    queryKey: ["productTypes"],
    queryFn: () => getAllProductTypes(),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });



  // Determine which products to show based on customer selection
  const productsToShow = useMemo(() => {
    // Always use all product types
    return allProducts;
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    return productsToShow.filter((product: ProductType) => {
      const lowerCaseSearch = debouncedSearchTerm.toLowerCase();
      const matchesSearch = product.name.toLowerCase().includes(lowerCaseSearch) || product.id.toString() === lowerCaseSearch;
      const matchesCategory = !categoryId || product.category?.id.toString() === categoryId;
      return matchesSearch && matchesCategory;
    });
  }, [productsToShow, categoryId, debouncedSearchTerm]);

  // Check if a product is in the cart
  const isProductInCart = (productId: number): boolean => {
    return cartItems.some(item => item.productType.id === productId);
  };

  const isLoading = isLoadingCustomerProducts || isLoadingAllProducts;

  if (isLoading) { /* ... same as before ... */ }
  if (error) { /* ... same as before ... */ }

  return (
    <MuiThemeProvider theme={muiTheme}>
      <div className="flex flex-col h-full w-full max-w-[50vw] overflow-hidden" ref={containerRef}>
        <ScrollArea className="flex-grow h-[calc(100vh-100px)]">
          <div className="p-0">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground min-h-[50px]">
                {/* ... empty state message ... */}
              </div>
            ) : (
              <div className="grid gap-2 w-full" 
                   style={{ 
                     gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                     maxWidth: "100%"
                   }}>
                {filteredProducts.map((product: ProductType) => (
                  <div key={product.id} className={cn(
                    "rounded-lg transition-all",
                    activeProductId === product.id.toString() && "ring-2 ring-primary ring-offset-2"
                  )}>
                    <button
                      onClick={() => onSelectProduct(product)}
                      className={cn(
                        "w-full h-[160px] flex flex-col items-center justify-between p-2 rounded-lg transition-all text-center cursor-pointer",
                        "bg-card hover:bg-card/90",
                        "shadow-sm hover:shadow-md",
                        "transform hover:-translate-y-0.5",
                        "border border-border hover:border-primary/50",
                        isProductInCart(product.id) && "bg-sky-500/10 border-sky-500"
                        
                      )}
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
                          {/* Green check circle for products in cart */}
                          {isProductInCart(product.id) && (
                            <div className="absolute -top-1 -left-8 bg-green-500 rounded-full p-0.5 shadow-md">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        <div className="w-full h-[100px] mb-2 rounded-lg bg-secondary flex items-center justify-center overflow-hidden relative">
                          {product.image_url ? (
                            <img 
                              src={getImageUrl(product.image_url)} 
                              alt={product.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-full h-full flex items-center justify-center bg-muted ${product.image_url ? 'hidden' : 'flex'}`}
                            style={{ display: product.image_url ? 'none' : 'flex' }}
                          >
                            <Utensils className="h-8 w-8 text-muted-foreground" />
                          </div>
                        </div>
                      </Badge>
                      <span className="text-sm font-medium line-clamp-2 px-1 text-card-foreground text-center">
                        {product.name}
                      </span>

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