// src/pages/admin/users/UsersListPage.tsx
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // For navigating to edit/new page
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

import type { User, PaginatedResponse } from '@/types';
import { getUsers, deleteUserAsAdmin } from '@/api/userService';
import { getAllRoles } from '@/api/roleService'; // To filter by role

import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, Edit3, Trash2, MoreHorizontal, Loader2, RefreshCw } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

// Define Role type since it's not exported from @/types
type Role = {
    id: number;
    name: string;
    description?: string;
};

interface UserWithRole extends Omit<User, 'role'> {
    role: Role[];
}

const UsersListPage: React.FC = () => {
    const { t, i18n } = useTranslation(['common', 'auth', 'admin']); // 'admin' namespace for admin specific terms
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState(''); // Role name for filtering
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const itemsPerPage = 10;

    const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);

    const { data: paginatedUsers, isLoading, error, isFetching, refetch } = useQuery<PaginatedResponse<UserWithRole>, Error>({
        queryKey: ['adminUsers', currentPage, itemsPerPage, debouncedSearchTerm, roleFilter],
        queryFn: async () => {
            const response = await getUsers(currentPage, itemsPerPage, debouncedSearchTerm, roleFilter);
            return response as unknown as PaginatedResponse<UserWithRole>;
        },
    });
    const users = paginatedUsers?.data || [];
    const totalPages = paginatedUsers?.meta?.last_page || 1;

    const { data: rolesForFilter = [] } = useQuery<Role[], Error>({
        queryKey: ['allRolesForFilter'],
        queryFn: getAllRoles,
    });


    const deleteMutation = useMutation<void, Error, number | string>({
        mutationFn: (id) => deleteUserAsAdmin(id).then(() => {}),
        onSuccess: () => {
            toast.success(t('userDeletedSuccess', { ns: 'admin', name: userToDelete?.name || '' }));
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            setUserToDelete(null);
        },
        onError: (error) => {
            toast.error(error.message || t('userDeleteFailed', { ns: 'admin' }));
            setUserToDelete(null);
        }
    });

    const columns: ColumnDef<UserWithRole>[] = useMemo(() => [
        { accessorKey: "name", header: t('name', { ns: 'common' }) },
        { accessorKey: "email", header: t('email', { ns: 'common' }) },
        {
            accessorKey: "role",
            header: t('roles', { ns: 'admin' }),
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-1">
                    {Array.isArray(row.original.role) && row.original.role.map((role: Role) => (
                        <Badge key={role.id} variant="secondary">{role.name}</Badge>
                    ))}
                    {(!Array.isArray(row.original.role) || row.original.role.length === 0) && 
                        <Badge variant="outline">{t('noRolesAssigned', {ns:'admin'})}</Badge>
                    }
                </div>
            ),
        },
        {
            accessorKey: "created_at",
            header: t('createdDate', { ns: 'admin', defaultValue: "Created Date"}),
            cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(i18n.language)
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="text-right rtl:text-left">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align={i18n.dir() === 'rtl' ? 'start' : 'end'}>
                            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/admin/users/${row.original.id}/edit`)}>
                                <Edit3 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />{t('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setUserToDelete(row.original)} onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />{t('delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ], [t, i18n.language, i18n.dir, navigate]);

    if (isLoading && !isFetching && !users.length && !searchTerm && !roleFilter) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-lg">{t('loading', { ns: 'common' })}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-destructive text-lg">{t('errorLoading', { ns: 'common' })}</p>
                <p className="text-muted-foreground">{error.message}</p>
                <Button onClick={() => refetch()} className="mt-4">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('retry', { ns: 'common' })}
                </Button>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title={t('manageUsers', { ns: 'admin' })}
                actionButton={{ label: t('newUser', { ns: 'admin' }), icon: PlusCircle, to: '/admin/users/new' }}
                showRefreshButton onRefresh={refetch} isRefreshing={isFetching && isLoading}
            >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full mt-4 sm:mt-0">
                    <Input
                        placeholder={t('searchUsersPlaceholder', { ns: 'admin', defaultValue: 'Search by name or email...' })}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 w-full sm:w-auto sm:flex-grow lg:w-[300px]"
                    />
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="h-9 w-full sm:w-auto sm:min-w-[180px]">
                            <SelectValue placeholder={t('filterByRole', { ns: 'admin' })} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=" ">{t('allRoles', { ns: 'admin' })}</SelectItem>
                            {rolesForFilter.map(role => (
                                <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </PageHeader>
            <DataTable
                columns={columns} data={users} isLoading={isFetching}
                pageCount={totalPages} currentPage={currentPage} onPageChange={setCurrentPage}
            />
            <DeleteConfirmDialog
                isOpen={!!userToDelete}
                onOpenChange={(open) => !open && setUserToDelete(null)}
                onConfirm={() => { if (userToDelete) deleteMutation.mutate(userToDelete.id); }}
                itemName={userToDelete?.name}
                itemType="userLC" // common.json -> "userLC": "user"
                isPending={deleteMutation.isPending}
            />
        </div>
    );
};
export default UsersListPage;