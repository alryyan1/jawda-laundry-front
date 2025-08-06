// src/pages/customers/CustomerPriceListPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { getCustomerById } from '@/api/customerService';
import { pricingRuleService } from '@/api/pricingRuleService';
import type { Customer } from '@/types/customer.types';
import type { PricingRule, AvailableServiceOffering } from '@/api/pricingRuleService';
import type { ProductType } from '@/types';


// Import components
import { CustomerPriceListHeader } from './components/CustomerPriceListHeader';
import { CustomerPriceListFilters } from './components/CustomerPriceListFilters';
import { PricingRuleTable } from './components/PricingRuleTable';
import { PricingRuleMobileView } from './components/PricingRuleMobileView';
import { PricingRulePagination } from './components/PricingRulePagination';
import { EditPricingRuleDialog } from './components/EditPricingRuleDialog';

const CustomerPriceListPage: React.FC = () => {
  const { t } = useTranslation(['common', 'customers']);
    const { customerId } = useParams<{ customerId: string }>();
    const queryClient = useQueryClient();
    
  // State management
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState("id");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
  const [selectedServiceOffering, setSelectedServiceOffering] = useState<AvailableServiceOffering | null>(null);
  const [selectedPricingRule, setSelectedPricingRule] = useState<PricingRule | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Reset to page 1 when product type or category changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedProductType, selectedCategory]);

    // Fetch customer details
    const { data: customer, isLoading: isLoadingCustomer } = useQuery<Customer>({
        queryKey: ['customer', customerId],
        queryFn: () => getCustomerById(parseInt(customerId!)),
        enabled: !!customerId,
    });

  // Fetch customer pricing rules
  const { data: pricingRulesData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["customerPricingRules", customerId, currentPage, itemsPerPage, selectedProductType?.id, sortBy, sortOrder, selectedCategory],
    queryFn: () => pricingRuleService.getCustomerPricingRules(
      parseInt(customerId!),
      currentPage,
      itemsPerPage,
      undefined, // search term removed
      sortBy,
      sortOrder,
      selectedCategory,
      selectedProductType?.id
    ),
        enabled: !!customerId,
        placeholderData: keepPreviousData,
    });

  // Fetch available service offerings for autocomplete
  const { data: availableServiceOfferingsData } = useQuery({
    queryKey: ["availableServiceOfferings", customerId],
    queryFn: () => pricingRuleService.getAvailableServiceOfferings(parseInt(customerId!)),
        enabled: !!customerId,
    });

  const pricingRules = pricingRulesData?.pricing_rules || [];
  const availableServiceOfferings = availableServiceOfferingsData?.available_service_offerings || [];
  const totalItems = pricingRulesData?.total_count || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Sorting handler
    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
    setCurrentPage(1);
  };

    // Import all pricing rules mutation
  const importAllMutation = useMutation({
    mutationFn: (customerId: number) => pricingRuleService.importAllServiceOfferings(customerId),
    onSuccess: () => {
      toast.success(t('pricingRulesImportedSuccessfully', { defaultValue: 'Pricing rules imported successfully' }));
      queryClient.invalidateQueries({ queryKey: ["customerPricingRules", customerId] });
      queryClient.invalidateQueries({ queryKey: ["availableServiceOfferings", customerId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('failedToImportPricingRules', { defaultValue: 'Failed to import pricing rules' }));
        },
    });

  // Add pricing rule mutation
  const addPricingRuleMutation = useMutation({
    mutationFn: ({ customerId, serviceOfferingId }: { customerId: number; serviceOfferingId: number }) => {
      const serviceOffering = availableServiceOfferings.find((so: AvailableServiceOffering) => so.id === serviceOfferingId);
      if (!serviceOffering) throw new Error('Service offering not found');
      
      const isDimensionBased = serviceOffering.product_type?.is_dimension_based;
      return pricingRuleService.createPricingRule(customerId, {
        service_offering_id: serviceOfferingId,
        price: isDimensionBased ? 0 : parseFloat(serviceOffering.default_price || '0'),
        price_per_sq_meter: isDimensionBased ? parseFloat(serviceOffering.default_price_per_sq_meter || '0') : 0,
      });
    },
        onSuccess: () => {
      toast.success(t('pricingRuleAddedSuccessfully', { defaultValue: 'Pricing rule added successfully' }));
      queryClient.invalidateQueries({ queryKey: ["customerPricingRules", customerId] });
      queryClient.invalidateQueries({ queryKey: ["availableServiceOfferings", customerId] });
      setSelectedServiceOffering(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('failedToAddPricingRule', { defaultValue: 'Failed to add pricing rule' }));
        },
    });

  // Delete pricing rule mutation
  const deletePricingRuleMutation = useMutation({
    mutationFn: ({ customerId, pricingRuleId }: { customerId: number; pricingRuleId: number }) =>
      pricingRuleService.deletePricingRule(customerId, pricingRuleId),
        onSuccess: () => {
      toast.success(t('pricingRuleDeletedSuccessfully', { defaultValue: 'Pricing rule deleted successfully' }));
      queryClient.invalidateQueries({ queryKey: ["customerPricingRules", customerId] });
      queryClient.invalidateQueries({ queryKey: ["availableServiceOfferings", customerId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('failedToDeletePricingRule', { defaultValue: 'Failed to delete pricing rule' }));
        },
    });

  // Event handlers
      const handleImportAll = () => {
    if (!customerId) return;
    importAllMutation.mutate(parseInt(customerId));
  };

  const handleAddPricingRule = () => {
    if (!customerId || !selectedServiceOffering) return;
    addPricingRuleMutation.mutate({
            customerId: parseInt(customerId),
      serviceOfferingId: selectedServiceOffering.id
        });
    };

  const handleDeletePricingRule = (pricingRuleId: number) => {
        if (!customerId) return;
    deletePricingRuleMutation.mutate({
            customerId: parseInt(customerId),
      pricingRuleId
        });
    };

  const handleEditPricingRule = (pricingRule: PricingRule) => {
    setSelectedPricingRule(pricingRule);
    setIsEditDialogOpen(true);
  };

  // Use pricing rules directly from backend (filtering handled by backend)
  const filteredPricingRules = pricingRules;

  // Loading states
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
      {/* Header */}
      <CustomerPriceListHeader
        customer={customer}
        selectedServiceOffering={selectedServiceOffering}
        onServiceOfferingChange={setSelectedServiceOffering}
        availableServiceOfferings={availableServiceOfferings}
        onImportAll={handleImportAll}
        onAddPricingRule={handleAddPricingRule}
        isImporting={importAllMutation.isPending}
        isAdding={addPricingRuleMutation.isPending}
        onRefresh={() => refetch()}
        isRefreshing={isFetching && !isLoading}
      />

      {/* Filters */}
      <CustomerPriceListFilters
        selectedProductType={selectedProductType}
        onProductTypeChange={(productType) => {
          setSelectedProductType(productType);
          setCurrentPage(1);
        }}
        selectedCategory={selectedCategory}
        onCategoryChange={(value) => {
          setSelectedCategory(value);
          setCurrentPage(1);
        }}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(value) => {
          setItemsPerPage(value);
          setCurrentPage(1);
        }}
      />

      {/* Pricing Rules Table */}
      <PricingRuleTable
        pricingRules={filteredPricingRules}
        isLoading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onEdit={handleEditPricingRule}
        onDelete={handleDeletePricingRule}
        isDeleting={deletePricingRuleMutation.isPending}
      />

      {/* Mobile View */}
      <PricingRuleMobileView
        pricingRules={filteredPricingRules}
        isLoading={isLoading}
        onEdit={handleEditPricingRule}
        onDelete={handleDeletePricingRule}
        isDeleting={deletePricingRuleMutation.isPending}
      />

      {/* Pagination */}
      <PricingRulePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        isFetching={isFetching}
      />

      {/* Edit Dialog */}
      <EditPricingRuleDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        pricingRule={selectedPricingRule}
                    customerId={parseInt(customerId!)}
                />
        </div>
    );
};

export default CustomerPriceListPage; 