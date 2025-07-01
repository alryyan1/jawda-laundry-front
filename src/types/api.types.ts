// src/types/api.types.ts

/**
 * Generic structure for paginated API responses from Laravel.
 */
export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

/**
 * For UI components like Combobox or Select.
 */
export interface ComboboxOption {
    value: string; // Usually ID
    label: string; // Display text
    disabled?: boolean;
}