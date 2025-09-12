// src/features/pos/components/CartItem.tsx
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  X,
  Plus,
  Minus,
  AlertCircle,
  List,
  Mail,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { ServiceOffering, ProductType, ProductTypeComposition } from "@/types";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getProductTypeCompositions } from "@/api/productTypeCompositionService";
import { Popover, Chip, List as MuiList, ListItem, ListItemText, Typography, Box } from "@mui/material";

// The CartItem type definition should ideally live in a types file (e.g., src/types/pos.types.ts)
// but exporting it here makes this component self-describing.
export interface CartItem {
  id: string; // Keep id as string in UI; convert backend numeric id to string when mapping
  productType: ProductType;
  serviceOffering: ServiceOffering;
  quantity: number;
  price: number; // The base unit price
  notes?: string;
  excludedCompositionIds?: number[]; // Product compositions excluded by customer
  _isQuoting?: boolean;
  _quoteError?: string | null;
  _quotedSubTotal?: number;
  _isExistingOrderItem?: boolean; // Flag to identify existing order items
  _orderItemId?: string | number; // ID of the original order item in the database
  _isAdding?: boolean; // Flag to show loading state while adding to backend
  _isDeleting?: boolean; // Flag to show loading state while deleting from backend
  _addedAt?: number; // Timestamp when item was added to cart
}

interface CartItemProps {
  item: CartItem;
  onRemoveItem: (id: string | number) => void;
  onUpdateQuantity: (id: string | number, quantity: number) => void;
  onUpdateNotes: (id: string | number, notes: string) => void;
  onUpdateCompositions: (id: string | number, excludedIds: number[]) => void;
  onSaveNotesToBackend?: (orderItemId: string | number, notes: string) => Promise<void>;
  isReadOnly?: boolean;
  itemNumber?: number; // Cart item number for display
}

