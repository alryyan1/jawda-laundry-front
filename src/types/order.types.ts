// src/types/order.types.ts
import type { User } from './auth.types';
import type { Customer } from './customer.types';
import type { ServiceOffering, PricingStrategy } from './service.types';

export type OrderStatus = "pending" | "processing" | "ready_for_pickup" | "completed" | "cancelled" | string;
export const orderStatusOptions: OrderStatus[] = ["pending", "processing", "ready_for_pickup", "completed", "cancelled"];


export interface OrderItem {
    id: number;
    order_id: number;
    service_offering_id: number;
    serviceOffering?: ServiceOffering; // if eager loaded from backend
    product_description_custom?: string | null;
    quantity: number;
    length_meters?: number | null;
    width_meters?: number | null;
    calculated_price_per_unit_item: number;
    sub_total: number;
    notes?: string | null;
}

export interface Order {
    id: number;
    order_number: string;
    customer_id: number;
    customer: Customer; // Assuming customer is always eager loaded
    user_id?: number | null; // Staff user ID
    staff_user?: User;       // Eager loaded staff user details
    status: OrderStatus;
    total_amount: number;
    paid_amount: number;
    payment_method?: string | null;
    payment_status?: 'pending' | 'paid' | 'partially_paid' | 'refunded' | string | null;
    notes?: string | null;
    order_date: string;      // ISO date string
    due_date?: string | null;   // ISO date string
    pickup_date?: string | null;// ISO date string
    delivery_address?: string | null;
    items: OrderItem[];
    created_at: string;
    updated_at: string;
    amount_due?: number; // Accessor from backend
}

// Form data types for NewOrderPage
export interface OrderItemFormLine {
    id: string; // For useFieldArray key (client-side only)
    product_type_id: string;
    service_action_id: string;
    product_description_custom?: string;
    quantity: number | string;
    length_meters?: number | string | null; // Allow null for reset
    width_meters?: number | string | null;  // Allow null for reset
    notes?: string;

    // Client-side derived/temporary fields for UI logic
    _derivedServiceOffering?: ServiceOffering | null;
    _pricingStrategy?: PricingStrategy | null;
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
    due_date?: string; // yyyy-mm-dd
}