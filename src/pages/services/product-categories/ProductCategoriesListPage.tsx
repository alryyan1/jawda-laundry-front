// src/pages/services/product-categories/ProductCategoriesListPage.tsx
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import type { ProductCategory } from "@/types";
import {
  getProductCategories,
  deleteProductCategory,
} from "@/api/productCategoryService"; // create/update are handled by modal

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { ProductCategoryFormModal } from "./ProductCategoryFormModal"; // Import the modal
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Edit3,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const ProductCategoriesListPage: React.FC = () => {
  const { t, i18n } = useTranslation(["common", "services", "validation"]);
  const queryClient = useQueryClient();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] =
    useState<ProductCategory | null>(null);

  const {
    data: categories = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<ProductCategory[], Error>({
    queryKey: ["productCategories"],
    queryFn: getProductCategories,
  });

  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: (id) => deleteProductCategory(id).then(() => {}),
    onSuccess: () => {
      toast.success(
        t("categoryDeletedSuccess", {
          ns: "services",
          name: categoryToDelete?.name || "",
        })
      );
      queryClient.invalidateQueries({ queryKey: ["productCategories"] });
      setCategoryToDelete(null);
    },
    onError: (error) => {
      toast.error(
        error.message || t("categoryDeleteFailed", { ns: "services" })
      );
      setCategoryToDelete(null); // Also clear on error
    },
  });

  const handleOpenAddModal = () => {
    setEditingCategory(null); // Ensure no editing data is present
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (category: ProductCategory) => {
    setEditingCategory(category);
    setIsFormModalOpen(true);
  };

  const columns: ColumnDef<ProductCategory>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: t("name", { ns: "common" }),
        cell: ({ row }) => (
          <div className="font-medium">{row.original.name}</div>
        ),
      },
      {
        accessorKey: "description",
        header: t("description", { ns: "common" }),
        cell: ({ row }) => (
          <p className="truncate max-w-sm text-sm text-muted-foreground">
            {row.original.description || "-"}
          </p>
        ),
      },
      // Example: Count of product types in this category
      // {
      //     accessorKey: "product_types_count", // Assuming this is returned by API
      //     header: t('productTypesCount', { ns: 'services', defaultValue: 'Product Types' }),
      //     cell: ({ row }) => <div className="text-center">{row.original.product_types_count || 0}</div>
      // },
      {
        id: "actions",
        header: () => (
          <div className="text-right rtl:text-left">
            {t("actions", { ns: "common" })}
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right rtl:text-left">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t("openMenu")}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={i18n.dir() === "rtl" ? "start" : "end"}
              >
                <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleOpenEditModal(row.original)}
                >
                  <Edit3 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t("edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => setCategoryToDelete(row.original)}
                  onSelect={(e) => e.preventDefault()} // Keep dropdown open for AlertDialog
                >
                  <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [t, i18n.dir, handleOpenEditModal, setCategoryToDelete]
  ); // Dependencies for memoization

  return (
    <div>
      <PageHeader
        title={t("productCategoriesTitle", { ns: "services" })}
        description={t("productCategoriesDescription", { ns: "services" })}
        actionButton={{
          label: t("newCategoryBtn", { ns: "services" }),
          icon: PlusCircle,
          onClick: handleOpenAddModal,
        }}
        showRefreshButton
        onRefresh={refetch}
        isRefreshing={isFetching && !isLoading}
      />

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading || isFetching}
      />

      <ProductCategoryFormModal
        isOpen={isFormModalOpen}
        onOpenChange={(isOpen) => {
          setIsFormModalOpen(isOpen);
          if (!isOpen) setEditingCategory(null); // Clear editing state when modal is closed
        }}
        editingCategory={editingCategory}
      />

      <DeleteConfirmDialog
        isOpen={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) deleteMutation.mutate(categoryToDelete.id);
        }}
        itemName={categoryToDelete?.name}
        itemType="productCategoryLC" // Translation key for "product category"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};
export default ProductCategoriesListPage;
