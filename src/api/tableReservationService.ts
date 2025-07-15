import apiClient from './apiClient';
import type { TableReservation, TableReservationFormData } from '@/types/dining.types';

export const getTableReservations = async (params?: {
  date?: string;
  status?: string;
  table_id?: number;
}): Promise<{ data: TableReservation[]; meta: any }> => {
  const { data } = await apiClient.get('/table-reservations', { params });
  return data;
};

export const getTableReservation = async (id: number): Promise<TableReservation> => {
    try {
        const { data } = await apiClient.get<{ data: TableReservation }>(`/table-reservations/${id}`);
        return data.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            throw new Error(`Table reservation with ID ${id} not found`);
        }
        throw error;
    }
};

export const createTableReservation = async (reservationData: TableReservationFormData): Promise<TableReservation> => {
  const { data } = await apiClient.post<{ data: TableReservation }>('/table-reservations', reservationData);
  return data.data;
};

export const updateTableReservation = async (id: number, reservationData: Partial<TableReservationFormData>): Promise<TableReservation> => {
  const { data } = await apiClient.put<{ data: TableReservation }>(`/table-reservations/${id}`, reservationData);
  return data.data;
};

export const deleteTableReservation = async (id: number): Promise<void> => {
  await apiClient.delete(`/table-reservations/${id}`);
};

export const assignOrderToReservation = async (reservationId: number, orderId: number): Promise<TableReservation> => {
  const { data } = await apiClient.post<{ data: TableReservation }>(`/table-reservations/${reservationId}/assign-order`, { order_id: orderId });
  return data.data;
};

export const getTodayReservations = async (): Promise<TableReservation[]> => {
  const { data } = await apiClient.get<{ data: TableReservation[] }>('/table-reservations/today');
  return data.data;
}; 