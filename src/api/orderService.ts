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
    PricingStrategy,  // For QuoteItemResponse
    QuoteItemPayload,
    QuoteItemResponse,
    OrderStatistics
} from '@/types';

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
    order_type?: 'in_house' | 'take_away' | 'delivery';
    dining_table_id?: number | null; // Add dining table ID for in-house orders
    // For updates, other fields might be included
    status?: OrderStatus;
    order_complete?: boolean; // Add order_complete field for order completion
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
    filters?: {
        status?: OrderStatus | '';
        search?: string;
        orderId?: string;
        customerId?: string;
        productTypeId?: string;
        dateFrom?: string; // YYYY-MM-DD
        dateTo?: string;   // YYYY-MM-DD
        createdDate?: string; // YYYY-MM-DD
        category_sequence_search?: string;
        show_only_incomplete?: boolean;
        shiftId?: number;
    }
): Promise<PaginatedResponse<Order>> => {
    const params: any = { page, per_page: perPage };
    if (filters?.status) params.status = filters.status;
    if (filters?.search) params.search = filters.search;
    if (filters?.orderId) params.order_id = filters.orderId;
    if (filters?.customerId) params.customer_id = filters.customerId;
    if (filters?.productTypeId) params.product_type_id = filters.productTypeId;
    if (filters?.dateFrom) params.date_from = filters.dateFrom;
    if (filters?.dateTo) params.date_to = filters.dateTo;
    if (filters?.createdDate) params.created_date = filters.createdDate;
    if (filters?.category_sequence_search) params.category_sequence_search = filters.category_sequence_search;
    if (filters?.show_only_incomplete) params.show_only_incomplete = filters.show_only_incomplete;
    if (filters?.shiftId) params.shift_id = filters.shiftId;

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
 * Fetch order items independently for a given order ID
 */
export const getOrderItems = async (orderId: string | number): Promise<OrderItem[]> => {
  const { data } = await apiClient.get<{ order_id: number; items: OrderItem[] }>(`/orders/${orderId}/items`);
  return data.items;
};

/**
 * Add a single order item to an existing order
 */
export const addOrderItem = async (
  orderId: string | number,
  payload: {
    service_offering_id: number;
    quantity: number;
    product_description_custom?: string | null;
    length_meters?: number | null;
    width_meters?: number | null;
    notes?: string | null;
  }
): Promise<{ order_item: OrderItem; order: Order; message: string }> => {
  const { data } = await apiClient.post<{ order_item: OrderItem; order: Order; message: string }>(
    `/orders/${orderId}/items`,
    payload
  );
  return data;
};

/**
 * Response type for order creation with warnings
 */
export interface OrderResponseWithWarnings {
    order: Order;
    warnings?: string[];
    message?: string;
}

/**
 * Creates a new order.
 * @param orderData Data from the frontend form.
 * @param serviceOfferingsList Full list of available service offerings (used to find offering ID).
 */
export const createOrder = async (orderData: FrontendNewOrderFormData, serviceOfferingsList: ServiceOffering[]): Promise<OrderResponseWithWarnings> => {
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
        order_type: orderData.order_type || 'in_house', // Default to in_house if not provided
        dining_table_id: orderData.dining_table_id || null, // Include dining table ID if provided
    };

    console.log('Final payload:', payload);

    const { data } = await apiClient.post<OrderResponseWithWarnings | { data: Order }>('/orders', payload);
    
    // Handle both response formats (with warnings or without)
    if ('warnings' in data) {
        return data as OrderResponseWithWarnings;
    } else {
        return { order: data.data };
    }
};





/**
 * Updates the status of a specific order.
 */
export const updateOrderStatus = async (orderId: string | number, status: OrderStatus): Promise<OrderResponseWithWarnings> => {
    const { data } = await apiClient.patch<OrderResponseWithWarnings | { data: Order }>(`/orders/${orderId}/status`, { status });
    
    // Handle both response formats (with warnings or without)
    if ('warnings' in data) {
        return data as OrderResponseWithWarnings;
    } else {
        return { order: data.data };
    }
};

