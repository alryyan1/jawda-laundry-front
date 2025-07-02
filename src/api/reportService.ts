import apiClient from './apiClient';

interface TopService {
    id: number;
    display_name: string;
    total_quantity: number;
    total_revenue: number;
}

interface SalesSummaryReport {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
    date_range: {
        from: string;
        to: string;
    };
    top_services: TopService[];
}

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