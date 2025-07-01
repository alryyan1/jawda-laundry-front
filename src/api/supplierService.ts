// src/api/supplierService.ts
import apiClient from './apiClient';
import type { Supplier, SupplierFormData, PaginatedResponse } from '@/types';

export const getSuppliers = async (
    page: number,
    perPage: number,
    search?: string
): Promise<PaginatedResponse<Supplier>> => {
    const params = { page, per_page: perPage, search: search || undefined };
    const { data } = await apiClient.get<PaginatedResponse<Supplier>>('/suppliers', { params });
    return data;
};

// For dropdowns in the Purchases form later
export const getAllSuppliers = async (): Promise<Supplier[]> => {
    const { data } = await apiClient.get<{data: Supplier[]}>('/suppliers-list');
    return data.data;
};

export const createSupplier = async (formData: SupplierFormData): Promise<Supplier> => {
    const { data } = await apiClient.post<{data: Supplier}>('/suppliers', formData);
    return data.data;
};

export const updateSupplier = async (id: number, formData: Partial<SupplierFormData>): Promise<Supplier> => {
    const { data } = await apiClient.put<{data: Supplier}>(`/suppliers/${id}`, formData);
    return data.data;
};

export const deleteSupplier = async (id: number): Promise<{message: string}> => {
    const { data } = await apiClient.delete<{message: string}>(`/suppliers/${id}`);
    return data;
};