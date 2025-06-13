// src/pages/orders/OrdersListPage.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

import type { Order, OrderStatus, PaginatedResponse } from "@/types";
import { getOrders } from "@/api/orderService";
import { useDebounce } from "@/hooks/useDebounce";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge"; // Corrected import path
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  // DropdownMenuSeparator, // Not used in this version for order actions
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusCircle,
  MoreHorizontal,
  ArrowUpDown,
  Eye, // Icon for View Details
  Loader2, // For loading states
} from "lucide-react";

const OrdersListPage: React.FC = () => {
  const { t, i18n } = useTranslation(["common", "orders", "validation"]);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const itemsPerPage = 10; // Or make this configurable

  const currentLocale = i18n.language.startsWith("ar") ? arSA : enUS;
  const orderStatusOptions: OrderStatus[] = [
    "pending",
    "processing",
    "ready_for_pickup",
    "completed",
    "cancelled",
  ];

  const {
    data: paginatedOrders,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery<PaginatedResponse<Order>, Error>({
    queryKey: [
      "orders",
      currentPage,
      itemsPerPage,
      statusFilter,
      debouncedSearchTerm,
    ],
    queryFn: () =>
      getOrders(currentPage, itemsPerPage, statusFilter, debouncedSearchTerm),
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, debouncedSearchTerm]);

  const orders = paginatedOrders?.data ?? [];
  const totalPages = paginatedOrders?.meta?.last_page ?? 1;

  const columns: ColumnDef<Order>[] = useMemo(
    () => [
      {
        id: "select", // Optional: if you need bulk actions later
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label={t("selectAll", { ns: "common" })}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t("selectRow", { ns: "common" })}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "order_number",
        header: t("orderNumber", { ns: "orders", defaultValue: "Order #" }),
        cell: ({ row }) => (
          <div className="font-medium">{row.original.order_number}</div>
        ),
      },
      {
        accessorFn: (row) => row.customer?.name, // Use accessorFn for nested data if sorting/filtering by it
        id: "customerName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("customerName", { ns: "common" })}
            <ArrowUpDown className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            {row.original.customer?.name || t("notAvailable", { ns: "common" })}
          </div>
        ),
      },
      {
        accessorKey: "order_date",
        header: t("orderDate", { ns: "common" }),
        cell: ({ row }) => {
          const dateVal = row.getValue("order_date");
          return (
            <div>
              {dateVal
                ? format(new Date(dateVal as string), "PP", {
                    locale: currentLocale,
                  })
                : "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("status", { ns: "common" }),
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "total_amount",
        header: () => (
          <div className="text-right rtl:text-left">
            {t("total", { ns: "common" })}
          </div>
        ),
        cell: ({ row }) => {
          const amount = row.original.total_amount;
          const formatted = new Intl.NumberFormat(i18n.language, {
            style: "currency",
            currency: "USD",
          }).format(amount); // TODO: Configurable currency
          return (
            <div className="text-right rtl:text-left font-medium">
              {formatted}
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.items?.length || 0,
        id: "itemCount",
        header: () => (
          <div className="text-center">
            {t("items", { ns: "orders", defaultValue: "Items" })}
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">{row.original.items?.length || 0}</div>
        ),
      },
      {
        id: "actions",
        header: () => (
          <div className="text-right rtl:text-left">
            {t("actions", { ns: "common" })}
          </div>
        ),
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="text-right rtl:text-left">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">
                      {t("openMenu", { ns: "common" })}
                    </span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align={i18n.dir() === "rtl" ? "start" : "end"}
                >
                  <DropdownMenuLabel>
                    {t("actions", { ns: "common" })}
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                    {t("viewDetails", { ns: "common" })}
                  </DropdownMenuItem>
                  {/* Add "Edit Order" link when EditOrderPage is ready */}
                  {/* <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}/edit`)}>
                                    <Edit3 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                                    {t('editOrder', { ns: 'orders' })}
                                </DropdownMenuItem> */}
                  {/* Delete for orders usually means changing status to 'cancelled' */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [t, i18n.language, i18n.dir, navigate, currentLocale]
  ); // Dependencies

  if (
    isLoading &&
    !isFetching &&
    !orders.length &&
    !searchTerm &&
    !statusFilter
  )
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ms-3 text-lg">{t("loadingOrders", { ns: "orders" })}</p>
      </div>
    );

  if (error)
    return (
      <div className="text-center py-10">
        <p className="text-destructive text-lg">
          {t("errorLoading", { ns: "common" })}
        </p>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={() => refetch()} className="mt-4">
          {t("retry", { ns: "common" })}
        </Button>
      </div>
    );

  return (
    <div>
      <PageHeader
        title={t("title", { ns: "orders" })}
        description={t("orderListDescription", {
          ns: "orders",
          defaultValue: "View and manage all customer orders.",
        })}
        actionButton={{
          label: t("newOrder", { ns: "common" }),
          icon: PlusCircle,
          to: "/orders/new", // Link handled by PageHeader now
        }}
        showRefreshButton
        onRefresh={refetch}
        isRefreshing={isFetching && isLoading} // Show spinner on refresh only when actively fetching initially
      >
        {/* Children prop of PageHeader for filter controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full mt-4 sm:mt-0">
          <Input
            placeholder={t("searchOrdersPlaceholder", {
              ns: "orders",
              defaultValue: "Search Order #, Customer...",
            })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full sm:w-auto sm:flex-grow lg:w-[300px]"
          />
          <Select
            value={statusFilter}
            onValueChange={(value: OrderStatus | "") => setStatusFilter(value)}
          >
            <SelectTrigger className="h-9 w-full sm:w-auto sm:min-w-[180px]">
              <SelectValue
                placeholder={t("filterByStatus", { ns: "orders" })}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">
                {t("allStatuses", { ns: "orders" })}
              </SelectItem>
              {orderStatusOptions.map((statusOpt) => (
                <SelectItem key={statusOpt} value={statusOpt}>
                  {t(`status_${statusOpt}`, { ns: "orders" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        data={orders}
        isLoading={isFetching} // Pass isFetching to show subtle loading during re-fetches on table
        pageCount={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        // DataTable internal search should be disabled if using external search like above
        // searchColumnId="order_number" // Remove if using external global search
        // searchPlaceholder="..." // Remove
      />
      {/* No DeleteConfirmDialog for orders directly from list for now, typically status change */}
    </div>
  );
};

export default OrdersListPage;
