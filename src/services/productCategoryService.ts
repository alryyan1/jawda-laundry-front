// src/services/productCategoryService.ts
import apiClient from '@/lib/axios';
import { ProductCategory } from '@/types';

export interface ProductCategoryFormData {
    name: string;
    description?: string;
}

export const getProductCategories = async (): Promise<ProductCategory[]> => {
    const { data } = await apiClient.get('/product-categories');
    return data.data; // Assuming response is { "data": ProductCategory[] }
};

export const createProductCategory = async (categoryData: ProductCategoryFormData): Promise<ProductCategory> => {
    const { data } = await apiClient.post('/product-categories', categoryData);
    return data.data;
};
// Add getById, update, delete if full CRUD needed for categories separately