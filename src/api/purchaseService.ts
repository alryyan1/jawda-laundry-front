// src/api/purchaseService.ts
import apiClient from './apiClient';
import type { Purchase, PurchaseFormData, PaginatedResponse } from '@/types';

// Helper to prepare payload by converting strings to numbers
const preparePayload = (formData: Partial<PurchaseFormData>) => {
    const payload: any = { ...formData };
    if (payload.supplier_id) payload.supplier_id = Number(payload.supplier_id);
    if (payload.items) {
        payload.items = payload.items.map(item => ({
            ...item,
            product_type_id: Number(item.product_type_id) || 0,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
        }));
    }
    return payload;
};

export const getPurchases = async (
    page: number,
    perPage: number,
    filters: { status?: string; supplier_id?: string; }
): Promise<PaginatedResponse<Purchase>> => {
    const params = { page, per_page: perPage, ...filters };
    const { data } = await apiClient.get<PaginatedResponse<Purchase>>('/purchases', { params });
    return data;
};

export const getPurchaseById = async (id: number): Promise<Purchase> => {
    const { data } = await apiClient.get<{data: Purchase}>(`/purchases/${id}`);
    return data.data;
}

export const createPurchase = async (formData: PurchaseFormData): Promise<Purchase> => {
    const payload = preparePayload(formData);
    const { data } = await apiClient.post<{data: Purchase}>('/purchases', payload);
    return data.data;
};

export const updatePurchase = async (id: number, formData: Partial<PurchaseFormData>): Promise<Purchase> => {
    const payload = preparePayload(formData);
    const { data } = await apiClient.put<{data: Purchase}>(`/purchases/${id}`, payload);
    return data.data;
};

export const deletePurchase = async (id: number): Promise<{message: string}> => {
    const { data } = await apiClient.delete<{message: string}>(`/purchases/${id}`);
    return data;
};