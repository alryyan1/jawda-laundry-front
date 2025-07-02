// src/pages/admin/roles/RolesListPage.tsx
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

import type { PaginatedResponse } from '@/types';
import { getRolesPaginated, deleteRole } from '@/api/roleService';

import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, Edit3, Trash2, MoreHorizontal, Loader2, RefreshCw } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

// Define types since they're not exported from @/types
type Permission = {
    id: number;
    name: string;
    description?: string;
};

type Role = {
    id: number;
    name: string;
    description?: string;
    permissions?: Permission[];
    created_at: string;
    updated_at: string;
};

const RolesListPage: React.FC = () => {
    const { t, i18n } = useTranslation(['common', 'admin', 'permissions']);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const itemsPerPage = 10;

    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const { data: paginatedRoles, isLoading, error, isFetching, refetch } = useQuery<PaginatedResponse<Role>, Error>({
        queryKey: ['adminRoles', currentPage, itemsPerPage, debouncedSearchTerm],
        queryFn: () => getRolesPaginated(currentPage, itemsPerPage, debouncedSearchTerm),
    });
    const roles = paginatedRoles?.data || [];
    const totalPages = paginatedRoles?.meta?.last_page || 1;

    const deleteMutation = useMutation<void, Error, number | string>({
        mutationFn: (id) => deleteRole(id).then(() => {}),
        onSuccess: () => {
            toast.success(t('roleDeletedSuccess', { ns: 'admin', name: roleToDelete?.name || '' }));
            queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
            queryClient.invalidateQueries({ queryKey: ['allRolesForAssignment'] }); // If used elsewhere
            setRoleToDelete(null);
        },
        onError: (error) => {
            toast.error(error.message || t('roleDeleteFailed', { ns: 'admin' }));
            setRoleToDelete(null);
        }
    });

    const columns: ColumnDef<Role>[] = useMemo(() => [
        {
            accessorKey: "name",
            header: t('roleName', { ns: 'admin' }),
            cell: ({row}) => <div className="font-medium">{row.original.name}</div>
        },
        {
            accessorKey: "permissions",
            header: t('permissions', { ns: 'admin' }),
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-1 max-w-md">
                    {row.original.permissions?.slice(0, 5).map((perm: Permission) => ( // Show first 5 permissions
                        <Badge key={perm.id} variant="outline" className="text-xs">
                            {t(`${perm.name.replace(':', '.')}`, {ns:'permissions', defaultValue: perm.name.replace(/_/g, ' ')})}
                        </Badge>
                    ))}
                    {(row.original.permissions?.length || 0) > 5 && (
                        <Badge variant="outline" className="text-xs">+{ (row.original.permissions?.length || 0) - 5} {t('more', {ns:'common'})}</Badge>
                    )}
                    {(!row.original.permissions || row.original.permissions.length === 0) && 
                        <Badge variant="destructive" className="text-xs">{t('noPermissionsAssigned', {ns:'admin'})}</Badge>
                    }
                </div>
            ),
        },
        {
            accessorKey: "created_at",
            header: t('createdDate', { ns: 'admin'}),
            cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(i18n.language)
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="text-right rtl:text-left">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={i18n.dir() === 'rtl' ? 'start' : 'end'}>
                            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/admin/roles/${row.original.id}/edit`)}>
                                <Edit3 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />{t('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive" 
                                onClick={() => setRoleToDelete(row.original)} 
                                onSelect={(e) => e.preventDefault()}
                            >
                                <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />{t('delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ], [t, i18n.language, i18n.dir, navigate]);

    if (isLoading && !isFetching && !roles.length && !searchTerm) {
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
                title={t('manageRoles', { ns: 'admin' })}
                actionButton={{ label: t('newRole', { ns: 'admin' }), icon: PlusCircle, to: '/admin/roles/new' }}
                showRefreshButton 
                onRefresh={refetch} 
                isRefreshing={isFetching && isLoading}
            >
                <Input
                    placeholder={t('searchRolesPlaceholder', { ns: 'admin', defaultValue: 'Search by role name...' })}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 w-full sm:w-auto sm:max-w-xs"
                />
            </PageHeader>
            <DataTable
                columns={columns} 
                data={roles} 
                isLoading={isFetching}
                pageCount={totalPages} 
                currentPage={currentPage} 
                onPageChange={setCurrentPage}
            />
            <DeleteConfirmDialog
                isOpen={!!roleToDelete}
                onOpenChange={(open) => !open && setRoleToDelete(null)}
                onConfirm={() => { if (roleToDelete) deleteMutation.mutate(roleToDelete.id); }}
                itemName={roleToDelete?.name}
                itemType="roleLC"
                isPending={deleteMutation.isPending}
            />
        </div>
    );
};

export default RolesListPage;