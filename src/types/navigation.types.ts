export interface NavigationItem {
  id: number;
  key: string;
  title: {
    en: string;
    ar: string;
  };
  icon?: string;
  route?: string;
  parent_id?: number;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
  permissions?: string[];
  created_at: string;
  updated_at: string;
  children?: NavigationItem[];
  parent?: NavigationItem;
}

export interface UserNavigationPermission {
  navigation_item_id: number;
  navigation_item: NavigationItem;
  is_granted: boolean | null;
  has_explicit_permission: boolean;
  can_access_by_role: boolean;
}

export interface NavigationFormData {
  key: string;
  title: {
    en: string;
    ar: string;
  };
  icon?: string;
  route?: string;
  parent_id?: number;
  sort_order: number;
  is_active: boolean;
  permissions?: string[];
}

export interface UserNavigationPermissionUpdate {
  navigation_item_id: number;
  is_granted: boolean;
}

export interface NavigationOrderUpdate {
  id: number;
  sort_order: number;
}

export interface NavigationApiResponse {
  data: NavigationItem[];
  message: string;
}

export interface UserNavigationPermissionsApiResponse {
  data: UserNavigationPermission[];
  message: string;
} 