/**
 * Marks an order as delivered and sets the delivered_date to current date
 */
export const markOrderAsDelivered = async (orderId: string | number): Promise<OrderResponseWithWarnings> => {
    const { data } = await apiClient.patch<OrderResponseWithWarnings | { data: Order }>(`/orders/${orderId}/status`, { 
        status: 'delivered',
        delivered_date: new Date().toISOString()
    });
    
    // Handle both response formats (with warnings or without)
    if ('warnings' in data) {
        return data as OrderResponseWithWarnings;
    } else {
        return { order: data.data };
    }
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
    const quoteApiPayload: any = {
        service_offering_id: Number(payload.service_offering_id),
        quantity: Number(payload.quantity),
        length_meters: payload.length_meters ? Number(payload.length_meters) : null,
        width_meters: payload.width_meters ? Number(payload.width_meters) : null,
    };
    if (payload.customer_id) {
        quoteApiPayload.customer_id = Number(payload.customer_id);
    }
    const { data } = await apiClient.post<QuoteItemResponse>('/orders/quote-item', quoteApiPayload);
    return data;
};

/**
 * Fetches orders for a specific date.
 */
export const getTodayOrders = async (date?: string): Promise<Order[]> => {
    const params: any = { 
        per_page: 100 // Get more orders
    };
    
    if (date) {
        // Use specific date
        params.created_date = date;
    } else {
        // Use today's date
        params.today = true;
    }
    
    const { data } = await apiClient.get<{data: Order[]}>('/orders', { params });
    return data.data;
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
): Promise<OrderResponseWithWarnings> => {
    const itemsPayload = prepareOrderItemsPayload(orderData.items, allServiceOfferings);

    const payload: BackendOrderPayload = { // BackendOrderPayload should allow optional fields for update
        customer_id: parseInt(orderData.customer_id, 10), // Assuming customer can't change on edit easily
        items: itemsPayload, // Send the full list of current items
        notes: orderData.notes || null,
        due_date: orderData.due_date && orderData.due_date.trim() !== '' ? orderData.due_date : null,
        // Include other order-level fields from EditOrderPage form if any
        status: orderData.status, // Include status for order completion
        order_complete: orderData.order_complete, // Include order_complete for order completion
        order_type: orderData.order_type,
        dining_table_id: orderData.dining_table_id,
    };

    const { data } = await apiClient.put<OrderResponseWithWarnings | { data: Order }>(`/orders/${orderId}`, payload);
    
    // Handle both response formats (with warnings or without)
    if ('warnings' in data) {
        return data as OrderResponseWithWarnings;
    } else {
        return { order: data.data };
    }
};


// This type can be used for any partial update of order details
export interface OrderDetailsUpdatePayload {
    customer_id?: number;
    notes?: string | null;
    due_date?: string | null;
    status?: OrderStatus;
    order_complete?: boolean;
    pickup_date?: string | null; // e.g., "YYYY-MM-DD HH:mm:ss" UTC
    order_type?: 'in_house' | 'take_away' | 'delivery';
}

export const updateOrderDetails = async (orderId: string | number, payload: OrderDetailsUpdatePayload): Promise<Order> => {
    const { data } = await apiClient.patch<{ data: Order }>(`/orders/${orderId}`, payload);
    return data.data;
};

/**
 * Updates the order type for a specific order
 */
export const updateOrderType = async (orderId: string | number, orderType: 'in_house' | 'take_away' | 'delivery'): Promise<Order> => {
    const { data } = await apiClient.patch<{ order: Order }>(`/orders/${orderId}/order-type`, {
        order_type: orderType
    });
    return data.order;
};

/**
 * Sends a WhatsApp message to the customer about their order.
 */
export const sendOrderWhatsAppMessage = async (
    orderId: string | number, 
    message: string
): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>(`/orders/${orderId}/send-whatsapp-message`, {
        message
    });
    return data;
};

/**
 * Sends the order invoice via WhatsApp to the customer.
 */
