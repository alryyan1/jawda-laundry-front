// src/api/settingsService.ts
import apiClient from './apiClient';
import type { ApplicationSettings, SettingsFormData } from '@/types';

export const getApplicationSettings = async (): Promise<ApplicationSettings> => {
    const { data } = await apiClient.get<ApplicationSettings>('/settings');
    // Provide defaults for missing groups to prevent errors in react-hook-form
    return {
        general: data.general || {},
        whatsapp: data.whatsapp || {},
    };
};

export const updateApplicationSettings = async (formData: SettingsFormData): Promise<{ message: string }> => {
    const { data } = await apiClient.put<{ message: string }>('/settings', formData);
    return data;
};

export const sendTestWhatsappMessage = async (phoneNumber: string): Promise<{ message: string, response?: any }> => {
    const { data } = await apiClient.post<{ message: string, response?: any }>('/settings/whatsapp/send-test', {
        test_phone_number: phoneNumber
    });
    return data;
};