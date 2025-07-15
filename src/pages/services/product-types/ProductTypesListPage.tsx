// src/pages/services/product-types/ProductTypesListPage.tsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";

import type { ProductType, PaginatedResponse } from "@/types";
import {
  getProductTypesPaginated,
  deleteProductType,
} from "@/api/productTypeService";
import { useDebounce } from "@/hooks/useDebounce";
import { getProductCategories } from '@/services/productCategoryService';
import type { ProductCategory } from '@/types/service.types';
import { ManageOfferingsDialog } from '../offerings/components/ManageOfferingsDialog';

import { PageHeader } from "@/components/shared/PageHeader";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { ProductTypeFormModal } from "./ProductTypeFormModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusCircle,
  Edit3,
  Trash2,
  MoreHorizontal,
  Loader2,
  Shirt,
  Check,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

const ProductTypesListPage: React.FC = () => {
  const { t, i18n } = useTranslation(["common", "services", "validation"]);
  const queryClient = useQueryClient();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProductType, setEditingProductType] =
    useState<ProductType | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ProductType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [offeringsDialogOpen, setOfferingsDialogOpen] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ['productCategories'],
    queryFn: getProductCategories,
  });

  const {
    data: paginatedData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<PaginatedResponse<ProductType>, Error>({
    queryKey: ["productTypes", currentPage, itemsPerPage, debouncedSearchTerm, sortBy, sortOrder, selectedCategory],
    queryFn: () =>
      getProductTypesPaginated(currentPage, itemsPerPage, debouncedSearchTerm, sortBy, sortOrder, selectedCategory ?? undefined),
    placeholderData: keepPreviousData,
  });

  const productTypes = paginatedData?.data || [];
  const totalItems = paginatedData?.meta?.total || 0;
  const totalPages = paginatedData?.meta?.last_page || 1;

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: (id) => deleteProductType(id).then(() => {}),
    onSuccess: () => {
      toast.success(
        t("productTypeDeletedSuccess", {
          ns: "services",
          name: itemToDelete?.name || "",
        })
      );
      queryClient.invalidateQueries({ queryKey: ["productTypes"] });
      queryClient.invalidateQueries({ queryKey: ["allProductTypesForSelect"] });
      setItemToDelete(null);
    },
    onError: (error) => {
      toast.error(
        error.message || t("productTypeDeleteFailed", { ns: "services" })
      );
      setItemToDelete(null);
    },
  });

  const handleOpenAddModal = () => {
    setEditingProductType(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (pt: ProductType) => {
    setEditingProductType(pt);
    setIsFormModalOpen(true);
  };

  const MemoizedTableRow = React.memo(
    ({ productType }: { productType: ProductType }) => {
      return (
        <TableRow key={productType.id}>
          <TableCell>
            {productType.id}
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-md">
                <AvatarImage
                  src={productType.image_url || undefined}
                  alt={productType.name}
                />
                <AvatarFallback className="rounded-md bg-muted">
                  <Shirt className="h-5 w-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{productType.name}</span>
            </div>
          </TableCell>
          <TableCell>
            {productType.category?.name ||
              t("uncategorized", { ns: "services" })}
          </TableCell>
          <TableCell>
            <div className="flex items-center justify-center">
              {productType.is_dimension_based ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </TableCell>
          <TableCell className="text-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedProductType(productType);
                setOfferingsDialogOpen(true);
              }}
            >
              {t('manageOfferings', { ns: 'services', defaultValue: 'Manage Offerings' })}
            </Button>
          </TableCell>
          <TableCell className="text-right rtl:text-left">
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
                  onClick={() => handleOpenEditModal(productType)}
                >
                  <Edit3 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t("edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => setItemToDelete(productType)}
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      );
    }
  );

  return (
    <div>
      <PageHeader
        title={t("productTypesTitle", { ns: "services" })}
        description={t("productTypesDescription", { ns: "services" })}
        actionButton={{
          label: t("newProductTypeBtn", { ns: "services" }),
          icon: PlusCircle,
          onClick: handleOpenAddModal,
        }}
        showRefreshButton
        onRefresh={refetch}
        isRefreshing={isFetching && !isLoading}
      />

      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <Input
          placeholder={t("searchProductTypes", {
            ns: "services",
            defaultValue: "Search by product or category name...",
          })}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <select
          className="border rounded px-3 py-2 text-sm"
          value={selectedCategory ?? ''}
          onChange={e => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">{t('allCategories', { ns: 'services', defaultValue: 'All Categories' })}</option>
          {categories.map((cat: ProductCategory) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="min-w-[250px] cursor-pointer hover:bg-muted/50 text-center"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center gap-1">
                  {t("id", { ns: "common" })}
                  {getSortIcon("id")}
                </div>
              </TableHead>
              <TableHead 
                className="min-w-[250px] cursor-pointer hover:bg-muted/50 text-center"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1">
                  {t("name")}
                  {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead className="text-center">{t("category", { ns: "services" })}</TableHead>
              {/* <TableHead className="text-center">
                {t("dimensionBased", {
                  ns: "services",
                  defaultValue: "Dimension Based",
                })}
              </TableHead> */}
              <TableHead className="text-center">
                {t('serviceOfferings', { ns: 'services', defaultValue: 'Service Offerings' })}
              </TableHead>
              <TableHead className="text-center w-[80px]">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && productTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex justify-center items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>
                      {t("loadingProductTypes", {
                        ns: "services",
                        defaultValue: "Loading product types...",
                      })}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : productTypes.length > 0 ? (
              productTypes.map((pt) => (
                <MemoizedTableRow key={pt.id} productType={pt} />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-muted-foreground"
                >
                  {t("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {t("pagination.showingItems", {
            ns: "common",
            first: paginatedData?.meta.from || 0,
            last: paginatedData?.meta.to || 0,
            total: totalItems,
          })}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1 || isFetching}
          >
            {" "}
            {t("firstPage")}{" "}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isFetching}
          >
            {" "}
            {t("previous")}{" "}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages || isFetching}
          >
            {" "}
            {t("next")}{" "}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || isFetching}
          >
            {" "}
            {t("lastPage")}{" "}
          </Button>
        </div>
      </div>

      {/* Modals are rendered here */}
      <ProductTypeFormModal
        isOpen={isFormModalOpen}
        onOpenChange={(isOpen) => {
          setIsFormModalOpen(isOpen);
          if (!isOpen) setEditingProductType(null);
        }}
        editingProductType={editingProductType}
      />
      <DeleteConfirmDialog
        isOpen={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) deleteMutation.mutate(itemToDelete.id);
        }}
        itemName={itemToDelete?.name}
        itemType="productTypeLC"
        isPending={deleteMutation.isPending}
      />
      {selectedProductType && (
        <ManageOfferingsDialog
          isOpen={offeringsDialogOpen}
          onOpenChange={setOfferingsDialogOpen}
          productType={selectedProductType}
        />
      )}
    </div>
  );
};
export default ProductTypesListPage;
