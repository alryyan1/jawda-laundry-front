// src/pages/services/product-types/components/AddCompositionDialog.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createProductComposition } from "@/api/productCompositionService";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Plus,
} from "lucide-react";

interface AddCompositionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCompositionAdded?: (composition: any) => void;
}

export function AddCompositionDialog({
  isOpen,
  onOpenChange,
  onCompositionAdded,
}: AddCompositionDialogProps) {
  const { t } = useTranslation(["common", "services"]);
  const queryClient = useQueryClient();

  const [compositionName, setCompositionName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create composition mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string }) => createProductComposition(data),
    onSuccess: (response) => {
      toast.success(t("compositionCreatedSuccess", { 
        ns: "services", 
        defaultValue: "Composition created successfully" 
      }));
      
      // Invalidate the compositions query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['productCompositions'] });
      
      // Call the callback if provided
      if (onCompositionAdded && response.data) {
        onCompositionAdded(response.data);
      }
      
      // Reset form and close dialog
      setCompositionName("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("compositionCreateFailed", { 
        ns: "services", 
        defaultValue: "Failed to create composition" 
      }));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!compositionName.trim()) {
      toast.error(t("compositionNameRequired", { 
        ns: "services", 
        defaultValue: "Composition name is required" 
      }));
      return;
    }

    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({ name: compositionName.trim() });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCompositionName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t("addNewComposition", { ns: "services", defaultValue: "Add New Composition" })}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="composition-name">
              {t("compositionName", { ns: "services", defaultValue: "Composition Name" })}
            </Label>
            <Input
              id="composition-name"
              type="text"
              value={compositionName}
              onChange={(e) => setCompositionName(e.target.value)}
              placeholder={t("enterCompositionName", { 
                ns: "services", 
                defaultValue: "Enter composition name..." 
              })}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {t("cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button type="submit" disabled={isSubmitting || !compositionName.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("creating", { defaultValue: "Creating..." })}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("create", { defaultValue: "Create" })}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
