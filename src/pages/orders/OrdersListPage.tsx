// src/pages/orders/OrdersListPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

import { Order, OrderStatus, PaginatedResponse, orderStatusOptions } from '@/types';
import { getOrders } from '@/api/orderService';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatCurrency } from '@/lib/formatters';

import { PageHeader } from '@/components/shared/PageHeader';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    PlusCircle, MoreHorizontal, Eye, Loader2, RefreshCw
} from 'lucide-react';
// import { DatePickerWithRange } from '@/components/ui/date-range-picker'; // If you build this component


const OrdersListPage: React.FC = () => {
    const { t, i18n } = useTranslation(['common', 'orders']);
    const navigate = useNavigate();
    const { can } = useAuth();
    console.log(can('order:create'),'can order create')
    // --- State Management for Filters and Pagination ---
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<{ search?: string; status?: OrderStatus | ''; dateRange?: DateRange }>({});
    const debouncedSearchTerm = useDebounce(filters.search, 500);
    const itemsPerPage = 10;
    const currentLocale = i18n.language.startsWith('ar') ? arSA : enUS;

    // --- Data Fetching ---
    const queryKey = useMemo(() => [
        'orders', currentPage, itemsPerPage, filters.status, debouncedSearchTerm, filters.dateRange
    ], [currentPage, itemsPerPage, filters.status, debouncedSearchTerm, filters.dateRange]);

    const { data: paginatedData, isLoading, error, isFetching, refetch } = useQuery<PaginatedResponse<Order>, Error>({
        queryKey,
        queryFn: () => getOrders(
            currentPage,
            itemsPerPage,
            filters.status,
            debouncedSearchTerm,
            undefined, // customerId filter placeholder
            filters.dateRange?.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : undefined,
            filters.dateRange?.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : undefined
        ),
        placeholderData: keepPreviousData,
    });

    const orders = paginatedData?.data || [];
    const totalItems = paginatedData?.meta?.total || 0;
    const totalPages = paginatedData?.meta?.last_page || 1;

    // Reset to page 1 when any filter changes
    useEffect(() => {
        if(currentPage !== 1) setCurrentPage(1);
    }, [filters.status, debouncedSearchTerm, filters.dateRange]);

    const MemoizedTableRow = React.memo(({ order }: { order: Order }) => (
        <TableRow key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="cursor-pointer">
            <TableCell className="font-medium text-center">{order.order_number}</TableCell>
            <TableCell className="text-center">{order.customer?.name || t('notAvailable')}</TableCell>
            <TableCell className="text-center">{format(new Date(order.order_date), "PP", { locale: currentLocale })}</TableCell>
            <TableCell className="text-center"><OrderStatusBadge status={order.status} /></TableCell>
            <TableCell className="text-center font-semibold">{formatCurrency(order.total_amount, 'USD', i18n.language)}</TableCell>
            <TableCell className="text-center">
                <DropdownMenu onOpenChange={(open) => open && event?.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">{t('openMenu')}</span><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}><Eye className="mr-2 h-4 w-4" />{t("viewDetails")}</DropdownMenuItem>
                        {/* Add Edit link when page is ready and user has permission */}
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    ));

    return (
        <div className=" mx-auto">
            <PageHeader
                title={t('title', { ns: 'orders' })}
                description={t('orderListDescription', { ns: 'orders' })}
                actionButton={can('order:create') ? { label: t('newOrder'), icon: PlusCircle, to: '/orders/new' } : undefined}
                showRefreshButton onRefresh={refetch} isRefreshing={isFetching && isLoading}
            />

            <Card className="mb-4">
                <CardHeader><CardTitle className="text-lg">{t('filters')}</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4">
                    <Input
                        placeholder={t('searchOrdersPlaceholder', { ns: 'orders' })}
                        value={filters.search || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="max-w-sm"
                    />
                    <Select value={filters.status || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as OrderStatus }))}>
                        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder={t('filterByStatus', { ns: 'orders' })} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('allStatuses', { ns: 'orders' })}</SelectItem>
                            {orderStatusOptions.map(opt => <SelectItem key={opt} value={opt}>{t(`status_${opt}`, { ns: 'orders' })}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {/* <DatePickerWithRange
                        date={filters.dateRange}
                        onDateChange={(range) => setFilters(prev => ({...prev, dateRange: range}))}
                        className="w-full sm:w-auto"
                    /> */}
                </CardContent>
            </Card>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center">{t('orderNumber', { ns: 'orders' })}</TableHead>
                            <TableHead className="min-w-[200px] text-center">{t('customerName')}</TableHead>
                            <TableHead className="text-center">{t('orderDate')}</TableHead>
                            <TableHead className="text-center">{t('status')}</TableHead>
                            <TableHead className="text-center">{t('totalAmount', {ns:'purchases'})}</TableHead>
                            <TableHead className="text-center w-[80px]">{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && orders.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-32 text-center">
                                <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-6 w-6 animate-spin" /><span>{t("loadingOrders", { ns: "orders" })}</span>
                                </div>
                            </TableCell></TableRow>
                        ) : orders.length > 0 ? (
                            orders.map(order => <MemoizedTableRow key={order.id} order={order} />)
                        ) : (
                            <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">{t("noResults")}</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {t("pagination.showingItems", { first: paginatedData?.meta.from || 0, last: paginatedData?.meta.to || 0, total: totalItems })}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || isFetching}> {t('firstPage')} </Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || isFetching}> {t('previous')} </Button>
                        <span className="text-sm font-medium">{t('pageWithTotal', { currentPage, totalPages })}</span>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || isFetching}> {t('next')} </Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || isFetching}> {t('lastPage')} </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersListPage;