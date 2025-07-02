// src/types/settings.types.ts

export interface GeneralSettings {
    company_name?: string;
    company_address?: string;
    company_phone?: string;
    currency_symbol?: string;
}

export interface WhatsAppSettings {
    api_url?: string;
    api_token?: string;
    enabled?: boolean;
}

export interface ApplicationSettings {
    general?: GeneralSettings;
    whatsapp?: WhatsAppSettings;
}

// FormData will be a nested object matching the structure above
export type SettingsFormData = ApplicationSettings;