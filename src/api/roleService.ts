// src/api/roleService.ts
import apiClient from './apiClient';
import { Role, PaginatedResponse, Permission } from '@/types'; // Assuming types are in global or role.types.ts

export interface RoleFormData {
    name: string;
    permission_ids?: (number | string)[]; // Array of permission IDs
}

// For admin role management page
export const getRolesPaginated = async (page: number = 1, perPage: number = 10, search?: string): Promise<PaginatedResponse<Role>> => {
    const params: any = { page, per_page: perPage };
    if (search) params.search = search;
    const { data } = await apiClient.get<PaginatedResponse<Role>>('/admin/roles', { params });
    return data;
};

// For user form dropdown / multi-select
export const getAllRoles = async (): Promise<Role[]> => {
    const { data } = await apiClient.get<{ data: Role[] }>('/admin/roles?paginate=false'); // Assuming backend supports no pagination
    return data.data;
};

export const getRoleById = async (id: number | string): Promise<Role> => {
    const { data } = await apiClient.get<{data: Role}>(`/admin/roles/${id}`);
    return data.data;
};

export const createRole = async (roleData: RoleFormData): Promise<Role> => {
    const payload = { ...roleData, permissions: roleData.permission_ids };
    delete payload.permission_ids;
    const { data } = await apiClient.post<{data: Role}>('/admin/roles', payload);
    return data.data;
};

export const updateRole = async (id: number | string, roleData: Partial<RoleFormData>): Promise<Role> => {
    const payload = { ...roleData, permissions: roleData.permission_ids };
    delete payload.permission_ids;
    const { data } = await apiClient.put<{data: Role}>(`/admin/roles/${id}`, payload);
    return data.data;
};

export const deleteRole = async (id: number | string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/admin/roles/${id}`);
    return data;
};



// src/api/roleService.ts OR src/api/permissionService.ts
// ... (existing role functions)

export const getAllPermissions = async (): Promise<Permission[]> => {
    // Assuming backend returns { data: Permission[] }
    const { data } = await apiClient.get<{ data: Permission[] }>('/admin/permissions');
    return data.data;
};