export const sendOrderWhatsAppInvoice = async (
    orderId: string | number
): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>(`/orders/${orderId}/send-whatsapp-invoice`);
    return data;
};

/**
 * Enqueue a print job for POS invoice
 */
export const enqueueOrderPrintJob = async (
  orderId: string | number
): Promise<{ message: string; job_id: number; order_id: number; pdf_url: string }> => {
  const { data } = await apiClient.post<{ message: string; job_id: number; order_id: number; pdf_url: string }>(`/orders/${orderId}/print`);
  return data;
};

/**
 * Updates the status of a specific order item.
 */
export const updateOrderItemStatus = async (
  orderItemId: number | string,
  status: string
): Promise<OrderItem> => {
  const { data } = await apiClient.patch<{ order_item: OrderItem }>(`/order-items/${orderItemId}/status`, { status });
  return data.order_item;
};

export const updateOrderItemPickedUpQuantity = async (
  orderItemId: number | string,
  pickedUpQuantity: number
): Promise<OrderItem> => {
  const { data } = await apiClient.patch<{ order_item: OrderItem }>(`/order-items/${orderItemId}/picked-up-quantity`, { 
    picked_up_quantity: pickedUpQuantity 
  });
  return data.order_item;
};

export const getOrderStatistics = async (
  dateFrom?: string,
  dateTo?: string,
  shiftId?: number
): Promise<OrderStatistics> => {
  const params = new URLSearchParams();
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);
  if (shiftId) params.append('shift_id', String(shiftId));

  const { data } = await apiClient.get<OrderStatistics>(
    `/orders/statistics?${params.toString()}`
  );
  return data;
};

export const getOrdersByShift = async (
  shiftId: number
): Promise<Order[]> => {
  const { data } = await apiClient.get<Order[]>(`/shifts/${shiftId}/orders`);
  return data;
};

// --- Shifts API ---
export const getCurrentShift = async () => {
  const { data } = await apiClient.get<{ shift: any }>(`/shifts/current`);
  return data.shift as { id: number; opened_at: string; closed_at: string | null; opening_cash: number; closing_cash: number | null } | null;
};

export const openShift = async (payload: { opening_cash?: number; notes?: string }) => {
  const { data } = await apiClient.post<{ message: string; shift: any }>(`/shifts/open`, payload);
  return data.shift as { id: number };
};

export const closeShift = async (payload: { closing_cash?: number; notes?: string }) => {
  const { data } = await apiClient.post<{ message: string; shift: any }>(`/shifts/close`, payload);
  return data.shift as { id: number };
};

export const getLatestShift = async () => {
  const { data } = await apiClient.get<{ shift: any }>(`/shifts/latest`);
  return data.shift as { id: number; opened_at: string; closed_at: string | null; opening_cash: number; closing_cash: number | null } | null;
};

export const getPreviousShift = async (shiftId: number) => {
  const { data } = await apiClient.get<{ shift: any }>(`/shifts/${shiftId}/previous`);
  return data.shift as { id: number; opened_at: string; closed_at: string | null; opening_cash: number; closing_cash: number | null } | null;
};

export const getNextShift = async (shiftId: number) => {
  const { data } = await apiClient.get<{ shift: any }>(`/shifts/${shiftId}/next`);
  return data.shift as { id: number; opened_at: string; closed_at: string | null; opening_cash: number; closing_cash: number | null } | null;
};

export const deleteOrderItem = async (orderItemId: number | string): Promise<{ order: Order; message: string }> => {
  const { data } = await apiClient.delete<{ order: Order; message: string }>(`/order-items/${orderItemId}`);
  return data;
};

/**
 * Cancel a completed order by setting order_complete to false.
 */
export const cancelOrder = async (orderId: string | number): Promise<{ order: Order; message: string }> => {
    const { data } = await apiClient.post<{ order: Order; message: string }>(`/orders/${orderId}/cancel`);
    return data;
};

