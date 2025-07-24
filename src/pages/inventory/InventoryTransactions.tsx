import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FilterIcon, DownloadIcon, PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/shared/DataTable';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInventoryTransactionsWithFilters, exportInventoryTransactions, createInventoryTransaction, getInventoryItems } from '@/api/inventoryService';
import { getProductCategories } from '@/api/productCategoryService';
import type { InventoryTransaction } from '@/api/inventoryService';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
}

interface TransactionRow extends InventoryTransaction {
  productType?: { id: number; name: string };
  category_name?: string;
  created_by?: string;
}

interface InventoryItemOption {
  id: number;
  product_type?: { name: string };
  sku?: string;
}

const InventoryTransactions: React.FC = () => {
  const { t } = useTranslation(['common', 'inventory']);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    inventory_item_id: '',
    transaction_type: '',
    quantity: '',
    unit_price: '',
    notes: '',
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    type: '',
    dateFrom: '',
    dateTo: '',
  });

  // Fetch transactions with filters
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['inventory-transactions', filters],
    queryFn: () => getInventoryTransactionsWithFilters({
      search: filters.search || undefined,
      category_id: filters.category ? parseInt(filters.category) : undefined,
      transaction_type: filters.type as 'in' | 'out' | 'adjustment' | undefined,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch product categories for filter dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['product-categories'],
    queryFn: getProductCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch inventory items for transaction form
  const { data: inventoryItemsData } = useQuery({
    queryKey: ['inventory-items-for-transactions'],
    queryFn: () => getInventoryItems({}),
    // staleTime: 10 * 60 * 1000,
  });

  const transactions: TransactionRow[] = transactionsData?.data || [];
  const categories: Category[] = categoriesData || [];
  const inventoryItems: InventoryItemOption[] = inventoryItemsData?.data || [];
 console.log(inventoryItems,'inventoryItems')
  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: createInventoryTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      toast.success(t('common.createSuccess'));
      setIsModalOpen(false);
      setFormData({
        inventory_item_id: '',
        transaction_type: '',
        quantity: '',
        unit_price: '',
        notes: '',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || t('common.createFailed');
      toast.error(errorMessage);
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData,'formData')
    createTransactionMutation.mutate({
      inventory_item_id: parseInt(formData.inventory_item_id),
      transaction_type: formData.transaction_type as 'in' | 'out' | 'adjustment',
      quantity: parseFloat(formData.quantity),
      unit_price: formData.unit_price ? parseFloat(formData.unit_price) : undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const columns = [
    {
      accessorKey: 'created_at',
      header: t('date'),
      cell: ({ row }: { row: { original: TransactionRow } }) => format(new Date(row.original.created_at), 'MMM dd, yyyy HH:mm'),
    },
    {
      accessorKey: 'productType.name',
      header: t('productType'),
      cell: ({ row }: { row: { original: TransactionRow } }) => row.original.productType?.name || '-',
    },
    {
      accessorKey: 'category_name',
      header: t('category'),
    },
    {
      accessorKey: 'transaction_type',
      header: t('type'),
      cell: ({ row }: { row: { original: TransactionRow } }) => {
        const type = row.original.transaction_type;
        const variants: Record<string, string> = {
          in: 'bg-green-100 text-green-800',
          out: 'bg-red-100 text-red-800',
          adjustment: 'bg-yellow-100 text-yellow-800',
          purchase: 'bg-blue-100 text-blue-800',
          sale: 'bg-purple-100 text-purple-800',
          transfer: 'bg-gray-100 text-gray-800',
          waste: 'bg-orange-100 text-orange-800',
        };
        return (
          <Badge className={variants[type] || ''}>
            {t(`transactionTypes.${type}`, type.charAt(0).toUpperCase() + type.slice(1))}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'quantity',
      header: t('quantity'),
      cell: ({ row }: { row: { original: TransactionRow } }) => {
        const quantity = row.original.quantity;
        const className = quantity > 0 ? 'text-green-600' : 'text-red-600';
        return <span className={className}>{quantity > 0 ? '+' : ''}{quantity}</span>;
      },
    },
    {
      accessorKey: 'total_value',
      header: t('value'),
      cell: ({ row }: { row: { original: TransactionRow } }) => {
        // Use total_cost as the canonical value field
        const value = typeof row.original.total_cost === 'number' ? row.original.total_cost : undefined;
        if (!value) return '-';
        return `$${Math.abs(value).toFixed(2)}`;
      },
    },
    {
      accessorKey: 'reference_type',
      header: t('reference'),
      cell: ({ row }: { row: { original: TransactionRow } }) => {
        const ref = row.original.reference_type;
        const id = row.original.reference_id;
        if (!ref || !id) return '-';
        return `${t(`referenceTypes.${ref}`)} #${id}`;
      },
    },
    {
      accessorKey: 'created_by',
      header: t('createdBy'),
    },
  ];

  const handleExport = async () => {
    try {
      const blob = await exportInventoryTransactions({
        search: filters.search || undefined,
        category_id: filters.category ? parseInt(filters.category) : undefined,
        transaction_type: filters.type || undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(t('exportSuccess'));
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('exportFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('transactions')}</h1>
          <p className="text-muted-foreground">
            {t('transactionsDescription')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            {t('addTransaction')}
          </Button>
          <Button onClick={handleExport} variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            {t('export')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            {t('filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">{t('search')}</Label>
              <Input
                id="search"
                placeholder={t('searchPlaceholder')}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t('category')}</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">{t('all')}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">{t('type')}</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">{t('all')}</SelectItem>
                  <SelectItem value="in">{t('transactionTypes.in')}</SelectItem>
                  <SelectItem value="out">{t('transactionTypes.out')}</SelectItem>
                  <SelectItem value="adjustment">{t('transactionTypes.adjustment')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('dateRange')}</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={transactions}
            isLoading={transactionsLoading}
          />
        </CardContent>
      </Card>

      {/* Add Transaction Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addTransaction')}</DialogTitle>
            <DialogDescription>
              {t('addTransactionDescription')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inventory_item_id">{t('inventoryItem')}</Label>
              <Select value={formData.inventory_item_id} onValueChange={(value) => handleInputChange('inventory_item_id', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectInventoryItem')} />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.product_type?.name || 'Unknown'} {item.sku && `(${item.sku})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction_type">{t('transactionType')}</Label>
              <Select value={formData.transaction_type} onValueChange={(value) => handleInputChange('transaction_type', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectTransactionType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">{t('transactionTypes.in')}</SelectItem>
                  <SelectItem value="out">{t('transactionTypes.out')}</SelectItem>
                  <SelectItem value="adjustment">{t('transactionTypes.adjustment')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">{t('quantity')}</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_price">{t('unitPrice')} ({t('optional')})</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => handleInputChange('unit_price', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')} ({t('optional')})</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleFormSubmit} disabled={createTransactionMutation.isPending}>
              {createTransactionMutation.isPending ? t('loading') : t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryTransactions; 