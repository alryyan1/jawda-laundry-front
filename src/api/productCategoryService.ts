// src/api/productCategoryService.ts
import apiClient from './apiClient';
import type { ProductCategory } from '@/types';

export interface ProductCategoryFormData {
    name: string;
    description?: string;
    image?: File | null;
    sequence_prefix?: string;
    sequence_enabled?: boolean;
    current_sequence?: number;
}

export const getProductCategories = async (): Promise<ProductCategory[]> => {
    const { data } = await apiClient.get<{data: ProductCategory[]}>('/product-categories');
    return data.data;
};

export const createProductCategory = async (categoryData: ProductCategoryFormData): Promise<ProductCategory> => {
    const formData = new FormData();
    formData.append('name', categoryData.name);
    if (categoryData.description) {
        formData.append('description', categoryData.description);
    }
    if (categoryData.image) {
        formData.append('image', categoryData.image);
    }
    if (categoryData.sequence_prefix) {
        formData.append('sequence_prefix', categoryData.sequence_prefix);
    }
    if (categoryData.sequence_enabled !== undefined) {
        formData.append('sequence_enabled', categoryData.sequence_enabled.toString());
    }
    if (categoryData.current_sequence !== undefined) {
        formData.append('current_sequence', categoryData.current_sequence.toString());
    }
    
    const { data } = await apiClient.post<{data: ProductCategory}>('/product-categories', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data.data;
};

export const getProductCategoryById = async (id: number | string): Promise<ProductCategory> => {
    const { data } = await apiClient.get<{ data: ProductCategory }>(`/product-categories/${id}`);
    return data.data;
};

export const updateProductCategory = async (id: number | string, categoryData: Partial<ProductCategoryFormData>): Promise<ProductCategory> => {
    const formData = new FormData();
    formData.append('_method', 'PUT'); // Laravel expects this for PUT requests with file uploads
    formData.append('name', categoryData.name || '');
    if (categoryData.description !== undefined) {
        formData.append('description', categoryData.description || '');
    }
    if (categoryData.image) {
        formData.append('image', categoryData.image);
    }
    if (categoryData.sequence_prefix !== undefined) {
        formData.append('sequence_prefix', categoryData.sequence_prefix || '');
    }
    if (categoryData.sequence_enabled !== undefined) {
        formData.append('sequence_enabled', categoryData.sequence_enabled.toString());
    }
    if (categoryData.current_sequence !== undefined) {
        formData.append('current_sequence', categoryData.current_sequence.toString());
    }
    
    const { data } = await apiClient.post<{ data: ProductCategory }>(`/product-categories/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data.data;
};

export const deleteProductCategory = async (id: number | string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/product-categories/${id}`);
    return data;
};