export const markOrderReceived = async (orderId: string | number): Promise<{ order: Order; message: string }> => {
    const { data } = await apiClient.post<{ order: Order; message: string }>(`/orders/${orderId}/mark-received`);
    return data;
};

/**
 * Update order item dimensions and recalculate totals
 */
export const updateOrderItemDimensions = async (
    orderItemId: string | number,
    dimensions: { length_meters?: number | null; width_meters?: number | null }
): Promise<{ order_item: OrderItem; order_total: number; message: string }> => {
    const { data } = await apiClient.patch<{ order_item: OrderItem; order_total: number; message: string }>(
        `/order-items/${orderItemId}/dimensions`,
        dimensions
    );
    return data;
};

/**
 * Update order item quantity and recalculate totals
 */
export const updateOrderItemQuantity = async (
    orderItemId: string | number,
    quantity: number
): Promise<{ order_item: OrderItem; order_total: number; message: string }> => {
    const { data } = await apiClient.patch<{ order_item: OrderItem; order_total: number; message: string }>(
        `/order-items/${orderItemId}/quantity`,
        { quantity }
    );
    return data;
};

/**
 * Update order item notes
 */
export const updateOrderItemNotes = async (
    orderItemId: string | number,
    notes: string
): Promise<{ order_item: OrderItem; order: Order; message: string }> => {
    const { data } = await apiClient.patch<{ order_item: OrderItem; order: Order; message: string }>(
        `/order-items/${orderItemId}/notes`,
        { notes }
    );
    return data;
};

/**
 * Download order invoice PDF
 */
export const downloadOrderInvoice = async (orderId: string | number): Promise<void> => {
    try {
        const response = await apiClient.get(`/orders/${orderId}/invoice/download`, {
            responseType: 'blob',
        });
        
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${orderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        throw error;
    }
};

/**
 * Download orders list Excel
 */
export const downloadOrdersListExcel = async (filters: {
    status?: string;
    search?: string;
    orderId?: string;
    customerId?: string;
    productTypeId?: string;
    dateFrom?: string;
    dateTo?: string;
    category_sequence_search?: string;
    shiftId?: number;
}): Promise<void> => {
    try {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.orderId) params.append('order_id', filters.orderId);
        if (filters.customerId) params.append('customer_id', filters.customerId);
        if (filters.productTypeId) params.append('product_type_id', filters.productTypeId);
        if (filters.dateFrom) params.append('date_from', filters.dateFrom);
        if (filters.dateTo) params.append('date_to', filters.dateTo);
        if (filters.category_sequence_search) params.append('category_sequence_search', filters.category_sequence_search);
        if (filters.shiftId) params.append('shift_id', String(filters.shiftId));
        
        const response = await apiClient.get(`/reports/orders/export-csv?${params.toString()}`, {
            responseType: 'blob',
        });
        
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `orders-report-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading Excel:', error);
        throw error;
    }
};

/**
 * Download orders list PDF (opens in new tab)
 */
export const downloadOrdersListPdf = async (filters: {
    status?: string;
    search?: string;
    orderId?: string;
    customerId?: string;
    productTypeId?: string;
    dateFrom?: string;
    dateTo?: string;
    category_sequence_search?: string;
    shiftId?: number;
}): Promise<void> => {
    try {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.orderId) params.append('order_id', filters.orderId);
        if (filters.customerId) params.append('customer_id', filters.customerId);
        if (filters.productTypeId) params.append('product_type_id', filters.productTypeId);
        if (filters.dateFrom) params.append('date_from', filters.dateFrom);
        if (filters.dateTo) params.append('date_to', filters.dateTo);
        if (filters.category_sequence_search) params.append('category_sequence_search', filters.category_sequence_search);
        if (filters.shiftId) params.append('shift_id', String(filters.shiftId));
        
        // Open PDF in new tab
        const url = `${apiClient.defaults.baseURL}/reports/orders/list-pdf?${params.toString()}`;
        window.open(url, '_blank');
    } catch (error) {
        console.error('Error opening PDF:', error);
        throw error;
    }
};


