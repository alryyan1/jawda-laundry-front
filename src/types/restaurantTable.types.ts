export interface RestaurantTable {
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

export interface CreateRestaurantTableRequest {
  name: string;
  number: string;
  capacity: number;
  description?: string;
  status?: 'available' | 'occupied' | 'reserved' | 'maintenance';
  is_active?: boolean;
}

export interface UpdateRestaurantTableRequest {
  name?: string;
  number?: string;
  capacity?: number;
  description?: string;
  status?: 'available' | 'occupied' | 'reserved' | 'maintenance';
  is_active?: boolean;
}

export interface RestaurantTableFilters {
  status?: string;
  active_only?: boolean;
  available_only?: boolean;
  search?: string;
} 