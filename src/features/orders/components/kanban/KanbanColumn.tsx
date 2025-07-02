// src/features/orders/components/kanban/KanbanColumn.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OrderStatusBadge } from '../OrderStatusBadge';
import { OrderCard } from './OrderCard';
import type { Order, OrderStatus } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  status: OrderStatus;
  orders: Order[];
  isLoading: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, orders, isLoading }) => {
    const { t } = useTranslation('orders');
    const { setNodeRef, isOver } = useDroppable({ id: status });

    const orderIds = React.useMemo(() => orders.map(o => o.id), [orders]);

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col h-full bg-muted/60 dark:bg-muted/30 rounded-lg",
                isOver && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
        >
            <header className="p-3 font-semibold border-b flex items-center justify-between shrink-0 sticky top-0 bg-muted/60 dark:bg-muted/30 rounded-t-lg z-10">
                <div className="flex items-center gap-2">
                    <OrderStatusBadge status={status} size="sm"/>
                    <span className="text-sm uppercase tracking-wider">{t(`status_${status}`)}</span>
                </div>
                <span className="text-sm font-bold text-muted-foreground bg-background px-2 py-0.5 rounded-full">{isLoading ? '...' : orders.length}</span>
            </header>
            <ScrollArea className="flex-grow p-3">
                {isLoading && orders.length === 0 ? (
                    <div className="space-y-3">
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                    </div>
                ) : (
                    <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
                        {orders.map(order => <OrderCard key={order.id} order={order} />)}
                        {orders.length === 0 && <div className="text-center text-xs text-muted-foreground py-10">{t('noOrdersInStatus', {ns:'orders'})}</div>}
                    </SortableContext>
                )}
            </ScrollArea>
        </div>
    );
};