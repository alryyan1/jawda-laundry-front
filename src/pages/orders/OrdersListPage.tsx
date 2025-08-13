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
} from "@/types";
import { getOrders, downloadOrdersListExcel } from "@/api/orderService";
import { getAllCustomers } from "@/api/customerService";
import { getAllProductTypes } from "@/api/productTypeService";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSettings } from "@/context/SettingsContext";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { DarkThemeAutocomplete } from "@/components/ui/mui-autocomplete";

import {
  PlusCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { PaymentsListDialog } from "@/features/orders/components/PaymentsListDialog";
import OrderItemsDialog from "@/features/orders/components/OrderItemsDialog";
import MobileOrderCard from "./components/MobileOrderCard";
import OrdersTableRow from "./components/OrdersTableRow";
import OrdersPagination from "./components/OrdersPagination";


const OrdersListPage: React.FC = () => {
  const { t, i18n } = useTranslation("orders");
  const navigate = useNavigate();
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const { getSetting } = useSettings();
  const currencySymbol = getSetting('currency_symbol', '$') || '$';

  // --- State Management ---
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{
    search?: string;
    orderId?: string;
    status?: OrderStatus | "";
    customerId?: string;
    productTypeId?: string;
    dateFrom?: string;
    dateTo?: string;
    categorySequenceSearch?: string;
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
      filters.orderId,
      filters.customerId,
      filters.productTypeId,
      filters.dateFrom,
      filters.dateTo,
      filters.categorySequenceSearch,
    ],
    [
      currentPage,
      itemsPerPage,
      filters.status,
      debouncedSearch,
      filters.orderId,
      filters.customerId,
      filters.productTypeId,
      filters.dateFrom,
      filters.dateTo,
      filters.categorySequenceSearch,
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
        orderId: filters.orderId,
        customerId: filters.customerId,
        productTypeId: filters.productTypeId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        category_sequence_search: filters.categorySequenceSearch,
      }),
    placeholderData: keepPreviousData,
  });



  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
  }, [
    filters.status,
    debouncedSearch,
    filters.orderId,
    filters.customerId,
    filters.productTypeId,
    filters.dateFrom,
    filters.dateTo,
    filters.categorySequenceSearch,
  ]);

  const orders = paginatedData?.data || [];
  const totalItems = paginatedData?.meta?.total || 0;
  const totalPages = paginatedData?.meta?.last_page || 1;

  // Mobile Order Card Component
  

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

        
        {/* Excel Export Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadOrdersListExcel(filters)}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          {t("exportExcel", { defaultValue: "Export Excel" })}
        </Button>
        
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

      

      



             {/* Desktop Filters */}
       <div className="hidden sm:block mb-4">
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          <Input
            placeholder={t("searchOrdersPlaceholder")}
            value={filters.search || ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
          />
          <Input
            placeholder="Order ID"
            value={filters.orderId || ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, orderId: e.target.value }))
            }
            className="w-full"
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
          <DarkThemeAutocomplete
            options={[{ id: "all", name: t("allCustomers", { ns: "customers" }) }, ...customers]}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={customers.find(c => c.id.toString() === filters.customerId) || { id: "all", name: t("allCustomers", { ns: "customers" }) }}
            onChange={(_, newValue) =>
              setFilters((prev) => ({
                ...prev,
                customerId: newValue?.id === "all" ? undefined : newValue?.id?.toString(),
              }))
            }
            renderInput={(params) => (
              <div ref={params.InputProps.ref}>
                <Input
                  {...params.inputProps}
                  placeholder={t("filterByCustomer")}
                />
              </div>
            )}
          />
          <DarkThemeAutocomplete
            options={[{ id: "all", name: t("allProducts") }, ...productTypes]}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={productTypes.find(pt => pt.id.toString() === filters.productTypeId) || { id: "all", name: t("allProducts") }}
            onChange={(_, newValue) =>
              setFilters((prev) => ({
                ...prev,
                productTypeId: newValue?.id === "all" ? undefined : newValue?.id?.toString(),
              }))
            }
            renderInput={(params) => (
              <div ref={params.InputProps.ref}>
                <Input
                  {...params.inputProps}
                  placeholder={t("filterByProduct")}
                />
              </div>
            )}
          />
          <Input
            placeholder={t("searchCategorySequences", { defaultValue: "Search Category Sequences" })}
            value={filters.categorySequenceSearch || ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, categorySequenceSearch: e.target.value }))
            }
          />
        </div>
      </div>



      {/* Mobile Orders List */}
      <div className="sm:hidden px-1 sm:px-0">
        {isLoading && orders.length === 0 ? (
          <div className="flex items-center justify-center h-24 sm:h-32">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-1 sm:space-y-2">
            {orders.map((order) => {
              const isFullyPaid = order.amount_due === 0 || (order.total_amount > 0 && order.paid_amount >= order.total_amount);
              return (
                <MobileOrderCard
                  key={order.id}
                  order={order}
                  isSelected={orderItemsDialogOrder?.id === order.id}
                  isFullyPaid={isFullyPaid}
                  onNavigate={(path) => navigate(path)}
                  onOpenItems={(o) => setOrderItemsDialogOrder(o)}
                  onOpenPayments={(o) => setSelectedOrderForPayments(o)}
                  onEdit={(o) => navigate(`/orders/${o.id}/edit`)}
                  can={can}
                  t={t}
                  currentLocale={currentLocale}
                  currencySymbol={currencySymbol}
                />
              );
            })}
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
                <TableHead className="text-center">{t("categorySequences", { defaultValue: "Category Sequences" })}</TableHead>
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
                  <OrdersTableRow
                    key={order.id}
                    order={order}
                    selectedOrderId={orderItemsDialogOrder?.id ?? null}
                    onNavigate={(path) => navigate(path)}
                    onOpenItems={(o) => setOrderItemsDialogOrder(o)}
                    onOpenPayments={(o) => setSelectedOrderForPayments(o)}
                    onEdit={(o) => navigate(`/orders/${o.id}/edit`)}
                    can={can}
                    t={t}
                    currencySymbol={currencySymbol}
                    language={i18n.language}
                  />
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

      {/* Pagination */}
      <OrdersPagination
        currentPage={currentPage}
        totalPages={totalPages}
        isFetching={isFetching}
        setCurrentPage={setCurrentPage}
        t={t}
        showingText={t("showingItems", {
          first: paginatedData?.meta.from || 0,
          last: paginatedData?.meta.to || 0,
          total: totalItems,
        })}
      />
      
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


    </div>
  );
};

export default OrdersListPage;
