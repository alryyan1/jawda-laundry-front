// src/api/orderService.ts
import apiClient from './apiClient';
import type {
    Order,
    OrderItem, // If needed for update payload details
    OrderStatus,
    PaginatedResponse,
    NewOrderFormData as FrontendNewOrderFormData, // Alias to distinguish from backend payload if necessary
    OrderItemFormLine,
    ServiceOffering, // Needed for createOrder logic
    PricingStrategy  // For QuoteItemResponse
} from '@/types';

// --- Quote Types ---
export interface QuoteItemPayload {
    service_offering_id: number | string; // string from form, number for API
    customer_id: number | string;       // string from form, number for API
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

// --- Backend Payload Types for Order Creation/Update ---
interface BackendOrderItemPayload {
    service_offering_id: number;
    quantity: number;
    product_description_custom?: string | null;
    length_meters?: number | null;
    width_meters?: number | null;
    notes?: string | null;
    // If updating, you might send an 'id' for existing items, or a flag for new/deleted
    // id?: number | null; // For updates
    // _destroy?: boolean; // For marking an item for deletion during update
}

interface BackendOrderPayload {
    customer_id: number;
    items: BackendOrderItemPayload[];
    notes?: string | null;
    due_date?: string | null; // Expects 'YYYY-MM-DD'
    // For updates, other fields might be included
    status?: OrderStatus;
    payment_method?: string | null;
    payment_status?: string | null;
    paid_amount?: number | null;
}

// --- Payment Types ---
export interface RecordPaymentPayload {
    amount_paid: number;
    payment_method: string;
    payment_date?: string | null; // 'YYYY-MM-DD'
    transaction_id?: string | null;
    notes?: string | null;
}


// --- API Functions ---

/**
 * Fetches a paginated list of orders.
 */
export const getOrders = async (
    page: number = 1,
    perPage: number = 10,
    status?: OrderStatus | '',
    search?: string,
    customerId?: number | string,
    dateFrom?: string, // YYYY-MM-DD
    dateTo?: string    // YYYY-MM-DD
): Promise<PaginatedResponse<Order>> => {
    const params: any = { page, per_page: perPage };
    if (status) params.status = status;
    if (search) params.search = search;
    if (customerId) params.customer_id = customerId;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    const { data } = await apiClient.get<PaginatedResponse<Order>>('/orders', { params });
    return data;
};

/**
 * Fetches a single order by its ID.
 */
export const getOrderById = async (id: string | number): Promise<Order> => {
  const { data } = await apiClient.get<{data: Order}>(`/orders/${id}`);
  return data.data; // Assuming backend wraps single resource in 'data'
};

/**
 * Creates a new order.
 * @param orderData Data from the frontend form.
 * @param serviceOfferingsList Full list of available service offerings (used to find offering ID).
 */
export const createOrder = async (orderData: FrontendNewOrderFormData, serviceOfferingsList: ServiceOffering[]): Promise<Order> => {
    console.log('Creating order with data:', orderData);
    console.log('Available service offerings:', serviceOfferingsList);

    const itemsPayload: BackendOrderItemPayload[] = orderData.items.map(item => {
        console.log('Processing item:', item);
        
     

        // Convert length and width to numbers if they exist
        const lengthMeters = item.length_meters ? 
            (typeof item.length_meters === 'string' ? parseFloat(item.length_meters) : item.length_meters) : 
            null;
        
        const widthMeters = item.width_meters ? 
            (typeof item.width_meters === 'string' ? parseFloat(item.width_meters) : item.width_meters) : 
            null;

        return {
            service_offering_id: item.service_offering_id,
            quantity: typeof item.quantity === 'string' ? parseInt(item.quantity, 10) : item.quantity,
            product_description_custom: item.product_description_custom || null,
            length_meters: lengthMeters,
            width_meters: widthMeters,
            notes: item.notes || null,
        };
    });

    const payload: BackendOrderPayload = {
        customer_id: parseInt(orderData.customer_id, 10),
        items: itemsPayload,
        notes: orderData.notes || null,
        due_date: orderData.due_date && orderData.due_date.trim() !== '' ? orderData.due_date : null,
    };

    console.log('Final payload:', payload);

    const { data } = await apiClient.post<{ data: Order }>('/orders', payload);
    return data.data;
};





/**
 * Updates the status of a specific order.
 */
export const updateOrderStatus = async (orderId: string | number, status: OrderStatus): Promise<Order> => {
    const { data } = await apiClient.patch<{ data: Order }>(`/orders/${orderId}/status`, { status });
    return data.data;
};

/**
 * Records a payment for a specific order.
 */
export const recordOrderPayment = async (orderId: string | number, paymentData: RecordPaymentPayload): Promise<Order> => {
    const payload = {
        ...paymentData,
        amount_paid: Number(paymentData.amount_paid) // Ensure it's a number
    };
    const { data } = await apiClient.post<{ data: Order }>(`/orders/${orderId}/payment`, payload);
    return data.data;
};


/**
 * Gets a price quote for a potential order item.
 */
export const getOrderItemQuote = async (payload: QuoteItemPayload): Promise<QuoteItemResponse> => {
    const quoteApiPayload = {
        ...payload,
        service_offering_id: Number(payload.service_offering_id),
        customer_id: Number(payload.customer_id),
        length_meters: payload.length_meters ? Number(payload.length_meters) : null,
        width_meters: payload.width_meters ? Number(payload.width_meters) : null,
    };
    const { data } = await apiClient.post<QuoteItemResponse>('/orders/quote-item', quoteApiPayload);
    return data;
};

/**
 * Deletes an order (if business logic allows).
 * Backend returns a message object.
 */
export const deleteOrder = async (id: string | number): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/orders/${id}`);
    return data;
};
// src/api/orderService.ts
// ...
interface BackendOrderUpdatePayload { // More specific for update
    customer_id?: number; // Usually not changed, but possible
    notes?: string | null;
    due_date?: string | null;
    status?: OrderStatus;
    payment_method?: string | null;
    payment_status?: string | null;
    paid_amount?: number | null;
    // IMPORTANT: Do NOT include 'items' if only updating order details
}

export const updateOrderDetails = async (orderId: string | number, orderUpdateData: BackendOrderUpdatePayload): Promise<Order> => {
    const { data } = await apiClient.put<{ data: Order }>(`/orders/${orderId}`, orderUpdateData);
    return data.data;
};
// src/api/orderService.ts

// Helper to prepare item payload (can be used by create and update)
const prepareOrderItemsPayload = (
    items: OrderItemFormLine[],
    allServiceOfferings: ServiceOffering[]
): BackendOrderItemPayload[] => {
    return items.map(item => {
        // Logic to find offering.id using item.product_type_id and item.service_action_id
        // from allServiceOfferings OR directly use item._derivedServiceOffering.id
        const offeringId = item._derivedServiceOffering?.id ||
                           allServiceOfferings.find(so =>
                               so.productType?.id.toString() === item.product_type_id &&
                               so.serviceAction?.id.toString() === item.service_action_id
                           )?.id;

        if (!offeringId) {
            throw new Error(`Service offering could not be determined for an item. ProductType ID: ${item.product_type_id}, ServiceAction ID: ${item.service_action_id}`);
        }

        return {
            service_offering_id: Number(offeringId),
            quantity: typeof item.quantity === 'string' ? parseInt(item.quantity, 10) : item.quantity,
            product_description_custom: item.product_description_custom || null,
            length_meters: item.length_meters && String(item.length_meters).trim() !== '' ? parseFloat(String(item.length_meters)) : null,
            width_meters: item.width_meters && String(item.width_meters).trim() !== '' ? parseFloat(String(item.width_meters)) : null,
            notes: item.notes || null,
            // If NOT using delete-and-recreate, you'd pass item ID for existing items:
            // id: item.db_id || null, // Assuming you store original DB ID on form item
        };
    });
};


export const updateOrder = async (
    orderId: string | number,
    orderData: FrontendNewOrderFormData, // Same structure as NewOrderFormData
    allServiceOfferings: ServiceOffering[]
): Promise<Order> => {
    const itemsPayload = prepareOrderItemsPayload(orderData.items, allServiceOfferings);

    const payload: BackendOrderPayload = { // BackendOrderPayload should allow optional fields for update
        customer_id: parseInt(orderData.customer_id, 10), // Assuming customer can't change on edit easily
        items: itemsPayload, // Send the full list of current items
        notes: orderData.notes || null,
        due_date: orderData.due_date && orderData.due_date.trim() !== '' ? orderData.due_date : null,
        // Include other order-level fields from EditOrderPage form if any
        // status: orderData.status, // If status is edited on this page
    };

    const { data } = await apiClient.put<{ data: Order }>(`/orders/${orderId}`, payload);
    return data.data;
};