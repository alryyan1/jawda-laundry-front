import apiClient from './apiClient';
import type { SalesSummaryReport, CostSummaryReport, Order, PaginatedResponse } from '@/types';

export const getSalesSummaryReport = async (
    dateFrom?: string,
    dateTo?: string
): Promise<SalesSummaryReport> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    
    const { data } = await apiClient.get<SalesSummaryReport>(`/reports/sales-summary?${params.toString()}`);
    return data;
};



export const getCostSummaryReport = async (dateFrom?: string, dateTo?: string): Promise<CostSummaryReport> => {
    const params = { date_from: dateFrom, date_to: dateTo };
    const { data } = await apiClient.get<{ data: CostSummaryReport }>('/reports/cost-summary', { params });
    return data.data;
};


// src/api/reportService.ts
// ... (existing functions)

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