// src/types/service.types.ts
import type { Customer, CustomerType } from './customer.types';

export interface ProductCategory {
    id: number;
    name: string;
    description?: string | null;
    product_types_count?: number;
}

export interface ProductType {
    id: number;
    product_category_id: number;
    category?: ProductCategory;
    name: string;
    description?: string | null;
    image_url?: string | null; // Added
    is_dimension_based: boolean; // Replaces base_measurement_unit
    is_active: boolean;
    service_offerings_count?: number;
}

export interface ServiceAction {
    id: number;
    name: string;
    description?: string | null;
    base_duration_minutes?: number | null;
    service_offerings_count?: number;
}

// Pricing strategy is now implicitly determined by ProductType.is_dimension_based
// but we can keep the type for clarity in quoting logic etc.
export type PricingStrategy = 'fixed' | 'dimension_based';

export interface ServiceOffering {
    id: number;
    product_type_id: number;
    productType?: ProductType;
    service_action_id: number;
    serviceAction?: ServiceAction;
    display_name: string;
    name_override?: string | null;
    description_override?: string | null;
    default_price?: number | null;
    default_price_per_sq_meter?: number | null;
    applicable_unit?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PricingRule {
    id: number;
    service_offering_id: number;
    customer_id?: number;
    customer?: Customer;
    customer_type_id?: number;
    customerType?: CustomerType;
    price?: number | null;
    price_per_sq_meter?: number | null;
}


// --- Form Data Interfaces for Service Admin ---

export interface ProductCategoryFormData {
    name: string;
    description?: string;
}

export interface ProductTypeFormData {
    name: string;
    product_category_id: number; // API expects number
    description?: string;
    is_dimension_based: boolean;
    image?: File | null; // For upload
}

export interface ServiceActionFormData {
    name: string;
    description?: string;
    base_duration_minutes?: number | string;
}

export interface ServiceOfferingFormData {
    product_type_id: number;
    service_action_id: number;
    name_override?: string;
    description_override?: string;
    default_price?: number | string;
    default_price_per_sq_meter?: number | string;
    applicable_unit?: string;
    is_active: boolean;
}