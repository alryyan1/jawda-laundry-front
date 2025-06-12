// src/pages/services/product-types/ProductTypesListPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import type { ProductType, ProductCategory, PaginatedResponse } from '@/types';
import {
    getProductTypesPaginated,
    createProductType,
    updateProductType,
    deleteProductType,
} from '@/api/productTypeService';
import type { ProductTypeFormData } from '@/api/productTypeService';
import { getProductCategories } from '@/api/productCategoryService';

import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit3, Trash2, Loader2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const measurementUnits = ['item', 'kg', 'sq_meter', 'set', 'piece']; // Example units

const productTypeSchema = z.object({
    name: z.string().nonempty({ message: "validation.nameRequired" }),
    product_category_id: z.string().min(1, { message: "validation.categoryRequired" }), // String because select value
    description: z.string().optional(),
    base_measurement_unit: z.string().optional(),
});

type ProductTypeFormValues = z.infer<typeof productTypeSchema>;


const ProductTypesListPage: React.FC = () => {
    const { t, i18n } = useTranslation(['common', 'services', 'validation']);
    const queryClient = useQueryClient();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingProductType, setEditingProductType] = useState<ProductType | null>(null);
    const [itemToDelete, setItemToDelete] = useState<ProductType | null>(null);
    const [currentPage, setCurrentPage] = useState(1); // For paginated list
    const itemsPerPage = 10;

    const { data: paginatedProductTypes, isLoading, isFetching, refetch } = useQuery<PaginatedResponse<ProductType>, Error>({
        queryKey: ['productTypes', currentPage, itemsPerPage],
        queryFn: () => getProductTypesPaginated(currentPage, itemsPerPage),
        placeholderData: (previousData) => previousData,
    });
    const productTypes = paginatedProductTypes?.data || [];
    const totalPages = paginatedProductTypes?.meta?.last_page || 1;

    const { data: categories = [] } = useQuery<ProductCategory[], Error>({
        queryKey: ['productCategoriesForSelect'],
        queryFn: getProductCategories,
    });

    const { control, register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProductTypeFormValues>({
        resolver: zodResolver(productTypeSchema),
    });

    const formMutation = useMutation<ProductType, Error, { id?: number; data: ProductTypeFormValues }>({
        mutationFn: ({ id, data }) => {
            const payload: ProductTypeFormData = {
                ...data,
                product_category_id: parseInt(data.product_category_id, 10)
            };
            return id ? updateProductType(id, payload) : createProductType(payload);
        },
        onSuccess: (data, variables) => {
            toast.success(variables.id ? t('productTypeUpdatedSuccess', { ns: 'services', name: data.name }) : t('productTypeCreatedSuccess', { ns: 'services', name: data.name }));
            queryClient.invalidateQueries({ queryKey: ['productTypes'] });
            setIsFormModalOpen(false);
            setEditingProductType(null);
            reset();
        },
        onError: (error, variables) => {
            toast.error(error.message || (variables.id ? t('productTypeUpdateFailed', { ns: 'services' }) : t('productTypeCreationFailed', { ns: 'services' })));
        }
    });

     const deleteMutation = useMutation<void, Error, number>({
        mutationFn: (id) => deleteProductType(id).then(() => {}), // Adapt if deleteProductType returns more
        onSuccess: () => {
            toast.success(t('productTypeDeletedSuccess', { ns: 'services', name: itemToDelete?.name || '' }));
            queryClient.invalidateQueries({ queryKey: ['productTypes'] });
            setItemToDelete(null);
        },
        onError: (error) => {
            toast.error(error.message || t('productTypeDeleteFailed', { ns: 'services' }));
        }
    });


    const handleOpenAddModal = () => {
        reset({ name: '', product_category_id: '', description: '', base_measurement_unit: '' });
        setEditingProductType(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (pt: ProductType) => {
        setEditingProductType(pt);
        setValue('name', pt.name);
        setValue('product_category_id', pt.product_category_id.toString());
        setValue('description', pt.description || '');
        setValue('base_measurement_unit', pt.base_measurement_unit || '');
        setIsFormModalOpen(true);
    };

    const onSubmit = (formData: ProductTypeFormValues) => {
        formMutation.mutate({ id: editingProductType?.id, data: formData });
    };

    const columns: ColumnDef<ProductType>[] = useMemo(() => [
        { accessorKey: "name", header: t('name', { ns: 'common' }) },
        {
            accessorKey: "category.name", // Assuming category is eager loaded
            header: t('category', { ns: 'services' }),
            cell: ({ row }) => row.original.category?.name || t('uncategorized', {ns:'services'}),
        },
        { accessorKey: "base_measurement_unit", header: t('unit', {ns:'services'}), cell: ({row}) => row.original.base_measurement_unit || '-' },
        {
            id: "actions",
            header: () => <div className="text-right rtl:text-left">{t('actions', { ns: 'common' })}</div>,
             cell: ({ row }) => (
                <div className="text-right rtl:text-left">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"> <MoreHorizontal className="h-4 w-4" /> </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={i18n.dir() === 'rtl' ? 'start' : 'end'}>
                            <DropdownMenuItem onClick={() => handleOpenEditModal(row.original)}>
                                <Edit3 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />{t('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setItemToDelete(row.original)}>
                                <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />{t('delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ], [t, i18n.dir, handleOpenEditModal, setItemToDelete]);

    return (
        <div>
            <PageHeader
                title={t('productTypesTitle', { ns: 'services' })}
                description={t('productTypesDescription', { ns: 'services' })}
                actionButton={{ label: t('newProductTypeBtn', { ns: 'services' }), icon: PlusCircle, onClick: handleOpenAddModal }}
                showRefreshButton onRefresh={refetch} isRefreshing={isFetching && !isLoading}
            />
            <DataTable
                columns={columns} data={productTypes} isLoading={isLoading}
                pageCount={totalPages} currentPage={currentPage} onPageChange={setCurrentPage}
            />
            <Dialog open={isFormModalOpen} onOpenChange={(isOpen) => { setIsFormModalOpen(isOpen); if (!isOpen) setEditingProductType(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingProductType ? t('editProductTypeTitle', {ns:'services'}) : t('newProductTypeTitle', { ns: 'services' })}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                        <div>
                            <Label htmlFor="name">{t('name', { ns: 'common' })} <span className="text-destructive">*</span></Label>
                            <Input id="name" {...register('name')} />
                            {errors.name && <p className="text-sm text-destructive">{t(errors.name.message as string)}</p>}
                        </div>
                        <div>
                            <Label htmlFor="product_category_id">{t('category', { ns: 'services' })} <span className="text-destructive">*</span></Label>
                            <Controller
                                name="product_category_id"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue placeholder={t('selectCategory', {ns:'services'})} /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.product_category_id && <p className="text-sm text-destructive">{t(errors.product_category_id.message as string)}</p>}
                        </div>
                        <div>
                            <Label htmlFor="base_measurement_unit">{t('baseUnitOptional', {ns:'services', defaultValue:'Base Measurement Unit (Optional)'})}</Label>
                             <Controller
                                name="base_measurement_unit"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue placeholder={t('selectUnitOptional', {ns:'services', defaultValue: 'Select unit (e.g., item, kg)...'})} /></SelectTrigger>
                                        <SelectContent>
                                            {measurementUnits.map(unit => <SelectItem key={unit} value={unit}>{t(`units.${unit}`, {ns:'services', defaultValue: unit})}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">{t('descriptionOptional', { ns: 'common' })}</Label>
                            <Textarea id="description" {...register('description')} />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline" disabled={formMutation.isPending}>{t('cancel')}</Button></DialogClose>
                            <Button type="submit" disabled={formMutation.isPending}>
                                {formMutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                                {editingProductType ? t('saveChanges', {ns:'common'}) : t('create', { ns: 'common' })}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <DeleteConfirmDialog
                isOpen={!!itemToDelete}
                onOpenChange={(open) => !open && setItemToDelete(null)}
                onConfirm={() => { if (itemToDelete) deleteMutation.mutate(itemToDelete.id); }}
                itemName={itemToDelete?.name}
                itemType="productTypeLC" // from services.json
                isPending={deleteMutation.isPending}
            />
        </div>
    );
};
export default ProductTypesListPage;