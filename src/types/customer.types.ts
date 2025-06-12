// src/types/customer.types.ts
import type { User } from './auth.types'; // Import if User type is needed here

export interface CustomerType {
    id: number;
    name: string;
    description?: string;
}

export interface Customer {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  customer_type_id?: number | null;
  customerType?: CustomerType; // If eager loaded
  user_id?: number | null; // Staff who created/manages
  user?: User;           // If eager loaded
  registered_date: string; // from created_at
  total_orders?: number;    // from withCount
  created_at: string;
  updated_at: string;
}

// Form data for creating/editing customers
export interface CustomerFormData {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    customer_type_id?: number | string | null; // string for form select
}