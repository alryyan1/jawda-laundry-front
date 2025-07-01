// src/types/customer.types.ts
import type { User } from './auth.types';

export interface CustomerType {
    id: number;
    name: string;
    description?: string | null;
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