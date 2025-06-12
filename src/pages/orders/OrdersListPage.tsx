// src/pages/orders/OrdersListPage.tsx
import React, { useState, useMemo, useEffect } from 'react'; // Added useEffect
// ... (other imports)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input'; // For search
import { useDebounce } from '@/hooks/useDebounce'; // For debouncing search input


const OrdersListPage: React.FC = () => {
    // ... (t, navigate, queryClient, currentPage, itemsPerPage, currentLocale)
    const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>(''); // '' for all statuses
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);


    const { data: paginatedOrders, isLoading, error, isFetching, refetch } = useQuery<PaginatedResponse<Order>, Error>({
        queryKey: ['orders', currentPage, itemsPerPage, statusFilter, debouncedSearchTerm], // Add filters to queryKey
        queryFn: () => getOrders(currentPage, itemsPerPage, statusFilter, debouncedSearchTerm),
        keepPreviousData: true,
    });

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, debouncedSearchTerm]);


    const orders = paginatedOrders?.data || [];
    const totalPages = paginatedOrders?.meta?.last_page || 1;

    const orderStatusOptions: OrderStatus[] = ["pending", "processing", "ready_for_pickup", "completed", "cancelled"];

    // ... (columns definition, deleteMutation, etc.)

    return (
        <div>
            <PageHeader
                title={t('title', { ns: 'orders' })}
                // description can be removed or kept
                actionButton={{
                    label: t('newOrder', { ns: 'common' }),
                    icon: PlusCircle,
                    to: '/orders/new',
                }}
                showRefreshButton
                onRefresh={refetch}
                isRefreshing={isFetching && isLoading}
            >
                {/* Children prop of PageHeader for extra actions/filters */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input
                        placeholder={t('searchOrdersPlaceholder', {ns:'orders', defaultValue: 'Search by Order # or Customer...' })}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 w-full sm:w-[250px]"
                    />
                    <Select value={statusFilter} onValueChange={(value: OrderStatus | '') => setStatusFilter(value)}>
                        <SelectTrigger className="h-9 w-full sm:w-[180px]">
                            <SelectValue placeholder={t('filterByStatus', { ns: 'orders' })} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">{t('allStatuses', { ns: 'orders' })}</SelectItem>
                            {orderStatusOptions.map(statusOpt => (
                                <SelectItem key={statusOpt} value={statusOpt}>
                                    {t(`status_${statusOpt}`, { ns: 'orders' })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </PageHeader>

            <DataTable
                columns={columns}
                data={orders}
                isLoading={isFetching} // Pass isFetching to show loading on table during refetch
                pageCount={totalPages}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                // Remove DataTable's internal search if backend handles it
                // searchColumnId="order_number" // Or customer.name, but backend search is better
                // searchPlaceholder={t('searchOrdersPlaceholder', {ns:'orders'})}
            />
            {/* ... (DeleteConfirmDialog if you implement delete for orders) */}
        </div>
    );
};
export default OrdersListPage;