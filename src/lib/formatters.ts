// src/lib/formatters.ts
import { format, parseISO } from 'date-fns';
import { enUS, arSA } from 'date-fns/locale'; // Import locales you use

/**
 * Formats a date string or Date object into a more readable format.
 * @param dateInput Date string (ISO 8601 preferred) or Date object.
 * @param formatString Desired output format (defaults to 'PPP p' -> 'Sep 21, 2023, 4:30 PM').
 *                     See date-fns format strings: https://date-fns.org/v2.30.0/docs/format
 * @param lang Current language code ('en', 'ar') to select locale.
 * @returns Formatted date string or 'N/A' if input is invalid.
 */
export const formatDate = (
    dateInput: string | Date | null | undefined,
    formatString: string = 'PPP', // Just date: 'MMM d, yyyy'
    lang: string = 'en'
): string => {
    if (!dateInput) return 'N/A';
    try {
        const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
        const locale = lang.startsWith('ar') ? arSA : enUS;
        return format(date, formatString, { locale });
    } catch (error) {
        console.error("Error formatting date:", dateInput, error);
        return 'Invalid Date';
    }
};

export const formatDateTime = (
    dateInput: string | Date | null | undefined,
    formatString: string = 'PPP p', // Date and time: 'Sep 21, 2023, 4:30 PM'
    lang: string = 'en'
): string => {
    return formatDate(dateInput, formatString, lang);
};


/**
 * Formats a number as currency.
 * @param amount The number to format.
 * @param currency The currency code (e.g., 'USD', 'EUR', 'SAR'). Defaults to 'USD'.
 * @param lang Current language code ('en', 'ar') for locale-specific formatting.
 * @returns Formatted currency string.
 */
export const formatCurrency = (
    amount: number | null | undefined,
    currency: string = 'USD', // Make this configurable from app settings later
    lang: string = 'en'
): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        // Return a default like $0.00 or an empty string/dash
        // For consistency, let's format 0 if input is problematic
        return new Intl.NumberFormat(lang.startsWith('ar') ? 'ar-SA' : 'en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(0);
    }

    const locale = lang.startsWith('ar') ? 'ar-SA' : 'en-US'; // Adjust for other Arabic locales if needed

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

/**
 * Truncates a string to a specified maximum length and appends an ellipsis if truncated.
 * @param str The string to truncate.
 * @param maxLength The maximum length of the string.
 * @returns The truncated string with an ellipsis, or the original string if shorter than maxLength.
 */
export const truncateText = (str: string | null | undefined, maxLength: number = 50): string => {
    if (!str) return '';
    if (str.length <= maxLength) {
        return str;
    }
    return str.substring(0, maxLength) + '...';
};


/**
 * Capitalizes the first letter of each word in a string.
 * @param str The string to capitalize.
 * @returns The capitalized string.
 */
export const capitalizeWords = (str: string | null | undefined): string => {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Generates a simple placeholder string for empty values.
 * @param placeholder The placeholder text, defaults to '---'.
 * @returns The placeholder string.
 */
export const displayPlaceholder = (value: any, placeholder: string = '---'): string => {
    if (value === null || value === undefined || String(value).trim() === '') {
        return placeholder;
    }
    return String(value);
};