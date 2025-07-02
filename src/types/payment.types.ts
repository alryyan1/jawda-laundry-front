// src/types/payment.types.ts
import type { PAYMENT_METHODS } from '@/lib/constants';
import type { User } from './auth.types';

// The type is now derived from the constant, ensuring they can't go out of sync.
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export type PaymentType = 'payment' | 'refund';

// Re-export the shared types from order.types.ts to avoid duplication
export type { Payment, RecordPaymentFormData } from './order.types';
