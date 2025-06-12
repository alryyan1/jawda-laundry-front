// src/pages/customers/CustomersListPage.tsx
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

import { Customer, PaginatedResponse } from "@/types";
import { getCustomers, deleteCustomer } from "@/api/customerService";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusCircle,
  MoreHorizontal,
  ArrowUpDown,
  Edit3,
  Trash2,
  Loader2,
} from "lucide-react";

const CustomersListPage: React.FC = () => {
  const { t, i18n } = useTranslation(["common", "customers", "validation"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(""); // For DataTable search
  const itemsPerPage = 10;
  const currentLocale = i18n.language.startsWith("ar") ? arSA : enUS;

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );

  const {
    data: paginatedCustomers,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery<PaginatedResponse<Customer>, Error>({
    queryKey: ["customers", currentPage, itemsPerPage, searchTerm], // Include searchTerm for re-fetching on search
    queryFn: () => getCustomers(currentPage, itemsPerPage, searchTerm),
    keepPreviousData: true, // Optional: for smoother pagination experience
  });

  const customers = paginatedCustomers?.data || [];
  const totalPages = paginatedCustomers?.meta?.last_page || 1;

  const deleteMutation = useMutation<void, Error, string | number>({
    mutationFn: (id) => deleteCustomer(id!).then(() => {}), // Ensure it returns void if deleteCustomer returns {message}
    onSuccess: () => {
      toast.success(
        t("customerDeletedSuccess", {
          ns: "customers",
          name:
            customerToDelete?.name ||
            t("theCustomer", { ns: "customers", defaultValue: "The customer" }),
        })
      );
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customersForSelect"] }); // If used in dropdowns
      setCustomerToDelete(null);
    },
    onError: (error) => {
      toast.error(
        error.message || t("customerDeleteFailed", { ns: "customers" })
      );
      setCustomerToDelete(null);
    },
  });

  const columns: ColumnDef<Customer>[] = useMemo(
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
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("name", { ns: "common" })}{" "}
            <ArrowUpDown className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "email",
        header: t("email", { ns: "common" }),
        cell: ({ row }) => (
          <div>
            {row.getValue("email") || t("notAvailable", { ns: "common" })}
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: t("phone", { ns: "customers" }),
        cell: ({ row }) => (
          <div>
            {row.getValue("phone") || t("notAvailable", { ns: "common" })}
          </div>
        ),
      },
      {
        accessorKey: "total_orders",
        header: () => (
          <div className="text-center">
            {t("totalOrders", { ns: "customers" })}
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">{row.original.total_orders ?? 0}</div>
        ),
      },
      {
        accessorKey: "registered_date",
        header: t("registeredDate", { ns: "customers" }),
        cell: ({ row }) => {
          const dateVal = row.getValue("registered_date");
          return (
            <div>
              {dateVal
                ? format(new Date(dateVal as string), "PPP", {
                    locale: currentLocale,
                  })
                : t("notAvailable", { ns: "common" })}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <div className="text-right rtl:text-left">
            {t("actions", { ns: "common" })}
          </div>
        ),
        cell: ({ row }) => {
          const customer = row.original;
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
                    onClick={() => navigate(`/customers/${customer.id}/edit`)}
                  >
                    <Edit3 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                    {t("edit", { ns: "common" })}
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem onClick={() => navigate(`/customers/${customer.id}`)}> View Details </DropdownMenuItem> */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => setCustomerToDelete(customer)}
                    onSelect={(e) => e.preventDefault()} // Keep dropdown open
                  >
                    <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                    {t("delete", { ns: "common" })}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [t, i18n.dir, i18n.language, navigate, currentLocale, setCustomerToDelete]
  );

  if (isLoading && !isFetching && !customers.length && !searchTerm)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ms-3 text-lg">
          {t("loadingCustomers", { ns: "customers" })}
        </p>
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
        title={t("title", { ns: "customers" })}
        description={t("customerListDescription", {
          ns: "customers",
          defaultValue: "Manage your registered customers.",
        })}
        actionButton={{
          label: t("newCustomer", { ns: "customers" }),
          icon: PlusCircle,
          to: "/customers/new",
        }}
        showRefreshButton
        onRefresh={refetch}
        isRefreshing={isFetching && isLoading} // Show spinner on refresh icon only when actually fetching and not initial load
      />
      <DataTable
        columns={columns}
        data={customers}
        searchColumnId="name" // This search will be passed to backend if DataTable is modified to handle it
        searchPlaceholder={t("searchByNameOrEmail", {
          ns: "customers",
          defaultValue: "Search by name, email, or phone...",
        })}
        onSearchTermChange={setSearchTerm} // DataTable needs to call this
        pageCount={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isLoading={isFetching}
      />
      <DeleteConfirmDialog
        isOpen={!!customerToDelete}
        onOpenChange={(open) => !open && setCustomerToDelete(null)}
        onConfirm={() => {
          if (customerToDelete) {
            deleteMutation.mutate(customerToDelete.id);
          }
        }}
        itemName={customerToDelete?.name}
        itemType="customerLC" // Translation key in customers.json: "customerLC": "customer"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};

export default CustomersListPage;
