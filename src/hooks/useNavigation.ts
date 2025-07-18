import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Home,
  Package,
  Users,
  Settings as SettingsIcon,
  Calculator,
  UtensilsCrossed,
  Coffee,
  DollarSign,
  ShoppingCart,
  FolderKanban,
  ChartBar,
  TrendingUp,
  Layers,
  Box,
  Wand2,
  User2,
  Lock,
  BarChart3,
  Receipt,
  Truck,
  Shield,
  Plus,
  List,
  Kanban,
  UserPlus,
  Grid3x3,
  Tags,
  FolderOpen,
  FileText,
  Briefcase
} from 'lucide-react';

import { getUserNavigation } from '@/api/navigationService';
import type { NavigationItem } from '@/types/navigation.types';

// Icon mapping from string to Lucide icon component
const iconMap: Record<string, any> = {
  LayoutDashboard: Home,
  Calculator: Calculator,
  ShoppingCart: Package,
  Users: Users,
  Briefcase: Briefcase,
  UtensilsCrossed: UtensilsCrossed,
  Receipt: Receipt,
  Package: Package,
  Truck: Truck,
  BarChart3: ChartBar,
  Shield: SettingsIcon,
  Settings: SettingsIcon,
  Plus: Plus,
  List: List,
  Kanban: Kanban,
  UserPlus: UserPlus,
  Grid3x3: Grid3x3,
  Tags: Tags,
  FolderOpen: FolderOpen,
  TrendingUp: TrendingUp,
  TrendingDown: TrendingUp,
  FileText: FileText,
  User2: User2,
  Lock: Lock,
  Coffee: Coffee,
  DollarSign: DollarSign,
  Layers: Layers,
  Box: Box,
  Wand2: Wand2,
  FolderKanban: FolderKanban,
};

export interface NavigationItemWithIcon {
  id: number;
  key: string;
  title: string;
  icon?: any; // Lucide icon component
  route?: string;
  children?: NavigationItemWithIcon[];
  hasSubItems: boolean;
  type: 'link' | 'collapsible';
}

export const useNavigation = () => {
  const { i18n } = useTranslation();

  // Fetch user navigation from API
  const { 
    data: navigationItems = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['user-navigation'],
    queryFn: getUserNavigation,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Transform API navigation items to component-ready format
  const processedNavigation = useMemo(() => {
    const processItem = (item: NavigationItem): NavigationItemWithIcon => {
      const title = item.title[i18n.language] || item.title.en;
      const icon = item.icon ? iconMap[item.icon] : undefined;
      const hasSubItems = item.children && item.children.length > 0;

      return {
        id: item.id,
        key: item.key,
        title,
        icon,
        route: item.route || undefined,
        children: hasSubItems ? item.children!.map(processItem) : undefined,
        hasSubItems: !!hasSubItems,
        type: hasSubItems ? 'collapsible' : 'link'
      };
    };

    return navigationItems.map(processItem);
  }, [navigationItems, i18n.language]);

  // Fallback navigation for when API is unavailable or user has no permissions
  const fallbackNavigation: NavigationItemWithIcon[] = useMemo(() => [
    {
      id: 0,
      key: 'dashboard',
      title: i18n.language === 'ar' ? 'لوحة التحكم' : 'Dashboard',
      icon: Home,
      route: '/',
      hasSubItems: false,
      type: 'link'
    }
  ], [i18n.language]);

  return {
    navigation: processedNavigation.length > 0 ? processedNavigation : fallbackNavigation,
    isLoading,
    error,
    refetch,
    hasNavigation: processedNavigation.length > 0
  };
}; 