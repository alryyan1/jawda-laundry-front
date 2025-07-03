// src/api/productCategoryService.ts
import apiClient from './apiClient';
import type { ProductCategory } from '@/types';

export interface ProductCategoryFormData {
    name: string;
    description?: string;
}

export const getProductCategories = async (): Promise<ProductCategory[]> => {
    const { data } = await apiClient.get<{data: ProductCategory[]}>('/product-categories');
    return data.data;
};

export const createProductCategory = async (categoryData: ProductCategoryFormData): Promise<ProductCategory> => {
    const { data } = await apiClient.post<{data: ProductCategory}>('/product-categories', categoryData);
    return data.data;
};

export const getProductCategoryById = async (id: number | string): Promise<ProductCategory> => {
    const { data } = await apiClient.get<{ data: ProductCategory }>(`/product-categories/${id}`);
    return data.data;
};

export const updateProductCategory = async (id: number | string, categoryData: Partial<ProductCategoryFormData>): Promise<ProductCategory> => {
    const { data } = await apiClient.post<{ data: ProductCategory }>(`/product-categories/${id}`, categoryData); // Should be PUT or PATCH
    // const { data } = await apiClient.put<{ data: ProductCategory }>(`/product-categories/${id}`, categoryData);
    return data.data;
};

export const deleteProductCategory = async (id: number | string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/product-categories/${id}`);
    return data;
};