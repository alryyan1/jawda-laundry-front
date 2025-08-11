import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { 
  Loader2,
  GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { PageHeader } from '@/components/shared/PageHeader';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { PermissionWrapper, PermissionButton } from '@/components/ui/permission-wrapper';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getNavigationItems, deleteNavigationItem, updateNavigationItem, updateNavigationOrder } from '@/api/navigationService';
import type { NavigationItem, NavigationItemDisplay } from '@/types/navigation.types';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Sortable Table Row Component
interface SortableTableRowProps {
  item: NavigationItemDisplay;
  onToggleActive: (id: number, is_active: boolean) => void;
  onDelete: (item: NavigationItemDisplay) => void;
  can: (permission: string) => boolean;
  t: (key: string) => string;
  toggleActiveMutation: any;
}

const SortableTableRow: React.FC<SortableTableRowProps> = ({ 
  item, 
  onToggleActive, 
  onDelete, 
  can, 
  t, 
  toggleActiveMutation 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="text-center">
        {/* Drag handle */}
        <PermissionWrapper 
          permission="navigation:update" 
          tooltipText={t('noPermissionToReorderNavigation')}
        >
          <div className="flex items-center justify-center">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </PermissionWrapper>
      </TableCell>
      <TableCell className="text-center">
        {/* Indentation for sub-items */}
        <div  className="flex items-center justify-center gap-2">
        
          
          <div>
            <div className="font-medium">{item.title}</div>
            <div className="text-xs text-muted-foreground">
              Key: {item.key}
              {item.route && ` • Route: ${item.route}`}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex flex-wrap justify-center gap-1">
          {item.permissions?.map((permission, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {permission}
            </Badge>
          )) || <span className="text-muted-foreground text-sm">{t('noPermissions')}</span>}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="secondary">
          {item.sort_order}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <PermissionWrapper 
          permission="navigation:update" 
          tooltipText={t('noPermissionToUpdateNavigation')}
        >
          <div className="flex items-center justify-center gap-2">
            <Checkbox
              checked={item.is_active}
              onCheckedChange={(checked: boolean) => {
                console.log('Toggling navigation item:', item.id, 'to:', checked);
                onToggleActive(item.id, checked);
              }}
              disabled={toggleActiveMutation.isPending}
            />
            <span className="text-sm">
              {item.is_active ? t('active') : t('inactive')}
            </span>
          </div>
        </PermissionWrapper>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={item.is_default ? "default" : "secondary"}>
          {item.is_default ? t('system') : t('custom')}
        </Badge>
      </TableCell>
      
    </TableRow>
  );
};

