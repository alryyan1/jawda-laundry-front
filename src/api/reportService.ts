import apiClient from './apiClient';
import type { SalesSummaryReport, CostSummaryReport, Order, PaginatedResponse, DailyRevenueReport, OrdersReportData } from '@/types';

export const getSalesSummaryReport = async (
    dateFrom?: string,
    dateTo?: string,
    month?: string
): Promise<SalesSummaryReport> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (month) params.append('month', month);
    
    const { data } = await apiClient.get<{ data: SalesSummaryReport }>(`/reports/sales-summary?${params.toString()}`);
    return data.data;
};

export const getCostSummaryReport = async (dateFrom?: string, dateTo?: string): Promise<CostSummaryReport> => {
    const params = { date_from: dateFrom, date_to: dateTo };
    const { data } = await apiClient.get<{ data: CostSummaryReport }>('/reports/cost-summary', { params });
    return data.data;
};

// Define filters type for clarity
export interface OrderReportFilters {
    search?: string;
    status?: string;
    customerId?: string;
    productTypeId?: string;
    dateFrom?: string;
    dateTo?: string;
}

export const downloadOrdersReport = async (filters: OrderReportFilters): Promise<Blob> => {
    const params = {
        search: filters.search || undefined,
        status: filters.status || undefined,
        customer_id: filters.customerId || undefined,
        product_type_id: filters.productTypeId || undefined,
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
    };
    
    const response = await apiClient.get('/reports/orders/export-csv', {
        params,
        responseType: 'blob', // Crucial for file downloads
    });
    return response.data;
};

export const getOverduePickupOrders = async (
    page: number, perPage: number, overdueDays?: number
): Promise<PaginatedResponse<Order>> => {
    const params: Record<string, string | number> = { page, per_page: perPage };
    if (overdueDays && overdueDays > 0) {
        params.overdue_days = overdueDays;
    }
    const { data } = await apiClient.get<PaginatedResponse<Order>>('/reports/overdue-pickups', { params });
    return data;
};

export const getDailyRevenueReport = async (month: number, year: number): Promise<DailyRevenueReport> => {
    const params = { month, year };
    const { data } = await apiClient.get<{ data: DailyRevenueReport }>('/reports/daily-revenue', { params });
    return data.data;
};

import type { DailyCostsReport } from '@/types';

export const getDailyCostsReport = async (month: number, year: number): Promise<DailyCostsReport> => {
    const params = { month, year };
    const { data } = await apiClient.get<{ data: DailyCostsReport }>('/reports/daily-costs', { params });
    return data.data;
};

// New orders report functions
export const getOrdersReport = async (dateFrom: string, dateTo: string): Promise<OrdersReportData> => {
  const response = await apiClient.get('/reports/orders', {
    params: { date_from: dateFrom, date_to: dateTo }
  });
  return response.data;
};

export const exportOrdersReportPdf = async (dateFrom: string, dateTo: string): Promise<Blob> => {
  const response = await apiClient.get('/reports/orders/pdf', {
    params: { date_from: dateFrom, date_to: dateTo },
    responseType: 'blob'
  });
  return response.data;
};

export const getOrdersReportPdfViewUrl = (dateFrom: string, dateTo: string): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const params = new URLSearchParams({
    date_from: dateFrom,
    date_to: dateTo
  });
  return `${baseUrl}/reports/orders/pdf/view?${params.toString()}`;
};