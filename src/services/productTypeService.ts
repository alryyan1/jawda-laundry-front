// src/services/productTypeService.ts
import apiClient from '@/lib/axios';
import { ProductType } from '@/types';

export interface ProductTypeFormData {
    name: string;
    product_category_id: number | string; // Allow string for form input
    description?: string;
    base_measurement_unit?: string;
}

export const getProductTypes = async (categoryId?: number | string): Promise<ProductType[]> => {
    const params = categoryId ? { product_category_id: categoryId } : {};
    const { data } = await apiClient.get('/product-types', { params });
    return data.data;
};
// Add create, getById, update, delete as needed