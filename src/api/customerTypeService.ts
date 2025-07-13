import apiClient from './apiClient';
import type { CustomerType, PaginatedResponse } from '@/types';

export interface CustomerTypeFormData {
    name: string;
    description?: string;
}

// Get all customer types (for dropdowns/select)
export const getCustomerTypes = async (): Promise<CustomerType[]> => {
    const response = await apiClient.get('/customer-types');
    // Handle both possible response structures
    return Array.isArray(response.data) ? response.data : response.data.data || [];
};

// Get paginated customer types (for list pages)
export const getCustomerTypesPaginated = async (
    page: number = 1,
    perPage: number = 15,
    searchTerm?: string
): Promise<PaginatedResponse<CustomerType>> => {
    const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
    });

    if (searchTerm?.trim()) {
        params.append('search', searchTerm.trim());
    }

    const response = await apiClient.get(`/customer-types?${params.toString()}`);
    return response.data;
};

// Get a single customer type by ID
export const getCustomerTypeById = async (id: string | number): Promise<CustomerType> => {
    const response = await apiClient.get(`/customer-types/${id}`);
    return response.data;
};

// Create a new customer type
export const createCustomerType = async (data: CustomerTypeFormData): Promise<CustomerType> => {
    const response = await apiClient.post('/customer-types', data);
    return response.data;
};

// Update an existing customer type
export const updateCustomerType = async (id: string | number, data: CustomerTypeFormData): Promise<CustomerType> => {
    const response = await apiClient.put(`/customer-types/${id}`, data);
    return response.data;
};

// Delete a customer type
export const deleteCustomerType = async (id: string | number): Promise<void> => {
    await apiClient.delete(`/customer-types/${id}`);
}; 