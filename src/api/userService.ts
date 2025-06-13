// src/api/userService.ts
import apiClient from './apiClient';
import { User, PaginatedResponse } from '@/types'; // Or from specific auth.types

export interface UserFormData { // For admin creating/editing users
    name: string;
    email: string;
    password?: string; // Optional on update
    password_confirmation?: string;
    role_ids?: (number | string)[]; // Array of role IDs to assign/sync
}

// Admin: Get all users
export const getUsers = async (
    page: number = 1,
    perPage: number = 10,
    search?: string,
    role?: string
): Promise<PaginatedResponse<User>> => {
    const params: any = { page, per_page: perPage };
    if (search) params.search = search;
    if (role) params.role = role; // Assuming backend filters by a primary role name if sent
    const { data } = await apiClient.get<PaginatedResponse<User>>('/admin/users', { params });
    return data;
};

// Admin: Get a single user
export const getUserById = async (id: number | string): Promise<User> => {
    const { data } = await apiClient.get<{ data: User }>(`/admin/users/${id}`);
    return data.data;
};

// Admin: Create a user
export const createUserAsAdmin = async (userData: UserFormData): Promise<User> => {
    const payload = { ...userData, roles: userData.role_ids }; // Backend might expect 'roles' key with IDs
    delete payload.role_ids;
    const { data } = await apiClient.post<{ data: User }>('/admin/users', payload);
    return data.data;
};

// Admin: Update a user
export const updateUserAsAdmin = async (id: number | string, userData: Partial<UserFormData>): Promise<User> => {
    const payload = { ...userData, roles: userData.role_ids };
    delete payload.role_ids;
    // Remove password/password_confirmation if they are empty strings, so backend doesn't try to update with empty
    if (payload.password === '') delete payload.password;
    if (payload.password_confirmation === '') delete payload.password_confirmation;

    const { data } = await apiClient.put<{ data: User }>(`/admin/users/${id}`, payload);
    return data.data;
};

// Admin: Delete a user
export const deleteUserAsAdmin = async (id: number | string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/admin/users/${id}`);
    return data;
};