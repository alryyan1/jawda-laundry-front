// src/types/dashboard.types.ts

export interface DashboardSummary {
    // Order counts by time period
    totalOrdersToday: number;
    totalOrdersThisWeek: number;
    totalOrdersThisMonth: number;
    
    // Revenue by time period
    totalRevenueToday: number;
    totalRevenueThisWeek: number;
    totalRevenueThisMonth: number;
    
    // Legacy fields (keeping for backward compatibility)
    pendingOrders: number;
    processingOrders: number;
    readyForPickupOrders: number;
    completedTodayOrders: number;
    cancelledOrders: number;
    totalActiveCustomers: number;
    monthlyRevenue: number;
}

export interface TopProductItem {
    name: string; // Product name
    count: number; // Number of times ordered
    percentage: number; // Percentage of total orders
    color: string; // Color for the pie chart
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
    delivered: number;
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