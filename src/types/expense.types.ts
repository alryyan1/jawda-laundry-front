// src/types/expense.types.ts
import type { User } from './auth.types';

export interface Expense {
    id: number;
    name: string;
    expense_category_id?: number | null;
    description?: string | null;
    amount: number;
    payment_method: string;
    expense_date: string; // YYYY-MM-DD
    user?: Pick<User, 'id' | 'name'>; // Partial User type
    created_at: string;
}

export interface ExpenseFormData {
    name: string;
    expense_category_id: number;
    amount: number | string;
    payment_method: string;
    expense_date: string; // YYYY-MM-DD
    description?: string;
}