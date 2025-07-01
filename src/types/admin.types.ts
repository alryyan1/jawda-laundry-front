// src/types/admin.types.ts

export interface Permission {
    id: number;
    name: string;
}

export interface Role {
    id: number;
    name: string;
    permissions: Permission[];
    created_at: string;
    updated_at: string;
}

export interface RoleFormData {
    name: string;
    permissions: number[]; // Array of permission IDs
}