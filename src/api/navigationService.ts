import apiClient from './apiClient';

export interface SimpleNavigationItem {
  key: string;
  title: {
    en: string;
    ar: string;
  };
  icon: string;
  route: string | null;
  sort_order: number;
  children?: SimpleNavigationItem[];
}

export interface SimpleNavigationResponse {
  data: SimpleNavigationItem[];
  user_role: string;
}

// Get navigation items for the authenticated user
export const getUserNavigation = async (): Promise<SimpleNavigationItem[]> => {
  console.log('Fetching user navigation...');
  const response = await apiClient.get<SimpleNavigationResponse>('/navigation');
  console.log('Navigation response:', response.data);
  return response.data.data;
};

// Get navigation items for a specific role (admin only)
export const getNavigationByRole = async (role: string): Promise<SimpleNavigationItem[]> => {
  const response = await apiClient.get<SimpleNavigationResponse>(`/navigation/role/${role}`);
  return response.data.data;
}; 