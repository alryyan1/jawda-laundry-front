import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface OrderEvent {
  order: {
    id: number;
    order_number: string;
    daily_order_number?: number;
    status: string;
    total_amount: number;
    paid_amount: number;
    order_date: string;
    customer: {
      id: number;
      name: string;
    };
    items_count: number;
  };
  message: string;
  timestamp: string;
  changes?: {
    status?: string;
  };
}

export const useRealtimeUpdates = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['orders']);

  // DISABLED: Real-time updates are disabled for production
  // Set this to true to enable real-time updates
  const ENABLE_REALTIME = false;

  const handleOrderCreated = useCallback((event: OrderEvent) => {
    console.log('Order created event received:', event);
    
    // Invalidate and refetch relevant queries
    queryClient.invalidateQueries({ queryKey: ['todayOrders'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['orderStatistics'] });
    
    // Show notification
    toast.success(
      t('newOrderCreated', { 
        defaultValue: 'New order created',
        orderNumber: event.order.order_number 
      }),
      {
        description: `${event.order.customer.name} - ${event.order.order_number}`,
        duration: 5000,
      }
    );
  }, [queryClient, t]);

  const handleOrderUpdated = useCallback((event: OrderEvent) => {
    console.log('Order updated event received:', event);
    
    // Invalidate and refetch relevant queries
    queryClient.invalidateQueries({ queryKey: ['todayOrders'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['orderStatistics'] });
    queryClient.invalidateQueries({ queryKey: ['order', event.order.id] });
    
    // Show notification for status changes
    if (event.changes?.status) {
      toast.info(
        t('orderStatusUpdated', { 
          defaultValue: 'Order status updated',
          orderNumber: event.order.order_number,
          status: t(`status_${event.order.status}`, { defaultValue: event.order.status })
        }),
        {
          description: `${event.order.customer.name} - ${event.order.order_number}`,
          duration: 4000,
        }
      );
    }
  }, [queryClient, t]);

  useEffect(() => {
    // Real-time updates are disabled
    if (!ENABLE_REALTIME) {
      console.log('Real-time updates are disabled. Set ENABLE_REALTIME = true to enable.');
      return;
    }

    // The rest of the real-time setup code is disabled
    console.log('Real-time updates would be enabled here if ENABLE_REALTIME = true');
  }, [handleOrderCreated, handleOrderUpdated]);

  return {
    // Return any additional methods if needed
  };
}; 