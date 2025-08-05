// src/api/customerProductTypeService.ts

import apiClient from './apiClient';
import type { 
  CustomerProductTypesResponse, 
  AvailableProductTypesResponse,
  ImportAllResponse,
  AddProductTypeRequest 
} from '@/types/customerProductTypes.types';

export const customerProductTypeService = {
  /**
   * Get all product types assigned to a customer
   */
  getCustomerProductTypes: async (customerId: number): Promise<CustomerProductTypesResponse> => {
    const response = await apiClient.get(`/customers/${customerId}/product-types`);
    return response.data;
  },

  /**
   * Import all available product types for a customer
   */
  importAllProductTypes: async (customerId: number): Promise<ImportAllResponse> => {
    const response = await apiClient.post(`/customers/${customerId}/product-types/import-all`);
    return response.data;
  },

  /**
   * Add a specific product type to a customer
   */
  addProductType: async (customerId: number, data: AddProductTypeRequest): Promise<{ message: string }> => {
    const response = await apiClient.post(`/customers/${customerId}/product-types`, data);
    return response.data;
  },

  /**
   * Remove a product type from a customer
   */
  removeProductType: async (customerId: number, customerProductTypeId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/customers/${customerId}/product-types/${customerProductTypeId}`);
    return response.data;
  },

  /**
   * Get available product types that can be assigned to a customer
   */
  getAvailableProductTypes: async (customerId: number): Promise<AvailableProductTypesResponse> => {
    const response = await apiClient.get(`/customers/${customerId}/product-types/available`);
    return response.data;
  },

  /**
   * Update customer-specific pricing for a service action
   */
  updateCustomerPricing: async (
    customerId: number, 
    productTypeId: number, 
    serviceActionId: number, 
    data: Partial<{ 
      custom_price: number | null; 
      custom_price_per_sq_meter: number | null; 
      is_active: boolean;
      name_override?: string;
      description_override?: string;
      default_price?: number | null;
      default_price_per_sq_meter?: number | null;
      applicable_unit?: string;
      valid_from?: string;
      valid_to?: string;
      min_quantity?: number;
      min_area_sq_meter?: number;
    }>
  ): Promise<any> => {
    const response = await apiClient.put(
      `/customers/${customerId}/product-types/${productTypeId}/service-offerings/${serviceActionId}`, 
      data
    );
    return response.data;
  },

  /**
   * Delete customer-specific pricing for a service action
   */
  deleteCustomerPricing: async (
    customerId: number, 
    productTypeId: number, 
    serviceActionId: number
  ): Promise<any> => {
    const response = await apiClient.delete(
      `/customers/${customerId}/product-types/${productTypeId}/service-offerings/${serviceActionId}`
    );
    return response.data;
  },

  /**
   * Create customer-specific pricing for a service offering
   */
  createCustomerPricing: async (
    customerId: number, 
    productTypeId: number, 
    serviceActionId: number
  ): Promise<any> => {
    const response = await apiClient.post(
      `/customers/${customerId}/product-types/${productTypeId}/service-offerings`, 
      { service_action_id: serviceActionId }
    );
    return response.data;
  },
}; 