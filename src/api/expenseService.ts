// src/api/expenseService.ts
import apiClient from './apiClient';
import type { Expense, ExpenseFormData, PaginatedResponse } from '@/types';

export const getExpenses = async (
    page: number, perPage: number, filters: { search?: string; category?: string; date_from?: string; date_to?: string }
): Promise<PaginatedResponse<Expense>> => {
    const params = { page, per_page: perPage, ...filters };
    const { data } = await apiClient.get<PaginatedResponse<Expense>>('/expenses', { params });
    return data;
};

export const createExpense = async (formData: ExpenseFormData): Promise<Expense> => {
    const payload = { ...formData, amount: parseFloat(String(formData.amount)) };
    const { data } = await apiClient.post<{data: Expense}>('/expenses', payload);
    return data.data;
};

export const updateExpense = async (id: number, formData: Partial<ExpenseFormData>): Promise<Expense> => {
    const payload = { ...formData, amount: formData.amount ? parseFloat(String(formData.amount)) : undefined };
    const { data } = await apiClient.put<{data: Expense}>(`/expenses/${id}`, payload);
    return data.data;
};

export const deleteExpense = async (id: number): Promise<{message: string}> => {
    const { data } = await apiClient.delete<{message: string}>(`/expenses/${id}`);
    return data;
};

export const getExpenseCategories = async (): Promise<string[]> => {
    const { data } = await apiClient.get<string[]>('/expenses/categories');
    return data;
};