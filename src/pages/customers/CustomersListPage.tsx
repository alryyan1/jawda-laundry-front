// src/pages/customers/CustomersListPage.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';

import type { Customer, PaginatedResponse } from '@/types';
import { getCustomers, deleteCustomer } from '@/api/customerService';
import { useDebounce } from '@/hooks/useDebounce';

import { PageHeader } from '@/components/shared/PageHeader';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
    MoreHorizontal,
    Edit3,
    Loader2,
} from 'lucide-react';

const CustomersListPage: React.FC = () => {
    const { t, i18n } = useTranslation(['common', 'customers', 'validation']);
    const navigate = useNavigate();

    // --- State Management ---
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({}); // Manage selection state manually
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const itemsPerPage = 10;
    const currentLocale = i18n.language.startsWith('ar') ? arSA : enUS;

    // --- Data Fetching ---
    const { data: paginatedData, isLoading, error, isFetching, refetch } = useQuery<PaginatedResponse<Customer>, Error>({
        queryKey: ['customers', currentPage, itemsPerPage, debouncedSearchTerm],
        queryFn: () => getCustomers(currentPage, itemsPerPage, debouncedSearchTerm),
        placeholderData: keepPreviousData,
    });

    const customers = paginatedData?.data || [];
    const totalItems = paginatedData?.meta?.total || 0;
    const totalPages = paginatedData?.meta?.last_page || 1;

    // --- Mutations ---
    const deleteMutation = useMutation<void, Error, number>({
        mutationFn: (id) => deleteCustomer(id).then(() => {}),
        onSuccess: () => {
            toast.success(t('customerDeletedSuccess', { ns: 'customers', name: customerToDelete?.name || '' }));
            refetch(); // Refetch current page after delete
            setSelectedRows({}); // Clear selection after delete
            setCustomerToDelete(null);
        },
        onError: (err) => {
            toast.error(err.message || t('customerDeleteFailed', { ns: 'customers' }));
            setCustomerToDelete(null);
        }
    });

    // --- Manual Row Selection Logic ---
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const newSelection: Record<string, boolean> = {};
            customers.forEach((customer: Customer) => {
                newSelection[customer.id] = true;
            });
            setSelectedRows(newSelection);
        } else {
            setSelectedRows({});
        }
    };

    const handleSelectRow = (customerId: number, checked: boolean) => {
        setSelectedRows(prev => {
            const newSelection = { ...prev };
            if (checked) {
                newSelection[customerId] = true;
            } else {
                delete newSelection[customerId];
            }
            return newSelection;
        });
    };

    const selectedRowCount = Object.keys(selectedRows).length;
    const isAllSelected = customers.length > 0 && selectedRowCount === customers.length;
    const isSomeSelected = selectedRowCount > 0 && selectedRowCount < customers.length;

    // --- Render ---
    if (isLoading && !paginatedData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">{t('loading', { ns: 'common' })}</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-sm text-destructive">{t('errorLoading', { ns: 'common' })}</p>
                <Button onClick={() => refetch()} className="mt-2">
                    {t('tryAgain', { ns: 'common' })}
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            <PageHeader
                title={t('title', { ns: 'customers' })}
                description={t('customerListDescription', { ns: 'customers' })}
                actionButton={{ label: t('newCustomer', { ns: 'customers' }), icon: PlusCircle, to: '/customers/new' }}
                showRefreshButton onRefresh={refetch} isRefreshing={isFetching}
            />

            {/* --- Filter Bar --- */}
            <div className="flex items-center py-4">
                <Input
                    placeholder={t('searchByNameOrEmail', { ns: 'customers' })}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                {/* Column visibility toggle is removed as it's a feature of table libraries */}
            </div>

            {/* --- Table Container --- */}
            <div className="flex justify-center">
                <div className="w-full max-w-6xl">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">
                                        <Checkbox
                                            checked={isAllSelected || (isSomeSelected && 'indeterminate')}
                                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                            aria-label={t('selectAll')}
                                        />
                                    </TableHead>
                                    <TableHead className="min-w-[200px]">{t('name', { ns: 'common' })}</TableHead>
                                    <TableHead className="min-w-[200px]">{t('email', { ns: 'common' })}</TableHead>
                                    <TableHead>{t('phone', { ns: 'customers' })}</TableHead>
                                    <TableHead className="text-center">{t('totalOrders', { ns: 'customers' })}</TableHead>
                                    <TableHead>{t('registeredDate', { ns: 'customers' })}</TableHead>
                                    <TableHead className="text-right rtl:text-left w-[80px]">{t('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(isLoading || isFetching) && customers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : customers.length > 0 ? (
                                    customers.map((customer: Customer) => (
                                        <TableRow key={customer.id} data-state={selectedRows[customer.id] && "selected"}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={!!selectedRows[customer.id]}
                                                    onCheckedChange={(checked) => handleSelectRow(customer.id, !!checked)}
                                                    aria-label={t('selectRow')}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{customer.name}</TableCell>
                                            <TableCell>{customer.email || t('notAvailable')}</TableCell>
                                            <TableCell>{customer.phone || t('notAvailable')}</TableCell>
                                            <TableCell className="text-center">{customer.total_orders ?? 0}</TableCell>
                                            <TableCell>
                                                {format(new Date(customer.registered_date), "PP", { locale: currentLocale })}
                                            </TableCell>
                                            <TableCell className="text-right rtl:text-left">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">{t('openMenu')}</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => navigate(`/customers/${customer.id}/edit`)}>
                                                            <Edit3 className="mr-2 h-4 w-4" />
                                                            {t('edit')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                     
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            {t('noResults')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* --- Pagination --- */}
            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {t('selectedRows', { count: selectedRowCount, total: totalItems })}
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                        {t('pageWithTotal', { currentPage, totalPages })}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || isFetching}>
                        {t('firstPage')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || isFetching}>
                        {t('previous')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || isFetching}>
                        {t('next')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || isFetching}>
                        {t('lastPage')}
                    </Button>
                </div>
            </div>

            {/* --- Dialogs --- */}
            <DeleteConfirmDialog
                isOpen={!!customerToDelete}
                onOpenChange={(open) => !open && setCustomerToDelete(null)}
                onConfirm={() => { if (customerToDelete) deleteMutation.mutate(customerToDelete.id); }}
                itemName={customerToDelete?.name}
                itemType="customerLC"
                isPending={deleteMutation.isPending}
            />
        </div>
    );
};

export default CustomersListPage;