// src/services/orderService.ts
import apiClient from '@/lib/axios';
import { Order, NewOrderFormData } from '@/types'; // Assuming NewOrderFormData is defined or imported

export const getOrders = async (): Promise<Order[]> => {
  const { data } = await apiClient.get('/orders');
  return data;
};

export const getOrderById = async (id: string): Promise<Order> => {
  const { data } = await apiClient.get(`/orders/${id}`);
  return data;
};

export const createOrder = async (orderData: NewOrderFormData): Promise<Order> => {
  const { data } = await apiClient.post('/orders', orderData);
  return data;
};

// Add updateOrder, deleteOrder etc.