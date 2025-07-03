export interface TopService {
    id: number;
    display_name: string;
    total_quantity: number;
    total_revenue: number;
}

export interface SalesSummaryReport {
    summary: {
        total_revenue: number;
        total_orders: number;
        average_order_value: number;
    };
    date_range: {
        from: string;
        to: string;
    };
    top_services: TopService[];
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