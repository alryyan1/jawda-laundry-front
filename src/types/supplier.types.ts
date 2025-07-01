// src/types/supplier.types.ts

export interface Supplier {
    id: number;
    name: string;
    contact_person?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    purchases_count?: number; // from withCount
    created_at: string;
    updated_at: string;
}

// For the create/edit form
export interface SupplierFormData {
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
}