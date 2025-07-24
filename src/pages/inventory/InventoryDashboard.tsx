import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, DollarSign, TrendingUp } from 'lucide-react';
import { getLowStockItems, getInventoryStatistics } from '@/api/inventoryService';
import { Link } from 'react-router-dom';

const InventoryDashboard: React.FC = () => {
  const { t } = useTranslation(['common', 'inventory']);

  const { data: lowStockItems = [], isLoading: lowStockLoading } = useQuery({
    queryKey: ['lowStockItems'],
    queryFn: getLowStockItems,
  });

  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['inventoryStatistics'],
    queryFn: getInventoryStatistics,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (statsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading inventory dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('inventoryDashboard', { ns: 'inventory', defaultValue: 'Inventory Dashboard' })}</h1>
          <p className="text-muted-foreground mt-1">
            {t('inventoryOverview', { ns: 'inventory', defaultValue: 'Manage your inventory and track stock levels' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/inventory/items">
              {t('manageInventory', { ns: 'inventory', defaultValue: 'Manage Inventory' })}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/inventory/transactions">
              {t('viewTransactions', { ns: 'inventory', defaultValue: 'View Transactions' })}
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('totalItems', { ns: 'inventory', defaultValue: 'Total Items' })}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.total_items || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('activeInventoryItems', { ns: 'inventory', defaultValue: 'Active inventory items' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('lowStockItems', { ns: 'inventory', defaultValue: 'Low Stock Items' })}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statistics?.low_stock_items || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('itemsNeedRestocking', { ns: 'inventory', defaultValue: 'Items that need restocking' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('totalValue', { ns: 'inventory', defaultValue: 'Total Value' })}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics?.total_value || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {t('currentInventoryValue', { ns: 'inventory', defaultValue: 'Current inventory value' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            {t('lowStockAlerts', { ns: 'inventory', defaultValue: 'Low Stock Alerts' })}
          </CardTitle>
          <CardDescription>
            {t('itemsBelowMinimumLevel', { ns: 'inventory', defaultValue: 'Items that are below their minimum stock level' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lowStockLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-muted-foreground">Loading low stock items...</div>
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t('noLowStockItems', { ns: 'inventory', defaultValue: 'No low stock items found. All inventory levels are good!' })}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{item.name}</h3>
                      {item.sku && (
                        <Badge variant="secondary" className="text-xs">
                          {item.sku}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('currentStock', { ns: 'inventory', defaultValue: 'Current Stock' })}: {item.current_stock} {item.unit}
                      {item.min_stock_level > 0 && (
                        <span className="ml-2">
                          ({t('minimum', { ns: 'inventory', defaultValue: 'Min' })}: {item.min_stock_level} {item.unit})
                        </span>
                      )}
                    </p>
                    {item.category && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('category', { ns: 'inventory', defaultValue: 'Category' })}: {item.category.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      {t('lowStock', { ns: 'inventory', defaultValue: 'Low Stock' })}
                    </Badge>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/inventory/items/${item.id}`}>
                        {t('addStock', { ns: 'inventory', defaultValue: 'Add Stock' })}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryDashboard; 