// src/api/serviceOfferingService.ts
import apiClient from './apiClient';
import type { ServiceOffering, PaginatedResponse, PricingStrategy } from '@/types';

export interface ServiceOfferingFormData {
    product_type_id: string;
    service_action_id: string;
    name_override?: string;
    description_override?: string;
    default_price?: string;
    pricing_strategy: PricingStrategy;
    default_price_per_sq_meter?: string;
    applicable_unit?: string;
    is_active: boolean;
}

export const getServiceOfferings = async (page: number = 1, perPage: number = 10): Promise<PaginatedResponse<ServiceOffering>> => {
    const { data } = await apiClient.get<PaginatedResponse<ServiceOffering>>('/service-offerings', {
        params: { page, per_page: perPage }
    });
    return data;
};

export const getAllServiceOfferingsForSelect = async (productTypeId?: string): Promise<ServiceOffering[]> => {
    const params = productTypeId ? { product_type_id: productTypeId } : {};
    const { data } = await apiClient.get<{data: ServiceOffering[]}>('/service-offerings/all-for-select', { params });
    return data.data;
};

export const getServiceOfferingById = async (id: string): Promise<ServiceOffering> => {
    const { data } = await apiClient.get<{data: ServiceOffering}>(`/service-offerings/${id}`);
    return data.data;
};

export const createServiceOffering = async (formData: ServiceOfferingFormData): Promise<ServiceOffering> => {
    const payload = {
        ...formData,
        default_price: formData.default_price ? parseFloat(formData.default_price) : null,
        default_price_per_sq_meter: formData.default_price_per_sq_meter ? parseFloat(formData.default_price_per_sq_meter) : null,
        product_type_id: parseInt(formData.product_type_id, 10),
        service_action_id: parseInt(formData.service_action_id, 10),
    };
    const { data } = await apiClient.post<{data: ServiceOffering}>('/service-offerings', payload);
    return data.data;
};

export const updateServiceOffering = async (id: string, formData: Partial<ServiceOfferingFormData>): Promise<ServiceOffering> => {
    const payload = {
        ...formData,
        default_price: formData.default_price ? parseFloat(formData.default_price) : null,
        default_price_per_sq_meter: formData.default_price_per_sq_meter ? parseFloat(formData.default_price_per_sq_meter) : null,
        product_type_id: formData.product_type_id ? parseInt(formData.product_type_id, 10) : undefined,
        service_action_id: formData.service_action_id ? parseInt(formData.service_action_id, 10) : undefined,
    };
    const { data } = await apiClient.put<{data: ServiceOffering}>(`/service-offerings/${id}`, payload);
    return data.data;
};

export const deleteServiceOffering = async (id: string | number): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/service-offerings/${id}`);
    return data;
};