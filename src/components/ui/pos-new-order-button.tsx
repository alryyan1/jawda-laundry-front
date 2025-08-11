import React from 'react';
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { useNewOrder } from "@/context/NewOrderContext";
import { useDate } from "@/context/DateContext";

interface CreateEmptyOrderResponse {
  order: {
    id: number;
    order_number: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  message: string;
}

export const POSNewOrderButton: React.FC = () => {
  const { t } = useTranslation(["pos"]);
  const queryClient = useQueryClient();
  const { setNewlyCreatedOrder } = useNewOrder();
  const { selectedDate } = useDate();

  const createEmptyOrderMutation = useMutation({
    mutationFn: async (): Promise<CreateEmptyOrderResponse> => {
      const response = await apiClient.post('/orders', {
        create_empty_order: true,
        customer_id: null,
        order_type: 'in_house',
        dining_table_id: null,
        items: [], // Empty items array
        status: 'pending'
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(t("orderCreatedSuccessfully", { defaultValue: "Order created successfully" }));
      // Invalidate and refetch orders to update the TodayOrdersColumn
      queryClient.invalidateQueries({ queryKey: ['orders', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['todayOrders', selectedDate] });
      
      // Set the newly created order in context so it can be selected
      setNewlyCreatedOrder(data.order);
      console.log('New order created:', data.order);
    },
    onError: (error: any) => {
      console.error('Error creating order:', error);
      toast.error(
        error.response?.data?.message || 
        t("errorCreatingOrder", { defaultValue: "Error creating order" })
      );
    }
  });

  const handleCreateOrder = () => {
    createEmptyOrderMutation.mutate();
  };

  return (
    <Button
      onClick={handleCreateOrder}
      disabled={createEmptyOrderMutation.isPending}
      size="sm"
      className="flex items-center gap-2"
      title={t("createNewOrder", { defaultValue: "Create new order" })}
    >
      {createEmptyOrderMutation.isPending ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {t("creating", { defaultValue: "Creating..." })}
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          {t("newOrder", { defaultValue: "New Order" })}
        </>
      )}
    </Button>
  );
}; 