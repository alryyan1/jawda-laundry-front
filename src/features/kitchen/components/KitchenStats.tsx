import React from 'react';
import { useTranslation } from "react-i18next";
import type { Order } from '@/types';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  ChefHat,
  TrendingUp
} from "lucide-react";

interface KitchenStatsProps {
  orders: Order[];
  selectedCategoryId: string | null;
}

const KitchenStats: React.FC<KitchenStatsProps> = ({ orders, selectedCategoryId }) => {
  const { t } = useTranslation(["kitchen"]);

  // Filter orders based on selected category
  const filteredOrders = selectedCategoryId 
    ? orders.filter(order => 
        order.items?.some(item => 
          item.serviceOffering?.productType?.product_category_id?.toString() === selectedCategoryId
        )
      )
    : orders;

  // Only show non-completed orders
  const activeOrders = filteredOrders.filter(order => 
    !order.order_complete && order.status !== 'completed'
  );

  // Calculate statistics
  const stats = {
    total: activeOrders.length,
    pending: activeOrders.filter(order => order.status === 'pending').length,
    inProgress: activeOrders.filter(order => order.status === 'processing').length,
    completed: filteredOrders.filter(order => order.order_complete || order.status === 'completed').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Active Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("totalActiveOrders", { ns: "kitchen", defaultValue: "Total Active Orders" })}
          </CardTitle>
          <ChefHat className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {selectedCategoryId 
              ? t("filteredByCategory", { ns: "kitchen", defaultValue: "Filtered by category" })
              : t("allCategories", { ns: "kitchen", defaultValue: "All categories" })
            }
          </p>
        </CardContent>
      </Card>

      {/* Pending Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("pendingOrders", { ns: "kitchen", defaultValue: "Pending Orders" })}
          </CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pending > 0 
              ? t("needsAttention", { ns: "kitchen", defaultValue: "Needs attention" })
              : t("allClear", { ns: "kitchen", defaultValue: "All clear" })
            }
          </p>
        </CardContent>
      </Card>

      {/* In Progress Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("inProgressOrders", { ns: "kitchen", defaultValue: "In Progress" })}
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <p className="text-xs text-muted-foreground">
            {t("beingPrepared", { ns: "kitchen", defaultValue: "Being prepared" })}
          </p>
        </CardContent>
      </Card>

      {/* Completed Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("completedOrders", { ns: "kitchen", defaultValue: "Completed Today" })}
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <p className="text-xs text-muted-foreground">
            {t("readyForPickup", { ns: "kitchen", defaultValue: "Ready for pickup" })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default KitchenStats;
