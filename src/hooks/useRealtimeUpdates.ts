import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Echo from '@/lib/websocket';
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
    // Check if Echo is properly configured
    if (!Echo || typeof Echo.channel !== 'function') {
      console.warn('Echo not properly configured. Real-time updates disabled.');
      return;
    }

    // Subscribe to POS updates channel
    const channel = Echo.channel('pos-updates');

    // Listen for order created events
    channel.listen('.order.created', handleOrderCreated);

    // Listen for order updated events
    channel.listen('.order.updated', handleOrderUpdated);

    // Cleanup function
    return () => {
      channel.stopListening('.order.created');
      channel.stopListening('.order.updated');
      Echo.leaveChannel('pos-updates');
    };
  }, [handleOrderCreated, handleOrderUpdated]);

  return {
    // Return any additional methods if needed
  };
}; 