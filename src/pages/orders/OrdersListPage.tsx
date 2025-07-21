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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  PlusCircle,
  MoreHorizontal,
  Eye,
  Edit3,
  CreditCard,
  Loader2,
  CheckCircle,
  Calendar,
  Package,
  Search,
  Filter,
  Calculator,
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
  const [showFilters, setShowFilters] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
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

  // Calculate payment breakdown for statistics
  const calculatePaymentBreakdown = () => {
    if (!statistics) {
      return {
        totalPaid: 0,
        breakdown: PAYMENT_METHODS.map(method => ({
          method,
          amount: 0,
          percentage: 0
        }))
      };
    }

    const totalPaid = statistics.totalAmountPaid;
    const breakdown = PAYMENT_METHODS.map(method => {
      const amount = statistics.paymentBreakdown[method as keyof typeof statistics.paymentBreakdown] || 0;
      const percentage = totalPaid > 0 ? (amount / totalPaid) * 100 : 0;
      
      return {
        method,
        amount,
        percentage
      };
    });

    return { totalPaid, breakdown };
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

  // Mobile Order Card Component
  const MobileOrderCard = ({ order }: { order: Order }) => {
    const isFullyPaid = order.amount_due === 0 || (order.total_amount > 0 && order.paid_amount >= order.total_amount);
    
    return (
      <Card 
        className={`mb-2 sm:mb-4 p-1 sm:p-2 cursor-pointer transition-all hover:shadow-md ${
          orderItemsDialogOrder?.id === order.id ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20' : ''
        } ${
          isFullyPaid ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10' : ''
        }`}
        onClick={() => navigate(`/orders/${order.id}`)}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <span className="text-xs sm:text-sm font-mono text-muted-foreground">#{order.id}</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">
                {order.customer?.name || t("notAvailable")}
              </h3>
              <div className="text-xs sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-1">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(order.order_date), "PP", { locale: currentLocale })}</span>
                </div>
                {order.pickup_date && (
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>{format(new Date(order.pickup_date), "PP", { locale: currentLocale })}</span>
                  </div>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("viewDetails")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setOrderItemsDialogOrder(order);
                  }}
                >
                  <Package className="mr-2 h-4 w-4" />
                  {t("viewItems", { defaultValue: "View Items" })}
                </DropdownMenuItem>
                {can("order:record-payment") && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrderForPayments(order);
                    }}
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
          </div>
          
          <div className="grid grid-cols-2 gap-1.5 sm:gap-4 mb-2 sm:mb-3">
            <div className="text-center p-1.5 sm:p-2 bg-muted rounded-lg min-w-0">
              <div className="text-xs text-muted-foreground mb-0.5 sm:mb-1 truncate">
                {t("totalItems", { defaultValue: "Total Items" })}
              </div>
              <div className="font-semibold text-sm sm:text-base truncate">
                {calculateTotalQuantities(order)} / {calculateTotalPickedUpQuantities(order)}
              </div>
            </div>
            <div className="text-center p-1.5 sm:p-2 bg-muted rounded-lg min-w-0">
              <div className="text-xs text-muted-foreground mb-0.5 sm:mb-1 truncate">
                {t("totalAmount", { ns: "orders" })}
              </div>
              <div className="font-semibold text-sm sm:text-base truncate">
                {formatCurrency(order.total_amount, currencySymbol, i18n.language, 3)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-1.5 sm:p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
              {t("amountPaid")}
            </span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm sm:text-base text-green-600 dark:text-green-400">
                {formatCurrency(order.paid_amount, currencySymbol, i18n.language, 3)}
              </span>
              {isFullyPaid && (
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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
        {formatCurrency(order.total_amount, currencySymbol, i18n.language, 3)}
      </TableCell>
      <TableCell className="text-center font-semibold text-green-600 dark:text-green-500">
        <div className="flex items-center justify-center gap-1">
          {formatCurrency(order.paid_amount, currencySymbol, i18n.language, 3)}
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
    <div className="space-y-2 sm:space-y-4 p-0 sm:p-2 max-w-full overflow-hidden">
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
        {/* Calculator Button */}
        {statistics && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCalculatorOpen(true)}
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            {t("paymentBreakdown", { defaultValue: "Payment Breakdown" })}
          </Button>
        )}
        
        {/* Mobile Date Range Picker */}
        {/* Mobile Date Range Picker */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full">
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none">
              <Input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
                className="w-full sm:w-40 text-xs sm:text-sm"
              />
            </div>
            <div className="flex-1 sm:flex-none">
              <Input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                }
                className="w-full sm:w-40 text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>
      </PageHeader>

      {/* Mobile Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchOrdersPlaceholder")}
            value={filters.search || ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="pl-7 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 sm:gap-2 h-8 sm:h-10 text-xs sm:text-sm"
        >
          <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">{t("filters")}</span>
        </Button>
      </div>

      {/* Mobile Filters Panel */}
      {showFilters && (
        <Card className="sm:hidden">
          <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <Select
              value={filters.status || ""}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  status: value === "all" ? undefined : (value as OrderStatus),
                }))
              }
            >
              <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
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
              <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder={t("filterByCustomer")} />
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
              <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder={t("filterByProduct")} />
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
      )}

      {/* Desktop Filters */}
      <Card className="hidden sm:block mb-4">
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

      {/* Loading state for statistics */}
      {isLoadingStats && (
        <div className="flex items-center justify-center h-24">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Mobile Orders List */}
      <div className="sm:hidden px-1 sm:px-0">
        {isLoading && orders.length === 0 ? (
          <div className="flex items-center justify-center h-24 sm:h-32">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-1 sm:space-y-2">
            {orders.map((order) => (
              <MobileOrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <p className="text-muted-foreground text-sm sm:text-base">{t("noResults")}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Orders Table */}
      <div className="hidden sm:block">
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
      </div>

      {/* Mobile Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 py-2 sm:py-4">
          <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left px-2 sm:px-0">
            {t("showingItems", {
              first: paginatedData?.meta.from || 0,
              last: paginatedData?.meta.to || 0,
              total: totalItems,
            })}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || isFetching}
              className="h-7 sm:h-9 text-xs sm:text-sm px-1.5 sm:px-3 min-w-0"
            >
              <span className="hidden sm:inline">{t("firstPage")}</span>
              <span className="sm:hidden">1</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isFetching}
              className="h-7 sm:h-9 text-xs sm:text-sm px-1.5 sm:px-3 min-w-0"
            >
              <span className="hidden sm:inline">{t("previous")}</span>
              <span className="sm:hidden">‹</span>
            </Button>
            <span className="text-xs sm:text-sm font-medium px-1 sm:px-2 min-w-0">
              {t("pageWithTotal", { currentPage, totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages || isFetching}
              className="h-7 sm:h-9 text-xs sm:text-sm px-1.5 sm:px-3 min-w-0"
            >
              <span className="hidden sm:inline">{t("next")}</span>
              <span className="sm:hidden">›</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || isFetching}
              className="h-7 sm:h-9 text-xs sm:text-sm px-1.5 sm:px-3 min-w-0"
            >
              <span className="hidden sm:inline">{t("lastPage")}</span>
              <span className="sm:hidden">{totalPages}</span>
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

      {/* Calculator Dialog */}
      <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {t("paymentBreakdown", { defaultValue: "Payment Breakdown" })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Total Paid Summary */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {t("totalAmountPaid", { defaultValue: "Total Amount Paid" })}
                    </p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {formatCurrency(calculatePaymentBreakdown().totalPaid, currencySymbol, i18n.language, 3)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("paymentMethods", { defaultValue: "Payment Methods" })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {calculatePaymentBreakdown().breakdown.map((item) => (
                  <div key={item.method} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                        {t(`paymentMethod_${item.method}`, { defaultValue: item.method })}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.amount, currencySymbol, i18n.language, 3)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Date Range Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("dateRange", { defaultValue: "Date Range" })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t("from", { defaultValue: "From" })}: {filters.dateFrom && format(new Date(filters.dateFrom), "PP", { locale: currentLocale })}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t("to", { defaultValue: "To" })}: {filters.dateTo && format(new Date(filters.dateTo), "PP", { locale: currentLocale })}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersListPage;
