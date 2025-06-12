// src/api/serviceActionService.ts
import apiClient from './apiClient';
import type { ServiceAction } from '@/types';

export interface ServiceActionFormData {
    name: string;
    description?: string;
    base_duration_minutes?: number | string; // Allow string for form input
}

export const getServiceActions = async (): Promise<ServiceAction[]> => {
    const { data } = await apiClient.get<{data: ServiceAction[]}>('/service-actions');
    return data.data;
};

export const createServiceAction = async (formData: ServiceActionFormData): Promise<ServiceAction> => {
    const payload = { ...formData, base_duration_minutes: formData.base_duration_minutes ? parseInt(formData.base_duration_minutes as string, 10) : undefined }
    const { data } = await apiClient.post<{data: ServiceAction}>('/service-actions', payload);
    return data.data;
};
// Add getById, update, delete for full CRUD
// src/api/serviceActionService.ts
// ... (getServiceActions, createServiceAction)

export const updateServiceAction = async (id: number | string, formData: Partial<ServiceActionFormData>): Promise<ServiceAction> => {
    const payload = { ...formData, base_duration_minutes: formData.base_duration_minutes ? Number(formData.base_duration_minutes) : undefined };
    const { data } = await apiClient.put<{data: ServiceAction}>(`/service-actions/${id}`, payload);
    return data.data;
};

export const deleteServiceAction = async (id: number | string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/service-actions/${id}`);
    return data;
};