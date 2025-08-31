import React from 'react';
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { useNewOrder } from "@/context/NewOrderContext";
import type { Order } from "@/types";

interface CreateEmptyOrderResponse {
  order: Order;
  message: string;
}

export const POSNewOrderButton: React.FC = () => {
  const { t } = useTranslation(["pos"]);
  const { setNewlyCreatedOrder } = useNewOrder();

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
       // Set the newly created order in context so it can be selected
       setNewlyCreatedOrder(data.order);
       console.log('New order created:', data.order);
     },
    onError: (error: unknown) => {
      console.error('Error creating order:', error);
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
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