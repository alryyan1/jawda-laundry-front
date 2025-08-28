// src/api/expenseService.ts
import apiClient from './apiClient';
import type { Expense, ExpenseFormData, PaginatedResponse } from '@/types';

export const getExpenses = async (
    page: number, perPage: number, filters: { search?: string; category?: string; date_from?: string; date_to?: string }
): Promise<PaginatedResponse<Expense>> => {
    const params = { 
        page, 
        per_page: perPage, 
        ...filters,
        expense_category_id: filters.category ? parseInt(filters.category) : undefined
    };
    delete params.category; // Remove the old category parameter
    const { data } = await apiClient.get<PaginatedResponse<Expense>>('/expenses', { params });
    return data;
};

export const downloadExpensesExcel = async (filters: { search?: string; category?: string; date_from?: string; date_to?: string }): Promise<void> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('expense_category_id', filters.category);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    const response = await apiClient.get(`/reports/expenses/export-excel?${params.toString()}`, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

export const openExpensesPdf = (filters: { search?: string; category?: string; date_from?: string; date_to?: string }): void => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('expense_category_id', filters.category);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    const url = `${apiClient.defaults.baseURL}/reports/expenses/export-pdf?${params.toString()}`;
    window.open(url, '_blank');
};

export const createExpense = async (formData: ExpenseFormData): Promise<Expense> => {
    const payload = { 
        ...formData, 
        amount: parseFloat(String(formData.amount)),
        expense_category_id: parseInt(String(formData.expense_category_id))
    };
    const { data } = await apiClient.post<{data: Expense}>('/expenses', payload);
    return data.data;
};

export const updateExpense = async (id: number, formData: Partial<ExpenseFormData>): Promise<Expense> => {
    const payload = { 
        ...formData, 
        amount: formData.amount ? parseFloat(String(formData.amount)) : undefined,
        expense_category_id: formData.expense_category_id ? parseInt(String(formData.expense_category_id)) : undefined
    };
    const { data } = await apiClient.put<{data: Expense}>(`/expenses/${id}`, payload);
    return data.data;
};

export const deleteExpense = async (id: number): Promise<{message: string}> => {
    const { data } = await apiClient.delete<{message: string}>(`/expenses/${id}`);
    return data;
};

export const getExpenseCategories = async (): Promise<{ id: number; name: string; description?: string }[]> => {
    const { data } = await apiClient.get<{ data: { id: number; name: string; description?: string }[] }>('/expenses/categories');
    return Array.isArray(data.data) ? data.data : [];
};