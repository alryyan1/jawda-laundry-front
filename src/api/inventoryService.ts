import apiClient from './apiClient';

export interface InventoryItem {
  id: number;
  product_type_id: number;
  productType?: { 
    id: number; 
    name: string; 
    category?: { id: number; name: string } 
  };
  sku?: string;
  description?: string;
  unit: string;
  min_stock_level: number;
  max_stock_level?: number;
  current_stock: number;
  cost_per_unit?: number;
  supplier_id?: number;
  is_active: boolean;
  total_value: number;
  is_low_stock: boolean;
  supplier?: any;
  created_at: string;
  updated_at: string;
}

export interface InventoryCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  inventory_items_count?: number;
}

export interface InventoryTransaction {
  id: number;
  inventory_item_id: number;
  transaction_type: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'waste';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  user_id: number;
  created_at: string;
  inventory_item?: InventoryItem;
  user?: any;
}

export interface InventoryStatistics {
  total_items: number;
  low_stock_items: number;
  total_value: number;
}

// Get all inventory items with filters
export const getInventoryItems = async (params?: {
  search?: string;
  category_id?: number;
  low_stock?: boolean;
  per_page?: number;
  page?: number;
}) => {
  const response = await apiClient.get('/inventories', { params });
  return response.data;
};

// Get low stock items
export const getLowStockItems = async () => {
  const response = await apiClient.get('/inventories/low-stock');
  return response.data;
};

// Get inventory item details
export const getInventoryItem = async (id: number) => {
  const response = await apiClient.get(`/inventories/${id}`);
  return response.data;
};

// Create new inventory item
export const createInventoryItem = async (data: Partial<InventoryItem>) => {
  const response = await apiClient.post('/inventories', data);
  return response.data;
};

// Get inventory item by ID
export const getInventoryItemById = async (id: number) => {
  const response = await apiClient.get(`/inventories/${id}`);
  return response.data;
};

// Update inventory item
export const updateInventoryItem = async (id: number, data: Partial<InventoryItem>) => {
  const response = await apiClient.put(`/inventories/${id}`, data);
  return response.data;
};

// Add stock to inventory item
export const addStock = async (id: number, data: {
  quantity: number;
  unit_cost?: number;
  notes?: string;
}) => {
  const response = await apiClient.post(`/inventories/${id}/add-stock`, data);
  return response.data;
};

// Remove stock from inventory item
export const removeStock = async (id: number, data: {
  quantity: number;
  notes?: string;
}) => {
  const response = await apiClient.post(`/inventories/${id}/remove-stock`, data);
  return response.data;
};

// Get inventory transactions
export const getInventoryTransactions = async (params?: {
  inventory_item_id?: number;
  transaction_type?: string;
  per_page?: number;
  page?: number;
}) => {
  const response = await apiClient.get('/inventories/transactions', { params });
  return response.data;
};

// Get inventory categories
export const getInventoryCategories = async () => {
  const response = await apiClient.get('/inventories/categories');
  return response.data;
};

// Get inventory statistics
export const getInventoryStatistics = async () => {
  const response = await apiClient.get('/inventories/statistics');
  return response.data;
};

// Get inventory data for all product types
export const getProductTypeInventory = async () => {
  const response = await apiClient.get('/inventories/product-type-inventory');
  return response.data;
};

// Create new inventory category
export const createInventoryCategory = async (data: {
  name: string;
  description?: string;
  color?: string;
}) => {
  const response = await apiClient.post('/inventories/categories', data);
  return response.data;
};

// Update inventory category
export const updateInventoryCategory = async (id: number, data: {
  name: string;
  description?: string;
  color?: string;
}) => {
  const response = await apiClient.put(`/inventories/categories/${id}`, data);
  return response.data;
};

// Delete inventory category
export const deleteInventoryCategory = async (id: number) => {
  const response = await apiClient.delete(`/inventories/categories/${id}`);
  return response.data;
};

// Get inventory transactions with enhanced filters
export const getInventoryTransactionsWithFilters = async (params?: {
  search?: string;
  category_id?: number;
  transaction_type?: 'in' | 'out' | 'adjustment';
  date_from?: string;
  date_to?: string;
  per_page?: number;
  page?: number;
}) => {
  const response = await apiClient.get('/inventories/transactions', { params });
  return response.data;
};

// Create inventory transaction
export const createInventoryTransaction = async (data: {
  inventory_item_id: number;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unit_price?: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
}) => {
  const response = await apiClient.post('/inventories/transactions', data);
  return response.data;
};

// Export inventory transactions
export const exportInventoryTransactions = async (params?: {
  search?: string;
  category_id?: number;
  transaction_type?: string;
  date_from?: string;
  date_to?: string;
}) => {
  const response = await apiClient.get('/inventories/transactions/export', { 
    params,
    responseType: 'blob'
  });
  return response.data;
}; 