import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { 
  PlusCircle,
  Edit3,
  Trash2,
  MoreHorizontal,
  GripVertical,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { getNavigationItems, deleteNavigationItem, updateNavigationItem } from '@/api/navigationService';
import type { NavigationItem } from '@/types/navigation.types';
import type { ColumnDef } from '@tanstack/react-table';
import { useAuth } from '@/features/auth/hooks/useAuth';

const NavigationManagementPage: React.FC = () => {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const { can } = useAuth();

  const [itemToDelete, setItemToDelete] = useState<NavigationItem | null>(null);

  // Fetch navigation items
  const { data: navigationItems = [], isLoading, refetch, isFetching } = useQuery({
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
      toast.error(error.message || t('navigationItemDeleteFailed'));
      setItemToDelete(null);
    }
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => 
      updateNavigationItem(id, { is_active }),
    onSuccess: () => {
      toast.success(t('navigationItemUpdated'));
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('navigationItemUpdateFailed'));
    }
  });

  // Flatten navigation items for table display
  const flattenedItems = useMemo(() => {
    const result: (NavigationItem & { level: number })[] = [];
    
    const processItem = (item: NavigationItem, level: number) => {
        result.push({ ...item, level });
      
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

  // Table columns
  const columns: ColumnDef<NavigationItem & { level: number }>[] = useMemo(() => [
    {
      accessorKey: "title",
      header: t('navigationItem'),
      cell: ({ row }) => {
        const item = row.original;
        const title = item.title[i18n.language as keyof typeof item.title] || item.title.en;
        
        return (
          <div className="flex items-center justify-center gap-2">
            {/* Indentation for sub-items */}
            <div style={{ marginLeft: `${item.level * 20}px` }} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
              
              {/* Icon placeholder */}
              {item.icon && (
                <div className="w-5 h-5 bg-muted rounded flex items-center justify-center">
                  <span className="text-xs">{item.icon.slice(0, 2)}</span>
                </div>
              )}
              
              <div>
                <div className="font-medium">{title}</div>
                <div className="text-xs text-muted-foreground">
                  Key: {item.key}
                  {item.route && ` • Route: ${item.route}`}
                </div>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "permissions",
      header: t('permissions'),
      cell: ({ row }) => (
        <div className="flex flex-wrap justify-center gap-1">
          {row.original.permissions?.map((permission, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {permission}
            </Badge>
          )) || <span className="text-muted-foreground text-sm">{t('noPermissions')}</span>}
        </div>
      )
    },
    {
      accessorKey: "sort_order",
      header: t('order'),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.sort_order}
        </Badge>
      )
    },
    {
      accessorKey: "is_active",
      header: t('status'),
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <Switch
            checked={row.original.is_active}
            onCheckedChange={(checked) => 
              toggleActiveMutation.mutate({ 
                id: row.original.id, 
                is_active: checked 
              })
            }
            disabled={toggleActiveMutation.isPending}
          />
          <span className="text-sm">
            {row.original.is_active ? t('active') : t('inactive')}
          </span>
        </div>
      )
    },
    {
      accessorKey: "is_default",
      header: t('type'),
      cell: ({ row }) => (
        <Badge variant={row.original.is_default ? "default" : "secondary"}>
          {row.original.is_default ? t('system') : t('custom')}
        </Badge>
      )
    },
    {
      id: "actions",
      header: t('actions'),
      cell: ({ row }) => (
        <div className="text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("openMenu")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
              
              {can('navigation:update') && (
                <DropdownMenuItem>
                  <Edit3 className="mr-2 h-4 w-4" />
                  {t("edit")}
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem
                onClick={() => 
                  toggleActiveMutation.mutate({ 
                    id: row.original.id, 
                    is_active: !row.original.is_active 
                  })
                }
              >
                {row.original.is_active ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    {t("disable")}
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    {t("enable")}
                  </>
                )}
              </DropdownMenuItem>
              
              {can('navigation:delete') && !row.original.is_default && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => setItemToDelete(row.original)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("delete")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [t, i18n.language, can, toggleActiveMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg">{t('loading', { ns: 'common' })}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('navigationManagement')}
        description={t('navigationManagementDescription')}
        actionButton={can('navigation:create') ? {
          label: t('addNavigationItem'),
          icon: PlusCircle,
          onClick: () => {
            // TODO: Open navigation item form modal
            toast.info(t('featureComingSoon'));
          }
        } : undefined}
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

      <DataTable
        columns={columns}
        data={flattenedItems}
        isLoading={isFetching}
      />

      {/* Delete Confirmation Dialog */}
      {can('navigation:delete') && (
        <DeleteConfirmDialog
          isOpen={!!itemToDelete}
          onOpenChange={(open) => !open && setItemToDelete(null)}
          onConfirm={() => {
            if (itemToDelete) {
              deleteMutation.mutate(itemToDelete.id);
            }
          }}
          itemName={itemToDelete?.title[i18n.language as keyof typeof itemToDelete.title] || itemToDelete?.title.en}
          itemType="navigationItem"
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default NavigationManagementPage; 