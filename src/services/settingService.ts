// src/services/settingService.ts

import apiClient from "@/api/apiClient";

// Interface for the settings object (should match keys in config/app_settings.php)
export interface AppSettings {
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    company_logo_url: string | null;
    currency_symbol: string;
    date_format: string; // e.g., 'YYYY-MM-DD', 'MM/DD/YYYY'
    global_low_stock_threshold: number;
    invoice_prefix: string;
    purchase_order_prefix: string;
    // WhatsApp settings
    whatsapp_enabled: boolean;
    whatsapp_api_url: string;
    whatsapp_api_token: string;
    whatsapp_notification_number: string;
    whatsapp_country_code: string;
    // POS settings
    pos_auto_show_pdf: boolean;
    pos_show_products_as_list: boolean;
    // Add other settings as defined in your config
}

// Type for the update payload (can be partial)
export type UpdateAppSettingsData = Partial<AppSettings>;


const settingService = {
    /**
     * Fetch all current application settings.
     * Requires 'view-settings' permission.
     */
    getSettings: async (): Promise<AppSettings> => {
        try {
            // Backend returns { data: AppSettings }
            const response = await apiClient.get<{ data: AppSettings }>('/admin/settings');
            return response.data.data; // Assuming data is nested under 'data' key
        } catch (error) {
            console.error('Error fetching settings:', error);
            throw error;
        }
    },

    /**
     * Update application settings.
     * Requires 'update-settings' permission.
     */
    updateSettings: async (settingsData: UpdateAppSettingsData): Promise<AppSettings> => {
        try {
            // Backend returns { message: '...', data: AppSettings }
            const response = await apiClient.put<{ message: string, data: AppSettings }>('/admin/settings', settingsData);
            return response.data.data; // Return the updated settings
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    },

    /**
     * Upload company logo.
     * Requires 'update-settings' permission.
     */
    uploadLogo: async (file: File): Promise<{ logo_url: string }> => {
        try {
            const formData = new FormData();
            formData.append('logo', file);

            const response = await apiClient.post<{ message: string, logo_url: string }>('/settings/logo/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return { logo_url: response.data.logo_url };
        } catch (error) {
            console.error('Error uploading logo:', error);
            throw error;
        }
    },

    /**
     * Delete company logo.
     * Requires 'update-settings' permission.
     */
    deleteLogo: async (): Promise<void> => {
        try {
            await apiClient.delete('/settings/logo');
        } catch (error) {
            console.error('Error deleting logo:', error);
            throw error;
        }
    },

};



export default settingService;
export type { AppSettings as AppSettingsType }; // Export type