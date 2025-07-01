// src/types/order.types.ts
import type { User } from './auth.types';
import type { Customer } from './customer.types';
import type { ServiceOffering, PricingStrategy } from './service.types';

export type OrderStatus = "pending" | "processing" | "ready_for_pickup" | "completed" | "cancelled";
export const orderStatusOptions: OrderStatus[] = ["pending", "processing", "ready_for_pickup", "completed", "cancelled"];

export interface OrderItem {
    id: number;
    order_id: number;
    service_offering_id: number;
    serviceOffering?: ServiceOffering;
    product_description_custom?: string | null;
    quantity: number;
    length_meters?: number | null;
    width_meters?: number | null;
    calculated_price_per_unit_item: number;
    sub_total: number;
    notes?: string | null;
    // New fields if you implement them
    brand?: string | null;
    color?: string | null;
    defects?: string | null;
}

export type BackendOrderItem = Omit<OrderItem, 'serviceOffering'> & { serviceOffering: ServiceOffering };

export interface Order {
    id: number;
    order_number: string;
    customer: Customer;
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
    items: OrderItem[];
    created_at: string;
    updated_at: string;
}

export interface OrderItemFormLine {
    id: string; // Client-side UUID
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
    items: OrderItemFormLine[];
    notes?: string;
    due_date?: string;
    status?: OrderStatus; // Added for edit page
}