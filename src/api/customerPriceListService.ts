// src/api/customerPriceListService.ts

import apiClient from './apiClient';
import type { 
  CustomerPriceList, 
  CustomerPriceListSummary, 
  CustomerPriceListExport,
  CustomerPriceListUpdateRequest 
} from '@/types/customerPriceList.types';

export const customerPriceListService = {
  /**
   * Get the price list for a specific customer
   */
  getCustomerPriceList: async (customerId: number): Promise<CustomerPriceList> => {
    const response = await apiClient.get(`/customers/${customerId}/price-list`);
    return response.data;
  },

  /**
   * Update the price list for a specific customer
   */
  updateCustomerPriceList: async (
    customerId: number, 
    data: CustomerPriceListUpdateRequest
  ): Promise<{ message: string; customer_id: number }> => {
    const response = await apiClient.put(`/customers/${customerId}/price-list`, data);
    return response.data;
  },

  /**
   * Delete all pricing rules for a customer
   */
  deleteCustomerPriceList: async (customerId: number): Promise<{ message: string; deleted_rules: number }> => {
    const response = await apiClient.delete(`/customers/${customerId}/price-list`);
    return response.data;
  },

  /**
   * Get a summary of customer pricing rules
   */
  getCustomerPriceListSummary: async (customerId: number): Promise<CustomerPriceListSummary> => {
    const response = await apiClient.get(`/customers/${customerId}/price-list/summary`);
    return response.data;
  },

  /**
   * Export customer price list as CSV
   */
  exportCustomerPriceList: async (customerId: number): Promise<CustomerPriceListExport> => {
    const response = await apiClient.get(`/customers/${customerId}/price-list/export`);
    return response.data;
  },

  /**
   * Download CSV file
   */
  downloadCsv: (csvData: string[][], filename: string) => {
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
}; 