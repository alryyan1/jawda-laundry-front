// src/types/dashboard.types.ts

export interface DashboardSummary {
    pendingOrders: number;
    processingOrders: number;
    readyForPickupOrders: number;
    completedTodayOrders: number;
    cancelledOrders?: number;
    totalActiveCustomers: number;
    monthlyRevenue: number;
}

export interface OrderTrendItem {
    date: string; // YYYY-MM-DD
    count: number;
}

export interface RevenueBreakdownItem {
    name: string; // Category Name
    total_revenue: number;
}