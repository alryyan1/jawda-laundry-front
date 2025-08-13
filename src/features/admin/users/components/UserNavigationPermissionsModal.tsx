import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, X, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-4">
          <h2 className="text-lg font-semibold">
            {t('manageNavigationPermissions')} - {user.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('manageNavigationPermissionsDescription')}
          </p>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
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

          {/* Permissions Table - Scrollable Area */}
          <div className="flex-1 min-h-0 border rounded-md overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">{t('loading')}</span>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">{t('navigationItem')}</TableHead>
                      <TableHead className="w-1/6">{t('roleBasedAccess')}</TableHead>
                      <TableHead className="w-1/4">{t('explicitPermission')}</TableHead>
                      <TableHead className="w-1/6">{t('finalAccess')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((permission) => {
                      const finalAccess = permission.is_granted !== null 
                        ? permission.is_granted 
                        : permission.can_access_by_role;

                      return (
                        <TableRow key={permission.navigation_item_id}>
                          <TableCell className="w-1/3">
                            <div className="flex items-center gap-2">
                              {permission.navigation_item.icon && (
                                <span className="text-muted-foreground">
                                  {/* Icon placeholder */}
                                </span>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">
                                  {permission.navigation_item.title[i18n.language as keyof typeof permission.navigation_item.title] || permission.navigation_item.title.en}
                                </div>
                                {permission.navigation_item.route && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {permission.navigation_item.route}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell className="w-1/6">
                            <div className="flex items-center gap-2">
                              {permission.can_access_by_role ? (
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <X className="h-4 w-4 text-red-600 flex-shrink-0" />
                              )}
                              <span className="text-sm font-medium">
                                {permission.can_access_by_role ? t('allowed') : t('denied')}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell className="w-1/4">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={permission.is_granted === true}
                                onCheckedChange={(checked) => 
                                  handlePermissionToggle(permission.navigation_item_id, checked === true)
                                }
                                disabled={updatePermissionsMutation.isPending}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary flex-shrink-0"
                              />
                              <div className="flex flex-col min-w-0">
                                {permission.is_granted === null ? (
                                  <span className="text-xs text-muted-foreground">
                                    {t('useRoleBased')}
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium">
                                    {permission.is_granted ? t('granted') : t('denied')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell className="w-1/6">
                            <div className="flex items-center gap-2">
                              <Badge variant={finalAccess ? 'default' : 'secondary'} className="flex-shrink-0">
                                {finalAccess ? t('allowed') : t('denied')}
                              </Badge>
                              {permission.is_granted !== null && (
                                <span className="text-xs text-muted-foreground">
                                  ({t('explicitIndicator')})
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t flex-shrink-0">
            <div className="text-sm text-muted-foreground">
              {hasChanges && (
                <div className="flex items-center gap-2 text-orange-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">{t('unsavedChanges')}</span>
                </div>
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