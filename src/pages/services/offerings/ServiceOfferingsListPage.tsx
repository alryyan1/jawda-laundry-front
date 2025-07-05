// src/pages/services/offerings/ServiceOfferingsListPage.tsx
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import type { ProductType, PaginatedResponse } from '@/types';
import { getProductTypesPaginated } from '@/api/productTypeService'; // Use this to list product types
import { useDebounce } from '@/hooks/useDebounce';

import { PageHeader } from '@/components/shared/PageHeader';
import { ManageOfferingsDialog } from './components/ManageOfferingsDialog'; // We will create this component
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, SlidersHorizontal, Shirt, Tag } from 'lucide-react';

const ServiceOfferingsListPage: React.FC = () => {
    const { t } = useTranslation(['common', 'services']);

    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const { data: paginatedData, isLoading, isFetching, refetch } = useQuery<PaginatedResponse<ProductType>, Error>({
        queryKey: ["productTypesForOfferingsPage", currentPage, itemsPerPage, debouncedSearchTerm],
        queryFn: () => getProductTypesPaginated(currentPage, itemsPerPage, debouncedSearchTerm),
        placeholderData: (prevData) => prevData,
    });

    const productTypes = paginatedData?.data || [];
    const totalPages = paginatedData?.meta?.last_page || 1;

    const handleManageOfferings = (productType: ProductType) => {
        setSelectedProductType(productType);
        setIsManageModalOpen(true);
    };

    const MemoizedTableRow = React.memo(({ productType }: { productType: ProductType }) => (
        <TableRow key={productType.id}>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-md">
                        <AvatarImage src={productType.image_url || undefined} alt={productType.name} />
                        <AvatarFallback className="rounded-md bg-muted"><Shirt className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{productType.name}</div>
                        <div className="text-xs text-muted-foreground">{productType.category?.name || t('uncategorized', {ns:'services'})}</div>
                    </div>
                </div>
            </TableCell>
                {/* --- NEW COLUMN FOR OFFERINGS COUNT --- */}
                <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2 font-medium">
                    <Tag className="h-4 w-4 text-muted-foreground"/>
                    <span>{productType.service_offerings_count ?? 0}</span>
                </div>
            </TableCell>

            <TableCell className="text-right rtl:text-left">
                <Button variant="outline" size="sm" onClick={() => handleManageOfferings(productType)}>
                    <SlidersHorizontal className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0"/>
                    {t('manageOfferings', {ns: 'services', defaultValue: 'Manage Offerings'})}
                </Button>
            </TableCell>
        </TableRow>
    ));

    return (
        <div>
            <PageHeader
                title={t('serviceOfferingsTitle', { ns: 'services' })}
                description={t('serviceOfferingsDescriptionNew', { ns: 'services', defaultValue: 'Select a product type to manage its available services and prices.' })}
                showRefreshButton onRefresh={refetch} isRefreshing={isFetching && !isLoading}
            />

            <div className="mb-4">
                <Input
                    placeholder={t('searchProductTypes', {ns:'services'})}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("productType", {ns:'services'})}</TableHead>
                            <TableHead className="text-center">{t("offeringsCount", {ns:'services'})}</TableHead>
                                <TableHead className="text-right rtl:text-left">{t("actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={2} className="h-32 text-center">
                                <div className="flex justify-center items-center gap-2 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /><span>{t("loadingProductTypes", {ns:'services'})}</span></div>
                            </TableCell></TableRow>
                        ) : productTypes.length > 0 ? (
                            productTypes.map((pt) => <MemoizedTableRow key={pt.id} productType={pt} />)
                        ) : (
                            <TableRow><TableCell colSpan={2} className="h-32 text-center text-muted-foreground">{t("noResults")}</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || isFetching}> {t('firstPage')} </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || isFetching}> {t('previous')} </Button>
                <span className="text-sm font-medium">{t('pageWithTotal', { currentPage, totalPages })}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || isFetching}> {t('next')} </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || isFetching}> {t('lastPage')} </Button>
            </div>

            {selectedProductType && (
                <ManageOfferingsDialog
                    isOpen={isManageModalOpen}
                    onOpenChange={(isOpen) => {
                        setIsManageModalOpen(isOpen);
                        if (!isOpen) setSelectedProductType(null);
                    }}
                    productType={selectedProductType}
                />
            )}
        </div>
    );
};
export default ServiceOfferingsListPage;