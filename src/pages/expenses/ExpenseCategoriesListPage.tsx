import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

import { PageHeader } from '@/components/shared/PageHeader';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { ExpenseCategoryFormModal } from '@/features/expenses/components/ExpenseCategoryFormModal';
import { getExpenseCategories, deleteExpenseCategory } from '@/api/expenseCategoryService';
import type { ExpenseCategory } from '@/types';
import { useAuth } from '@/features/auth/hooks/useAuth';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { PlusCircle, MoreHorizontal, Edit3, Trash2, Loader2, FolderKanban, ArrowLeft } from 'lucide-react';

const ExpenseCategoriesListPage: React.FC = () => {
    const { t, i18n } = useTranslation(['common', 'expenses', 'validation']);
    const { can } = useAuth();
    const queryClient = useQueryClient();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
    const [itemToDelete, setItemToDelete] = useState<ExpenseCategory | null>(null);

    const { data: categories = [], isLoading, isFetching, refetch } = useQuery<ExpenseCategory[], Error>({
        queryKey: ['expenseCategories'],
        queryFn: getExpenseCategories,
    });

    const deleteMutation = useMutation<void, Error, number>({
        mutationFn: (id) => deleteExpenseCategory(id).then(() => {}), // Assuming service returns promise
        onSuccess: () => {
            toast.success(t('categoryDeletedSuccess', { ns: 'expenses' }));
            queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
            setItemToDelete(null);
        },
        onError: (error) => {
            toast.error(error.message || t('categoryDeleteFailed', { ns: 'expenses' }));
            setItemToDelete(null);
        }
    });

    const handleOpenAddModal = () => {
        setEditingCategory(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (category: ExpenseCategory) => {
        setEditingCategory(category);
        setIsFormModalOpen(true);
    };

    const MemoizedTableRow = React.memo(({ category }: { category: ExpenseCategory }) => (
        <TableRow key={category.id}>
            <TableCell className="font-medium text-center">{category.name}</TableCell>
            <TableCell className="text-muted-foreground text-center">{category.description || '-'}</TableCell>
            <TableCell className="text-center font-mono">{category.expenses_count ?? 0}</TableCell>
            <TableCell className="text-center">
                {can('expense-category:manage') && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">{t("openMenu")}</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={i18n.dir() === "rtl" ? "start" : "end"}>
                            <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenEditModal(category)}>
                                <Edit3 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                                {t("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => setItemToDelete(category)}
                                onSelect={(e) => e.preventDefault()}
                            >
                                <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                                {t("delete")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </TableCell>
        </TableRow>
    ));

    return (
        <div className="max-w-4xl mx-auto">
             <div className="mb-4">
                <Button variant="outline" size="sm" asChild>
                    <Link to="/expenses"> {/* Or to an admin dashboard */}
                        <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                        {t('backToExpenses', { ns: 'expenses', defaultValue: 'Back to Expenses' })}
                    </Link>
                </Button>
            </div>
            <PageHeader
                title={t('expenseCategoriesTitle', { ns: 'expenses' })}
                description={t('expenseCategoriesDescription', { ns: 'expenses' })}
                actionButton={can('expense-category:manage') ? {
                    label: t('newCategoryBtn', { ns: 'expenses' }),
                    icon: PlusCircle,
                    onClick: handleOpenAddModal
                } : undefined}
                showRefreshButton
                onRefresh={refetch}
                isRefreshing={isFetching && !isLoading}
            />

            <div className="rounded-md border bg-card mt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                                                <TableHead className="min-w-[200px] text-center">{t("name")}</TableHead>
                    <TableHead className="text-center">{t("description")}</TableHead>
                    <TableHead className="text-center w-[150px]">{t("expenseCount", { ns: 'expenses' })}</TableHead>
                    <TableHead className="text-center w-[80px]">{t("actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center">
                                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        <span>{t("loadingExpenseCategories", { ns: 'expenses' })}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : categories.length > 0 ? (
                            categories.map(category => <MemoizedTableRow key={category.id} category={category} />)
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <FolderKanban className="h-10 w-10" />
                                        <h3 className="font-semibold">{t('noCategoriesFound', { ns: 'expenses' })}</h3>
                                        <p className="text-sm">{t('noCategoriesFoundHint', { ns: 'expenses' })}</p>
                                        {can('expense-category:manage') && (
                                            <Button size="sm" className="mt-4" onClick={handleOpenAddModal}>
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                {t('addFirstCategory', { ns: 'expenses' })}
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modals are rendered here and controlled by this page's state */}
            {can('expense-category:manage') && (
                <ExpenseCategoryFormModal
                    isOpen={isFormModalOpen}
                    onOpenChange={setIsFormModalOpen}
                    editingCategory={editingCategory}
                />
            )}
            
            {can('expense-category:manage') && (
                <DeleteConfirmDialog
                    isOpen={!!itemToDelete}
                    onOpenChange={(open) => !open && setItemToDelete(null)}
                    onConfirm={() => { if (itemToDelete) deleteMutation.mutate(itemToDelete.id); }}
                    itemName={itemToDelete?.name}
                    itemType="expenseCategoryLC"
                    isPending={deleteMutation.isPending}
                />
            )}
        </div>
    );
};

export default ExpenseCategoriesListPage; 