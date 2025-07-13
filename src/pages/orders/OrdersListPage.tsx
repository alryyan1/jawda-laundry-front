// src/pages/orders/OrdersListPage.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";


import {
  type Order,
  type OrderStatus,
  type PaginatedResponse,
  orderStatusOptions,
  type Customer,
  type ProductType,
} from "@/types";
import { getOrders } from "@/api/orderService";
import { getAllCustomers } from "@/api/customerService";
import { getAllProductTypes } from "@/api/productTypeService";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { formatCurrency } from "@/lib/formatters";

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
} from "lucide-react";
import { PaymentsListDialog } from "@/features/orders/components/PaymentsListDialog";
import  OrderItemsDialog  from "@/features/orders/components/OrderItemsDialog";

const OrdersListPage: React.FC = () => {
  const { t, i18n } = useTranslation("orders");
  const navigate = useNavigate();
  const { can } = useAuth();

  // --- State Management ---
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{
    search?: string;
    status?: OrderStatus | "";
    customerId?: string;
    productTypeId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});
  const [selectedOrderForPayments, setSelectedOrderForPayments] =
    useState<Order | null>(null);
  const [orderItemsDialogOrder, setOrderItemsDialogOrder] = useState<Order | null>(null);
  const debouncedSearch = useDebounce(filters.search, 500);
  const itemsPerPage = 15;
  const currentLocale = i18n.language.startsWith("ar") ? arSA : enUS;

  // Handler to update order item status in memory
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

  const MemoizedTableRow = React.memo(({ order }: { order: Order }) => (
    <TableRow 
      key={order.id} 
      className="cursor-pointer hover:bg-muted/50"
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
        {formatCurrency(order.total_amount, "USD", i18n.language)}
      </TableCell>
      <TableCell className="text-center font-semibold text-green-600 dark:text-green-500">
        {formatCurrency(order.paid_amount, "USD", i18n.language)}
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
  ));

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("orderListDescription")}
        actionButton={
          can("order:create")
            ? { label: t("newOrder"), icon: PlusCircle, to: "/orders/new" }
            : undefined
        }
        showRefreshButton
        onRefresh={refetch}
        isRefreshing={isFetching && !isLoading}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">{t("filters")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
          <div className="flex gap-2">
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
                <TableCell colSpan={7} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <MemoizedTableRow key={order.id} order={order} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
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
            {t("pagination.showingItems", {
              ns: "common",
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
              
              {t("firstPage", { ns: "common" })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isFetching}
            >
              
              {t("previous", { ns: "common" })}
            </Button>
            <span className="text-sm font-medium">
              {t("pageWithTotal", { ns: "common", currentPage, totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages || isFetching}
            >
              
              {t("next", { ns: "common" })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || isFetching}
            >
              
              {t("lastPage", { ns: "common" })}
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
          onOpenChange={(open) => !open && setOrderItemsDialogOrder(null)}
          onOrderItemStatusChange={handleOrderItemStatusChange}
        />
      )}

      {/* TODO: Add PaymentsListDialog component when available */}
    </div>
  );
};

export default OrdersListPage;
