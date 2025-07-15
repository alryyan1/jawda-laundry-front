// src/types/order.types.ts
import type { User } from './auth.types';
import type { Customer } from './customer.types';
import type { ServiceOffering, PricingStrategy } from './service.types';
import type { PAYMENT_METHODS } from '@/lib/constants';
import type { RestaurantTable } from './restaurantTable.types';

export type PaymentMethod = typeof PAYMENT_METHODS[number];

export interface Payment {
    id: number;
    order_id: number;
    amount: number;
    method: PaymentMethod;
    type: 'payment' | 'refund';
    payment_date: string;
    transaction_id?: string | null;
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

export interface RecordPaymentFormData {
    amount: number;
    method: PaymentMethod;
    type: 'payment' | 'refund';
    payment_date: string;
    transaction_id?: string;
    notes?: string;
}

export interface QuoteItemPayload {
    service_offering_id: number;
    customer_id: string;
    quantity: number;
    length_meters?: number;
    width_meters?: number;
}

export interface QuoteItemResponse {
    calculated_price_per_unit_item: number;
    sub_total: number;
    applied_unit: string;
}

export type OrderStatus = "pending" | "processing" | "ready_for_pickup" | "completed" | "cancelled";
export const orderStatusOptions: OrderStatus[] = ["pending", "processing", "ready_for_pickup", "completed", "cancelled"];

export interface OrderItem {
    id: number;
    order_id: number;
    service_offering_id: number;
    serviceOffering?: ServiceOffering;
    product_description_custom?: string | null;
    quantity: number;
    picked_up_quantity?: number;
    length_meters?: number | null;
    width_meters?: number | null;
    calculated_price_per_unit_item: number;
    sub_total: number;
    notes?: string | null;
    // New fields if you implement them
    brand?: string | null;
    color?: string | null;
    defects?: string | null;
    status?: OrderStatus;
}

export type BackendOrderItem = Omit<OrderItem, 'serviceOffering'> & { serviceOffering: ServiceOffering };

export interface Order {
    id: number;
    overdue_days?: number; // <-- أضف هذا الحقل الاختياري

    order_number: string;
    order_type: 'in_house' | 'take_away' | 'delivery';
    daily_order_number?: number;
    customer: Customer;
    table_id?: number | null;
    table?: RestaurantTable;
    staff_user?: User;
    status: OrderStatus;
    total_amount: number;
    paid_amount: number;
    amount_due?: number;
    payment_status?: 'pending' | 'paid' | 'partially_paid' | 'refunded' | string | null;
    payment_method?: string | null;
    notes?: string | null;
    order_date: string;
    due_date?: string | null;
    pickup_date?: string | null;
    whatsapp_text_sent?: boolean;
    whatsapp_pdf_sent?: boolean;
    items: OrderItem[];
    payments?: Payment[];
    created_at: string;
    updated_at: string;
}

export interface OrderItemFormLine {
    id: string; // Client-side UUID
    service_offering_id: number;
    product_type_id: string;
    service_action_id: string;
    quantity: number | string;
    product_description_custom?: string;
    length_meters?: number | string;
    width_meters?: number | string;
    notes?: string;
    _derivedServiceOffering?: ServiceOffering | null;
    _pricingStrategy?: PricingStrategy | null; // 'fixed' or 'dimension_based'
    _quoted_price_per_unit_item?: number | null;
    _quoted_sub_total?: number | null;
    _quoted_applied_unit?: string | null;
    _isQuoting?: boolean;
    _quoteError?: string | null;
}

export interface NewOrderFormData {
    customer_id: string;
    table_id?: number | null;
    items: OrderItemFormLine[];
    notes?: string;
    due_date?: string;
    status?: OrderStatus; // Added for edit page
    order_type?: 'in_house' | 'take_away' | 'delivery';
}

export interface OrderStatistics {
  totalOrders: number;
  totalAmountPaid: number;
  paymentBreakdown: {
    cash: number;
    card: number;
    online: number;
    credit: number;
  };
}