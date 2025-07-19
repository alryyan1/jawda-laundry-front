// src/pages/admin/users/UsersListPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { 
  PlusCircle, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Loader2,
  Settings,
  Navigation
} from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { UserFormModal } from '@/features/admin/users/components/UserFormModal';
import { UserNavigationPermissionsModal } from '@/features/admin/users/components/UserNavigationPermissionsModal';
import { getUsers, deleteUser } from '@/api/adminService';
import type { User, PaginatedResponse } from '@/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';

const UsersListPage: React.FC = () => {
    const { t, i18n } = useTranslation(['admin', 'common']);
    const { user: currentUser, can } = useAuth();
    const navigate = useNavigate();

    // Modal states
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isNavigationModalOpen, setIsNavigationModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [managingNavigationUser, setManagingNavigationUser] = useState<User | null>(null);
    const [itemToDelete, setItemToDelete] = useState<User | null>(null);

    // Pagination and search
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const itemsPerPage = 15;

    // Users query
    const queryKey = useMemo(() => ['users', currentPage, itemsPerPage, debouncedSearch], [currentPage, itemsPerPage, debouncedSearch]);
    const { data: paginatedData, isLoading, isFetching, refetch } = useQuery<PaginatedResponse<User>, Error>({
        queryKey,
        queryFn: () => getUsers(currentPage, itemsPerPage, debouncedSearch),
        placeholderData: keepPreviousData,
    });

    const users = paginatedData?.data || [];
    const totalPages = paginatedData?.meta?.last_page || 1;

    // Delete user mutation
    const deleteMutation = useMutation<void, Error, number>({
        mutationFn: (id) => deleteUser(id).then(() => {}),
        onSuccess: () => {
            toast.success(t('userDeletedSuccess'));
            refetch();
            setItemToDelete(null);
        },
        onError: (error) => { 
            toast.error(error.message || t('userDeleteFailed')); 
            setItemToDelete(null); 
        }
    });

    // Reset page when search term changes
    useEffect(() => { 
        if (currentPage !== 1) setCurrentPage(1); 
    }, [debouncedSearch]);

    // Modal handlers
    const handleOpenAddModal = () => { 
        setEditingUser(null); 
        setIsUserModalOpen(true); 
    };

    const handleOpenEditModal = (user: User) => { 
        setEditingUser(user); 
        setIsUserModalOpen(true); 
    };

    const handleOpenNavigationModal = (user: User) => {
        setManagingNavigationUser(user);
        setIsNavigationModalOpen(true);
    };

    const handleUserModalClose = () => {
        setIsUserModalOpen(false);
        setEditingUser(null);
        refetch(); // Refresh data when modal closes
    };

    const handleNavigationModalClose = () => {
        setIsNavigationModalOpen(false);
        setManagingNavigationUser(null);
    };

    // Table columns
    const columns: ColumnDef<User>[] = useMemo(() => [
        {
            accessorKey: "name",
            header: t('name'),
            cell: ({ row }) => (
                <div className="flex flex-col text-center">
                    <div className="font-medium">{row.original.name}</div>
                    <div className="text-sm text-muted-foreground">{row.original.email}</div>
                </div>
            )
        },
        {
            accessorKey: "roles",
            header: t('roles'),
            cell: ({ row }) => (
                <div className="flex flex-wrap justify-center gap-1">
                    {row.original.roles.map((role, index) => {
                        // Handle both Role objects and string role names
                        const roleName = typeof role === 'string' ? role : role.name;
                        const roleId = typeof role === 'string' ? index : role.id;
                        
                        return (
                            <Badge key={`${roleId}-${index}`} variant="secondary" className="capitalize">
                                {roleName}
                            </Badge>
                        );
                    })}
                </div>
            )
        },
        {
            accessorKey: "created_at",
            header: t('dateCreated'),
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground text-center">
                    {new Date(row.original.created_at || '').toLocaleDateString(i18n.language)}
                </div>
            )
        },
        {
            id: "actions",
            header: t('actions'),
            cell: ({ row }) => (
                <div className="text-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0" 
                                disabled={row.original.id === currentUser?.id}
                            >
                                <span className="sr-only">{t("openMenu")}</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={i18n.dir() === 'rtl' ? 'start' : 'end'}>
                            <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                            
                            {can('user:update') && (
                                <DropdownMenuItem onClick={() => handleOpenEditModal(row.original)}>
                                    <Edit3 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                                    {t("edit")}
                                </DropdownMenuItem>
                            )}
                            
                            {can('user-navigation:manage') && (
                                <DropdownMenuItem onClick={() => handleOpenNavigationModal(row.original)}>
                                    <Navigation className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                                    {t("manageNavigation")}
                                </DropdownMenuItem>
                            )}
                            
                            {can('user:delete') && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        className="text-destructive focus:text-destructive" 
                                        onClick={() => setItemToDelete(row.original)}
                                        onSelect={(e) => e.preventDefault()}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                                        {t("delete")}
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ], [t, i18n.dir, i18n.language, currentUser?.id, can]);

    // Loading state
    if (isLoading && !isFetching && !users.length && !searchTerm) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-lg">{t('loading', { ns: 'common' })}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
            <PageHeader
                title={t('usersTitle')}
                description={t('usersDescription')}
                actionButton={can('user:create') ? { 
                    label: t('newUserBtn'), 
                    icon: PlusCircle, 
                    onClick: handleOpenAddModal 
                } : undefined}
                showRefreshButton 
                onRefresh={refetch} 
                isRefreshing={isFetching}
            >
                <div className="flex items-center gap-3">
                    <Input 
                        placeholder={t('searchUsers')} 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="h-9 w-full sm:w-auto sm:max-w-xs"
                    />
                    
                    {can('navigation:view') && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/admin/navigation')}
                            className="h-9"
                        >
                            <Settings className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                            {t('manageNavigation')}
                        </Button>
                    )}
                </div>
            </PageHeader>

            <DataTable
                columns={columns}
                data={users}
                isLoading={isFetching}
                pageCount={totalPages}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
            />
            
            {/* User Form Modal */}
            {(can('user:create') || can('user:update')) && (
                <UserFormModal 
                    isOpen={isUserModalOpen} 
                    onOpenChange={handleUserModalClose} 
                    editingUser={editingUser} 
                />
            )}

            {/* User Navigation Permissions Modal */}
            {can('user-navigation:manage') && (
                <UserNavigationPermissionsModal
                    isOpen={isNavigationModalOpen}
                    onOpenChange={handleNavigationModalClose}
                    user={managingNavigationUser}
                />
            )}
            
            {/* Delete Confirmation Dialog */}
            {can('user:delete') && (
                <DeleteConfirmDialog 
                    isOpen={!!itemToDelete} 
                    onOpenChange={(open) => !open && setItemToDelete(null)} 
                    onConfirm={() => { if (itemToDelete) deleteMutation.mutate(itemToDelete.id); }} 
                    itemName={itemToDelete?.name} 
                    itemType="userLC" 
                    isPending={deleteMutation.isPending} 
                />
            )}
        </div>
    );
};

export default UsersListPage;