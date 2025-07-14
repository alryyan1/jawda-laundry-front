// src/pages/orders/OrdersListPage.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";


import {
  type Order,
  type OrderStatus,
  type PaginatedResponse,
  orderStatusOptions,
  type Customer,
  type ProductType,
  type OrderStatistics,
} from "@/types";
import { getOrders, getOrderStatistics } from "@/api/orderService";
import { getAllCustomers } from "@/api/customerService";
import { getAllProductTypes } from "@/api/productTypeService";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { formatCurrency } from "@/lib/formatters";
import { PAYMENT_METHODS } from "@/lib/constants";
import { useSettings } from "@/context/SettingsContext";

import { PageHeader } from "@/components/shared/PageHeader";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  PlusCircle,
  MoreHorizontal,
  Eye,
  Edit3,
  CreditCard,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { PaymentsListDialog } from "@/features/orders/components/PaymentsListDialog";
import  OrderItemsDialog  from "@/features/orders/components/OrderItemsDialog";

const OrdersListPage: React.FC = () => {
  const { t, i18n } = useTranslation("orders");
  const navigate = useNavigate();
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const { getSetting } = useSettings();
  const currencySymbol = getSetting('currency_symbol', '$');

  // --- State Management ---
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{
    search?: string;
    status?: OrderStatus | "";
    customerId?: string;
    productTypeId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({
    dateFrom: format(new Date(), "yyyy-MM-dd"),
    dateTo: format(new Date(), "yyyy-MM-dd"),
  });
  const [selectedOrderForPayments, setSelectedOrderForPayments] =
    useState<Order | null>(null);
  const [orderItemsDialogOrder, setOrderItemsDialogOrder] = useState<Order | null>(null);
  const debouncedSearch = useDebounce(filters.search, 500);
  const itemsPerPage = 15;
  const currentLocale = i18n.language.startsWith("ar") ? arSA : enUS;

  // Define queryKey early so handlers can use it
  const queryKey = useMemo(
    () => [
      "orders",
      currentPage,
      itemsPerPage,
      filters.status,
      debouncedSearch,
      filters.customerId,
      filters.productTypeId,
      filters.dateFrom,
      filters.dateTo,
    ],
    [
      currentPage,
      itemsPerPage,
      filters.status,
      debouncedSearch,
      filters.customerId,
      filters.productTypeId,
      filters.dateFrom,
      filters.dateTo,
    ]
  );

  // Handler to update order item status in memory and cache
  const handleOrderItemStatusChange = (itemId: number, newStatus: string) => {
    setOrderItemsDialogOrder((prevOrder) => {
      if (!prevOrder) return prevOrder;
      return {
        ...prevOrder,
        items: prevOrder.items.map((item) =>
          item.id === itemId ? { ...item, status: newStatus as OrderStatus } : item
        ),
      };
    });

    // Update the cache for the orders list
    queryClient.setQueryData(queryKey, (oldData: PaginatedResponse<Order> | undefined) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        data: oldData.data.map((order) => {
          if (order.id === orderItemsDialogOrder?.id) {
            return {
              ...order,
              items: order.items.map((item) =>
                item.id === itemId ? { ...item, status: newStatus as OrderStatus } : item
              ),
            };
          }
          return order;
        }),
      };
    });
  };

  // Handler to update order item picked up quantity in memory and cache
  const handleOrderItemPickedUpQuantityChange = (itemId: number, pickedUpQuantity: number) => {
    setOrderItemsDialogOrder((prevOrder) => {
      if (!prevOrder) return prevOrder;
      return {
        ...prevOrder,
        items: prevOrder.items.map((item) =>
          item.id === itemId ? { ...item, picked_up_quantity: pickedUpQuantity } : item
        ),
      };
    });

    // Update the cache for the orders list
    queryClient.setQueryData(queryKey, (oldData: PaginatedResponse<Order> | undefined) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        data: oldData.data.map((order) => {
          if (order.id === orderItemsDialogOrder?.id) {
            return {
              ...order,
              items: order.items.map((item) =>
                item.id === itemId ? { ...item, picked_up_quantity: pickedUpQuantity } : item
              ),
            };
          }
          return order;
        }),
      };
    });
  };

  // Handler to update order status in cache
  const handleOrderStatusChange = (orderId: number, newStatus: string) => {
    // Update the cache for the orders list
    queryClient.setQueryData(queryKey, (oldData: PaginatedResponse<Order> | undefined) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        data: oldData.data.map((order) => {
          if (order.id === orderId) {
            return {
              ...order,
              status: newStatus as OrderStatus,
            };
          }
          return order;
        }),
      };
    });
  };

  // Handler to refresh orders data when dialog closes
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Refresh the orders list to get the latest data from server
      queryClient.invalidateQueries({ queryKey });
      setOrderItemsDialogOrder(null);
    }
  };

  // Calculate total quantities for an order
  const calculateTotalQuantities = (order: Order): number => {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  // Calculate total picked up quantities for an order
  const calculateTotalPickedUpQuantities = (order: Order): number => {
    return order.items.reduce((total, item) => total + (item.picked_up_quantity || 0), 0);
  };

  // --- Data Fetching ---
  const { data: customers = [] } = useQuery<Customer[], Error>({
    queryKey: ["allCustomersForSelect"],
    queryFn: () => getAllCustomers(),
  });
  const { data: productTypes = [] } = useQuery<ProductType[], Error>({
    queryKey: ["allProductTypesForSelect"],
    queryFn: () => getAllProductTypes(),
  });

  const {
    data: paginatedData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<PaginatedResponse<Order>, Error>({
    queryKey,
    queryFn: () =>
      getOrders(currentPage, itemsPerPage, {
        status: filters.status,
        search: debouncedSearch,
        customerId: filters.customerId,
        productTypeId: filters.productTypeId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      }),
    placeholderData: keepPreviousData,
  });

  // Statistics query
  const {
    data: statistics,
    isLoading: isLoadingStats,
  } = useQuery<OrderStatistics, Error>({
    queryKey: ["orderStatistics", filters.dateFrom, filters.dateTo],
    queryFn: () => getOrderStatistics(filters.dateFrom, filters.dateTo),
    enabled: !!(filters.dateFrom && filters.dateTo),
  });

  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
  }, [
    filters.status,
    debouncedSearch,
    filters.customerId,
    filters.productTypeId,
    filters.dateFrom,
    filters.dateTo,
  ]);

  const orders = paginatedData?.data || [];
  const totalItems = paginatedData?.meta?.total || 0;
  const totalPages = paginatedData?.meta?.last_page || 1;

  const MemoizedTableRow = React.memo(({ order }: { order: Order }) => {
    // Check if order is fully paid
    const isFullyPaid = order.amount_due === 0 || (order.total_amount > 0 && order.paid_amount >= order.total_amount);
    
    return (
      <TableRow 
        key={order.id} 
        className={`cursor-pointer hover:bg-muted/50 ${
          orderItemsDialogOrder?.id === order.id ? 'bg-green-50 dark:bg-green-950/20 border-l-4 border-l-green-500' : ''
        } ${
          isFullyPaid ? 'bg-green-50/50 dark:bg-green-950/10 border-l-2 border-l-green-400' : ''
        }`}
        onClick={() => navigate(`/orders/${order.id}`)}
      >
      <TableCell className="font-mono text-xs text-muted-foreground text-center">
        {order.id}
      </TableCell>
      <TableCell className="text-center">{order.customer?.name || t("notAvailable")}</TableCell>
      <TableCell className="text-center">
        {format(new Date(order.order_date), "PP", { locale: currentLocale })}
      </TableCell>
      <TableCell className="text-center">
        {order.pickup_date
          ? format(new Date(order.pickup_date), "PP", { locale: currentLocale })
          : "-"}
      </TableCell>
      <TableCell className="text-center">
        <OrderStatusBadge status={order.status} />
      </TableCell>
      <TableCell className="text-center font-semibold">
        {calculateTotalQuantities(order)} / {calculateTotalPickedUpQuantities(order)}
      </TableCell>
      <TableCell className="text-center font-semibold">
        {formatCurrency(order.total_amount, currencySymbol, i18n.language)}
      </TableCell>
      <TableCell className="text-center font-semibold text-green-600 dark:text-green-500">
        <div className="flex items-center justify-center gap-1">
          {formatCurrency(order.paid_amount, currencySymbol, i18n.language)}
          {isFullyPaid && (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
          )}
        </div>
      </TableCell>
      <TableCell className="text-center w-12">
        <Button
          variant="ghost"
          size="icon"
          onClick={e => {
            e.stopPropagation();
            setOrderItemsDialogOrder(order);
          }}
          aria-label={t("viewItems", { defaultValue: "View Items" })}
        >
          <Eye className="h-5 w-5" />
        </Button>
      </TableCell>
      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t("openMenu")}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              {t("viewDetails")}
            </DropdownMenuItem>
            {can("order:record-payment") && (
              <DropdownMenuItem
                onClick={() => setSelectedOrderForPayments(order)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {t("viewPayments")}
              </DropdownMenuItem>
            )}
            {can("order:update") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate(`/orders/${order.id}/edit`)}
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  {t("editOrder")}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
    );
  });

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("orderListDescription")}
        actionButton={
          can("order:create")
            ? { label: t("newOrder"), icon: PlusCircle, to: "/pos" }
            : undefined
        }
        showRefreshButton
        onRefresh={refetch}
        isRefreshing={isFetching && !isLoading}
      >
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-muted-foreground">
              {t("fromDate", { defaultValue: "From Date" })}
            </label>
            <Input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
              }
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-muted-foreground">
              {t("toDate", { defaultValue: "To Date" })}
            </label>
            <Input
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
              }
              className="w-40"
            />
          </div>
        </div>
      </PageHeader>

      {/* Summary Statistics */}
      {statistics && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Orders */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {t("totalOrders", { defaultValue: "Total Orders" })}
                  </p>
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    {statistics.totalOrders.toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Amount Paid */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    {t("totalAmountPaid", { defaultValue: "Total Amount Paid" })}
                  </p>
                  <p className="text-xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(statistics.totalAmountPaid, currencySymbol, i18n.language)}
                  </p>
                </div>
                <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods Breakdown */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 col-span-1 md:col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {t("paymentBreakdown", { defaultValue: "Payment Breakdown" })}
                </p>
                <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
                            <div className="grid grid-cols-4 gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const amount = statistics.paymentBreakdown[method as keyof typeof statistics.paymentBreakdown] || 0;
                  const percentage = statistics.totalAmountPaid > 0 ? (amount / statistics.totalAmountPaid) * 100 : 0;
                  
                  return (
                    <div key={method} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                          {t(`paymentMethod_${method}`, { defaultValue: method })}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(amount, currencySymbol, i18n.language)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading state for statistics */}
      {isLoadingStats && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                  <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">{t("filters")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder={t("searchOrdersPlaceholder")}
            value={filters.search || ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
          />
          <Select
            value={filters.status || ""}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                status: value === "all" ? undefined : (value as OrderStatus),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              {orderStatusOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {t(`status_${opt}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.customerId || ""}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                customerId: value === "all" ? undefined : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue
                placeholder={t("filterByCustomer")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("allCustomers", { ns: "customers" })}
              </SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.productTypeId || ""}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                productTypeId: value === "all" ? undefined : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue
                placeholder={t("filterByProduct")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("allProducts")}
              </SelectItem>
              {productTypes.map((pt) => (
                <SelectItem key={pt.id} value={pt.id.toString()}>
                  {pt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-center">ID</TableHead>
              <TableHead className="text-center">{t("customerName", { ns: "orders" })}</TableHead>
              <TableHead className="text-center">{t("orderDate", { ns: "orders" })}</TableHead>
              <TableHead className="text-center">{t("pickupDate", { defaultValue: "Pickup Date" })}</TableHead>
              <TableHead className="text-center">{t("status", { ns: "orders" })}</TableHead>
              <TableHead className="text-center">
                {t("totalItems", { defaultValue: "Total Items (Total/Picked Up)" })}
              </TableHead>
              <TableHead className="text-center">
                {t("totalAmount", { ns: "orders" })}
              </TableHead>
              <TableHead className="text-center">
                {t("amountPaid")}
              </TableHead>
              <TableHead className="text-center w-12">
                {t("actions", { ns: "orders" })}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <MemoizedTableRow key={order.id} order={order} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  {t("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {t("showingItems", {
              first: paginatedData?.meta.from || 0,
              last: paginatedData?.meta.to || 0,
              total: totalItems,
            })}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || isFetching}
            >
              {t("firstPage")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isFetching}
            >
              {t("previous")}
            </Button>
            <span className="text-sm font-medium">
              {t("pageWithTotal", { currentPage, totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages || isFetching}
            >
              {t("next")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || isFetching}
            >
              {t("lastPage")}
            </Button>
          </div>
        </div>
      )}
      {selectedOrderForPayments && (
        <PaymentsListDialog
          order={selectedOrderForPayments}
          isOpen={!!selectedOrderForPayments}
          onOpenChange={(open) => !open && setSelectedOrderForPayments(null)}
        />
      )}
      {orderItemsDialogOrder && (
        <OrderItemsDialog 
          order={orderItemsDialogOrder} 
          open={!!orderItemsDialogOrder} 
          onOpenChange={handleDialogClose}
          onOrderItemStatusChange={handleOrderItemStatusChange}
          onOrderItemPickedUpQuantityChange={handleOrderItemPickedUpQuantityChange}
          onOrderStatusChange={handleOrderStatusChange}
        />
      )}

      {/* TODO: Add PaymentsListDialog component when available */}
    </div>
  );
};

export default OrdersListPage;
