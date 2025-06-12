// src/types/service.types.ts

export interface ProductCategory {
    id: number;
    name: string;
    description?: string | null;
    product_types_count?: number; // if counted
}

export interface ProductType {
    id: number;
    product_category_id: number;
    category?: ProductCategory; // if eager loaded
    name: string;
    description?: string | null;
    base_measurement_unit?: 'item' | 'kg' | 'sq_meter' | 'set' | 'piece' | string | null;
    service_offerings_count?: number; // if counted
}

export interface ServiceAction {
    id: number;
    name: string;
    description?: string | null;
    base_duration_minutes?: number | null;
    service_offerings_count?: number; // if counted
}

export type PricingStrategy = 'fixed' | 'per_unit_product' | 'dimension_based' | 'customer_specific';
export const pricingStrategiesArray: [PricingStrategy, ...PricingStrategy[]] = ['fixed', 'per_unit_product', 'dimension_based', 'customer_specific'];


export interface ServiceOffering {
    id: number;
    product_type_id: number;
    productType?: ProductType;
    service_action_id: number;
    serviceAction?: ServiceAction;
    name_override?: string | null;
    display_name: string; // Accessor from backend
    description_override?: string | null;
    default_price?: number | null;
    pricing_strategy: PricingStrategy;
    default_price_per_sq_meter?: number | null;
    applicable_unit?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Form data for creating/editing ServiceOfferings
export interface ServiceOfferingFormData {
    product_type_id: string; // From select
    service_action_id: string; // From select
    name_override?: string;
    description_override?: string;
    pricing_strategy: PricingStrategy;
    default_price?: number | string; // string from input, number for submission
    default_price_per_sq_meter?: number | string;
    applicable_unit?: string;
    is_active: boolean;
}


// Basic form data types for admin pages
export interface ProductCategoryFormData {
    name: string;
    description?: string;
}
export interface ProductTypeFormData {
    name: string;
    product_category_id: string; // From select
    description?: string;
    base_measurement_unit?: string;
}
export interface ServiceActionFormData {
    name: string;
    description?: string;
    base_duration_minutes?: number | string;
}