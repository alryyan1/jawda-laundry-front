// src/api/productCompositionService.ts
import apiClient from "./apiClient";
import type { ProductComposition, ApiResponse } from "@/types";

export interface CreateProductCompositionData {
  name: string;
}

export interface UpdateProductCompositionData extends CreateProductCompositionData {}

export const productCompositionService = {
  // Get all product compositions
  getProductCompositions: async (): Promise<ApiResponse<ProductComposition[]>> => {
    const response = await apiClient.get('/product-compositions');
    return response.data;
  },

  // Get a specific product composition
  getProductComposition: async (id: number): Promise<ApiResponse<ProductComposition>> => {
    const response = await apiClient.get(`/product-compositions/${id}`);
    return response.data;
  },

  // Create a new product composition
  createProductComposition: async (data: CreateProductCompositionData): Promise<ApiResponse<ProductComposition>> => {
    const response = await apiClient.post('/product-compositions', data);
    return response.data;
  },

  // Update a product composition
  updateProductComposition: async (id: number, data: UpdateProductCompositionData): Promise<ApiResponse<ProductComposition>> => {
    const response = await apiClient.put(`/product-compositions/${id}`, data);
    return response.data;
  },

  // Delete a product composition
  deleteProductComposition: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/product-compositions/${id}`);
    return response.data;
  },
};

// Export individual functions for easier imports
export const getProductCompositions = productCompositionService.getProductCompositions;
export const getProductComposition = productCompositionService.getProductComposition;
export const createProductComposition = productCompositionService.createProductComposition;
export const updateProductComposition = productCompositionService.updateProductComposition;
export const deleteProductComposition = productCompositionService.deleteProductComposition;
