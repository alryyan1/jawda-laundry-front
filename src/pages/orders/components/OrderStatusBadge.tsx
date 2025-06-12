// src/features/orders/components/OrderStatusBadge.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import type { OrderStatus } from '@/types'; // Or from '@/types/order.types'
import { cn } from '@/lib/utils';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
  size?: 'sm' | 'default'; // Example size prop
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, className, size = 'default' }) => {
  const { t } = useTranslation('orders'); // Assuming 'orders' namespace has status translations

  let statusClasses = '';
  // Using more distinct colors based on common status meanings
  switch (status) {
    case 'pending':
      statusClasses = 'bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-700/30 dark:text-yellow-300 dark:border-yellow-600';
      break;
    case 'processing':
      statusClasses = 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-700/30 dark:text-blue-300 dark:border-blue-600';
      break;
    case 'ready_for_pickup':
      statusClasses = 'bg-green-100 text-green-700 border border-green-300 dark:bg-green-700/30 dark:text-green-300 dark:border-green-600';
      break;
    case 'completed':
      statusClasses = 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-700/30 dark:text-slate-300 dark:border-slate-600';
      break;
    case 'cancelled':
      statusClasses = 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-700/30 dark:text-red-300 dark:border-red-600';
      break;
    default: // For any other custom statuses
      statusClasses = 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <Badge className={cn("font-medium capitalize", sizeClasses, statusClasses, className)}>
      {t(`status_${status}`, { defaultValue: status })}
    </Badge>
  );
};