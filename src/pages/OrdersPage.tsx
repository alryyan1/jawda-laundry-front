// src/pages/OrdersPage.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  MoreHorizontal,
  ArrowUpDown,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@/types";
import { DataTable } from "@/components/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { getOrders, type PaginatedResponse } from "@/api/orderService";

const OrdersPage = () => {
  const { t, i18n } = useTranslation(["common", "orders"]);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const currentLocale = i18n.language.startsWith("ar") ? arSA : enUS;

  const {
    data: paginatedOrders,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery<PaginatedResponse<Order>, Error>({
    queryKey: ["orders", currentPage, itemsPerPage],
    queryFn: () => getOrders(currentPage, itemsPerPage),
  });

  const orders = paginatedOrders?.data || [];
  const totalPages = paginatedOrders?.meta?.last_page || 1;

  const columns: ColumnDef<Order>[] = React.useMemo(
    () => [
      {
        id: "select",
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
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("orderNumber", { ns: "orders" })}{" "}
            <ArrowUpDown className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">#{row.getValue("order_number")}</div>
        ),
      },
      {
        accessorKey: "customer.name",
        header: t("customer", { ns: "customers" }),
        cell: ({ row }) => (
          <div>
            {row.original.customer?.name || t("notAvailable", { ns: "common" })}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: t("status", { ns: "orders" }),
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("status")}</div>
        ),
      },
      {
        accessorKey: "total_amount",
        header: () => (
          <div className="text-center">
            {t("totalAmount", { ns: "common" })}
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {new Intl.NumberFormat(i18n.language, {
              style: "currency",
              currency: "USD",
            }).format(row.getValue("total_amount"))}
          </div>
        ),
      },
      {
        accessorKey: "order_date",
        header: t("orderDate", { ns: "orders" }),
        cell: ({ row }) => {
          const date = row.original.order_date;
          if (!date) return t("notAvailable", { ns: "common" });
          try {
            return format(new Date(date), "PPP", {
              locale: currentLocale,
            });
          } catch {
            console.error("Invalid date:", date);
            return t("invalidDate", { ns: "common" });
          }
        },
      },
      {
        id: "actions",
        header: () => (
          <div className="text-center">
            {t("actions", { ns: "common" })}
          </div>
        ),
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="text-center">
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
                  <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
                    {t("viewDetails", { ns: "orders" })}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [t, i18n.language, navigate, currentLocale]
  ); // Added i18n.language, currentLocale

  if (isLoading && !isFetching && !orders.length)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ms-3 text-lg">
          {t("loadingOrders", { ns: "orders" })}
        </p>
      </div>
    );
  if (error)
    return (
      <p className="text-destructive">
        {t("errorLoading", { ns: "common" })} {error.message}
      </p>
    );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {t("title", { ns: "orders" })}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching && !isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="sr-only">{t("refresh", { ns: "common" })}</span>
          </Button>
          <Button asChild>
            <Link to="/orders/new">
              <PlusCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t("newOrder", { ns: "orders" })}
            </Link>
          </Button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={orders}
        searchColumnId="order_number"
        searchPlaceholder={t("searchByOrderNumber", { ns: "orders" })}
        pageCount={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isLoading={isFetching}
      />
    </div>
  );
};

export default OrdersPage;
