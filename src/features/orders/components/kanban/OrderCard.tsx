// src/features/orders/components/kanban/OrderCard.tsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { GripVertical, Package, User as UserIcon } from 'lucide-react';
import type { Order } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
    const { t, i18n } = useTranslation(['orders', 'common']);
    const navigate = useNavigate();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: order.id,
        data: { type: 'Order', order }, // Pass order data for drop logic
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <Card
                className={cn(
                    "mb-3 shadow-sm hover:shadow-md transition-shadow",
                    isDragging && "opacity-50 ring-2 ring-primary shadow-lg"
                )}
                onClick={() => navigate(`/orders/${order.id}`)} // Make the whole card clickable
            >
                <CardHeader className="p-3 flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                        <p className="font-semibold text-sm hover:underline">#{order.order_number}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <UserIcon className="h-3 w-3"/>
                            {order.customer.name}
                        </p>
                    </div>
                    {/* The drag handle */}
                    <div {...listeners} className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:bg-accent rounded-sm">
                        <GripVertical className="h-5 w-5" />
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 text-sm">
                    {/* You can display a few item names here if you want */}
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                         <Package className="h-3 w-3"/>
                        {t('itemCount', { ns: 'orders', count: order.items?.length ?? 0 })}
                    </div>
                </CardContent>
                <CardFooter className="p-3 pt-0 flex justify-between text-xs font-semibold text-muted-foreground">
                    <span>
                        {t('due', {ns:'orders', defaultValue:'Due'})}: {formatDate(order.due_date, 'PP', i18n.language)}
                    </span>
                    <span className="font-bold text-foreground">
                        {formatCurrency(order.total_amount, 'USD', i18n.language)}
                    </span>
                </CardFooter>
            </Card>
        </div>
    );
};