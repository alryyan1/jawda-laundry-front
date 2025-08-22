import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getTodayOrders, updateOrderStatus } from "@/api/orderService";
import { useDate } from "@/context/DateContext";
import type { Order } from '@/types';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  User,
  Phone,
  FileText,
  Package,
  RefreshCw
} from "lucide-react";

import { TodayOrdersColumn } from "@/features/pos/components/TodayOrdersColumn";

const KitchenChefPage: React.FC = () => {
  const { t } = useTranslation(["common", "orders", "kitchen"]);
  const queryClient = useQueryClient();
  const { selectedDate } = useDate();
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch today's orders
  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery<Order[]>({
    queryKey: ["todayOrders", selectedDate],
    queryFn: () => getTodayOrders(selectedDate),
    staleTime: 30 * 1000, // Refresh every 30 seconds
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Mark order as complete mutation
  const completeOrderMutation = useMutation({
    mutationFn: (orderId: string | number) => updateOrderStatus(orderId, 'completed'),
    onSuccess: () => {
      toast.success(t("orderCompletedSuccessfully", { ns: "kitchen", defaultValue: "Order completed successfully" }));
      queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
      setSelectedOrder(null);
    },
    onError: (error) => {
      console.error('Failed to complete order:', error);
      toast.error(t("failedToCompleteOrder", { ns: "kitchen", defaultValue: "Failed to complete order" }));
    },
  });

  // Mark order as processing mutation
  const startOrderMutation = useMutation({
    mutationFn: (orderId: string | number) => updateOrderStatus(orderId, 'processing'),
    onSuccess: () => {
      toast.success(t("orderStartedSuccessfully", { ns: "kitchen", defaultValue: "Order started successfully" }));
      queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, status: 'processing' });
      }
    },
    onError: (error) => {
      console.error('Failed to start order:', error);
      toast.error(t("failedToStartOrder", { ns: "kitchen", defaultValue: "Failed to start order" }));
    },
  });

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleCompleteOrder = (orderId: string | number) => {
    completeOrderMutation.mutate(orderId);
  };

  const handleStartOrder = (orderId: string | number) => {
    startOrderMutation.mutate(orderId);
  };

  const getOrderStatusColor = (status: string) => {
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

  const getOrderStatusIcon = (status: string) => {
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeElapsed = (dateString: string) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  return (
    <div className="container mx-auto p-6 h-screen grid grid-cols-[auto_1fr] gap-6">
      {/* Orders List - TodayOrdersColumn on the left starting at top */}
      <div className="h-full">
        <TodayOrdersColumn
          onOrderSelect={handleOrderClick}
          selectedOrderId={selectedOrder?.id?.toString()}
        />
      </div>

      {/* Order Details */}
      <div className="h-full">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {selectedOrder 
                  ? t("orderDetails", { ns: "kitchen", defaultValue: "Order Details" })
                  : t("selectOrder", { ns: "kitchen", defaultValue: "Select an Order" })
                }
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{selectedDate}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchOrders()}
                  disabled={ordersLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-4rem)] overflow-y-auto">
            {selectedOrder ? (
              <div className="space-y-4">
                {/* Order Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="font-mono">
                      #{selectedOrder.category_sequences_string || selectedOrder.daily_order_number || selectedOrder.id}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={getOrderStatusColor(selectedOrder.status)}
                    >
                      <div className="flex items-center gap-1">
                        {getOrderStatusIcon(selectedOrder.status)}
                        {t(selectedOrder.status, { ns: "kitchen", defaultValue: selectedOrder.status })}
                      </div>
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {selectedOrder.customer?.name || t("noCustomer", { ns: "kitchen", defaultValue: "No Customer" })}
                      </span>
                    </div>
                    
                    {selectedOrder.customer?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{selectedOrder.customer.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{formatTime(selectedOrder.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-orange-600 font-medium">
                        {t("elapsed", { ns: "kitchen", defaultValue: "Elapsed" })}: {getTimeElapsed(selectedOrder.created_at)}
                      </span>
                    </div>
                  </div>

                  {selectedOrder.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            {t("orderNotes", { ns: "kitchen", defaultValue: "Order Notes" })}
                          </div>
                          <div className="text-sm text-gray-600">
                            {selectedOrder.notes}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    {t("orderItems", { ns: "kitchen", defaultValue: "Order Items" })}
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">
                            {item.serviceOffering?.productType?.name || t("unknownProduct", { ns: "kitchen", defaultValue: "Unknown Product" })}
                          </div>
                          <Badge variant="secondary">
                            {t("qty", { ns: "kitchen", defaultValue: "Qty" })}: {item.quantity}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          {item.serviceOffering?.serviceAction?.name || t("normal", { ns: "kitchen", defaultValue: "Normal" })}
                        </div>

                        {item.length_meters && item.width_meters && (
                          <div className="text-sm text-gray-600 mb-2">
                            {t("dimensions", { ns: "kitchen", defaultValue: "Dimensions" })}: {item.length_meters}m × {item.width_meters}m
                          </div>
                        )}

                        {item.notes && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                            <div className="flex items-start gap-2">
                              <FileText className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-yellow-800">
                                {item.notes}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <Separator />
                <div className="space-y-2">
                  {selectedOrder.status === 'pending' && (
                    <Button
                      onClick={() => handleStartOrder(selectedOrder.id)}
                      disabled={startOrderMutation.isPending}
                      className="w-full"
                      variant="outline"
                      size="lg"
                    >
                      {startOrderMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          {t("starting", { ns: "kitchen", defaultValue: "Starting..." })}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {t("startOrder", { ns: "kitchen", defaultValue: "Start Order" })}
                        </div>
                      )}
                    </Button>
                  )}
                  
                  {(selectedOrder.status === 'processing' || selectedOrder.status === 'pending') && (
                    <Button
                      onClick={() => handleCompleteOrder(selectedOrder.id)}
                      disabled={completeOrderMutation.isPending}
                      className="w-full"
                      size="lg"
                    >
                      {completeOrderMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          {t("completing", { ns: "kitchen", defaultValue: "Completing..." })}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          {t("completeOrder", { ns: "kitchen", defaultValue: "Complete Order" })}
                        </div>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t("selectOrderToView", { ns: "kitchen", defaultValue: "Select an order to view details" })}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KitchenChefPage;
