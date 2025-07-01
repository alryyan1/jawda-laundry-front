// src/types/expense.types.ts
import type { User } from './auth.types';

export interface Expense {
    id: number;
    name: string;
    category?: string | null;
    description?: string | null;
    amount: number;
    expense_date: string; // YYYY-MM-DD
    user?: Pick<User, 'id' | 'name'>; // Partial User type
    created_at: string;
}

export interface ExpenseFormData {
    name: string;
    category: string;

    amount: number | string;
    expense_date: string; // YYYY-MM-DD
    description?: string;
}