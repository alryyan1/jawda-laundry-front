import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';
import { getInventoryItems } from '@/api/inventoryService';
import { getProductCategories } from '@/api/productCategoryService';
import { Link } from 'react-router-dom';

interface InventoryItemRow {
  id: number;
  product_type?: { 
    id: number; 
    name: string; 
    category?: { id: number; name: string } 
  };
  sku?: string;
  current_stock: number;
  unit: string;
  min_stock_level: number;
  cost_per_unit?: number;
  total_value: number;
  is_low_stock: boolean;
}

const InventoryManagement: React.FC = () => {
  const { t } = useTranslation(['common', 'inventory']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const { data: inventoryResponse, isLoading } = useQuery({
    queryKey: ['inventoryItems', searchTerm, selectedCategory, showLowStockOnly],
    queryFn: () => getInventoryItems({
      search: searchTerm || undefined,
      category_id: selectedCategory ? parseInt(selectedCategory) : undefined,
      low_stock: showLowStockOnly || undefined,
    }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['productTypeCategories'],
    queryFn: getProductCategories,
  });

  const inventoryItems: InventoryItemRow[] = inventoryResponse?.data || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const columns = [
    {
      accessorKey: 'product_type.name',
      header: t('productType', { ns: 'inventory', defaultValue: 'Product Type' }),
      cell: ({ row }: { row: { original: InventoryItemRow } }) => (
        <div>
          <div className="font-medium">{row.original.product_type?.name || '-'}</div>
          {row.original.sku && (
            <div className="text-sm text-muted-foreground">{row.original.sku}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'product_type.category.name',
      header: t('category', { ns: 'inventory', defaultValue: 'Category' }),
      cell: ({ row }: { row: { original: InventoryItemRow } }) => (
        <span className="text-sm">
          {row.original.product_type?.category?.name || t('uncategorized', { ns: 'inventory', defaultValue: 'Uncategorized' })}
        </span>
      ),
    },
    {
      accessorKey: 'current_stock',
      header: t('currentStock', { ns: 'inventory', defaultValue: 'Current Stock' }),
      cell: ({ row }: { row: { original: InventoryItemRow } }) => (
        <div className="text-right">
          <div className="font-medium">
            {row.original.current_stock} {row.original.unit}
          </div>
          {row.original.min_stock_level > 0 && (
            <div className="text-xs text-muted-foreground">
              Min: {row.original.min_stock_level} {row.original.unit}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'cost_per_unit',
      header: t('costPerUnit', { ns: 'inventory', defaultValue: 'Cost/Unit' }),
      cell: ({ row }: { row: { original: InventoryItemRow } }) => (
        <div className="text-right">
          {row.original.cost_per_unit ? formatCurrency(row.original.cost_per_unit) : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'total_value',
      header: t('totalValue', { ns: 'inventory', defaultValue: 'Total Value' }),
      cell: ({ row }: { row: { original: InventoryItemRow } }) => (
        <div className="text-right font-medium">
          {formatCurrency(row.original.total_value)}
        </div>
      ),
    },
    {
      accessorKey: 'is_low_stock',
      header: t('status', { ns: 'inventory', defaultValue: 'Status' }),
      cell: ({ row }: { row: { original: InventoryItemRow } }) => (
        <Badge variant={row.original.is_low_stock ? 'destructive' : 'default'}>
          {row.original.is_low_stock 
            ? t('lowStock', { ns: 'inventory', defaultValue: 'Low Stock' })
            : t('inStock', { ns: 'inventory', defaultValue: 'In Stock' })
          }
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: t('actions', { ns: 'common', defaultValue: 'Actions' }),
      cell: ({ row }: { row: { original: InventoryItemRow } }) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/inventory/items/${row.original.id}`}>
              {t('view', { ns: 'common', defaultValue: 'View' })}
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to={`/inventory/items/${row.original.id}/edit`}>
              {t('edit', { ns: 'common', defaultValue: 'Edit' })}
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-8xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('inventoryManagement', { ns: 'inventory', defaultValue: 'Inventory Management' })}</h1>
          <p className="text-muted-foreground mt-1">
            {t('manageInventoryItems', { ns: 'inventory', defaultValue: 'Manage your inventory items and track stock levels' })}
          </p>
        </div>
        <Button asChild>
          <Link to="/inventory/items/new">
            <Plus className="h-4 w-4 mr-2" />
            {t('addItem', { ns: 'inventory', defaultValue: 'Add Item' })}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchItems', { ns: 'inventory', defaultValue: 'Search items...' })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('allCategories', { ns: 'inventory', defaultValue: 'All Categories' })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">{t('allCategories', { ns: 'inventory', defaultValue: 'All Categories' })}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showLowStockOnly ? 'default' : 'outline'}
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className="w-full sm:w-auto"
        >
          <Filter className="h-4 w-4 mr-2" />
          {t('lowStockOnly', { ns: 'inventory', defaultValue: 'Low Stock Only' })}
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={inventoryItems}
        isLoading={isLoading}
      />
    </div>
  );
};

export default InventoryManagement; 