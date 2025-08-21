import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { ProductType, ProductTypeComposition } from "@/types";
import { getProductTypeCompositions } from "@/api/productTypeCompositionService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartItemCompositionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productType: ProductType;
  excludedCompositionIds: number[];
  onSave: (excludedIds: number[]) => void;
  onUpdateNotes?: (notes: string) => void;
  currentNotes?: string;
}

export const CartItemCompositionsDialog: React.FC<CartItemCompositionsDialogProps> = ({
  isOpen,
  onOpenChange,
  productType,
  excludedCompositionIds,
  onSave,
  onUpdateNotes,
  currentNotes = "",
}) => {
  const { t } = useTranslation(["common", "services", "orders"]);

  const { data, isLoading } = useQuery({
    queryKey: ["productTypeCompositions", productType.id],
    queryFn: () => getProductTypeCompositions(productType.id),
    enabled: isOpen,
  });

  const compositions: ProductTypeComposition[] = data?.data || [];

  const [localExcluded, setLocalExcluded] = React.useState<number[]>(excludedCompositionIds);

  React.useEffect(() => {
    if (isOpen) {
      setLocalExcluded(excludedCompositionIds);
    }
  }, [isOpen, excludedCompositionIds]);

  const toggle = (compositionId: number) => {
    setLocalExcluded(prev => {
      const newExcluded = prev.includes(compositionId)
        ? prev.filter(id => id !== compositionId)
        : [...prev, compositionId];
      
      // Update notes automatically when compositions are toggled
      if (onUpdateNotes) {
        const excludedCompositions = compositions.filter(c => 
          newExcluded.includes(c.product_composition_id || c.id)
        );
        
        let newNotes = currentNotes;
        
        // Remove any existing composition notes
        const lines = currentNotes.split('\n').filter(line => 
          !line.includes('Excluded:') && !line.includes('لا يتضمن:')
        );
        
        if (excludedCompositions.length > 0) {
          const excludedNames = excludedCompositions.map(c => c.name).join(', ');
          const excludedNote = `Excluded: ${excludedNames}`;
          lines.push(excludedNote);
        }
        
        newNotes = lines.join('\n').trim();
        onUpdateNotes(newNotes);
      }
      
      return newExcluded;
    });
  };

  const handleSave = () => {
    onSave(localExcluded);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            {t("itemCompositions", { ns: "orders", defaultValue: "Item Compositions" })}
            <Badge variant="secondary" className="ml-auto">
              {productType.name}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            {t("loading", { defaultValue: "Loading..." })}
          </div>
        ) : compositions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <List className="h-10 w-10 mx-auto mb-3 opacity-60" />
            <p>{t("noCompositionsAvailable", { ns: "services", defaultValue: "No compositions available" })}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              {t("tapToIncludeExclude", { ns: "orders", defaultValue: "Tap to include/exclude each composition" })}
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
              {compositions.map(c => {
                const excluded = localExcluded.includes(c.product_composition_id || c.id);
                const compositionId = c.product_composition_id || c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(compositionId)}
                    className={cn(
                      "flex items-center justify-between w-full rounded-md border p-2 text-left transition-colors",
                      excluded
                        ? "bg-red-50 border-red-200 hover:bg-red-100"
                        : "bg-green-50 border-green-200 hover:bg-green-100"
                    )}
                  >
                    <span className="text-sm font-medium">{c.name}</span>
                    {excluded ? (
                      <span className="inline-flex items-center text-red-600 font-medium">
                        <X className="h-4 w-4 mr-1" />
                        {t("excluded", { ns: "orders", defaultValue: "Excluded" })}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-green-700 font-medium">
                        <Check className="h-4 w-4 mr-1" />
                        {t("included", { ns: "orders", defaultValue: "Included" })}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel", { ns: "common", defaultValue: "Cancel" })}
              </Button>
              <Button onClick={handleSave}>
                {t("save", { ns: "common", defaultValue: "Save" })}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CartItemCompositionsDialog;


