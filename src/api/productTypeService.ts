// src/api/productTypeService.ts
import apiClient from './apiClient';
import { ProductType, PaginatedResponse } from '@/types'; // Assuming ProductType might be paginated for admin lists

export interface ProductTypeFormData {
    name: string;
    product_category_id: number | string;
    description?: string;
    base_measurement_unit?: string;
}

// For admin listing product types
export const getProductTypesPaginated = async (page: number = 1, perPage: number = 10): Promise<PaginatedResponse<ProductType>> => {
    const { data } = await apiClient.get<PaginatedResponse<ProductType>>('/product-types', {
        params: { page, per_page: perPage }
    });
    return data;
};

// For dropdowns, usually not paginated
export const getAllProductTypes = async (categoryId?: number | string): Promise<ProductType[]> => {
    const params = categoryId ? { product_category_id: categoryId } : {};
    const { data } = await apiClient.get<{data: ProductType[]}>('/product-types/all-for-select', { params }); // Assuming an endpoint for this
    return data.data;
};


export const createProductType = async (formData: ProductTypeFormData): Promise<ProductType> => {
    const { data } = await apiClient.post<{data: ProductType}>('/product-types', formData);
    return data.data;
};

export const getProductTypeById = async (id: number | string): Promise<ProductType> => {
    const { data } = await apiClient.get<{ data: ProductType }>(`/product-types/${id}`);
    return data.data;
};

export const updateProductType = async (id: number | string, formData: Partial<ProductTypeFormData>): Promise<ProductType> => {
    const { data } = await apiClient.put<{ data: ProductType }>(`/product-types/${id}`, formData);
    return data.data;
};

export const deleteProductType = async (id: number | string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/product-types/${id}`);
    return data;
};