// src/pages/services/product-types/components/ManageCompositionsDialog.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ProductType, ProductTypeComposition, ProductComposition } from "@/types";
import { 
  getProductTypeCompositions, 
  createComposition, 
  deleteComposition
} from "@/api/productTypeCompositionService";
import { getProductCompositions } from "@/api/productCompositionService";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  List,
  Loader2,
  Save,
} from "lucide-react";

interface ManageCompositionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productType: ProductType;
}

interface CompositionWithStatus extends ProductComposition {
  isAssigned: boolean;
  assignmentId?: number;
}

export function ManageCompositionsDialog({
  isOpen,
  onOpenChange,
  productType,
}: ManageCompositionsDialogProps) {
  const { t } = useTranslation(["common", "services"]);
  const queryClient = useQueryClient();

  const [compositionsWithStatus, setCompositionsWithStatus] = useState<CompositionWithStatus[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all available compositions
  const { data: allCompositionsResponse, isLoading: isLoadingAllCompositions } = useQuery({
    queryKey: ['productCompositions'],
    queryFn: getProductCompositions,
    enabled: isOpen,
  });

  // Fetch current assignments for this product type
  const { data: currentAssignmentsResponse, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ["productTypeCompositions", productType.id],
    queryFn: () => getProductTypeCompositions(productType.id),
    enabled: isOpen,
  });

  // Process data when both queries are loaded
  React.useEffect(() => {
    if (allCompositionsResponse?.data && currentAssignmentsResponse?.data) {
      const allCompositions = allCompositionsResponse.data;
      const currentAssignments = currentAssignmentsResponse.data;
      
      const compositionsWithStatus = allCompositions.map((comp: ProductComposition): CompositionWithStatus => {
        const assignment = currentAssignments.find((a: ProductTypeComposition) => 
          a.product_composition_id === comp.id
        );
        
        return {
          ...comp,
          isAssigned: !!assignment,
          assignmentId: assignment?.id,
        };
      });

      setCompositionsWithStatus(compositionsWithStatus);
    }
  }, [allCompositionsResponse?.data, currentAssignmentsResponse?.data]);

  // Create composition assignment mutation
  const createMutation = useMutation({
    mutationFn: (data: { product_composition_id: number; description?: string; is_active: boolean }) => createComposition(productType.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productTypeCompositions", productType.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("compositionCreateFailed", { ns: "services", defaultValue: "Failed to create composition" }));
    },
  });

  // Delete composition assignment mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteComposition(productType.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productTypeCompositions", productType.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("compositionDeleteFailed", { ns: "services", defaultValue: "Failed to delete composition" }));
    },
  });

  const handleCompositionToggle = (compositionId: number, checked: boolean) => {
    setCompositionsWithStatus(prev => 
      prev.map(comp => 
        comp.id === compositionId 
          ? { ...comp, isAssigned: checked }
          : comp
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Process all changes
      for (const composition of compositionsWithStatus) {
        if (composition.isAssigned && !composition.assignmentId) {
          // Create new assignment
          await createMutation.mutateAsync({
            product_composition_id: composition.id,
            description: "",
            is_active: true,
          });
        } else if (!composition.isAssigned && composition.assignmentId) {
          // Delete assignment
          await deleteMutation.mutateAsync(composition.assignmentId);
        }
      }

      toast.success(t("compositionsUpdatedSuccess", { ns: "services", defaultValue: "Compositions updated successfully" }));
      onOpenChange(false);
    } catch {
      toast.error(t("compositionsUpdateFailed", { ns: "services", defaultValue: "Failed to update compositions" }));
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isLoadingAllCompositions || isLoadingAssignments;
  const assignedCount = compositionsWithStatus.filter(c => c.isAssigned).length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            {t("manageCompositions", { ns: "services", defaultValue: "Manage Compositions" })} - {productType.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header with Save Button */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {t("assignedCompositionsCount", { 
                ns: "services", 
                defaultValue: "{{count}} of {{total}} compositions assigned", 
                count: assignedCount,
                total: compositionsWithStatus.length
              })}
            </div>
            <Button onClick={handleSave} disabled={isSaving || isLoading} size="sm">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("saving", { defaultValue: "Saving..." })}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t("save", { defaultValue: "Save" })}
                </>
              )}
            </Button>
          </div>

          {/* Compositions Checklist */}
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">{t("loading", { defaultValue: "Loading..." })}</span>
            </div>
          ) : compositionsWithStatus.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("noCompositionsAvailable", { ns: "services", defaultValue: "No compositions available" })}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {compositionsWithStatus.map((composition) => (
                <div key={composition.id} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={`composition-${composition.id}`}
                    checked={composition.isAssigned}
                    onCheckedChange={(checked) => 
                      handleCompositionToggle(composition.id, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`composition-${composition.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {composition.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
