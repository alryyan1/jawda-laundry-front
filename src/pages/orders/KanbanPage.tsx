// src/pages/orders/KanbanPage.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    DndContext,
    type DragEndEvent,
    DragOverlay,
    type DragStartEvent,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { KanbanColumn } from '@/features/orders/components/kanban/KanbanColumn';
import { OrderCard } from '@/features/orders/components/kanban/OrderCard';
import { getOrders, updateOrderStatus } from '@/api/orderService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, LayoutGrid } from 'lucide-react';
import type { Order, OrderStatus, PaginatedResponse } from '@/types';

// Define the KanbanColumns type locally since it's not exported from types
type KanbanColumns = Record<OrderStatus, Order[]>;

// The statuses that will appear as columns on the board
const KANBAN_STATUSES: OrderStatus[] = ['pending', 'processing', 'ready_for_pickup', 'completed'];

const KanbanPage: React.FC = () => {
    const { t } = useTranslation(['orders', 'common']);
    const queryClient = useQueryClient();
    const [date, setDate] = useState<Date>(new Date());
    const [columns, setColumns] = useState<KanbanColumns>({} as KanbanColumns);
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);

    const formattedDate = format(date, 'yyyy-MM-dd');

    // Use useQueries to fetch data for all status columns in parallel
    const results = useQueries({
        queries: KANBAN_STATUSES.map(status => ({
            queryKey: ['kanbanOrders', status, formattedDate],
            queryFn: () => getOrders(1, 100, { status, dateFrom: formattedDate, dateTo: formattedDate }), // Fetch up to 100 orders per status for a day
            staleTime: 2 * 60 * 1000, // Cache for 2 minutes
        })),
    });

    // Effect to populate the local state `columns` once data is fetched
    useEffect(() => {
        const newColumns: KanbanColumns = {} as KanbanColumns;
        let allQueriesSuccess = true;
        results.forEach((result, index) => {
            if (result.isSuccess) {
                const status = KANBAN_STATUSES[index];
                newColumns[status] = (result.data as PaginatedResponse<Order>).data;
            } else if (result.isLoading) {
                allQueriesSuccess = false;
            }
        });

        if (allQueriesSuccess) {
            setColumns(newColumns);
        }
    }, [results.map(r => r.data).join(',')]); // A simple dependency array trigger

    const updateStatusMutation = useMutation<Order, Error, { orderId: number; status: OrderStatus; oldStatus: OrderStatus }>({
        mutationFn: ({ orderId, status }) => updateOrderStatus(orderId, status),
        onSuccess: (updatedOrder, { oldStatus, status }) => {
            toast.success(t('orderStatusUpdatedSuccess', {status: t(`status_${status}`)}));
            // Invalidate both the old and new column queries to ensure data consistency
            queryClient.invalidateQueries({ queryKey: ['kanbanOrders', oldStatus, formattedDate] });
            queryClient.invalidateQueries({ queryKey: ['kanbanOrders', status, formattedDate] });
        },
        onError: (error, { oldStatus }) => {
            toast.error(error.message || t('orderStatusUpdateFailed'));
            // Revert optimistic update on failure by refetching the original column
            queryClient.invalidateQueries({ queryKey: ['kanbanOrders', oldStatus, formattedDate] });
        }
    });

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const handleDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === 'Order') {
            setActiveOrder(event.active.data.current.order);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveOrder(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeOrderData = active.data.current?.order as Order;
        if (!activeOrderData) return;

        const originalStatus = activeOrderData.status;
        const newStatus = over.id as OrderStatus;

        if (originalStatus !== newStatus) {
            // Optimistic UI Update for a smoother experience
            setColumns((prev: KanbanColumns) => {
                const newCols = { ...prev };
                const orderToMove = newCols[originalStatus]?.find((o: Order) => o.id === active.id);
                if (orderToMove) {
                    // Update status on the moved item for immediate feedback
                    const updatedOrderToMove = { ...orderToMove, status: newStatus };
                    newCols[originalStatus] = (newCols[originalStatus] || []).filter((o: Order) => o.id !== active.id);
                    newCols[newStatus] = [updatedOrderToMove, ...(newCols[newStatus] || [])];
                }
                return newCols;
            });

            // Trigger the API call
            updateStatusMutation.mutate({ orderId: Number(active.id), status: newStatus, oldStatus: originalStatus });
        }
    };

    const isLoadingAnyColumn = results.some(r => r.isLoading);

    return (
        <div className="p-4 h-full flex flex-col max-h-screen">
            <header className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <LayoutGrid className="h-7 w-7 text-primary"/>
                    <div>
                        <h1 className="text-2xl font-bold">{t('kanbanBoardTitle', {ns:'orders'})}</h1>
                        <p className="text-sm text-muted-foreground">{t('kanbanBoardDescription', {ns:'orders', defaultValue:'Drag and drop orders to update their status.'})}</p>
                    </div>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[260px] justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{format(date, 'PPP')}</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus/></PopoverContent>
                </Popover>
            </header>
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
                    {KANBAN_STATUSES.map(status => (
                        <KanbanColumn
                            key={status}
                            status={status}
                            orders={columns[status] || []}
                            isLoading={isLoadingAnyColumn}
                        />
                    ))}
                </div>
                 <DragOverlay>{activeOrder ? <OrderCard order={activeOrder} /> : null}</DragOverlay>
            </DndContext>
        </div>
    );
};

export default KanbanPage;