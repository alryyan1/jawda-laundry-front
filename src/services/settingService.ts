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

};



export default settingService;
export type { AppSettings as AppSettingsType }; // Export type