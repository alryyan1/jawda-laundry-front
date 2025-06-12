// src/api/customerService.ts
import apiClient from './apiClient';
import { Customer, PaginatedResponse } from '@/types'; // Ensure PaginatedResponse is correctly defined/imported

export interface CustomerFormData {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    customer_type_id?: number | string; // If you added this
}

export const getCustomers = async (page: number = 1, perPage: number = 10, search: string = ''): Promise<PaginatedResponse<Customer>> => {
  const params: { page: number; per_page: number; search?: string } = { page, per_page: perPage };
  if (search) {
    params.search = search;
  }
  const { data } = await apiClient.get<PaginatedResponse<Customer>>('/customers', { params });
  return data;
};

export const getCustomerById = async (id: string | number): Promise<Customer> => {
    const { data } = await apiClient.get<{data: Customer}>(`/customers/${id}`); // Assuming backend wraps single resource
    return data.data;
};

export const createCustomer = async (customerData: CustomerFormData): Promise<Customer> => {
    const { data } = await apiClient.post<{data: Customer}>('/customers', customerData);
    return data.data;
};

export const updateCustomer = async (id: string | number, customerData: Partial<CustomerFormData>): Promise<Customer> => {
    const { data } = await apiClient.put<{data: Customer}>(`/customers/${id}`, customerData);
    return data.data;
};

export const deleteCustomer = async (id: string | number): Promise<{ message: string }> => { // Expecting a message
    const { data } = await apiClient.delete<{ message: string }>(`/customers/${id}`);
    return data;
};