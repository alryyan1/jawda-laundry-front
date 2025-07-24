import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Package } from 'lucide-react';
import { getInventoryItemById } from '@/api/inventoryService';

const ViewInventoryItemPage: React.FC = () => {
  const { t } = useTranslation(['common', 'inventory']);
  const { id } = useParams<{ id: string }>();

  const { data: inventoryItem, isLoading, error } = useQuery({
    queryKey: ['inventoryItem', id],
    queryFn: () => getInventoryItemById(parseInt(id!)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !inventoryItem) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <div className="text-destructive">Failed to load inventory item</div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/inventory/items">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back', { ns: 'common', defaultValue: 'Back' })}
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {inventoryItem.product_type?.name || 'Unknown Item'}
            </h1>
            {inventoryItem.sku && (
              <p className="text-muted-foreground">SKU: {inventoryItem.sku}</p>
            )}
          </div>
        </div>
        <Button asChild>
          <Link to={`/inventory/items/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            {t('edit', { ns: 'common', defaultValue: 'Edit' })}
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('basicInformation', { ns: 'common', defaultValue: 'Basic Information' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('productType', { ns: 'inventory', defaultValue: 'Product Type' })}
              </label>
              <p className="font-medium">
                {inventoryItem.product_type?.name || '-'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('category', { ns: 'inventory', defaultValue: 'Category' })}
              </label>
              <p className="font-medium">
                {inventoryItem.product_type?.category?.name || t('uncategorized', { ns: 'inventory', defaultValue: 'Uncategorized' })}
              </p>
            </div>

            {inventoryItem.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t('description', { ns: 'common', defaultValue: 'Description' })}
                </label>
                <p className="font-medium">{inventoryItem.description}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('unit', { ns: 'inventory', defaultValue: 'Unit' })}
              </label>
              <p className="font-medium">{inventoryItem.unit}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('status', { ns: 'inventory', defaultValue: 'Status' })}
              </label>
              <div className="mt-1">
                <Badge variant={inventoryItem.is_low_stock ? 'destructive' : 'default'}>
                  {inventoryItem.is_low_stock 
                    ? t('lowStock', { ns: 'inventory', defaultValue: 'Low Stock' })
                    : t('inStock', { ns: 'inventory', defaultValue: 'In Stock' })
                  }
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Information */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('stockInformation', { ns: 'inventory', defaultValue: 'Stock Information' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('currentStock', { ns: 'inventory', defaultValue: 'Current Stock' })}
              </label>
              <p className="text-2xl font-bold">
                {inventoryItem.current_stock} {inventoryItem.unit}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t('minStockLevel', { ns: 'inventory', defaultValue: 'Min Stock Level' })}
                </label>
                <p className="font-medium">
                  {inventoryItem.min_stock_level} {inventoryItem.unit}
                </p>
              </div>

              {inventoryItem.max_stock_level && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('maxStockLevel', { ns: 'inventory', defaultValue: 'Max Stock Level' })}
                  </label>
                  <p className="font-medium">
                    {inventoryItem.max_stock_level} {inventoryItem.unit}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('costPerUnit', { ns: 'inventory', defaultValue: 'Cost per Unit' })}
              </label>
              <p className="font-medium">
                {formatCurrency(inventoryItem.cost_per_unit)}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('totalValue', { ns: 'inventory', defaultValue: 'Total Value' })}
              </label>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(inventoryItem.total_value)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewInventoryItemPage; 