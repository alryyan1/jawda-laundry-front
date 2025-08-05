// src/pages/customers/CustomerPriceListPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Loader2,
  Package,
  SlidersHorizontal,
  Download,
  Plus,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import { Autocomplete, TextField } from '@mui/material';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getCustomerById } from '@/api/customerService';
import { customerProductTypeService } from '@/api/customerProductTypeService';
import { ManageCustomerPricingDialog } from './components/ManageCustomerPricingDialog';
import type { Customer } from '@/types/customer.types';
import type { CustomerProductType, AvailableProductType } from '@/types/customerProductTypes.types';
import { useDebounce } from '@/hooks/useDebounce';

// Mobile Card Component for responsive display
const MobileMemoizedCard = React.memo(({ 
  customerProductType, 
  handleManagePricing, 
  handleRemoveProductType, 
  removeProductTypeMutation, 
  t 
}: { 
  customerProductType: CustomerProductType;
  handleManagePricing: (customerProductType: CustomerProductType) => void;
  handleRemoveProductType: (customerProductTypeId: number) => void;
  removeProductTypeMutation: { isPending: boolean };
  t: (key: string, options?: { ns?: string; defaultValue?: string }) => string;
}) => {
  return (
    <div className="p-4 border-b last:border-b-0">
      {/* Header with Avatar and Name */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-12 w-12 rounded-md flex-shrink-0">
          <AvatarFallback className="rounded-md bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm leading-tight truncate" title={customerProductType.product_type.name}>
                {customerProductType.product_type.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {customerProductType.product_type.category?.name || t('uncategorized', { defaultValue: 'Uncategorized' })}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                  <span className="sr-only">{t('openMenu')}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleManagePricing(customerProductType)}>
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  {t('managePricing', { defaultValue: 'Manage Pricing' })}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => handleRemoveProductType(customerProductType.id)}
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('remove', { defaultValue: 'Remove' })}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Product Type Details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('pricingType', { defaultValue: 'Pricing Type' })}:</span>
          <Badge variant={customerProductType.product_type.is_dimension_based ? "default" : "secondary"}>
            {customerProductType.product_type.is_dimension_based 
              ? t('dimensionBased', { defaultValue: 'Dimension Based' })
              : t('fixed', { defaultValue: 'Fixed' })
            }
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleManagePricing(customerProductType)}
          className="flex-1"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4"/>
          {t('managePricing', { defaultValue: 'Manage Pricing' })}
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => handleRemoveProductType(customerProductType.id)}
          disabled={removeProductTypeMutation.isPending}
        >
          {t('remove', { defaultValue: 'Remove' })}
        </Button>
      </div>
    </div>
  );
});

