import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, X, Loader2, Navigation } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getUserNavigationPermissions, updateUserNavigationPermissions } from '@/api/navigationService';
import type { User } from '@/types';
import type { UserNavigationPermission, UserNavigationPermissionUpdate } from '@/types/navigation.types';

interface UserNavigationPermissionsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export const UserNavigationPermissionsModal: React.FC<UserNavigationPermissionsModalProps> = ({
  isOpen,
  onOpenChange,
  user
}) => {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const [permissions, setPermissions] = useState<UserNavigationPermission[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch user navigation permissions
  const { data: userPermissions, isLoading, refetch } = useQuery({
    queryKey: ['user-navigation-permissions', user?.id],
    queryFn: () => user ? getUserNavigationPermissions(user.id) : Promise.resolve([]),
    enabled: !!user && isOpen,
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: (updates: UserNavigationPermissionUpdate[]) => {
      if (!user) throw new Error('No user selected');
      return updateUserNavigationPermissions(user.id, updates);
    },
    onSuccess: () => {
      toast.success(t('navigationPermissionsUpdated'));
      setHasChanges(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('navigationPermissionsUpdateFailed'));
    }
  });

  // Initialize permissions when data loads
  useEffect(() => {
    if (userPermissions) {
      setPermissions(userPermissions);
      setHasChanges(false);
    }
  }, [userPermissions]);

  // Handle permission toggle
  const handlePermissionToggle = (navigationItemId: number, isGranted: boolean) => {
    setPermissions(prev => 
      prev.map(permission => 
        permission.navigation_item_id === navigationItemId 
          ? { ...permission, is_granted: isGranted }
          : permission
      )
    );
    setHasChanges(true);
  };

  // Handle save permissions
  const handleSave = () => {
    const updates: UserNavigationPermissionUpdate[] = permissions
      .filter(permission => permission.is_granted !== null)
      .map(permission => ({
        navigation_item_id: permission.navigation_item_id,
        is_granted: permission.is_granted!
      }));

    updatePermissionsMutation.mutate(updates);
  };

  // Handle reset to role-based permissions
  const handleReset = () => {
    setPermissions(prev => 
      prev.map(permission => ({ 
        ...permission, 
        is_granted: null 
      }))
    );
    setHasChanges(true);
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm(t('unsavedChangesWarning'))) {
        setHasChanges(false);
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            {t('manageNavigationPermissions')} - {user.name}
          </DialogTitle>
          <DialogDescription>
            {t('manageNavigationPermissionsDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {t('totalNavigationItems')}: {permissions.length}
              </Badge>
              <Badge variant="secondary">
                {t('explicitPermissions')}: {permissions.filter(p => p.is_granted !== null).length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={updatePermissionsMutation.isPending}
              >
                {t('resetToRoleBased')}
              </Button>
            </div>
          </div>

          {/* Permissions Table */}
          <ScrollArea className="h-[400px] border rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">{t('loading')}</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('navigationItem')}</TableHead>
                    <TableHead>{t('roleBasedAccess')}</TableHead>
                    <TableHead>{t('explicitPermission')}</TableHead>
                    <TableHead>{t('finalAccess')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => {
                    const finalAccess = permission.is_granted !== null 
                      ? permission.is_granted 
                      : permission.can_access_by_role;

                    return (
                      <TableRow key={permission.navigation_item_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {permission.navigation_item.icon && (
                              <span className="text-muted-foreground">
                                {/* Icon placeholder */}
                              </span>
                            )}
                            <div>
                              <div className="font-medium">
                                {permission.navigation_item.title[i18n.language as keyof typeof permission.navigation_item.title] || permission.navigation_item.title.en}
                              </div>
                              {permission.navigation_item.route && (
                                <div className="text-xs text-muted-foreground">
                                  {permission.navigation_item.route}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {permission.can_access_by_role ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm">
                              {permission.can_access_by_role ? t('allowed') : t('denied')}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={permission.is_granted === true}
                              onCheckedChange={(checked) => 
                                handlePermissionToggle(permission.navigation_item_id, checked)
                              }
                              disabled={updatePermissionsMutation.isPending}
                            />
                            {permission.is_granted === null ? (
                              <span className="text-xs text-muted-foreground">
                                {t('useRoleBased')}
                              </span>
                            ) : (
                              <span className="text-xs">
                                {permission.is_granted ? t('granted') : t('denied')}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant={finalAccess ? 'default' : 'secondary'}>
                            {finalAccess ? t('allowed') : t('denied')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ScrollArea>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {hasChanges && (
                <span className="text-orange-600">{t('unsavedChanges')}</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={updatePermissionsMutation.isPending}
              >
                {t('cancel')}
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updatePermissionsMutation.isPending}
              >
                {updatePermissionsMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('saveChanges')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 