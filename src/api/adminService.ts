// src/api/adminService.ts
import apiClient from './apiClient';
import type { User, Role, PaginatedResponse } from '@/types';

// Using 'any' for formData is a shortcut; for production, define specific UserFormData type
export const getUsers = async (page: number, perPage: number, search?: string): Promise<PaginatedResponse<User>> => {
    const { data } = await apiClient.get<PaginatedResponse<User>>('/admin/users', { params: { page, per_page: perPage, search } });
    return data;
};

export const getRoles = async (): Promise<Role[]> => {
    const { data } = await apiClient.get<{data: Role[]}>('/admin/roles'); // Assuming this endpoint exists
    return data.data;
};

export const createUser = async (userData: any): Promise<User> => {
    const { data } = await apiClient.post<{data: User}>('/admin/users', userData);
    return data.data;
};

export const updateUser = async (userId: number, userData: any): Promise<User> => {
    const { data } = await apiClient.put<{data: User}>(`/admin/users/${userId}`, userData);
    return data.data;
};