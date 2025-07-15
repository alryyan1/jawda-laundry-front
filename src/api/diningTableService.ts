import apiClient from './apiClient';
import type { DiningTable, DiningTableFormData, DiningTableStatistics } from '@/types/dining.types';

export const getDiningTables = async (): Promise<DiningTable[]> => {
  const { data } = await apiClient.get<{ data: DiningTable[] }>('/dining-tables');
  return data.data;
};

export const getDiningTable = async (id: number): Promise<DiningTable> => {
  const { data } = await apiClient.get<{ data: DiningTable }>(`/dining-tables/${id}`);
  return data.data;
};

export const createDiningTable = async (tableData: DiningTableFormData): Promise<DiningTable> => {
  const { data } = await apiClient.post<{ data: DiningTable }>('/dining-tables', tableData);
  return data.data;
};

export const updateDiningTable = async (id: number, tableData: Partial<DiningTableFormData>): Promise<DiningTable> => {
  const { data } = await apiClient.put<{ data: DiningTable }>(`/dining-tables/${id}`, tableData);
  return data.data;
};

export const deleteDiningTable = async (id: number): Promise<void> => {
  await apiClient.delete(`/dining-tables/${id}`);
};

export const updateDiningTableStatus = async (id: number, status: DiningTable['status']): Promise<DiningTable> => {
  const { data } = await apiClient.patch<{ data: DiningTable }>(`/dining-tables/${id}/status`, { status });
  return data.data;
};

export const getDiningTableStatistics = async (): Promise<DiningTableStatistics> => {
  const { data } = await apiClient.get<{ data: DiningTableStatistics }>('/dining-tables/statistics');
  return data.data;
}; 