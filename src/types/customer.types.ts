// src/types/customer.types.ts
import type { User } from './auth.types';

export interface CustomerType {
    id: number;
    name: string;
    description?: string | null;
    customers_count?: number;
    pricing_rules_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Customer {
  id: number;
  name: string; // Will always have a value (either provided or "no customer")
  car_plate_number: string; // Only car plate number is required
  phone?: string | null; // Now optional
  email?: string | null; // Now optional
  address?: string | null;
  notes?: string | null;
  user_id?: number | null;
  managedBy?: User; // The staff member who manages them
  registered_date: string;
  total_orders?: number;
  created_at: string;
  updated_at: string;
  is_default?: boolean; // New field for default customer
}

// Form data for creating/editing customers
export interface CustomerFormData {
    name?: string; // Optional in form, but backend will set to "no customer" if empty
    car_plate_number: string; // Only car plate number is required
    phone?: string;
    address?: string;
    notes?: string;
    is_default?: boolean; // New field for default customer
}


// src/types/customer.types.ts
// ...

export interface LedgerTransaction {
  date: string; // ISO date string
  type: 'order' | 'payment' | 'refund';
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference_id: number; // The Order ID
  total_amount?: number; // Total order amount
  paid_amount?: number; // Total amount paid
  remaining_balance?: number; // Remaining balance to be paid
  payment_status?: 'paid' | 'unpaid' | 'partially_paid'; // Payment status
}

export interface CustomerLedger {
  customer: {
      id: number;
      name: string;
  };
  summary: {
      total_debits: number;
      total_credits: number;
      current_balance: number;
  };
  transactions: LedgerTransaction[];
}