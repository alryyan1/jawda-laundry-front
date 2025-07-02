// src/api/settingsService.ts
import apiClient from './apiClient';
import type { ApplicationSettings, SettingsFormData } from '@/types';

interface BackendSettingsResponse {
    app_settings: Record<string, unknown>;
    whatsapp: Record<string, unknown>;
}

interface TestWhatsAppResponse {
    message: string;
    response?: unknown;
    details?: string;
    api_response?: unknown;
}

export const getApplicationSettings = async (): Promise<ApplicationSettings> => {
    const { data } = await apiClient.get<BackendSettingsResponse>('/settings');
    // Map backend response to frontend expected structure
    return {
        general: data.app_settings || {},
        whatsapp: data.whatsapp || {},
    };
};

export const updateApplicationSettings = async (formData: SettingsFormData): Promise<{ message: string }> => {
    const { data } = await apiClient.put<{ message: string }>('/settings', formData);
    return data;
};

export const sendTestWhatsappMessage = async (phoneNumber: string): Promise<TestWhatsAppResponse> => {
    const { data } = await apiClient.post<TestWhatsAppResponse>('/settings/whatsapp/send-test', {
        test_phone_number: phoneNumber
    });
    return data;
};