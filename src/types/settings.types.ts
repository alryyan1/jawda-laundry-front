// src/types/settings.types.ts

export interface GeneralSettings {
    company_name?: string;
    company_address?: string;
    company_phone?: string;
    default_currency?: string;
}

export interface WhatsAppSettings {
    api_url?: string;
    instance_id?: string;
    api_token?: string;
}

export interface ApplicationSettings {
    general: GeneralSettings;
    whatsapp: WhatsAppSettings;
}

// FormData will be a nested object matching the structure above
export type SettingsFormData = ApplicationSettings;