const NavigationManagementPage: React.FC = () => {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const { can, user, isAuthenticated } = useAuth();

  const [itemToDelete, setItemToDelete] = useState<NavigationItem | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch navigation items
  const { data: navigationItems = [], isLoading, refetch, isFetching, error } = useQuery({
    queryKey: ['navigation-items'],
    queryFn: getNavigationItems,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteNavigationItem,
    onSuccess: () => {
      toast.success(t('navigationItemDeleted'));
      refetch();
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      console.error('Delete mutation error:', error);
      toast.error(error.message || t('navigationItemDeleteFailed'));
      setItemToDelete(null);
    }
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => {
      console.log('Making API call to update navigation item:', id, 'is_active:', is_active);
      console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
      return updateNavigationItem(id, { is_active });
    },
    onSuccess: (data) => {
      console.log('Navigation item updated successfully:', data);
      toast.success(t('navigationItemUpdated'));
      // Force refetch to get the latest data
      refetch();
    },
    onError: (error: Error) => {
      console.error('Failed to update navigation item:', error);
      console.error('Error response:', (error as any).response);
      toast.error(error.message || t('navigationItemUpdateFailed'));
    }
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: updateNavigationOrder,
    onSuccess: () => {
      toast.success(t('navigationOrderUpdated'));
      refetch();
    },
    onError: (error: Error) => {
      console.error('Update order mutation error:', error);
      toast.error(error.message || t('navigationOrderUpdateFailed'));
    }
  });

  // Debug authentication
  console.log('Current user:', user);
  console.log('Is authenticated:', isAuthenticated);
  console.log('Can navigation:update:', can('navigation:update'));
  console.log('Can navigation:delete:', can('navigation:delete'));
  console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('All env vars:', import.meta.env);

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please log in to access this page.</p>
          <div className="space-y-2">
            <a href="/login" className="text-primary hover:underline block">
              Go to Login
            </a>
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('http://localhost/laundry/jawda-laundry-backend/public/api/login', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                      username: 'admin',
                      password: '12345678'
                    })
                  });
                  const data = await response.json();
                  console.log('Login test response:', data);
                  if (data.token) {
                    // Store the token
                    localStorage.setItem('auth-storage', JSON.stringify({
                      state: {
                        token: data.token,
                        isAuthenticated: true
                      }
                    }));
                    // Reload the page
                    window.location.reload();
                  }
                } catch (error) {
                  console.error('Login test failed:', error);
                }
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Test Login (Admin)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = flattenedItems.findIndex(item => item.id === active.id);
      const newIndex = flattenedItems.findIndex(item => item.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(flattenedItems, oldIndex, newIndex);
        
        // Update sort_order for all items
        const orderUpdates = newItems.map((item, index) => ({
          id: item.id,
          sort_order: index + 1
        }));

        updateOrderMutation.mutate(orderUpdates);
      }
    }
  };

  // Flatten navigation items for table display
  const flattenedItems = useMemo(() => {
    const result: NavigationItemDisplay[] = [];
    
    const processItem = (item: NavigationItem, level: number) => {
        // Convert to display format with English title
        const displayItem: NavigationItemDisplay = {
          ...item,
          title: item.title.en || item.title.ar || item.key, // Use English title as primary
          level
        };
        result.push(displayItem);
      
      // Process children if they exist
      if (item.children && item.children.length > 0) {
        item.children.forEach(child => {
          processItem(child, level + 1);
        });
      }
    };
    
    // Process all top-level items (they should already be sorted by sort_order from the API)
    navigationItems.forEach(item => {
      processItem(item, 0);
    });

    return result;
  }, [navigationItems]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg">{t('loading', { ns: 'common' })}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('navigationManagement')}
        description={t('navigationManagementDescription')}
        showRefreshButton
        onRefresh={refetch}
        isRefreshing={isFetching}
      >
        <div className="flex items-center gap-3">
          <Badge variant="outline">
            {t('totalItems')}: {navigationItems.length}
          </Badge>
          <Badge variant="secondary">
            {t('activeItems')}: {navigationItems.filter(item => item.is_active).length}
          </Badge>
        </div>
      </PageHeader>

             <div className="p-6 bg-white rounded-lg border">
         <DndContext
           sensors={sensors}
           collisionDetection={closestCenter}
           onDragEnd={handleDragEnd}
         >
           <SortableContext
             items={flattenedItems.map(item => item.id)}
             strategy={verticalListSortingStrategy}
           >
             <Table>
                               <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">{t('select')}</TableHead>
                    <TableHead className="text-center">{t('navigationItem')}</TableHead>
                    <TableHead className="text-center">{t('permissionsLabel')}</TableHead>
                    <TableHead className="text-center">{t('order')}</TableHead>
                    <TableHead className="text-center">{t('status')}</TableHead>
                    <TableHead className="text-center">{t('type')}</TableHead>
                  </TableRow>
                </TableHeader>
               <TableBody>
                 {flattenedItems.map((item) => (
                   <SortableTableRow
                     key={item.id}
                     item={item}
                     onToggleActive={(id, is_active) => toggleActiveMutation.mutate({ id, is_active })}
                     onDelete={(item) => setItemToDelete(item as NavigationItem)}
                     can={can}
                     t={t}
                     toggleActiveMutation={toggleActiveMutation}
                   />
                 ))}
               </TableBody>
             </Table>
           </SortableContext>
         </DndContext>
       </div>

      {/* Delete Confirmation Dialog */}
      <PermissionWrapper 
        permission="navigation:delete" 
        tooltipText={t('noPermissionToDeleteNavigation')}
      >
        <DeleteConfirmDialog
          isOpen={!!itemToDelete}
          onOpenChange={(open) => !open && setItemToDelete(null)}
          onConfirm={() => {
            if (itemToDelete) {
              deleteMutation.mutate(itemToDelete.id);
            }
          }}
          itemName={itemToDelete?.title.en || itemToDelete?.title.ar || itemToDelete?.key}
          itemType="navigationItem"
          isPending={deleteMutation.isPending}
        />
      </PermissionWrapper>
    </div>
  );
};

export default NavigationManagementPage; 