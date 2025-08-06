// src/pages/OrdersPage.tsx
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  MoreHorizontal,
  ArrowUpDown,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Order, Customer, ProductType } from "@/types";
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
import { getAllCustomers } from "@/api/customerService";
import { getAllProductTypes } from "@/api/productTypeService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

// MUI Autocomplete components
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useTheme } from '@/components/theme-provider';

const OrdersPage = () => {
  const { t, i18n } = useTranslation(["common", "orders"]);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const itemsPerPage = 10;
  const currentLocale = i18n.language.startsWith("ar") ? arSA : enUS;

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    customerId: "",
    productTypeId: "",
    dateFrom: "",
    dateTo: "",
    sequenceNumber: "",
  });

  // MUI Theme for Autocomplete
  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: theme === 'dark' ? 'dark' : 'light',
    },
  }), [theme]);

  // Fetch orders with filters
  const {
    data: paginatedOrders,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery<PaginatedResponse<Order>, Error>({
    queryKey: ["orders", currentPage, itemsPerPage, filters],
    queryFn: () => getOrders(currentPage, itemsPerPage, {
      search: filters.search || filters.sequenceNumber,
      customerId: filters.customerId,
      productTypeId: filters.productTypeId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    }),
  });

  // Fetch customers for autocomplete
  const { data: customers = [] } = useQuery<Customer[], Error>({
    queryKey: ["customersForSelect"],
    queryFn: getAllCustomers,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch product types for autocomplete
  const { data: productTypes = [] } = useQuery<ProductType[], Error>({
    queryKey: ["productTypesForSelect"],
    queryFn: () => getAllProductTypes(),
    staleTime: 5 * 60 * 1000,
  });

  const orders = paginatedOrders?.data || [];
  const totalPages = paginatedOrders?.meta?.last_page || 1;

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      customerId: "",
      productTypeId: "",
      dateFrom: "",
      dateTo: "",
      sequenceNumber: "",
    });
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== "");

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
        accessorKey: "category_sequences_string",
        header: t("sequenceNumber", { ns: "orders", defaultValue: "Sequence" }),
        cell: ({ row }) => (
          <div className="font-medium">
            {row.original.category_sequences_string || t("notAvailable", { ns: "common" })}
          </div>
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
  );

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

      {/* Filters Section */}
      <Card className="mb-6">
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {t("filters", { ns: "common" })}
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2">
                      {Object.values(filters).filter(v => v !== "").length}
                    </Badge>
                  )}
                </CardTitle>
                {isFiltersOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Search by Order Number */}
                <div className="space-y-2">
                  <Label htmlFor="search">
                    {t("searchByOrderNumber", { ns: "orders", defaultValue: "Search by Order Number" })}
                  </Label>
                  <Input
                    id="search"
                    placeholder={t("searchByOrderNumber", { ns: "orders", defaultValue: "Search by order number..." })}
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                  />
                </div>

                {/* Search by Sequence Number */}
                <div className="space-y-2">
                  <Label htmlFor="sequenceNumber">
                    {t("searchBySequenceNumber", { ns: "orders", defaultValue: "Search by Sequence Number" })}
                  </Label>
                  <Input
                    id="sequenceNumber"
                    placeholder={t("searchBySequenceNumber", { ns: "orders", defaultValue: "Search by sequence number..." })}
                    value={filters.sequenceNumber}
                    onChange={(e) => handleFilterChange("sequenceNumber", e.target.value)}
                  />
                </div>

                {/* Customer Filter */}
                <div className="space-y-2">
                  <Label>
                    {t("filterByCustomer", { ns: "orders", defaultValue: "Filter by Customer" })}
                  </Label>
                  <ThemeProvider theme={muiTheme}>
                    <Autocomplete
                      options={customers}
                      getOptionLabel={(option) => option.name}
                      value={customers.find(c => c.id.toString() === filters.customerId) || null}
                      onChange={(_, newValue) => {
                        handleFilterChange("customerId", newValue?.id.toString() || "");
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={t("selectCustomer", { ns: "orders", defaultValue: "Select customer..." })}
                          size="small"
                        />
                      )}
                      clearIcon={<X className="h-4 w-4" />}
                    />
                  </ThemeProvider>
                </div>

                {/* Product Type Filter */}
                <div className="space-y-2">
                  <Label>
                    {t("filterByProduct", { ns: "orders", defaultValue: "Filter by Product" })}
                  </Label>
                  <ThemeProvider theme={muiTheme}>
                    <Autocomplete
                      options={productTypes}
                      getOptionLabel={(option) => option.name}
                      value={productTypes.find(p => p.id.toString() === filters.productTypeId) || null}
                      onChange={(_, newValue) => {
                        handleFilterChange("productTypeId", newValue?.id.toString() || "");
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={t("selectProduct", { ns: "orders", defaultValue: "Select product..." })}
                          size="small"
                        />
                      )}
                      clearIcon={<X className="h-4 w-4" />}
                    />
                  </ThemeProvider>
                </div>

                {/* Date From */}
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">
                    {t("dateFrom", { ns: "orders", defaultValue: "From Date" })}
                  </Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  />
                </div>

                {/* Date To */}
                <div className="space-y-2">
                  <Label htmlFor="dateTo">
                    {t("dateTo", { ns: "orders", defaultValue: "To Date" })}
                  </Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {t("showingResults", { 
                    ns: "common", 
                    from: (currentPage - 1) * itemsPerPage + 1,
                    to: Math.min(currentPage * itemsPerPage, paginatedOrders?.meta?.total || 0),
                    total: paginatedOrders?.meta?.total || 0
                  })}
                </div>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t("clearAllFilters", { ns: "common", defaultValue: "Clear All" })}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={orders}
        pageCount={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isLoading={isFetching}
      />
    </div>
  );
};

export default OrdersPage;
