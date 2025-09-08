import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { useNewOrder } from "@/context/NewOrderContext";
import type { Order } from "@/types";

interface CreateEmptyOrderResponse {
  order: Order;
  message: string;
}

export const useCreateEmptyOrder = () => {
  const { t } = useTranslation(["pos"]);
  const { setNewlyCreatedOrder } = useNewOrder();
  const queryClient = useQueryClient();

  const mutation = useMutation<CreateEmptyOrderResponse, unknown, void>({
    mutationFn: async () => {
      const response = await apiClient.post("/orders", {
        create_empty_order: true,
        customer_id: null,
        order_type: "in_house",
        dining_table_id: null,
        items: [],
        status: "pending",
      });
      return response.data;
    },
    onSuccess: (data) => {
      setNewlyCreatedOrder(data.order);
      // console.debug('New order created via hook:', data.order);
      // Refresh TodayOrdersColumn (and any related lists)
      queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiMessage = (error as any)?.response?.data?.message as string | undefined;
      toast.error(apiMessage || t("errorCreatingOrder", { defaultValue: "Error creating order" }));
    },
  });

  const createNewOrder = () => mutation.mutate();

  return {
    createNewOrder,
    isCreating: mutation.isPending,
  };
};


