import apiClient from '@/lib/axios';

export interface PricingRule {
  id: number;
  service_offering_id: number;
  customer_id: number;
  price: number;
  price_per_sq_meter: number;
  created_at: string;
  updated_at: string;
  service_offering?: {
    id: number;
    name: string;
    product_type: {
      id: number;
      name: string;
      is_dimension_based: boolean;
      category?: {
        id: number;
        name: string;
      };
    };
    service_action: {
      id: number;
      name: string;
    };
  };
}

export interface AvailableServiceOffering {
  id: number;
  product_type_id: number;
  service_action_id: number;
  name_override: string | null;
  description_override: string | null;
  default_price: string;
  default_price_per_sq_meter: string;
  applicable_unit: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_type: {
    id: number;
    name: string;
    description: string | null;
    image_url: string | null;
    is_dimension_based: boolean;
    category: {
      id: number;
      name: string;
      description: string | null;
      image_url: string | null;
    };
  };
  service_action: {
    id: number;
    name: string;
    description: string | null;
    base_duration_minutes: number | null;
  };
}

// Helper function to get display name from service offering
export const getServiceOfferingDisplayName = (offering: AvailableServiceOffering): string => {
  const productTypeName = offering.product_type?.name || '';
  const serviceActionName = offering.service_action?.name || '';
  return `${productTypeName} - ${serviceActionName}`;
};

export interface PricingRuleResponse {
  pricing_rules: PricingRule[];
  total_count: number;
}

export interface CreatePricingRuleData {
  service_offering_id: number;
  price: number;
  price_per_sq_meter: number;
}

export interface UpdatePricingRuleData {
  price?: number;
  price_per_sq_meter?: number;
}

export const pricingRuleService = {
  // Get all pricing rules for a customer
  getCustomerPricingRules: async (
    customerId: number, 
    page: number = 1, 
    perPage: number = 10, 
    search?: string, 
    sortBy?: string, 
    sortOrder?: string,
    category?: string,
    productTypeId?: number
  ): Promise<PricingRuleResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    
    if (search) {
      params.append('search', search);
    }
    
    if (sortBy) {
      params.append('sort_by', sortBy);
    }
    
    if (sortOrder) {
      params.append('sort_order', sortOrder);
    }
    
    if (category && category !== 'all') {
      params.append('category', category);
    }
    
    if (productTypeId) {
      params.append('product_type_id', productTypeId.toString());
    }
    
    const response = await apiClient.get(`/customers/${customerId}/pricing-rules?${params.toString()}`);
    return response.data;
  },

  // Create a new pricing rule for a customer
  createPricingRule: async (customerId: number, data: CreatePricingRuleData): Promise<PricingRule> => {
    const response = await apiClient.post(`/customers/${customerId}/pricing-rules`, data);
    return response.data;
  },

  // Update a pricing rule
  updatePricingRule: async (customerId: number, pricingRuleId: number, data: UpdatePricingRuleData): Promise<PricingRule> => {
    const response = await apiClient.put(`/customers/${customerId}/pricing-rules/${pricingRuleId}`, data);
    return response.data;
  },

  // Delete a pricing rule
  deletePricingRule: async (customerId: number, pricingRuleId: number): Promise<void> => {
    await apiClient.delete(`/customers/${customerId}/pricing-rules/${pricingRuleId}`);
  },

  // Get available service offerings for a customer (those without pricing rules)
  getAvailableServiceOfferings: async (customerId: number) => {
    const response = await apiClient.get(`/customers/${customerId}/pricing-rules/available-service-offerings`);
    return response.data;
  },

  // Import all available service offerings as pricing rules
  importAllServiceOfferings: async (customerId: number) => {
    const response = await apiClient.post(`/customers/${customerId}/pricing-rules/import-all`);
    return response.data;
  },

  // Get products that have pricing rules for a customer
  getCustomerProductsWithPricingRules: async (customerId: number) => {
    const response = await apiClient.get(`/customers/${customerId}/pricing-rules/products`);
    return response.data;
  },
}; 