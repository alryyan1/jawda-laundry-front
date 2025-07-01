// src/types/dashboard.types.ts

export interface DashboardSummary {
    pendingOrders: number;
    processingOrders: number;
    readyForPickupOrders: number;
    completedTodayOrders: number;
    cancelledOrders?: number; // Optional
    totalActiveCustomers: number;
    monthlyRevenue: number;
}

export interface OrderTrendItem {
    date: string; // e.g., "2023-10-27"
    count: number;
}

export interface RevenueBreakdownItem {
    name: string; // e.g., "Apparel", "Household Linens"
    total_revenue: number;
}