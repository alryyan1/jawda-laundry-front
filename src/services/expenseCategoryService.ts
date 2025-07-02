// src/api/expenseCategoryService.ts
import apiClient from './apiClient';
import type { ExpenseCategory } from '@/types'; // Add ExpenseCategory type

export const getExpenseCategories = async (): Promise<ExpenseCategory[]> => {
    const { data } = await apiClient.get<{data: ExpenseCategory[]}>('/expense-categories');
    return data.data;
};
// ... add create, update, delete functions similar to other services ...