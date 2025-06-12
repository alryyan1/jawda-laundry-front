// src/api/orderService.ts
import apiClient from "./apiClient";
import {type  Order, type OrderStatus, type PaginatedResponse, type PricingStrategy, type ServiceOffering } from "@/types";
// Ensure NewOrderFormData is correctly defined and imported, possibly from a page or types file
// For now, let's assume it's defined in types or a specific order feature file.
// If it was in NewOrderPage.tsx, you might need to move it to a more central types location.
// Let's create a placeholder for it here for now, or define it in src/types/index.ts
// import { NewOrderFormData } from '@/pages/orders/NewOrderPage'; // Example if it was there
export interface NewOrderFormData {
  // Placeholder - define properly in types/ or feature/orders/types.ts
  customer_id: string | number;
  items: Array<{
    service_offering_id: string | number;
    quantity: number;
    product_description_custom?: string;
    length_meters?: number;
    width_meters?: number;
  }>;
  notes?: string;
  due_date?: string;
}



export const getOrderById = async (id: string | number): Promise<Order> => {
  const { data } = await apiClient.get<{ data: Order }>(`/orders/${id}`);
  return data.data;
};



// This is the payload the backend OrderController@store expects for an item
interface BackendOrderItemPayload {
    service_offering_id: number;
    quantity: number;
    product_description_custom?: string;
    length_meters?: number | null;
    width_meters?: number | null;
    notes?: string;
}

interface BackendOrderPayload {
    customer_id: number;
    items: BackendOrderItemPayload[];
    notes?: string;
    due_date?: string | null;
}

export const createOrder = async (orderData: NewOrderFormData, serviceOfferingsList: ServiceOffering[]): Promise<Order> => {
    const itemsPayload: BackendOrderItemPayload[] = orderData.items.map(item => {
        // Find the service_offering_id directly
        const offering = serviceOfferingsList.find(so =>
            so.id.toString() === item.service_offering_id.toString()
        );

        if (!offering) {
            // This should ideally be caught by form validation before submission
            throw new Error(`Service offering not found for Service Offering ID ${item.service_offering_id}`);
        }

        return {
            service_offering_id: offering.id,
            quantity: typeof item.quantity === 'string' ? parseInt(item.quantity, 10) : item.quantity,
            product_description_custom: item.product_description_custom,
            length_meters: item.length_meters ?? null,
            width_meters: item.width_meters ?? null,
            // notes: item.notes, // Removed, not in item type
        };
    });

    const payload: BackendOrderPayload = {
        customer_id: Number(orderData.customer_id),
        items: itemsPayload,
        notes: orderData.notes,
        due_date: orderData.due_date || null,
    };

    const { data } = await apiClient.post<{ data: Order }>('/orders', payload);
    return data.data;
};
// src/api/orderService.ts
// ... (other imports)

export interface QuoteItemPayload {
  service_offering_id: number | string;
  customer_id: number | string;
  quantity: number;
  length_meters?: number | null;
  width_meters?: number | null;
}

export interface QuoteItemResponse {
  calculated_price_per_unit_item: number;
  sub_total: number;
  applied_unit: string;
  strategy_applied: PricingStrategy;
  message?: string;
}

export const getOrderItemQuote = async (payload: QuoteItemPayload): Promise<QuoteItemResponse> => {
  const { data } = await apiClient.post<QuoteItemResponse>('/orders/quote-item', payload);
  return data;
};
// ... (getOrders, getOrderById remain mostly the same)

// src/api/orderService.ts
// ...
export const getOrders = async (
  page: number = 1,
  perPage: number = 10,
  status?: OrderStatus | '', // Allow empty string for 'all'
  search?: string
): Promise<PaginatedResponse<Order>> => {
  const params: Record<string, unknown> = { page, per_page: perPage };
  if (status) {
      params.status = status;
  }
  if (search) {
      params.search = search;
  }
  const { data } = await apiClient.get<PaginatedResponse<Order>>('/orders', { params });
  return data;
};
// src/api/orderService.ts
// ...
export const updateOrderStatus = async (orderId: string | number, status: OrderStatus): Promise<Order> => {
  const { data } = await apiClient.patch<{data: Order}>(`/orders/${orderId}/status`, { status });
  return data.data;
};