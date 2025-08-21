// src/pages/services/product-types/components/CompositionFormModal.tsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";

import type { ProductTypeComposition, ProductComposition } from "@/types";
import { getProductCompositions } from "@/api/productCompositionService";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  AlertCircle,
} from "lucide-react";

// Validation schema
const compositionSchema = z.object({
  product_composition_id: z.number().min(1, "يجب اختيار مكون"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type CompositionFormData = z.infer<typeof compositionSchema>;

interface CompositionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompositionFormData) => void;
  composition?: ProductTypeComposition | null;
  isLoading?: boolean;
}

export function CompositionFormModal({
  isOpen,
  onClose,
  onSubmit,
  composition,
  isLoading = false,
}: CompositionFormModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available product compositions
  const { data: productCompositionsResponse, isLoading: isLoadingCompositions } = useQuery({
    queryKey: ['productCompositions'],
    queryFn: getProductCompositions,
    enabled: isOpen,
  });

  const productCompositions = productCompositionsResponse?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompositionFormData>({
    resolver: zodResolver(compositionSchema),
    defaultValues: {
      product_composition_id: 0,
      description: "",
      is_active: true,
    },
  });

  // Reset form when composition changes
  useEffect(() => {
    if (composition) {
      reset({
        product_composition_id: composition.product_composition_id,
        description: composition.description || "",
        is_active: composition.is_active,
      });
    } else {
      reset({
        product_composition_id: 0,
        description: "",
        is_active: true,
      });
    }
  }, [composition, reset]);

  const handleFormSubmit = async (data: CompositionFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCompositionId = watch("product_composition_id");
  const selectedComposition = selectedCompositionId > 0 ? productCompositions.find(c => c.id === selectedCompositionId) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {composition ? t("تعديل المكون") : t("إضافة مكون جديد")}
          </DialogTitle>
          <DialogDescription>
            {composition 
              ? t("قم بتعديل تفاصيل المكون")
              : t("أضف مكون جديد لنوع المنتج")
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Product Composition Selection */}
          <div className="space-y-2">
            <Label htmlFor="product_composition_id">
              {t("المكون", { ns: "services", defaultValue: "Composition" })} *
            </Label>
            <Select
              value={selectedCompositionId > 0 ? selectedCompositionId.toString() : ""}
              onValueChange={(value) => {
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue > 0) {
                  setValue("product_composition_id", numValue);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("اختر المكون", { ns: "services", defaultValue: "Select composition" })} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCompositions ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("جاري التحميل...", { defaultValue: "Loading..." })}
                    </div>
                  </SelectItem>
                ) : productCompositions.length === 0 ? (
                  <SelectItem value="no-data" disabled>
                    {t("لا توجد مكونات متاحة", { ns: "services", defaultValue: "No compositions available" })}
                  </SelectItem>
                ) : (
                  productCompositions.map((comp: ProductComposition) => (
                    <SelectItem key={comp.id} value={comp.id.toString()}>
                      {comp.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.product_composition_id && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.product_composition_id.message}
              </p>
            )}
          </div>

          {/* Selected Composition Info */}
          {selectedComposition && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{t("المكون المختار", { ns: "services", defaultValue: "Selected composition" })}:</strong> {selectedComposition.name}
              </p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t("الوصف", { ns: "common", defaultValue: "Description" })}
            </Label>
            <Textarea
              id="description"
              placeholder={t("وصف اختياري للمكون", { ns: "services", defaultValue: "Optional description for this composition" })}
              {...register("description")}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch("is_active")}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
            <Label htmlFor="is_active">
              {t("مفعل", { ns: "common", defaultValue: "Active" })}
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t("إلغاء", { ns: "common", defaultValue: "Cancel" })}
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("جاري الحفظ...", { defaultValue: "Saving..." })}
                </>
              ) : (
                composition ? t("تحديث", { ns: "common", defaultValue: "Update" }) : t("إضافة", { ns: "common", defaultValue: "Add" })
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
