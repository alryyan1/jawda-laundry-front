// src/pages/services/product-types/ProductTypeFormModal.tsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, X } from "lucide-react";

import type {
  ProductType,
  ProductCategory,
  ProductTypeFormData,
} from "@/types";
import { getProductCategories } from "@/api/productCategoryService";
import { createProductType, updateProductType } from "@/api/productTypeService";

const productTypeSchema = z.object({
  name: z.string().nonempty({ message: "validation.nameRequired" }),
  product_category_id: z
    .string()
    .min(1, { message: "validation.categoryRequired" }),
  description: z.string().optional().or(z.literal("")),
  is_dimension_based: z.boolean().default(false),
  image: z.any().optional(), // Zod handles file validation poorly; we'll rely on backend
});

type ProductTypeFormValues = z.infer<typeof productTypeSchema>;

interface ProductTypeFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingProductType?: ProductType | null;
}

export const ProductTypeFormModal: React.FC<ProductTypeFormModalProps> = ({
  isOpen,
  onOpenChange,
  editingProductType,
}) => {
  const { t } = useTranslation(["common", "services", "validation"]);
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<
    ProductCategory[],
    Error
  >({
    queryKey: ["productCategoriesForSelect"],
    queryFn: getProductCategories,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProductTypeFormValues>({
    resolver: zodResolver(productTypeSchema),
    defaultValues: {
      name: "",
      product_category_id: "",
      description: "",
      is_dimension_based: false,
    },
  });

  useEffect(() => {
    if (editingProductType && isOpen) {
      setValue("name", editingProductType.name);
      setValue(
        "product_category_id",
        editingProductType.product_category_id.toString()
      );
      setValue("description", editingProductType.description || "");
      setValue("is_dimension_based", editingProductType.is_dimension_based);
      setImagePreview(editingProductType.image_url || null);
    } else if (!isOpen) {
      reset({
        name: "",
        product_category_id: "",
        description: "",
        is_dimension_based: false,
      });
      setImagePreview(null);
    }
  }, [editingProductType, isOpen, setValue, reset]);

  const formMutation = useMutation<ProductType, Error, ProductTypeFormData>({
    mutationFn: (data) =>
      editingProductType
        ? updateProductType(editingProductType.id, data)
        : createProductType(data),
    onSuccess: (data) => {
      toast.success(
        editingProductType
          ? t("productTypeUpdatedSuccess", { ns: "services", name: data.name })
          : t("productTypeCreatedSuccess", { ns: "services", name: data.name })
      );
      queryClient.invalidateQueries({ queryKey: ["productTypes"] });
      queryClient.invalidateQueries({ queryKey: ["allProductTypesForSelect"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error.message ||
          (editingProductType
            ? t("productTypeUpdateFailed", { ns: "services" })
            : t("productTypeCreationFailed", { ns: "services" }))
      );
    },
  });

  const onSubmit = (formData: ProductTypeFormValues) => {
    // We construct the FormData object here for API submission
    const apiFormData: ProductTypeFormData = {
      ...formData,
      product_category_id: parseInt(formData.product_category_id, 10), // Convert to number
      image: formData.image?.[0] || null, // Get the File object from FileList
    };
    formMutation.mutate(apiFormData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {editingProductType
              ? t("editProductTypeTitle", { ns: "services" })
              : t("newProductTypeTitle", { ns: "services" })}
          </DialogTitle>
          <DialogDescription>
            {editingProductType
              ? t("editProductTypeDescription", { ns: "services" })
              : t("newProductTypeDescription", { ns: "services" })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Name Field */}
          <div className="grid gap-1.5">
            <Label htmlFor="pt-name">
              {t("name")}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pt-name"
              {...register("name")}
              placeholder={t("egProductTypeName", { ns: "services" })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {t(errors.name.message as string)}
              </p>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="grid gap-1.5">
            <Label htmlFor="pt-category">
              {t("category", { ns: "services" })}
              <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="product_category_id"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoadingCategories}
                >
                  <SelectTrigger id="pt-category">
                    <SelectValue
                      placeholder={
                        isLoadingCategories
                          ? t("loadingCategories", { ns: "services" })
                          : t("selectCategory", { ns: "services" })
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.product_category_id && (
              <p className="text-sm text-destructive">
                {t(errors.product_category_id.message as string)}
              </p>
            )}
          </div>

          {/* Image Upload Field */}
          <div className="grid gap-2">
            <Label htmlFor="pt-image">
              {t("productTypeImageOptional", { ns: "services" })}
            </Label>
            {imagePreview && (
              <div className="relative w-28 h-28">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-md border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => {
                    setValue("image", null); // Clear file list in form state
                    setImagePreview(null); // Clear preview
                  }}
                >
                  {" "}
                  <X className="h-4 w-4" />{" "}
                </Button>
              </div>
            )}
            <Input
              id="pt-image"
              type="file"
              accept="image/*"
              {...register("image", {
                onChange: (e) => {
                  const file = e.target.files?.[0];
                  if (file) setImagePreview(URL.createObjectURL(file));
                  else setImagePreview(null);
                },
              })}
              className="file:text-primary file:font-semibold file:mr-2"
            />
          </div>

          {/* Is Dimension Based Switch */}
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label
                htmlFor="pt-is_dimension_based"
                className="text-base cursor-pointer"
              >
                {t("isDimensionBased", { ns: "services" })}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("isDimensionBasedHint", { ns: "services" })}
              </p>
            </div>
            <Controller
              name="is_dimension_based"
              control={control}
              render={({ field }) => (
                <Switch
                  id="pt-is_dimension_based"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label={t("isDimensionBased", { ns: "services" })}
                />
              )}
            />
          </div>

          {/* Description Textarea */}
          <div className="grid gap-1.5">
            <Label htmlFor="pt-description">
              {t("descriptionOptional", { ns: "common" })}
            </Label>
            <Textarea
              id="pt-description"
              {...register("description")}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={formMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                formMutation.isPending ||
                isLoadingCategories ||
                (!isDirty && !!editingProductType)
              }
            >
              {formMutation.isPending && (
                <Loader2 className="animate-spin h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              )}
              {editingProductType ? t("saveChanges") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
