// src/api/productTypeService.ts
import apiClient from './apiClient';
import { type ProductType, type PaginatedResponse, type ServiceAction, type ProductTypeFormData, type ServiceOffering } from '@/types'; // Assuming ProductType might be paginated for admin lists

// Remove pricing_strategy from ServiceOfferingFormData.
// Remove pricing_strategy from the preparePayload helper function.

// For admin listing product types
export const getProductTypesPaginated = async (
    page: number = 1, 
    perPage: number = 10, 
    search?: string,
    sortBy: string = 'id',
    sortOrder: 'asc' | 'desc' = 'desc'
): Promise<PaginatedResponse<ProductType>> => {
    const params: Record<string, any> = { 
        page, 
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder
    };
    
    if (search) {
        params.search = search;
    }
    
    const { data } = await apiClient.get<PaginatedResponse<ProductType>>('/product-types', {
        params
    });
    return data;
};

// For dropdowns, usually not paginated
export const getAllProductTypes = async (categoryId?: number | string): Promise<ProductType[]> => {
    const params = categoryId ? { product_category_id: categoryId } : {};
    const { data } = await apiClient.get<{data: ProductType[]}>('/product-types/all-for-select', { params }); // Assuming an endpoint for this
    return data.data;
};




export const getProductTypeById = async (id: number | string): Promise<ProductType> => {
    const { data } = await apiClient.get<{ data: ProductType }>(`/product-types/${id}`);
    return data.data;
};



export const deleteProductType = async (id: number | string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/product-types/${id}`);
    return data;
};

// src/api/productTypeService.ts
// ... (existing imports and functions)

export const getAvailableServiceActionsForProductType = async (productTypeId: number | string): Promise<ServiceAction[]> => {
    if (!productTypeId) return []; // Or throw error
    const { data } = await apiClient.get<{ data: ServiceAction[] }>(`/product-types/${productTypeId}/available-service-actions`);
    return data.data;
};





// src/api/productTypeService.ts
// ...
export const createProductType = async (formData: ProductTypeFormData): Promise<ProductType> => {
    const data = new FormData();
    data.append('name', formData.name);
    data.append('product_category_id', String(formData.product_category_id));
    data.append('is_dimension_based', formData.is_dimension_based ? '1' : '0');
    if (formData.description) data.append('description', formData.description);
    if (formData.image) data.append('image', formData.image);

    const { data: responseData } = await apiClient.post<{ data: ProductType }>('/product-types', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return responseData.data;
};

export const updateProductType = async (id: number | string, formData: Partial<ProductTypeFormData>): Promise<ProductType> => {
    const data = new FormData();
    data.append('_method', 'PUT'); // Laravel needs this hint for PUT requests with FormData
    if (formData.name !== undefined) data.append('name', formData.name);
    if (formData.product_category_id !== undefined) data.append('product_category_id', String(formData.product_category_id));
    if (formData.is_dimension_based !== undefined) data.append('is_dimension_based', formData.is_dimension_based ? '1' : '0');
    if (formData.description !== undefined) data.append('description', formData.description);
    if (formData.image) data.append('image', formData.image);

    // For some reason, PUT with FormData can be tricky. POST with _method override is a common workaround.
    const { data: responseData } = await apiClient.post<{ data: ProductType }>(`/product-types/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return responseData.data;
};



export const createAllOfferingsForProductType = async (productTypeId: number | string): Promise<ServiceOffering[]> => {
    const { data } = await apiClient.post<{ data: ServiceOffering[] }>(`/product-types/${productTypeId}/create-all-service-offerings`);
    return data.data; // Assuming backend returns the full updated list
};