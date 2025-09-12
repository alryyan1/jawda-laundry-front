// src/types/customerProductTypes.types.ts

export interface CustomerProductType {
  id: number;
  product_type: {
    id: number;
    name: string;
    category?: {
      id: number;
      name: string;
    };
  };
  is_active: boolean;
  created_at: string;
}

export interface CustomerProductTypesResponse {
  customer: {
    id: number;
    name: string;
    customer_type?: {
      id: number;
      name: string;
    };
  };
  product_types: CustomerProductType[];
  total_count: number;
}

export interface AvailableProductType {
  id: number;
  name: string;
  category?: {
    id: number;
    name: string;
  };
}

export interface AvailableProductTypesResponse {
  available_product_types: AvailableProductType[];
  total_available: number;
}

export interface ImportAllResponse {
  message: string;
  imported_count: number;
  total_available: number;
  already_assigned: number;
}

export interface AddProductTypeRequest {
  product_type_id: number;
} 