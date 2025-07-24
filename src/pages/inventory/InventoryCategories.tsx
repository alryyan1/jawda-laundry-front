import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInventoryCategories, createInventoryCategory, updateInventoryCategory, deleteInventoryCategory } from '@/api/inventoryService';
import { toast } from 'sonner';

interface InventoryCategory {
  id: number;
  name: string;
  description?: string;
  color?: string;
  item_count: number;
  total_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const InventoryCategories: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<InventoryCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  // Fetch categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: getInventoryCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const categories = categoriesData?.data || [];

  const columns = [
    {
      accessorKey: 'name',
      header: t('inventory.categoryName'),
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: row.original.color }}
          />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: t('common.description'),
      cell: ({ row }: any) => row.original.description || '-',
    },
    {
      accessorKey: 'item_count',
      header: t('inventory.items'),
      cell: ({ row }: any) => (
        <Badge variant="secondary">{row.original.item_count}</Badge>
      ),
    },
    {
      accessorKey: 'total_value',
      header: t('inventory.totalValue'),
      cell: ({ row }: any) => `$${row.original.total_value.toFixed(2)}`,
    },
    {
      accessorKey: 'is_active',
      header: t('common.status'),
      cell: ({ row }: any) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original)}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleEdit = (category: InventoryCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (category: InventoryCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: createInventoryCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      toast.success(t('common.createSuccess'));
      handleClose();
    },
    onError: (error) => {
      console.error('Create category failed:', error);
      toast.error(t('common.createFailed'));
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateInventoryCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      toast.success(t('common.updateSuccess'));
      handleClose();
    },
    onError: (error) => {
      console.error('Update category failed:', error);
      toast.error(t('common.updateFailed'));
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: deleteInventoryCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      toast.success(t('common.deleteSuccess'));
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
    onError: (error) => {
      console.error('Delete category failed:', error);
      toast.error(t('common.deleteFailed'));
    },
  });

  const handleSave = () => {
    if (editingCategory) {
      // Update existing category
      updateMutation.mutate({
        id: editingCategory.id,
        data: formData,
      });
    } else {
      // Create new category
      createMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', color: '#3B82F6' });
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id);
    }
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', color: '#3B82F6' });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('inventory.categories')}</h1>
          <p className="text-muted-foreground">
            {t('inventory.categoriesDescription')}
          </p>
        </div>
        <Button onClick={handleNewCategory}>
          <PlusIcon className="mr-2 h-4 w-4" />
          {t('inventory.addCategory')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={categories}
            loading={isLoading}
            searchable={true}
            pagination={true}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t('inventory.editCategory') : t('inventory.addCategory')}
            </DialogTitle>
            <DialogDescription>
              {t('inventory.categoryDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('inventory.categoryName')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('inventory.categoryNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('inventory.categoryDescriptionPlaceholder')}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">{t('inventory.color')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.name.trim() || createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? t('common.loading') : 
                editingCategory ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title={t('inventory.deleteCategory')}
        description={t('inventory.deleteCategoryDescription', { 
          name: categoryToDelete?.name 
        })}
      />
    </div>
  );
};

export default InventoryCategories; 