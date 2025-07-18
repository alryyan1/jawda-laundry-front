// src/api/dashboardService.ts
import apiClient from './apiClient';
import type { DashboardSummary, OrderTrendItem, OrderItemTrendItem, RevenueBreakdownItem, TodaySummary } from '@/types';

/**
 * Fetches the main summary statistics for the dashboard cards.
 * @returns A promise that resolves to the DashboardSummary object.
 */
export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
    // The backend endpoint should return the object directly
    const { data } = await apiClient.get<DashboardSummary>('/dashboard-summary');
    return data;
};

/**
 * Fetches data for the "Orders Trend" line chart.
 * @param days The number of days to look back for the trend data. Defaults to 7.
 * @returns A promise that resolves to an array of OrderTrendItem objects.
 */
export const fetchOrdersTrend = async (days: number = 7): Promise<OrderTrendItem[]> => {
    // Laravel ResourceCollections wrap arrays in a "data" key.
    const { data } = await apiClient.get<{ data: OrderTrendItem[] }>('/dashboard/orders-trend', {
        params: { days }
    });
    return data.data;
};

/**
 * Fetches data for the "Revenue Breakdown" pie chart.
 * @returns A promise that resolves to an array of RevenueBreakdownItem objects.
 */
export const fetchRevenueBreakdown = async (): Promise<RevenueBreakdownItem[]> => {
    const { data } = await apiClient.get<{ data: RevenueBreakdownItem[] }>('/dashboard/revenue-breakdown');
    return data.data;
};

/**
 * Fetches data for the "Order Items Trend" chart showing order items for the past 7 days.
 * @param days The number of days to look back for the trend data. Defaults to 7.
 * @returns A promise that resolves to an array of OrderItemTrendItem objects.
 */
export const fetchOrderItemsTrend = async (days: number = 7): Promise<OrderItemTrendItem[]> => {
    const { data } = await apiClient.get<{ data: OrderItemTrendItem[] }>('/dashboard/order-items-trend', {
        params: { days }
    });
    return data.data;
};

export const fetchTodaySummary = async (): Promise<TodaySummary> => {
    const { data } = await apiClient.get<{ data: TodaySummary }>('/dashboard/today-summary');
    return data.data;
};