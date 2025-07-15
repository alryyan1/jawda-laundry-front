import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, MapPin, Users, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { restaurantTableService } from '@/api/restaurantTableService';
import { RestaurantTable, RestaurantTableFilters } from '@/types/restaurantTable.types';
import { RestaurantTableFormModal } from '@/features/admin/components/RestaurantTableFormModal';

const RestaurantTablesListPage: React.FC = () => {
  const { t } = useTranslation(['common', 'admin']);
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<RestaurantTableFilters>({});
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [deletingTable, setDeletingTable] = useState<RestaurantTable | null>(null);

  // Fetch tables
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['restaurant-tables', filters],
    queryFn: () => restaurantTableService.getAll(filters),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => restaurantTableService.delete(id),
    onSuccess: () => {
      toast.success(t('tableDeletedSuccess', { ns: 'admin' }));
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      setDeletingTable(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t('tableDeleteFailed', { ns: 'admin' }));
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      restaurantTableService.updateStatus(id, status as any),
    onSuccess: () => {
      toast.success(t('tableStatusUpdated', { ns: 'admin' }));
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('tableStatusUpdateFailed', { ns: 'admin' }));
    },
  });

  const handleEdit = (table: RestaurantTable) => {
    setEditingTable(table);
    setIsFormModalOpen(true);
  };

  const handleDelete = (table: RestaurantTable) => {
    setDeletingTable(table);
  };

  const handleStatusChange = (table: RestaurantTable, newStatus: string) => {
    updateStatusMutation.mutate({ id: table.id, status: newStatus });
  };

  const handleFormSubmit = () => {
    setIsFormModalOpen(false);
    setEditingTable(null);
    queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      accessorKey: 'number',
      header: t('tableNumber', { ns: 'admin' }),
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.number}</span>
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: t('tableName', { ns: 'admin' }),
    },
    {
      accessorKey: 'capacity',
      header: t('capacity', { ns: 'admin' }),
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.capacity}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('status', { ns: 'common' }),
      cell: ({ row }: any) => (
        <Badge className={getStatusColor(row.original.status)}>
          {t(`tableStatus_${row.original.status}`, { ns: 'admin' })}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_active',
      header: t('active', { ns: 'common' }),
      cell: ({ row }: any) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? t('yes', { ns: 'common' }) : t('no', { ns: 'common' })}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: t('actions', { ns: 'common' }),
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('restaurantTables', { ns: 'admin' })}
        description={t('manageRestaurantTables', { ns: 'admin' })}
      >
        <Button onClick={() => setIsFormModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addTable', { ns: 'admin' })}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('tables', { ns: 'admin' })}</CardTitle>
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchTables', { ns: 'admin' })}
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setFilters({ ...filters, available_only: !filters.available_only })}
            >
              {filters.available_only ? t('showAll', { ns: 'common' }) : t('availableOnly', { ns: 'admin' })}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={tables}
            isLoading={isLoading}
            searchKey="name"
          />
        </CardContent>
      </Card>

      {/* Form Modal */}
      <RestaurantTableFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTable(null);
        }}
        onSubmit={handleFormSubmit}
        table={editingTable}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deletingTable}
        onClose={() => setDeletingTable(null)}
        onConfirm={() => {
          if (deletingTable) {
            deleteMutation.mutate(deletingTable.id);
          }
        }}
        title={t('deleteTable', { ns: 'admin' })}
        message={t('deleteTableConfirm', { ns: 'admin', name: deletingTable?.name })}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default RestaurantTablesListPage; 