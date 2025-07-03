// src/pages/reports/DetailedOrdersReport.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

import type { Order, PaginatedResponse, Customer, OrderStatus, ProductType } from '@/types';
import { orderStatusOptions } from '@/types';
import { getOrders } from '@/api/orderService';
import { getAllCustomers } from '@/api/customerService';
import { getAllProductTypes } from '@/api/productTypeService';
import { downloadOrdersReport } from '@/api/reportService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency, formatDate } from '@/lib/formatters';

import { PageHeader } from '@/components/shared/PageHeader';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Loader2, Download } from 'lucide-react';

const DetailedOrdersReport: React.FC = () => {
    const { t, i18n } = useTranslation(['reports', 'common', 'orders', 'customers', 'services']);
    const { can } = useAuth();
    const queryClient = useQueryClient();

    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<{ search?: string; status?: OrderStatus | ''; customerId?: string; productTypeId?: string; dateRange?: DateRange }>({});
    const debouncedSearch = useDebounce(filters.search, 500);
    const itemsPerPage = 25;

    // --- Data Fetching for Filters ---
    const { data: customers = [] } = useQuery<Customer[], Error>({ queryKey: ['allCustomersForSelect'], queryFn: getAllCustomers });
    const { data: productTypes = [] } = useQuery<ProductType[], Error>({ 
        queryKey: ['allProductTypesForSelect'], 
        queryFn: () => getAllProductTypes()
    });

    // --- Main Data Query ---
    const queryKey = useMemo(() => ['detailedOrdersReport', currentPage, itemsPerPage, filters.status, debouncedSearch, filters.customerId, filters.productTypeId, filters.dateRange],
        [currentPage, itemsPerPage, filters.status, debouncedSearch, filters.customerId, filters.productTypeId, filters.dateRange]
    );
    const { data: paginatedData, isLoading, isFetching } = useQuery<PaginatedResponse<Order>, Error>({
        queryKey,
        queryFn: () => getOrders(currentPage, itemsPerPage, {
            status: filters.status, search: debouncedSearch, customerId: filters.customerId, productTypeId: filters.productTypeId,
            dateFrom: filters.dateRange?.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : undefined,
            dateTo: filters.dateRange?.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : undefined,
        }),
        placeholderData: keepPreviousData,
        enabled: can('report:view-financial'),
    });

    // --- Export Mutation ---
    const exportMutation = useMutation<Blob, Error, typeof filters>({
        mutationFn: (currentFilters) => downloadOrdersReport({
             status: currentFilters.status, search: currentFilters.search, customerId: currentFilters.customerId, productTypeId: currentFilters.productTypeId,
             dateFrom: currentFilters.dateRange?.from ? format(currentFilters.dateRange.from, 'yyyy-MM-dd') : undefined,
             dateTo: currentFilters.dateRange?.to ? format(currentFilters.dateRange.to, 'yyyy-MM-dd') : undefined,
        }),
        onSuccess: (data) => {
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `orders_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(t('reportExportedSuccess'));
        },
        onError: (error) => { toast.error(error.message || t('reportExportFailed')); }
    });

    useEffect(() => { if(currentPage !== 1) setCurrentPage(1); }, [filters, debouncedSearch]);
    
    const orders = paginatedData?.data || [];
    const totalItems = paginatedData?.meta?.total || 0;
    const totalPages = paginatedData?.meta?.last_page || 1;
    
    const pageTotals = useMemo(() => {
        return orders.reduce((acc, order) => {
            acc.total_amount += order.total_amount;
            acc.paid_amount += order.paid_amount;
            acc.due_amount += (order.amount_due || 0);
            return acc;
        }, { total_amount: 0, paid_amount: 0, due_amount: 0 });
    }, [orders]);
    
    if (!can('report:view-financial')) {
        return <div className="p-8 text-center text-destructive">{t('accessDenied', {ns: 'common'})}</div>;
    }

    return (
        <div>
            <PageHeader
                title={t('detailedOrdersReportTitle')}
                description={t('detailedOrdersReportDescription')}
                showRefreshButton onRefresh={() => queryClient.invalidateQueries({ queryKey })} isRefreshing={isFetching}
            >
                <Button onClick={() => exportMutation.mutate(filters)} disabled={exportMutation.isPending || orders.length === 0}>
                    {exportMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                    {t('exportToCsv')}
                </Button>
            </PageHeader>

            <Card className="mb-6">
                <CardHeader><CardTitle className="text-lg">{t('filters')}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <Input placeholder={t('searchOrdersPlaceholder', {ns:'orders'})} value={filters.search || ''} onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))} />
                    <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as OrderStatus }))}>
                        <SelectTrigger><SelectValue placeholder={t('filterByStatus', { ns: 'orders' })} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('allStatuses', { ns: 'orders' })}</SelectItem>
                            {orderStatusOptions.map(opt => <SelectItem key={opt} value={opt}>{t(`status_${opt}`, { ns: 'orders' })}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filters.customerId || 'all'} onValueChange={(value) => setFilters(prev => ({...prev, customerId: value === 'all' ? undefined : value}))}>
                        <SelectTrigger><SelectValue placeholder={t('filterByCustomer', {ns:'orders'})} /></SelectTrigger>
                        <SelectContent><SelectItem value="all">{t('allCustomers', {ns:'customers'})}</SelectItem>{customers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={filters.productTypeId || 'all'} onValueChange={(value) => setFilters(prev => ({...prev, productTypeId: value === 'all' ? undefined : value}))}>
                        <SelectTrigger><SelectValue placeholder={t('filterByProduct', {ns:'orders'})} /></SelectTrigger>
                        <SelectContent><SelectItem value="all">{t('allProducts', {ns:'services'})}</SelectItem>{productTypes.map(pt => <SelectItem key={pt.id} value={pt.id.toString()}>{pt.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <DatePickerWithRange date={filters.dateRange} onDateChange={(range) => setFilters(prev => ({...prev, dateRange: range}))} />
                </CardContent>
            </Card>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead>{t('customerName')}</TableHead>
                            <TableHead>{t('orderDate')}</TableHead>
                            <TableHead>{t('status')}</TableHead>
                            <TableHead className="text-right">{t('totalAmount')}</TableHead>
                            <TableHead className="text-right">{t('amountPaid')}</TableHead>
                            <TableHead className="text-right">{t('amountDue')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? ( <TableRow><TableCell colSpan={7} className="h-48 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow> )
                        : orders.length > 0 ? ( orders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell><Link to={`/orders/${order.id}`} className="font-mono text-xs hover:underline text-primary">{order.id}</Link></TableCell>
                                <TableCell className="font-medium">{order.customer?.name}</TableCell>
                                <TableCell>{formatDate(order.order_date, 'PP', i18n.language)}</TableCell>
                                <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(order.total_amount, 'USD', i18n.language)}</TableCell>
                                <TableCell className="text-right font-mono text-green-600">{formatCurrency(order.paid_amount, 'USD', i18n.language)}</TableCell>
                                <TableCell className="text-right font-mono text-destructive">{formatCurrency(order.amount_due || 0, 'USD', i18n.language)}</TableCell>
                            </TableRow>
                        )))
                        : ( <TableRow><TableCell colSpan={7} className="h-48 text-center text-muted-foreground">{t('noResults')}</TableCell></TableRow> )}
                    </TableBody>
                    {orders.length > 0 && (
                        <TableFooter>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell colSpan={4}>{t('pageTotal')}</TableCell>
                                <TableCell className="text-right">{formatCurrency(pageTotals.total_amount, 'USD', i18n.language)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(pageTotals.paid_amount, 'USD', i18n.language)}</TableCell>
                                <TableCell className="text-right text-destructive">{formatCurrency(pageTotals.due_amount, 'USD', i18n.language)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </div>
            
            {totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {t('pagination.showingItems', {
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
                            {t('firstPage')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || isFetching}
                        >
                            {t('previous')}
                        </Button>
                        <span className="text-sm font-medium">
                            {t('pageWithTotal', { currentPage, totalPages })}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || isFetching}
                        >
                            {t('next')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || isFetching}
                        >
                            {t('lastPage')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default DetailedOrdersReport;