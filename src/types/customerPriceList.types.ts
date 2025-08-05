// src/types/customerPriceList.types.ts

export interface CustomerPriceRule {
  price?: number;
  price_per_sq_meter?: number;
  valid_from?: string;
  valid_to?: string;
  min_quantity?: number;
  min_area_sq_meter?: number;
}

export interface ServiceOfferingPriceItem {
  id: number;
  product_type: {
    id: number;
    name: string;
    is_dimension_based: boolean;
  };
  service_action: {
    id: number;
    name: string;
  };
  display_name: string;
  default_price?: number;
  default_price_per_sq_meter?: number;
  pricing_strategy: string;
  applicable_unit?: string;
  customer_specific_price?: CustomerPriceRule;
  customer_type_price?: CustomerPriceRule;
  effective_price?: number;
}

export interface CustomerPriceList {
  customer: {
    id: number;
    name: string;
    customer_type?: {
      id: number;
      name: string;
    };
  };
  price_list: ServiceOfferingPriceItem[];
  total_items: number;
}

export interface CustomerPriceListSummary {
  total_rules: number;
  active_rules: number;
  expired_rules: number;
  future_rules: number;
  categories_covered: number;
}

export interface CustomerPriceListExport {
  csv_data: string[][];
  filename: string;
}

export interface PricingRuleUpdate {
  service_offering_id: number;
  price?: number;
  price_per_sq_meter?: number;
  valid_from?: string;
  valid_to?: string;
  min_quantity?: number;
  min_area_sq_meter?: number;
}

export interface CustomerPriceListUpdateRequest {
  pricing_rules: PricingRuleUpdate[];
}

// Form data for creating/editing price rules
export interface PriceRuleFormData {
  service_offering_id: number;
  price?: number;
  price_per_sq_meter?: number;
  valid_from?: string;
  valid_to?: string;
  min_quantity?: number;
  min_area_sq_meter?: number;
}

// Filter options for price list
export interface PriceListFilters {
  category_id?: number;
  pricing_strategy?: string;
  has_customer_price?: boolean;
  is_active?: boolean;
  search?: string;
} 