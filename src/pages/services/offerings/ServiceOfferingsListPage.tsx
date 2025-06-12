// src/pages/services/offerings/ServiceOfferingsListPage.tsx
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

import { ServiceOffering, PaginatedResponse } from '@/types';
import { getServiceOfferings, deleteServiceOffering } from '@/api/serviceOfferingService'; // Renamed service

import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // For is_active status
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { PlusCircle, Edit3, Trash2, Loader2, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';

const ServiceOfferingsListPage: React.FC = () => {
    const { t, i18n } = useTranslation(['common', 'services', 'validation']);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [itemToDelete, setItemToDelete] = useState<ServiceOffering | null>(null);

    const { data: paginatedOfferings, isLoading, isFetching, refetch, error } = useQuery<PaginatedResponse<ServiceOffering>, Error>({
        queryKey: ['serviceOfferings', currentPage, itemsPerPage],
        queryFn: () => getServiceOfferings(currentPage, itemsPerPage),
        keepPreviousData: true,
    });

    const offerings = paginatedOfferings?.data || [];
    const totalPages = paginatedOfferings?.meta?.last_page || 1;

    const deleteMutation = useMutation<void, Error, number>({
        mutationFn: (id) => deleteServiceOffering(id).then(() => {}),
        onSuccess: () => {
            toast.success(t('serviceOfferingDeletedSuccess', { ns: 'services', name: itemToDelete?.display_name || '' }));
            queryClient.invalidateQueries({ queryKey: ['serviceOfferings'] });
            queryClient.invalidateQueries({ queryKey: ['serviceOfferingsForSelect']}); // If used in dropdowns
            setItemToDelete(null);
        },
        onError: (err) => { // Changed error to err to avoid conflict
            toast.error(err.message || t('serviceOfferingDeleteFailed', { ns: 'services' }));
            setItemToDelete(null);
        }
    });

    const columns: ColumnDef<ServiceOffering>[] = useMemo(() => [
        {
            accessorKey: "display_name", // Uses the accessor from ServiceOffering model
            header: t('offeringName', { ns: 'services', defaultValue: 'Offering Name' }),
            cell: ({ row }) => <div className="font-medium">{row.original.display_name}</div>,
        },
        {
            accessorFn: (row) => row.productType?.category?.name,
            id: 'productCategory',
            header: t('productCategory', { ns: 'services', defaultValue: 'Product Category' }),
            cell: ({ row }) => row.original.productType?.category?.name || '-',
        },
        {
            accessorFn: (row) => row.productType?.name,
            id: 'productType',
            header: t('productType', { ns: 'services', defaultValue: 'Product Type' }),
            cell: ({ row }) => row.original.productType?.name || '-',
        },
        {
            accessorFn: (row) => row.serviceAction?.name,
            id: 'serviceAction',
            header: t('serviceAction', { ns: 'services', defaultValue: 'Service Action' }),
            cell: ({ row }) => row.original.serviceAction?.name || '-',
        },
        {
            accessorKey: "default_price",
            header: () => <div className="text-right rtl:text-left">{t('defaultPrice', { ns: 'services' })}</div>,
            cell: ({ row }) => {
                const price = row.original.default_price;
                if (price === null || price === undefined) return <div className="text-right rtl:text-left text-muted-foreground">-</div>;
                const formatted = new Intl.NumberFormat(i18n.language, { style: "currency", currency: "USD" }).format(price); // TODO: Currency
                return <div className="text-right rtl:text-left">{formatted}</div>;
            },
        },
        {
            accessorKey: "pricing_strategy",
            header: t('pricingStrategy', { ns: 'services' }),
            cell: ({ row }) => t(`strategy.${row.original.pricing_strategy}`, {ns: 'services', defaultValue: row.original.pricing_strategy}),
        },
        {
            accessorKey: "is_active",
            header: () => <div className="text-center">{t('active', { ns: 'common' })}</div>,
            cell: ({ row }) => (
                <div className="flex justify-center">
                    {row.original.is_active ?
                        <CheckCircle className="h-5 w-5 text-green-500" /> :
                        <XCircle className="h-5 w-5 text-destructive" />}
                </div>
            ),
        },
        {
            id: "actions",
            header: () => <div className="text-right rtl:text-left">{t('actions', { ns: 'common' })}</div>,
            cell: ({ row }) => (
                <div className="text-right rtl:text-left">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={i18n.dir() === 'rtl' ? 'start' : 'end'}>
                            <DropdownMenuLabel>{t('actions', { ns: 'common' })}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/service-offerings/${row.original.id}/edit`)}>
                                <Edit3 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />{t('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => setItemToDelete(row.original)}
                                onSelect={(e) => e.preventDefault()}
                            >
                                <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />{t('delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ], [t, i18n.language, i18n.dir, navigate, setItemToDelete]);

    if (isLoading && !isFetching && !offerings.length) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ms-3 text-lg">{t('loadingServiceOfferings', { ns: 'services' })}</p>
        </div>
    );
     if (error) return (
        <div className="text-center py-10">
            <p className="text-destructive text-lg">{t('errorLoading', { ns: 'common' })}</p>
            <p className="text-muted-foreground">{error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">{t('retry', {ns:'common'})}</Button>
        </div>
    );

    return (
        <div>
            <PageHeader
                title={t('serviceOfferingsTitle', { ns: 'services', defaultValue: 'Service Offerings' })}
                description={t('serviceOfferingsDescription', { ns: 'services', defaultValue: 'Manage the specific services offered for different product types.' })}
                actionButton={{
                    label: t('newServiceOfferingBtn', { ns: 'services', defaultValue: 'New Offering' }),
                    icon: PlusCircle,
                    to: '/service-offerings/new',
                }}
                showRefreshButton
                onRefresh={refetch}
                isRefreshing={isFetching && isLoading}
            />
            <DataTable
                columns={columns} data={offerings} isLoading={isFetching}
                pageCount={totalPages} currentPage={currentPage} onPageChange={setCurrentPage}
            />
            <DeleteConfirmDialog
                isOpen={!!itemToDelete}
                onOpenChange={(open) => !open && setItemToDelete(null)}
                onConfirm={() => { if (itemToDelete) deleteMutation.mutate(itemToDelete.id); }}
                itemName={itemToDelete?.display_name}
                itemType="serviceOfferingLC" // e.g. "service offering" - define in services.json
                isPending={deleteMutation.isPending}
            />
        </div>
    );
};
export default ServiceOfferingsListPage;