const CustomerPriceListPage: React.FC = () => {
    const { t, i18n } = useTranslation(['common', 'customers', 'services']);
    const { customerId } = useParams<{ customerId: string }>();
    const queryClient = useQueryClient();
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("id");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [selectedProductType, setSelectedProductType] = useState<AvailableProductType | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedCustomerProductType, setSelectedCustomerProductType] = useState<CustomerProductType | null>(null);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);

    // Fetch customer details
    const { data: customer, isLoading: isLoadingCustomer } = useQuery<Customer>({
        queryKey: ['customer', customerId],
        queryFn: () => getCustomerById(parseInt(customerId!)),
        enabled: !!customerId,
    });

    // Fetch customer product types
    const { data: customerProductTypesData, isLoading, isFetching, refetch } = useQuery({
        queryKey: ["customerProductTypes", customerId, currentPage, itemsPerPage, debouncedSearchTerm, sortBy, sortOrder],
        queryFn: () => customerProductTypeService.getCustomerProductTypes(parseInt(customerId!)),
        enabled: !!customerId,
        placeholderData: keepPreviousData,
    });

    // Fetch available product types for autocomplete
    const { data: availableProductTypesData } = useQuery({
        queryKey: ["availableProductTypes", customerId],
        queryFn: () => customerProductTypeService.getAvailableProductTypes(parseInt(customerId!)),
        enabled: !!customerId,
    });

    const customerProductTypes = customerProductTypesData?.product_types || [];
    const availableProductTypes = availableProductTypesData?.available_product_types || [];
    const totalItems = customerProductTypes.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

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

    // Import all product types mutation
    const importAllMutation = useMutation({
        mutationFn: (customerId: number) => customerProductTypeService.importAllProductTypes(customerId),
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ["customerProductTypes", customerId] });
            queryClient.invalidateQueries({ queryKey: ["availableProductTypes", customerId] });
        },
        onError: (error: any) => {
            toast.error(error.message || t('failedToImportProductTypes', { defaultValue: 'Failed to import product types' }));
        },
    });

    // Add product type mutation
    const addProductTypeMutation = useMutation({
        mutationFn: ({ customerId, productTypeId }: { customerId: number; productTypeId: number }) =>
            customerProductTypeService.addProductType(customerId, { product_type_id: productTypeId }),
        onSuccess: () => {
            toast.success(t('productTypeAddedSuccessfully', { defaultValue: 'Product type added successfully' }));
            queryClient.invalidateQueries({ queryKey: ["customerProductTypes", customerId] });
            queryClient.invalidateQueries({ queryKey: ["availableProductTypes", customerId] });
            setSelectedProductType(null);
        },
        onError: (error: any) => {
            toast.error(error.message || t('failedToAddProductType', { defaultValue: 'Failed to add product type' }));
        },
    });

    // Remove product type mutation
    const removeProductTypeMutation = useMutation({
        mutationFn: ({ customerId, customerProductTypeId }: { customerId: number; customerProductTypeId: number }) =>
            customerProductTypeService.removeProductType(customerId, customerProductTypeId),
        onSuccess: () => {
            toast.success(t('productTypeRemovedSuccessfully', { defaultValue: 'Product type removed successfully' }));
            queryClient.invalidateQueries({ queryKey: ["customerProductTypes", customerId] });
            queryClient.invalidateQueries({ queryKey: ["availableProductTypes", customerId] });
        },
        onError: (error: any) => {
            toast.error(error.message || t('failedToRemoveProductType', { defaultValue: 'Failed to remove product type' }));
        },
    });

    const handleImportAll = () => {
        if (!customerId) return;
        importAllMutation.mutate(parseInt(customerId));
    };

    const handleAddProductType = () => {
        if (!customerId || !selectedProductType) return;
        addProductTypeMutation.mutate({
            customerId: parseInt(customerId),
            productTypeId: selectedProductType.id
        });
    };

    const handleRemoveProductType = (customerProductTypeId: number) => {
        if (!customerId) return;
        removeProductTypeMutation.mutate({
            customerId: parseInt(customerId),
            customerProductTypeId
        });
    };

    const handleManagePricing = (customerProductType: CustomerProductType) => {
        setSelectedCustomerProductType(customerProductType);
    };

    // Filter customer product types based on search and category
    const filteredCustomerProductTypes = customerProductTypes.filter(cpt => {
        const matchesSearch = !searchTerm || 
            cpt.product_type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cpt.product_type.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = selectedCategory === "all" || 
            cpt.product_type.category?.name === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });

    const MemoizedTableRow = React.memo(({ customerProductType }: { customerProductType: CustomerProductType }) => (
        <TableRow key={customerProductType.id}>
            <TableCell className="text-center w-16">
                <span className="font-mono text-xs">{customerProductType.id}</span>
            </TableCell>
            <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2 w-full min-w-0">
                    <Avatar className="h-8 w-8 rounded-md flex-shrink-0">
                        <AvatarFallback className="rounded-md bg-muted">
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                        <span 
                            className="font-medium truncate flex-1 text-sm" 
                            title={customerProductType.product_type.name}
                        >
                            {customerProductType.product_type.name}
                        </span>
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-center w-24 hidden lg:table-cell">
                <span 
                    className="truncate block px-1 text-xs"
                    title={customerProductType.product_type.category?.name || t("uncategorized", { defaultValue: "Uncategorized" })}
                >
                    {customerProductType.product_type.category?.name || t("uncategorized", { defaultValue: "Uncategorized" })}
                </span>
            </TableCell>
            <TableCell className="text-center w-20">
                <Badge variant={customerProductType.product_type.is_dimension_based ? "default" : "secondary"}>
                    {customerProductType.product_type.is_dimension_based 
                        ? t('dimensionBased', { defaultValue: 'Dimension Based' })
                        : t('fixed', { defaultValue: 'Fixed' })
                    }
                </Badge>
            </TableCell>
            <TableCell className="text-center w-24 hidden xl:table-cell">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleManagePricing(customerProductType)}
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
                        <DropdownMenuItem onClick={() => handleManagePricing(customerProductType)}>
                            <SlidersHorizontal className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                            {t('managePricing', { defaultValue: 'Manage Pricing' })}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => handleRemoveProductType(customerProductType.id)}
                            onSelect={(e) => e.preventDefault()}
                        >
                            <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                            {t('remove', { defaultValue: 'Remove' })}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    ));

    if (isLoadingCustomer) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                <div className="text-center">
                    <p className="text-muted-foreground">{t('customerNotFound', { defaultValue: 'Customer not found' })}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Custom Header with Large Customer Name and Action Buttons */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
                            {t('customerPriceList', { defaultValue: 'Customer Price List' })} for {customer.name}
                        </h1>
                        <div className="flex items-center gap-2 text-lg text-muted-foreground">
                            <span>{customer.customerType?.name || t('noType', { defaultValue: 'No Type' })}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            onClick={handleImportAll}
                            disabled={importAllMutation.isPending}
                            variant="outline"
                            size="sm"
                        >
                            {importAllMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            {t('importAllProductTypes', { defaultValue: 'Import All' })}
                        </Button>

                        <div className="flex items-center gap-2">
                            <Autocomplete
                                options={availableProductTypes}
                                getOptionLabel={(option) => option.name}
                                value={selectedProductType}
                                onChange={(_, newValue) => setSelectedProductType(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={t('selectProductType', { defaultValue: 'Select Product Type' })}
                                        size="small"
                                        className="min-w-[200px]"
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        <div>
                                            <div className="font-medium">{option.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {option.category?.name || t('uncategorized', { defaultValue: 'Uncategorized' })}
                                            </div>
                                        </div>
                                    </li>
                                )}
                            />
                            <Button 
                                onClick={handleAddProductType}
                                disabled={!selectedProductType || addProductTypeMutation.isPending}
                                size="sm"
                            >
                                {addProductTypeMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 h-4 w-4" />
                                )}
                                {t('addProductType', { defaultValue: 'Add' })}
                            </Button>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isFetching && !isLoading}
                            className="flex items-center gap-2"
                        >
                            {isFetching && !isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <div className="h-4 w-4" />
                            )}
                            {t('refresh', { defaultValue: 'Refresh' })}
                        </Button>
                    </div>
                </div>
                <div className="h-px bg-border" />
            </div>

            {/* Search and Filter Bar */}
            <div className="mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <Input
                    placeholder={t("searchProductTypes", {
                        defaultValue: "Search by product or category name...",
                    })}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <select
                    className="border rounded px-3 py-2 text-sm"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="all">{t('allCategories', { defaultValue: 'All Categories' })}</option>
                    {Array.from(new Set(customerProductTypes.map(cpt => cpt.product_type.category?.name).filter(Boolean))).map(categoryName => (
                        <option key={categoryName} value={categoryName}>{categoryName}</option>
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

            {/* Product Types Table */}
            <div className="rounded-md border">
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
                                    <TableHead className="text-center w-24 hidden lg:table-cell">{t("category", { defaultValue: "Category" })}</TableHead>
                                    <TableHead className="text-center w-20">
                                        {t('pricingStrategy', { defaultValue: 'Pricing Strategy' })}
                                    </TableHead>
                                    <TableHead className="text-center w-24 hidden xl:table-cell">
                                        {t('manage', { ns: 'common', defaultValue: 'Manage' })}
                                    </TableHead>
                                    <TableHead className="text-center w-16">
                                        {t("actions")}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && customerProductTypes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                                <span>
                                                    {t("loadingProductTypes", {
                                                        defaultValue: "Loading product types...",
                                                    })}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredCustomerProductTypes.length > 0 ? (
                                    filteredCustomerProductTypes.map((cpt) => (
                                        <MemoizedTableRow key={cpt.id} customerProductType={cpt} />
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            {customerProductTypes.length > 0 
                                                ? t("noResultsForFilter", { defaultValue: 'No product types match the current filter' })
                                                : t("noProductTypesAssigned", { defaultValue: 'No product types assigned to this customer' })
                                            }
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                    {isLoading && customerProductTypes.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span>
                                    {t("loadingProductTypes", {
                                        defaultValue: "Loading product types...",
                                    })}
                                </span>
                            </div>
                        </div>
                    ) : filteredCustomerProductTypes.length > 0 ? (
                        <div className="divide-y">
                            {filteredCustomerProductTypes.map((customerProductType) => (
                                <MobileMemoizedCard 
                                    key={customerProductType.id} 
                                    customerProductType={customerProductType}
                                    handleManagePricing={handleManagePricing}
                                    handleRemoveProductType={handleRemoveProductType}
                                    removeProductTypeMutation={removeProductTypeMutation}
                                    t={t}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            {customerProductTypes.length > 0 
                                ? t("noResultsForFilter", { defaultValue: 'No product types match the current filter' })
                                : t("noProductTypesAssigned", { defaultValue: 'No product types assigned to this customer' })
                            }
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {t("pagination.showingItems", {
                        ns: "common",
                        first: ((currentPage - 1) * itemsPerPage) + 1,
                        last: Math.min(currentPage * itemsPerPage, totalItems),
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
                        {t("firstPage")}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || isFetching}
                    >
                        {t("previous")}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                        }
                        disabled={currentPage === totalPages || isFetching}
                    >
                        {t("next")}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages || isFetching}
                    >
                        {t("lastPage")}
                    </Button>
                </div>
            </div>

            {/* Customer Pricing Management Dialog */}
            {selectedCustomerProductType && (
                <ManageCustomerPricingDialog
                    isOpen={!!selectedCustomerProductType}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            setSelectedCustomerProductType(null);
                        }
                    }}
                    customerProductType={selectedCustomerProductType}
                    customerId={parseInt(customerId!)}
                />
            )}
        </div>
    );
};

export default CustomerPriceListPage; 