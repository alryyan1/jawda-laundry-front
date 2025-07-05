// src/pages/admin/users/UsersListPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { UserFormModal } from '@/features/admin/users/components/UserFormModal';
import { getUsers, deleteUser } from '@/api/adminService';
import type { User, PaginatedResponse } from '@/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import type { ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { PlusCircle, MoreHorizontal, Edit3, Trash2, Loader2 } from 'lucide-react';

const UsersListPage: React.FC = () => {
    const { t, i18n } = useTranslation(['admin', 'common']);
    const { user: currentUser, can } = useAuth();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [itemToDelete, setItemToDelete] = useState<User | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const itemsPerPage = 15;

    const queryKey = useMemo(() => ['users', currentPage, itemsPerPage, debouncedSearch], [currentPage, itemsPerPage, debouncedSearch]);
    const { data: paginatedData, isLoading, isFetching, refetch } = useQuery<PaginatedResponse<User>, Error>({
        queryKey,
        queryFn: () => getUsers(currentPage, itemsPerPage, debouncedSearch),
        placeholderData: keepPreviousData,
    });

    const users = paginatedData?.data || [];
    const totalPages = paginatedData?.meta?.last_page || 1;

    const deleteMutation = useMutation<void, Error, number>({
        mutationFn: (id) => deleteUser(id).then(() => {}),
        onSuccess: () => {
            toast.success(t('userDeletedSuccess'));
            refetch();
            setItemToDelete(null);
        },
        onError: (error) => { toast.error(error.message || t('userDeleteFailed')); setItemToDelete(null); }
    });

    useEffect(() => { if (currentPage !== 1) setCurrentPage(1); }, [debouncedSearch]);

    const handleOpenAddModal = () => { setEditingUser(null); setIsModalOpen(true); };
    const handleOpenEditModal = (user: User) => { setEditingUser(user); setIsModalOpen(true); };

    const columns: ColumnDef<User>[] = useMemo(() => [
        {
            accessorKey: "name",
            header: t('name'),
            cell: ({ row }) => <div className="font-medium">{row.original.name}</div>
        },
        {
            accessorKey: "email",
            header: t('email'),
            cell: ({ row }) => <div className="text-muted-foreground">{row.original.email}</div>
        },
        {
            accessorKey: "roles",
            header: t('roles'),
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-1">
                    {row.original.roles.map((role, index) => (
                        <Badge key={`${role.id}-${index}`} variant="secondary" className="capitalize">
                            {role.name}
                        </Badge>
                    ))}
                </div>
            )
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="text-right rtl:text-left">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={row.original.id === currentUser?.id}>
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
    ], [t, i18n.dir, currentUser?.id, can, handleOpenEditModal]);

    if (isLoading && !isFetching && !users.length && !searchTerm) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-lg">{t('loading', { ns: 'common' })}</p>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title={t('usersTitle')}
                description={t('usersDescription')}
                actionButton={can('user:create') ? { label: t('newUserBtn'), icon: PlusCircle, onClick: handleOpenAddModal } : undefined}
                showRefreshButton 
                onRefresh={refetch} 
                isRefreshing={isFetching}
            >
                <Input 
                    placeholder={t('searchUsers')} 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="h-9 w-full sm:w-auto sm:max-w-xs"
                />
            </PageHeader>

            <DataTable
                columns={columns}
                data={users}
                isLoading={isFetching}
                pageCount={totalPages}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
            />
            
            {(can('user:create') || can('user:update')) && (
                <UserFormModal 
                    isOpen={isModalOpen} 
                    onOpenChange={setIsModalOpen} 
                    editingUser={editingUser} 
                />
            )}
            
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