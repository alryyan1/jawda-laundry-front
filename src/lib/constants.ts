// src/lib/constants.ts

// API related constants (if not solely in .env)
export const API_REQUEST_TIMEOUT = 15000; // 15 seconds
export const DEFAULT_ITEMS_PER_PAGE = 10;

// UI related constants
export const DEBOUNCE_DELAY = 500; // ms, for search inputs etc.
export const TOAST_DURATION = 5000; // ms, for Sonner toasts

// Application specific enums or fixed lists (can also live in types if closely tied to them)
// These are often used for populating Select dropdowns or for logic checks.

export const USER_ROLES = {
    ADMIN: 'admin',
    STAFF: 'staff',
    // CUSTOMER: 'customer', // If customers can log in
} as const; // 'as const' makes keys readonly and values literal types

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];


// If your OrderStatus type in order.types.ts is just `string`,
// you might want a more constrained list here for UI generation.
// Otherwise, the orderStatusOptions in order.types.ts is fine.
// export const ORDER_STATUS_OPTIONS = [
//   { value: 'pending', labelKey: 'orders:status_pending' },
//   { value: 'processing', labelKey: 'orders:status_processing' },
//   { value: 'ready_for_pickup', labelKey: 'orders:status_ready_for_pickup' },
//   { value: 'completed', labelKey: 'orders:status_completed' },
//   { value: 'cancelled', labelKey: 'orders:status_cancelled' },
// ] as const;


// Example for pricing strategies if you need to iterate over them in UI
// (pricingStrategiesArray in service.types.ts is also good for this)
// export const PRICING_STRATEGIES = [
//     { value: 'fixed', labelKey: 'services:strategy.fixed' },
//     { value: 'per_unit_product', labelKey: 'services:strategy.perUnit' },
//     { value: 'dimension_based', labelKey: 'services:strategy.dimensionBased' },
//     { value: 'customer_specific', labelKey: 'services:strategy.customerSpecific' },
// ] as const;

// Default date formats (can be overridden by formatDate arguments)
export const DEFAULT_DATE_FORMAT = 'PPP'; // e.g., Sep 22, 2023
export const DEFAULT_DATETIME_FORMAT = 'PPP p'; // e.g., Sep 22, 2023, 5:00 PM

// Regex patterns (examples)
export const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/; // Basic international phone
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
// (Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)

// Add other constants as your application grows:
// - Default settings values
// - Magic strings used in multiple places
// - Feature flags (if simple)





// --- Application-Specific Constants for UI Generation ---

// Use `as const` to get a readonly tuple with literal types
// Then derive the type from it in your types file. This is a very robust pattern.

export const PAYMENT_METHODS = ['cash', 'visa', 'bank_transfer'] as const;

export const EXPENSE_PAYMENT_METHODS = ['cash', 'visa', 'bank_transfer'] as const;

export const ORDER_STATUSES = ['pending', 'processing', 'ready_for_pickup', 'completed', 'cancelled'] as const;

export const PURCHASE_STATUSES = ['ordered', 'received', 'paid', 'partially_paid', 'cancelled'] as const;

