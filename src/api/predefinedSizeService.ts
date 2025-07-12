// src/api/predefinedSizeService.ts
import apiClient from './apiClient';
import type { PredefinedSize, PredefinedSizeFormData } from '@/types';

/**
 * Fetches all predefined sizes for a specific product type.
 */
export const getPredefinedSizes = async (productTypeId: number | string): Promise<PredefinedSize[]> => {
    const { data } = await apiClient.get<{ data: PredefinedSize[] }>(`/product-types/${productTypeId}/predefined-sizes`);
    return data.data;
};

/**
 * Creates a new predefined size for a specific product type.
 */
export const createPredefinedSize = async (productTypeId: number | string, formData: PredefinedSizeFormData): Promise<PredefinedSize> => {
    const payload = {
        ...formData,
        length_meters: Number(formData.length_meters),
        width_meters: Number(formData.width_meters),
    };
    const { data } = await apiClient.post<{ data: PredefinedSize }>(`/product-types/${productTypeId}/predefined-sizes`, payload);
    return data.data;
};

/**
 * Deletes a predefined size.
 */
export const deletePredefinedSize = async (productTypeId: number | string, sizeId: number): Promise<void> => {
    await apiClient.delete(`/product-types/${productTypeId}/predefined-sizes/${sizeId}`);
};