export const CartItemComponent: React.FC<CartItemProps> = ({
  item,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateNotes,
  onUpdateCompositions,
  onSaveNotesToBackend,
  isReadOnly = false,
  itemNumber,
}) => {
  // Only use the isReadOnly prop, don't make existing order items read-only
  const effectiveReadOnly = isReadOnly;
  const { t, i18n } = useTranslation(["common", "orders", "services"]);
  const { getSetting } = useSettings();
  const [compositionsAnchorEl, setCompositionsAnchorEl] = useState<HTMLElement | null>(null);
  const [showNotes, setShowNotes] = useState(Boolean(item.notes && String(item.notes).trim() !== ""));

  // Get currency from settings, fallback to USD
  const currency = getSetting('currency_symbol', 'OMR');

  // Fetch product compositions
  const { data: compositionsData, isLoading: compositionsLoading } = useQuery({
    queryKey: ["productTypeCompositions", item.productType.id],
    queryFn: () => getProductTypeCompositions(item.productType.id),
    enabled: !!item.productType.id,
  });

  const compositions: ProductTypeComposition[] = compositionsData?.data || [];

  // Handle composition popover
  const handleCompositionsClick = (event: React.MouseEvent<HTMLElement>) => {
    setCompositionsAnchorEl(event.currentTarget);
  };

  const handleCompositionsClose = () => {
    setCompositionsAnchorEl(null);
  };

  const handleCompositionToggle = (composition: ProductTypeComposition) => {
    const compositionId = composition.product_composition_id || composition.id;
    const isCurrentlyExcluded = item.excludedCompositionIds?.includes(compositionId) || false;
    
    let newExcludedIds: number[];
    if (isCurrentlyExcluded) {
      // Remove from excluded
      newExcludedIds = item.excludedCompositionIds?.filter(id => id !== compositionId) || [];
    } else {
      // Add to excluded
      newExcludedIds = [...(item.excludedCompositionIds || []), compositionId];
    }
    
    // Update compositions
    onUpdateCompositions(item.id, newExcludedIds);
    
    // Update notes with excluded compositions
    const excludedCompositions = compositions.filter(c => 
      newExcludedIds.includes(c.product_composition_id || c.id)
    );
    
    let newNotes = item.notes || "";
    
    // Remove any existing composition notes (both with and without ❌)
    const lines = newNotes.split('\n').filter(line => 
      !line.includes('Excluded:') && 
      !line.includes('لا يتضمن:') &&
      !line.includes('❌')
    );
    
    if (excludedCompositions.length > 0) {
      // Add each excluded composition with ❌ prefix
      excludedCompositions.forEach(comp => {
        lines.push(`❌ ${comp.name}`);
      });
    }
    
    newNotes = lines.join('\n').trim();
    onUpdateNotes(item.id, newNotes);
    
    // Save to database immediately if this is an existing order item
    if (item._isExistingOrderItem && onSaveNotesToBackend && item._orderItemId) {
      onSaveNotesToBackend(item._orderItemId, newNotes);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty input for user to clear it, but treat as 1 for logic.
    // A value of 0 or less will be invalid if using min(1)
    if (value === "" || /^[1-9]\d*$/.test(value)) {
      onUpdateQuantity(item.id, value === "" ? 1 : parseInt(value, 10));
    }
  };

  // Debounced notes saving
  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    console.log('handleNotesChange', newNotes);
    
    // Update local state immediately for responsive UI
    onUpdateNotes(item.id, newNotes);
    
    // Clear existing timeout
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }
    
    // If this is an existing order item and we have the save function, debounce the save
    if (item._isExistingOrderItem && onSaveNotesToBackend && item._orderItemId) {
      setIsSavingNotes(true);
      
      // Set a new timeout to save after 1 second of no typing
      notesTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('saving notes to backend for order item ID:', item._orderItemId);
          await onSaveNotesToBackend(item._orderItemId!, newNotes);
          console.log('Notes saved successfully');
        } catch (error) {
          console.error('Failed to save notes to backend:', error);
          // Optionally show a toast error here
        } finally {
          setIsSavingNotes(false);
        }
      }, 1000); // 1 second debounce
    }
  };

  // Auto-expand notes if item already has notes or when notes are added later
  useEffect(() => {
    if ((item.notes && String(item.notes).trim() !== "") && !showNotes) {
      setShowNotes(true);
    }
  }, [item.notes, showNotes]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (notesTimeoutRef.current) {
        clearTimeout(notesTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {item._isAdding ? (
        // Skeleton loading state while adding to backend
        <div className="relative rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex items-start justify-between p-1 border-b">
            <div className="flex-1 pr-2">
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-5 gap-2 items-end">
              <div className="col-span-2">
                <Skeleton className="h-3 w-12 mb-1" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-3 w-12 mb-1" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="col-span-1">
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ) : (
        <div dir={i18n.language === "ar" ? "rtl" : "ltr"}
          className={cn(
            "relative rounded-lg border bg-card text-card-foreground shadow-sm",
            item._isQuoting && "opacity-70 pointer-events-none"
          )}
        >
        {/* Header */}
          <div className="flex items-center  justify-center p-1 border-b">
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-2 mb-1">
              {itemNumber && (
              <Badge variant="secondary" className="text-xs font-bold">
                  #{itemNumber}
                </Badge>
              )}
              <Badge variant="info" className="text-xs">
              {item.serviceOffering.display_name}
            </Badge>
            </div>
            <p className=" text-2xl">
              {item.productType.name}
            </p>
            {item.productType.category && (
              <p className="text-xs font-bold text-sky-500">
                {item.productType.category.name}
              </p>
            )}
            {item.excludedCompositionIds && item.excludedCompositionIds.length > 0 && (
              <p className="text-xs text-orange-600 font-medium">
                {t("excludedCompositions", { defaultValue: "Excluded compositions" })}: {item.excludedCompositionIds.length}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
        
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleCompositionsClick}
                disabled={item._isQuoting}
                title={t("itemCompositions", { ns: "orders", defaultValue: "Item Compositions" }) as string}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowNotes(prev => !prev)}
                disabled={item._isQuoting}
                title={t("itemNotesOptional", { ns: "orders", defaultValue: "Notes" }) as string}
              >
                <Mail className="h-4 w-4" />
              </Button>
            
            {!effectiveReadOnly && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:text-destructive"
                onClick={() => onRemoveItem(item.id)}
                disabled={item._isDeleting}
              >
                {item._isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-1 space-y-1">

          {/* Quantity and Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {effectiveReadOnly ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t("quantity", { ns: "orders" })}:
                  </span>
                  <span className="font-medium">{item.quantity}</span>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1 || item._isQuoting}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={handleQuantityChange}
                    className="w-16 h-7 px-2 text-center"
                    disabled={item._isQuoting}
                    onFocus={(e) => e.target.select()}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={item._isQuoting}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
            <div className="text-right">
              {item._isQuoting ? (
                <div className="flex items-center gap-2 h-10">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(item.price, currency, i18n.language, 3)} ×{" "}
                    {item.quantity}
                  </p>
                  <p className="font-medium">
                    {formatCurrency(
                      item._quotedSubTotal || item.price * item.quantity,
                      currency,
                      i18n.language,
                      3
                    )}
                  </p>
                </>
              )}
            </div>
          </div>


          {/* Notes Section - Toggleable */}
          {showNotes && (
            <div className="pt-2">
              <Label className="text-xs mb-1">
                {t("itemNotesOptional", { ns: "orders" })}
              </Label>
              <div className="relative">
                <Textarea
                  style={{
                    border: '1px solid #e0e0e0',
                  }}
                  value={item.notes || ""}
                  onChange={handleNotesChange}
                  className="border-1 "
                />
                {isSavingNotes && (
                  <div className="absolute top-1 right-1">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quote Error Display */}
          {item._quoteError && !item._isQuoting && (
            <div className="pt-2 border-t border-destructive/50 flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p>{item._quoteError}</p>
            </div>
          )}
        </div>
      </div>
      )}


        {/* MUI Popover for Compositions */}
        <Popover
          open={Boolean(compositionsAnchorEl)}
          anchorEl={compositionsAnchorEl}
          onClose={handleCompositionsClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <Box sx={{ width: 300, maxHeight: 400, p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <List className="h-5 w-5" />
              {t("itemCompositions", { ns: "orders", defaultValue: "Item Compositions" })}
              <Chip 
                label={item.productType.name} 
                size="small" 
                sx={{ ml: 'auto' }}
              />
            </Typography>
            
            {compositionsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Loader2 className="h-5 w-5 animate-spin" />
              </Box>
            ) : compositions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t("noCompositionsAvailable", { ns: "services", defaultValue: "No compositions available" })}
                </Typography>
              </Box>
            ) : (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  {t("tapToIncludeExclude", { ns: "orders", defaultValue: "Tap to include/exclude each composition" })}
                </Typography>
                <MuiList sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {compositions.map((composition) => {
                    const compositionId = composition.product_composition_id || composition.id;
                    const isExcluded = item.excludedCompositionIds?.includes(compositionId) || false;
                    
                    return (
                      <ListItem
                        key={composition.id}
                        component="div"
                        onClick={() => handleCompositionToggle(composition)}
                        sx={{
                          border: 1,
                          borderColor: isExcluded ? 'error.light' : 'success.light',
                          bgcolor: isExcluded ? 'error.50' : 'success.50',
                          mb: 1,
                          borderRadius: 1,
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: isExcluded ? 'error.100' : 'success.100',
                          }
                        }}
                      >
                        <ListItemText
                          primary={composition.name}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }}
                        />
                        <Chip
                          label={isExcluded ? t("excluded", { ns: "orders", defaultValue: "Excluded" }) : t("included", { ns: "orders", defaultValue: "Included" })}
                          color={isExcluded ? "error" : "success"}
                          size="small"
                          icon={isExcluded ? <X className="h-3 w-3" /> : <List className="h-3 w-3" />}
                        />
                      </ListItem>
                    );
                  })}
                </MuiList>
              </>
            )}
          </Box>
        </Popover>
      
    </>
  );
};
