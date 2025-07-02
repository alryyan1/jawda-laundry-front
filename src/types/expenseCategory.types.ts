export interface ExpenseCategory {
    id: number;
    name: string;
    description?: string | null;
    expenses_count?: number; // Count of expenses in this category
    created_at: string;
    updated_at: string;
}

export interface ExpenseCategoryFormData {
    name: string;
    description?: string;
} 