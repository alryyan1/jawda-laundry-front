// src/types/purchase.types.ts
import type { User, Supplier } from '@/types';

export interface PurchaseItem {
    id: number;
    purchase_id: number;
    product_type_id: number;
    description?: string | null;
    quantity: number;
    unit?: string | null;
    unit_price: number;
    sub_total: number;
}

export type PurchaseStatus = 'ordered' | 'received' | 'paid' | 'partially_paid' | 'cancelled';
export const purchaseStatusOptions: PurchaseStatus[] = ['ordered', 'received', 'paid', 'partially_paid', 'cancelled'];

export interface Purchase {
    id: number;
    supplier_id?: number | null;
    supplier?: Supplier;
    reference_number?: string | null;
    total_amount: number;
    status: PurchaseStatus;
    purchase_date: string; // YYYY-MM-DD
    notes?: string | null;
    user_id?: number | null;
    user?: Pick<User, 'id' | 'name'>;
    items: PurchaseItem[];
    created_at: string;
    updated_at: string;
}

// For the New/Edit Purchase Form
export interface PurchaseItemFormData {
    id: string; // Client-side UUID
    product_type_id: string;
    description?: string;
    quantity: number | string;
    unit?: string;
    unit_price: number | string;
    sub_total?: number; // Calculated on client-side for display
}

export interface PurchaseFormData {
    supplier_id: string; // from select
    reference_number?: string;
    purchase_date: string; // YYYY-MM-DD
    status: PurchaseStatus;
    notes?: string;
    items: PurchaseItemFormData[];
}