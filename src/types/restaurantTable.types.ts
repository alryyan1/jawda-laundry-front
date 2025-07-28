export interface ServiceTable {
  id: number;
  name: string;
  number: string;
  capacity: number;
  description?: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  is_active: boolean;
  is_available: boolean;
  active_orders_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateServiceTableRequest {
  name: string;
  number: string;
  capacity: number;
  description?: string;
  status?: 'available' | 'occupied' | 'reserved' | 'maintenance';
  is_active?: boolean;
}

export interface UpdateServiceTableRequest {
  name?: string;
  number?: string;
  capacity?: number;
  description?: string;
  status?: 'available' | 'occupied' | 'reserved' | 'maintenance';
  is_active?: boolean;
}

export interface ServiceTableFilters {
  status?: string;
  active_only?: boolean;
  available_only?: boolean;
  search?: string;
} 