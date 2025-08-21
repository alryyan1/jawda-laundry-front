// src/api/productTypeCompositionService.ts
import apiClient from "./apiClient";
import type { ProductTypeComposition, ApiResponse } from "@/types";

export interface CreateCompositionData {
  product_composition_id: number;
  description?: string;
  is_active: boolean;
}

export interface UpdateCompositionData extends CreateCompositionData {}

export const productTypeCompositionService = {
  // Get all compositions for a product type
  getCompositions: async (productTypeId: number): Promise<ApiResponse<ProductTypeComposition[]>> => {
    const response = await apiClient.get(`/product-types/${productTypeId}/compositions`);
    return response.data;
  },

  // Get a specific composition
  getComposition: async (productTypeId: number, compositionId: number): Promise<ApiResponse<ProductTypeComposition>> => {
    const response = await apiClient.get(`/product-types/${productTypeId}/compositions/${compositionId}`);
    return response.data;
  },

  // Create a new composition
  createComposition: async (productTypeId: number, data: CreateCompositionData): Promise<ApiResponse<ProductTypeComposition>> => {
    const response = await apiClient.post(`/product-types/${productTypeId}/compositions`, data);
    return response.data;
  },

  // Update a composition
  updateComposition: async (productTypeId: number, compositionId: number, data: UpdateCompositionData): Promise<ApiResponse<ProductTypeComposition>> => {
    const response = await apiClient.put(`/product-types/${productTypeId}/compositions/${compositionId}`, data);
    return response.data;
  },

  // Delete a composition
  deleteComposition: async (productTypeId: number, compositionId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/product-types/${productTypeId}/compositions/${compositionId}`);
    return response.data;
  },

  // Toggle composition status
  toggleStatus: async (productTypeId: number, compositionId: number): Promise<ApiResponse<ProductTypeComposition>> => {
    const response = await apiClient.patch(`/product-types/${productTypeId}/compositions/${compositionId}/toggle-status`);
    return response.data;
  },
};

// Export individual functions for easier imports
export const getProductTypeCompositions = productTypeCompositionService.getCompositions;
export const getProductTypeComposition = productTypeCompositionService.getComposition;
export const createComposition = productTypeCompositionService.createComposition;
export const updateComposition = productTypeCompositionService.updateComposition;
export const deleteComposition = productTypeCompositionService.deleteComposition;
export const toggleCompositionStatus = productTypeCompositionService.toggleStatus;
