import type { Order } from "./order.types";

export interface TopService {
    id: number;
    display_name: string;
    total_quantity: number;
    total_revenue: number;
}

export interface DailyBreakdown {
    date: string;
    total_orders: number;
    total_revenue: number;
}

export interface SalesSummaryReport {
    summary: {
        total_revenue: number;
        total_orders: number;
        average_order_value: number;
    };
    daily_breakdown?: DailyBreakdown[];
    date_range: {
        from: string;
        to: string;
    };
    top_services: TopService[];
    view_type?: 'monthly' | 'custom_range';
}

export interface CostSummaryMetrics {
    total_expenses: number;
    total_purchases: number;
    total_cost: number;
}

export interface ExpenseByCategoryItem {
    category: string;
    total_amount: number;
}

export interface PurchaseBySupplierItem {
    name: string;
    total_amount: number;
}

export interface CostSummaryReport {
    summary: CostSummaryMetrics;
    expenses_by_category: ExpenseByCategoryItem[];
    purchases_by_supplier: PurchaseBySupplierItem[];
    date_range: {
        from: string;
        to: string;
    };
}


// src/types/report.types.ts
// ... (existing types)
export interface DailyRevenueRecord {
    date: string; // YYYY-MM-DD
    order_count: number;
    daily_revenue: number;
}

export interface DailyRevenueReport {
    report_details: {
        month: number;
        year: number;
        month_name: string;
    };
    summary: {
        total_revenue: number;
        total_orders: number;
        average_daily_revenue: number;
    };
    daily_data: DailyRevenueRecord[];
}


// src/types/report.types.ts
// ... (existing types)
export interface DailyCostRecord {
    date: string; // YYYY-MM-DD
    expense_count: number;
    daily_cost: number;
}

export interface DailyCostsReport {
    report_details: {
        month: number;
        year: number;
        month_name: string;
    };
    summary: {
        total_cost: number;
        total_entries: number;
        average_daily_cost: number;
    };
    daily_data: DailyCostRecord[];
}

export interface OrdersReportData {
  orders: Order[];
  summary: {
    total_orders: number;
    total_amount: number;
    average_order_value: number;
    date_from: string;
    date_to: string;
  };
}