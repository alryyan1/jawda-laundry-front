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

// Restaurant table types (alias for ServiceTable)
export interface RestaurantTable extends ServiceTable {}

export interface CreateServiceTableRequest {
  name: string;
  number: string;
  capacity: number;
  description?: string;
  status?: 'available' | 'occupied' | 'reserved' | 'maintenance';
  is_active?: boolean;
}

// Restaurant table create request (alias for CreateServiceTableRequest)
export interface CreateRestaurantTableRequest extends CreateServiceTableRequest {}

export interface UpdateServiceTableRequest {
  name?: string;
  number?: string;
  capacity?: number;
  description?: string;
  status?: 'available' | 'occupied' | 'reserved' | 'maintenance';
  is_active?: boolean;
}

// Restaurant table update request (alias for UpdateServiceTableRequest)
export interface UpdateRestaurantTableRequest extends UpdateServiceTableRequest {}

export interface ServiceTableFilters {
  status?: string;
  active_only?: boolean;
  available_only?: boolean;
  search?: string;
}

// Restaurant table filters (alias for ServiceTableFilters)
export interface RestaurantTableFilters extends ServiceTableFilters {} 