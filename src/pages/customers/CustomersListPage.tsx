// src/pages/customers/CustomersListPage.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';

import type { Customer, PaginatedResponse } from '@/types';
import { getCustomers, deleteCustomer, updateCustomer } from '@/api/customerService';
import { useDebounce } from '@/hooks/useDebounce';

import { PageHeader } from '@/components/shared/PageHeader';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    FileText,
    Star,
    StarOff,
    Mail,
    Phone,
    Calendar,
    ShoppingBag,
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

    const setDefaultMutation = useMutation<void, Error, number>({
        mutationFn: async (id) => {
            await updateCustomer(id, { is_default: true });
            await refetch();
        },
        onError: (err) => {
            toast.error(err.message || t('errorSettingDefault', { ns: 'customers' }));
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

    // --- Mobile Card Component ---
    const CustomerCard = ({ customer }: { customer: Customer }) => (
        <Card className={`w-full ${customer.is_default ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-800' : ''} ${selectedRows[customer.id] ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Checkbox
                            checked={!!selectedRows[customer.id]}
                            onCheckedChange={(checked) => handleSelectRow(customer.id, !!checked)}
                            aria-label={t('selectRow')}
                        />
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold truncate">
                                {customer.name}
                            </CardTitle>
                            {customer.is_default && (
                                <Badge variant="secondary" className="mt-1 inline-flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-600" />
                                    {t('default', { ns: 'customers', defaultValue: 'Default' })}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                            <DropdownMenuItem onClick={() => navigate(`/customers/${customer.id}/ledger`)}>
                                <FileText className="mr-2 h-4 w-4" />
                                {t('ledger')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{customer.email || t('notAvailable')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{customer.phone || t('notAvailable')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{t('totalOrders', { ns: 'customers' })}: {customer.total_orders ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{format(new Date(customer.registered_date), "PP", { locale: currentLocale })}</span>
                    </div>
                </div>
                {!customer.is_default && (
                    <div className="pt-2">
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setDefaultMutation.mutate(customer.id)}
                            className="w-full"
                            title={t('setAsDefault', { ns: 'customers', defaultValue: 'Set as default' })}
                        >
                            <StarOff className="mr-2 h-4 w-4" />
                            {t('setAsDefault', { ns: 'customers', defaultValue: 'Set as default' })}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    // --- Render ---
    if (isLoading && !paginatedData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">{t('loading', { ns: 'common' })}</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
                <div className="w-full sm:w-auto">
                    <Input
                        placeholder={t('searchByNameOrEmail', { ns: 'customers' })}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-80"
                    />
                </div>
                {selectedRowCount > 0 && (
                    <div className="text-sm text-muted-foreground">
                        {t('selectedRows', { count: selectedRowCount, total: totalItems })}
                    </div>
                )}
            </div>

            {/* --- Mobile View (Cards) --- */}
            <div className="block lg:hidden">
                <div className="space-y-4">
                    {(isLoading || isFetching) && customers.length === 0 ? (
                        <div className="flex justify-center items-center h-24">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : customers.length > 0 ? (
                        customers.map((customer: Customer) => (
                            <CustomerCard key={customer.id} customer={customer} />
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">{t('noResults')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Desktop View (Table) --- */}
            <div className="hidden lg:block w-full">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px] text-center">
                                    <Checkbox
                                        checked={isAllSelected || (isSomeSelected && 'indeterminate')}
                                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                        aria-label={t('selectAll')}
                                    />
                                </TableHead>
                                <TableHead className="min-w-[200px] text-center">{t('name', { ns: 'common' })}</TableHead>
                                <TableHead className="min-w-[200px] text-center">{t('email', { ns: 'common' })}</TableHead>
                                <TableHead className="text-center">{t('phone', { ns: 'customers' })}</TableHead>
                                <TableHead className="text-center">{t('totalOrders', { ns: 'customers' })}</TableHead>
                                <TableHead className="text-center">{t('registeredDate', { ns: 'customers' })}</TableHead>
                                <TableHead className="text-center">{t('default', { ns: 'customers', defaultValue: 'Default' })}</TableHead>
                                <TableHead className="text-center w-[80px]">{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(isLoading || isFetching) && customers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        <div className="flex justify-center items-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : customers.length > 0 ? (
                                customers.map((customer: Customer) => (
                                    <TableRow key={customer.id} data-state={selectedRows[customer.id] && "selected"} className={customer.is_default ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''}>
                                        <TableCell className='text-center'>
                                            <Checkbox
                                                checked={!!selectedRows[customer.id]}
                                                onCheckedChange={(checked) => handleSelectRow(customer.id, !!checked)}
                                                aria-label={t('selectRow')}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium text-center">{customer.name}</TableCell>
                                        <TableCell className="text-center">{customer.email || t('notAvailable')}</TableCell>
                                        <TableCell className="text-center">{customer.phone || t('notAvailable')}</TableCell>
                                        <TableCell className="text-center">{customer.total_orders ?? 0}</TableCell>
                                        <TableCell>
                                            {format(new Date(customer.registered_date), "PP", { locale: currentLocale })}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {customer.is_default ? (
                                                <span className="inline-flex items-center gap-1 text-yellow-600 font-bold">
                                                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-600" />
                                                    {t('default', { ns: 'customers', defaultValue: 'Default' })}
                                                </span>
                                            ) : (
                                                <Button size="icon" variant="ghost" onClick={() => setDefaultMutation.mutate(customer.id)} title={t('setAsDefault', { ns: 'customers', defaultValue: 'Set as default' })}>
                                                    <StarOff className="h-5 w-5 text-muted-foreground" />
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
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
                                                    <DropdownMenuItem onClick={() => navigate(`/customers/${customer.id}/ledger`)}>
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        {t('ledger')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        {t('noResults')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* --- Pagination --- */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                <div className="text-sm text-muted-foreground text-center sm:text-left">
                    {t('showingResults', { from: ((currentPage - 1) * itemsPerPage) + 1, to: Math.min(currentPage * itemsPerPage, totalItems), total: totalItems })}
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    <span className="text-sm font-medium">
                        {t('pageWithTotal', { currentPage, totalPages })}
                    </span>
                    <div className="flex items-center gap-1">
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