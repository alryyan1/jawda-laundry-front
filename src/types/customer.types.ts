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
  name:string;
  phone: string; // Now required
  email?: string | null; // Now optional
  address?: string | null;
  notes?: string | null;
  customer_type_id?: number | null;
  customerType?: CustomerType;
  user_id?: number | null;
  managedBy?: User; // The staff member who manages them
  registered_date: string;
  total_orders?: number;
  created_at: string;
  updated_at: string;
}

// Form data for creating/editing customers
export interface CustomerFormData {
    name: string;
    phone: string;
    address?: string;
    notes?: string;
    customer_type_id?: number | string | null; // string from form select
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