// src/api/adminService.ts
import apiClient from './apiClient';
import type { User, Role, PaginatedResponse } from '@/types';

// Define a more specific type for the user form payload
export interface UserFormData {
    name: string;
    username: string;
    email: string;
    password?: string;
    password_confirmation?: string;
    role_ids: number[]; // Array of role IDs
}

export const getUsers = async (
    page: number, perPage: number, search?: string, role?: string
): Promise<PaginatedResponse<User>> => {
    const params = { page, per_page: perPage, search: search || undefined, role: role || undefined };
    const { data } = await apiClient.get<PaginatedResponse<User>>('/admin/users', { params });
    return data;
};

export const getRoles = async (): Promise<Role[]> => {
    const { data } = await apiClient.get<{data: Role[]}>('/admin/roles');
    return data.data;
};

export const createUser = async (userData: UserFormData): Promise<User> => {
    const { data } = await apiClient.post<{data: User}>('/admin/users', userData);
    return data.data;
};

export const updateUser = async (userId: number, userData: Partial<UserFormData>): Promise<User> => {
    const { data } = await apiClient.put<{data: User}>(`/admin/users/${userId}`, userData);
    return data.data;
};

export const deleteUser = async (userId: number): Promise<{message: string}> => {
    const { data } = await apiClient.delete<{message: string}>(`/admin/users/${userId}`);
    return data;
};