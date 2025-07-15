export interface DiningTable {
  id: number;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  active_reservation?: TableReservation;
  active_order?: Order;
}

export interface TableReservation {
  id: number;
  dining_table_id: number;
  customer_id: number;
  order_id?: number;
  reservation_date: string;
  party_size: number;
  status: 'confirmed' | 'seated' | 'completed' | 'cancelled';
  notes?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
  dining_table?: DiningTable;
  customer?: Customer;
  order?: Order;
}

export interface DiningTableFormData {
  name: string;
  capacity: number;
  description?: string;
}

export interface TableReservationFormData {
  dining_table_id: number;
  customer_id: number;
  reservation_date: string;
  party_size: number;
  notes?: string;
  contact_phone?: string;
}

export interface DiningTableStatistics {
  total_tables: number;
  available_tables: number;
  occupied_tables: number;
  reserved_tables: number;
  maintenance_tables: number;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

export interface Order {
  id: number;
  order_number: string;
  daily_order_number?: number;
  customer_name: string;
  status: string;
  total_amount: number;
  created_at: string;
} 