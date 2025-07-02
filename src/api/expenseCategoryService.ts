// src/api/expenseCategoryService.ts
import apiClient from './apiClient';
import type { ExpenseCategory, ExpenseCategoryFormData } from '@/types';

/**
 * Fetches a list of all expense categories.
 * Usually not paginated as the list is expected to be short.
 * @returns A promise that resolves to an array of ExpenseCategory objects.
 */
export const getExpenseCategories = async (): Promise<ExpenseCategory[]> => {
    // The backend's index method for this resource returns a ResourceCollection,
    // which wraps the array in a 'data' key.
    const { data } = await apiClient.get<{ data: ExpenseCategory[] }>('/expense-categories');
    return data.data;
};

/**
 * Fetches a single expense category by its ID.
 * @param id The ID of the expense category to fetch.
 * @returns A promise that resolves to a single ExpenseCategory object.
 */
export const getExpenseCategoryById = async (id: number | string): Promise<ExpenseCategory> => {
    // A single resource from Laravel is also wrapped in a 'data' key.
    const { data } = await apiClient.get<{ data: ExpenseCategory }>(`/expense-categories/${id}`);
    return data.data;
};

/**
 * Creates a new expense category.
 * @param formData The data for the new category.
 * @returns A promise that resolves to the newly created ExpenseCategory object.
 */
export const createExpenseCategory = async (formData: ExpenseCategoryFormData): Promise<ExpenseCategory> => {
    const { data } = await apiClient.post<{ data: ExpenseCategory }>('/expense-categories', formData);
    return data.data;
};

/**
 * Updates an existing expense category.
 * @param id The ID of the category to update.
 * @param formData The partial data to update the category with.
 * @returns A promise that resolves to the updated ExpenseCategory object.
 */
export const updateExpenseCategory = async (id: number | string, formData: Partial<ExpenseCategoryFormData>): Promise<ExpenseCategory> => {
    const { data } = await apiClient.put<{ data: ExpenseCategory }>(`/expense-categories/${id}`, formData);
    return data.data;
};

/**
 * Deletes an expense category by its ID.
 * @param id The ID of the category to delete.
 * @returns A promise that resolves to the success message from the backend.
 */
export const deleteExpenseCategory = async (id: number | string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/expense-categories/${id}`);
    return data;
};