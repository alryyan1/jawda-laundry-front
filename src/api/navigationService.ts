import apiClient from './apiClient';
import type {
  NavigationItem,
  NavigationFormData,
  UserNavigationPermission,
  UserNavigationPermissionUpdate,
  NavigationOrderUpdate,
  NavigationApiResponse,
  UserNavigationPermissionsApiResponse
} from '@/types/navigation.types';

// Navigation Items Management
export const getNavigationItems = async (): Promise<NavigationItem[]> => {
  const response = await apiClient.get<NavigationApiResponse>('/navigation');
  return response.data.data;
};

export const getUserNavigation = async (): Promise<NavigationItem[]> => {
  const response = await apiClient.get<NavigationApiResponse>('/navigation/user');
  return response.data.data;
};

export const createNavigationItem = async (data: NavigationFormData): Promise<NavigationItem> => {
  const response = await apiClient.post<{ data: NavigationItem; message: string }>('/navigation', data);
  return response.data.data;
};

export const updateNavigationItem = async (id: number, data: Partial<NavigationFormData>): Promise<NavigationItem> => {
  const response = await apiClient.put<{ data: NavigationItem; message: string }>(`/navigation/${id}`, data);
  return response.data.data;
};

export const deleteNavigationItem = async (id: number): Promise<void> => {
  await apiClient.delete(`/navigation/${id}`);
};

export const updateNavigationOrder = async (items: NavigationOrderUpdate[]): Promise<void> => {
  await apiClient.put('/navigation/order', { items });
};

// User Navigation Permissions
export const getUserNavigationPermissions = async (userId: number): Promise<UserNavigationPermission[]> => {
  const response = await apiClient.get<UserNavigationPermissionsApiResponse>(`/users/${userId}/navigation-permissions`);
  return response.data.data;
};

export const updateUserNavigationPermissions = async (
  userId: number, 
  permissions: UserNavigationPermissionUpdate[]
): Promise<void> => {
  await apiClient.put(`/users/${userId}/navigation-permissions`, {
    navigation_permissions: permissions
  });
}; 