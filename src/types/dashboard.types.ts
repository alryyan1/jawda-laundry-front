// src/types/dashboard.types.ts

export interface DashboardSummary {
    pendingOrders: number;
    processingOrders: number;
    readyForPickupOrders: number;
    completedTodayOrders: number;
    cancelledOrders: number;
    totalActiveCustomers: number;
    monthlyRevenue: number;
}

export interface OrderTrendItem {
    date: string; // YYYY-MM-DD
    count: number;
}

export interface OrderItemTrendItem {
    date: string; // YYYY-MM-DD
    count: number;
    totalQuantity: number;
}

export interface RevenueBreakdownItem {
    name: string; // Category Name
    total_revenue: number;
}


// src/types/dashboard.types.ts
// ...
export interface TodayStatusCounts {
    pending: number;
    processing: number;
    ready_for_pickup: number;
    completed: number;
    cancelled: number;
}

export interface TodayIncomeSummary {
    total: number;
    cash: number;
    card: number;
    online: number;
    bank: number;
}

export interface TodaySummary {
    status_counts: TodayStatusCounts;
    income_summary: TodayIncomeSummary;
}