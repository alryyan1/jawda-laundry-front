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
import { updateFirstOfferingPrice } from '@/api/serviceOfferingService';

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
  Utensils,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";

// Mobile Card Component for responsive display
const MobileMemoizedCard = React.memo(
  ({ productType, editingPrice, setEditingPrice, updatePriceMutation, setSelectedProductType, setOfferingsDialogOpen, handleOpenEditModal, setItemToDelete, t, i18n }: { 
    productType: ProductType; 
    editingPrice: { id: number; price: number } | null;
    setEditingPrice: (value: { id: number; price: number } | null) => void;
    updatePriceMutation: { mutate: (variables: { productTypeId: number; price: number }) => void; isPending: boolean };
    setSelectedProductType: (productType: ProductType) => void;
    setOfferingsDialogOpen: (open: boolean) => void;
    handleOpenEditModal: (productType: ProductType) => void;
    setItemToDelete: (productType: ProductType) => void;
    t: (key: string, options?: { ns?: string; defaultValue?: string }) => string;
    i18n: { dir: () => string };
  }) => {
    const hasMultipleOfferings = Number(productType.service_offerings_count) > 1;
    
    return (
      <div className={`p-4 ${hasMultipleOfferings ? "bg-amber-50/50" : ""}`}>
        {/* Header with Avatar and Name */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-12 w-12 rounded-md flex-shrink-0">
            <AvatarImage
              src={productType.image_url || undefined}
              alt={productType.name}
            />
            <AvatarFallback className="rounded-md bg-muted">
              <Utensils className="h-6 w-6 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm leading-tight truncate" title={productType.name}>
                  {productType.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  ID: <span className="font-mono">{productType.id}</span>
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                    <span className="sr-only">{t("openMenu")}</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={i18n.dir() === "rtl" ? "start" : "end"}>
                  <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleOpenEditModal(productType)}>
                    <Edit3 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                    {t("edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedProductType(productType);
                      setOfferingsDialogOpen(true);
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                    {t('manageOfferings', { ns: 'services', defaultValue: 'Manage Offerings' })}
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
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-2 text-sm">
          {/* Category */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t("category", { ns: "services" })}:</span>
            <span className="font-medium truncate max-w-[60%] text-right" title={productType.category?.name || t("uncategorized", { ns: "services" })}>
              {productType.category?.name || t("uncategorized", { ns: "services" })}
            </span>
          </div>

          {/* Price */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t('price', { ns: 'common', defaultValue: 'Price' })}:</span>
            <div className="flex items-center gap-2">
              {productType.first_service_offering && productType.first_service_offering.default_price !== null ? (
                editingPrice?.id === productType.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingPrice.price}
                      onChange={(e) => setEditingPrice({ id: productType.id, price: parseFloat(e.target.value) || 0 })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updatePriceMutation.mutate({
                            productTypeId: productType.id,
                            price: editingPrice.price
                          });
                        } else if (e.key === 'Escape') {
                          setEditingPrice(null);
                        }
                      }}
                      className="w-20 h-7 text-xs"
                      disabled={updatePriceMutation.isPending}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (editingPrice) {
                          updatePriceMutation.mutate({
                            productTypeId: productType.id,
                            price: editingPrice.price
                          });
                        }
                      }}
                      disabled={updatePriceMutation.isPending}
                      className="h-7 w-7 p-0"
                    >
                      {updatePriceMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingPrice(null)}
                      disabled={updatePriceMutation.isPending}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      {(() => {
                        try {
                          return (Number(productType.first_service_offering.default_price) || 0).toFixed(2);
                        } catch {
                          return '0.00';
                        }
                      })()}
                    </span>
                    {Number(productType.service_offerings_count) === 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          try {
                            setEditingPrice({
                              id: productType.id,
                              price: Number(productType.first_service_offering?.default_price) || 0
                            });
                          } catch {
                            setEditingPrice({
                              id: productType.id,
                              price: 0
                            });
                          }
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )
              ) : productType.first_service_offering ? (
                <span className="text-muted-foreground text-xs">
                  {t('noPrice', { ns: 'services', defaultValue: 'No price set' })}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">
                  {t('noOfferings', { ns: 'services', defaultValue: 'No offerings' })}
                </span>
              )}
            </div>
          </div>

          {/* Service Offerings Count */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t('serviceOfferings', { ns: 'services', defaultValue: 'Offerings' })}:</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">{productType.service_offerings_count ?? 0}</span>
              {Number(productType.service_offerings_count) > 1 && (
                <div className="flex items-center gap-1 text-amber-600" title={t('multipleOfferings', { ns: 'services', defaultValue: 'Multiple service offerings' })}>
                  <AlertTriangle className="h-3 w-3" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

const ProductTypesListPage: React.FC = () => {
  const { t, i18n } = useTranslation(["common", "services", "validation"]);
  const queryClient = useQueryClient();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProductType, setEditingProductType] =
    useState<ProductType | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ProductType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [offeringsDialogOpen, setOfferingsDialogOpen] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
  const [editingPrice, setEditingPrice] = useState<{ id: number; price: number } | null>(null);

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

  const updatePriceMutation = useMutation<void, Error, { productTypeId: number; price: number }>({
    mutationFn: ({ productTypeId, price }) => updateFirstOfferingPrice(productTypeId, price).then(() => {}),
    onSuccess: () => {
      toast.success(t("priceUpdatedSuccess", { ns: "services", defaultValue: "Price updated successfully" }));
      queryClient.invalidateQueries({ queryKey: ["productTypes"] });
      setEditingPrice(null);
    },
    onError: (error) => {
      toast.error(error.message || t("priceUpdateFailed", { ns: "services", defaultValue: "Failed to update price" }));
      setEditingPrice(null);
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
      const hasMultipleOfferings = Number(productType.service_offerings_count) > 1;
      
      return (
        <TableRow 
          key={productType.id}
          className={hasMultipleOfferings ? "bg-amber-50/50 hover:bg-amber-100/50" : ""}
        >
          <TableCell className="text-center w-16">
            <span className="font-mono text-xs">{productType.id}</span>
          </TableCell>
          <TableCell className="text-center">
            <div className="flex items-center justify-center gap-2 w-full min-w-0">
              <Avatar className="h-8 w-8 rounded-md flex-shrink-0">
                <AvatarImage
                  src={productType.image_url || undefined}
                  alt={productType.name}
                />
                <AvatarFallback className="rounded-md bg-muted">
                  <Utensils className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                <span 
                  className="font-medium truncate flex-1 text-sm" 
                  title={productType.name}
                >
                  {productType.name}
                </span>
                {Number(productType.service_offerings_count) > 1 && (
                  <div className="flex items-center gap-1 px-1 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium flex-shrink-0">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    <span className="text-xs">{productType.service_offerings_count}</span>
                  </div>
                )}
              </div>
            </div>
          </TableCell>
          <TableCell className="text-center w-24 hidden lg:table-cell">
            <span 
              className="truncate block px-1 text-xs"
              title={productType.category?.name || t("uncategorized", { ns: "services" })}
            >
              {productType.category?.name || t("uncategorized", { ns: "services" })}
            </span>
          </TableCell>
          <TableCell className="text-center w-20">
            {productType.first_service_offering && productType.first_service_offering.default_price !== null ? (
              editingPrice?.id === productType.id ? (
                <div className="flex flex-col items-center gap-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingPrice.price}
                    onChange={(e) => setEditingPrice({ id: productType.id, price: parseFloat(e.target.value) || 0 })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updatePriceMutation.mutate({
                          productTypeId: productType.id,
                          price: editingPrice.price
                        });
                      } else if (e.key === 'Escape') {
                        setEditingPrice(null);
                      }
                    }}
                    className="w-full h-6 text-xs"
                    disabled={updatePriceMutation.isPending}
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (editingPrice) {
                          updatePriceMutation.mutate({
                            productTypeId: productType.id,
                            price: editingPrice.price
                          });
                        }
                      }}
                      disabled={updatePriceMutation.isPending}
                      className="h-5 w-5 p-0"
                    >
                      {updatePriceMutation.isPending ? (
                        <Loader2 className="h-2 w-2 animate-spin" />
                      ) : (
                        <Check className="h-2 w-2" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingPrice(null)}
                      disabled={updatePriceMutation.isPending}
                      className="h-5 w-5 p-0"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="font-medium text-xs">
                    {(() => {
                      try {
                        return (Number(productType.first_service_offering.default_price) || 0).toFixed(2);
                      } catch {
                        return '0.00';
                      }
                    })()}
                  </span>
                  {Number(productType.service_offerings_count) === 1 ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        try {
                          setEditingPrice({
                            id: productType.id,
                            price: Number(productType.first_service_offering?.default_price) || 0
                          });
                        } catch {
                          setEditingPrice({
                            id: productType.id,
                            price: 0
                          });
                        }
                      }}
                      className="h-4 w-4 p-0"
                    >
                      <Edit3 className="h-2 w-2" />
                    </Button>
                  ) : Number(productType.service_offerings_count) > 1 ? (
                    <div className="flex items-center gap-1 text-amber-600" title={t('multipleOfferings', { ns: 'services', defaultValue: 'Multiple service offerings' })}>
                      <AlertTriangle className="h-2 w-2" />
                      <span className="text-xs font-medium">{productType.service_offerings_count}</span>
                    </div>
                  ) : null}
                </div>
              )
            ) : productType.first_service_offering ? (
              <span className="text-muted-foreground text-xs">
                {t('noPrice', { ns: 'services', defaultValue: 'No price' })}
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">
                {t('noOfferings', { ns: 'services', defaultValue: 'No offers' })}
              </span>
            )}
          </TableCell>
          <TableCell className="text-center w-24 hidden xl:table-cell">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedProductType(productType);
                setOfferingsDialogOpen(true);
              }}
              className="whitespace-nowrap text-xs h-6 px-2"
            >
              {t('manage', { ns: 'common', defaultValue: 'Manage' })}
            </Button>
          </TableCell>
          <TableCell className="text-center w-16">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-6 w-6 p-0">
                  <span className="sr-only">{t("openMenu")}</span>
                  <MoreHorizontal className="h-3 w-3" />
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
    <div className="container mx-auto px-4 py-6 max-w-7xl">
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
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground whitespace-nowrap">
            {t('rowsPerPage', { defaultValue: 'Rows per page' })}:
          </label>
          <select
            className="border rounded px-3 py-2 text-sm"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
      </div>

      <div className="rounded-md border">
        {/* Legend for multiple offerings indicator */}
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                <AlertTriangle className="h-3 w-3" />
                <span>2</span>
              </div>
              <span className="hidden sm:inline">{t('multipleOfferingsLegend', { ns: 'services', defaultValue: 'Multiple service offerings (price editing disabled)' })}</span>
              <span className="sm:hidden">{t('multipleOfferings', { ns: 'services', defaultValue: 'Multiple offerings' })}</span>
            </div>
          </div>
        </div>
        
        {/* Desktop/Tablet Table View */}
        <div className="hidden md:block overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="w-16 cursor-pointer hover:bg-muted/50 text-center"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs">{t("id", { ns: "common" })}</span>
                      {getSortIcon("id")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-center"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {t("name")}
                      {getSortIcon("name")}
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-24 hidden lg:table-cell">{t("category", { ns: "services" })}</TableHead>
                  <TableHead className="text-center w-20">
                    {t('price', { ns: 'common', defaultValue: 'Price' })}
                  </TableHead>
                  <TableHead className="text-center w-24 hidden xl:table-cell">
                    {t('serviceOfferings', { ns: 'services', defaultValue: 'Offerings' })}
                  </TableHead>
                  <TableHead className="text-center w-16">
                    {t("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && productTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
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
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      {t("noResults")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {isLoading && productTypes.length === 0 ? (
            <div className="p-8 text-center">
              <div className="flex justify-center items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>
                  {t("loadingProductTypes", {
                    ns: "services",
                    defaultValue: "Loading product types...",
                  })}
                </span>
              </div>
            </div>
          ) : productTypes.length > 0 ? (
            <div className="divide-y">
              {productTypes.map((productType) => (
                <MobileMemoizedCard 
                  key={productType.id} 
                  productType={productType}
                  editingPrice={editingPrice}
                  setEditingPrice={setEditingPrice}
                  updatePriceMutation={updatePriceMutation}
                  setSelectedProductType={setSelectedProductType}
                  setOfferingsDialogOpen={setOfferingsDialogOpen}
                  handleOpenEditModal={handleOpenEditModal}
                  setItemToDelete={setItemToDelete}
                  t={t}
                  i18n={i18n}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {t("noResults")}
            </div>
          )}
        </div>
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
