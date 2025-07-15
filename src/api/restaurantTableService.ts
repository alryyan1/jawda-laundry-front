import apiClient from './apiClient';
import { 
  RestaurantTable, 
  CreateRestaurantTableRequest, 
  UpdateRestaurantTableRequest,
  RestaurantTableFilters 
} from '../types/restaurantTable.types';

export const restaurantTableService = {
  // Get all restaurant tables with optional filters
  getAll: async (filters?: RestaurantTableFilters): Promise<RestaurantTable[]> => {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.active_only !== undefined) params.append('active_only', filters.active_only.toString());
    if (filters?.available_only !== undefined) params.append('available_only', filters.available_only.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const response = await apiClient.get(`/restaurant-tables?${params.toString()}`);
    return response.data;
  },

  // Get available tables only
  getAvailable: async (): Promise<RestaurantTable[]> => {
    const response = await apiClient.get('/restaurant-tables/available');
    return response.data;
  },

  // Get a single restaurant table
  getById: async (id: number): Promise<RestaurantTable> => {
    const response = await apiClient.get(`/restaurant-tables/${id}`);
    return response.data;
  },

  // Create a new restaurant table
  create: async (data: CreateRestaurantTableRequest): Promise<RestaurantTable> => {
    const response = await apiClient.post('/restaurant-tables', data);
    return response.data;
  },

  // Update a restaurant table
  update: async (id: number, data: UpdateRestaurantTableRequest): Promise<RestaurantTable> => {
    const response = await apiClient.put(`/restaurant-tables/${id}`, data);
    return response.data;
  },

  // Delete a restaurant table
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/restaurant-tables/${id}`);
  },

  // Update table status
  updateStatus: async (id: number, status: 'available' | 'occupied' | 'reserved' | 'maintenance'): Promise<RestaurantTable> => {
    const response = await apiClient.patch(`/restaurant-tables/${id}/status`, { status });
    return response.data;
  },
}; 