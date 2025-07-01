// src/pages/purchases/PurchasesListPage.tsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  useQuery,
  useMutation,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

import { PageHeader } from "@/components/shared/PageHeader";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { getPurchases, deletePurchase } from "@/api/purchaseService";
import { getAllSuppliers } from "@/api/supplierService";
import type {
  Purchase,
  PaginatedResponse,
  Supplier,
  PurchaseStatus,
} from "@/types";
import { purchaseStatusOptions } from "@/types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { formatCurrency } from "@/lib/formatters";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// A local component for status badges, specific to purchase statuses
const PurchaseStatusBadge: React.FC<{ status: PurchaseStatus }> = ({
  status,
}) => {
  const { t } = useTranslation("purchases");
  let statusClasses = "";
  switch (status) {
    case "ordered":
      statusClasses =
        "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-700/30 dark:text-blue-300 dark:border-blue-600";
      break;
    case "received":
      statusClasses =
        "bg-green-100 text-green-700 border-green-300 dark:bg-green-700/30 dark:text-green-300 dark:border-green-600";
      break;
    case "paid":
      statusClasses =
        "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-700/30 dark:text-purple-300 dark:border-purple-600";
      break;
    case "partially_paid":
      statusClasses =
        "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-700/30 dark:text-yellow-300 dark:border-yellow-600";
      break;
    case "cancelled":
      statusClasses =
        "bg-red-100 text-red-700 border-red-300 dark:bg-red-700/30 dark:text-red-300 dark:border-red-600";
      break;
    default:
      statusClasses =
        "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700/30 dark:text-slate-300 dark:border-slate-600";
  }
  return (
    <Badge className={cn("capitalize", statusClasses)}>
      {t(`status_${status}`)}
    </Badge>
  );
};

const PurchasesListPage: React.FC = () => {
  const { t, i18n } = useTranslation(["common", "purchases"]);
  const navigate = useNavigate();
  const { can } = useAuth();

  // --- State Management ---
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{
    status?: string;
    supplier_id?: string;
  }>({});
  const [itemToDelete, setItemToDelete] = useState<Purchase | null>(null);
  const itemsPerPage = 15;

  // --- Data Fetching ---
  const { data: suppliers = [] } = useQuery<Supplier[], Error>({
    queryKey: ["allSuppliers"],
    queryFn: getAllSuppliers,
  });
  const {
    data: paginatedData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<PaginatedResponse<Purchase>, Error>({
    queryKey: ["purchases", currentPage, itemsPerPage, filters],
    queryFn: () => getPurchases(currentPage, itemsPerPage, filters),
    placeholderData: keepPreviousData,
  });

  const purchases = paginatedData?.data || [];
  const totalItems = paginatedData?.meta?.total || 0;
  const totalPages = paginatedData?.meta?.last_page || 1;

  // --- Mutations ---
  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: (id) => deletePurchase(id).then(() => {}),
    onSuccess: () => {
      toast.success(t("purchaseDeletedSuccess", { ns: "purchases" }));
      refetch();
      setItemToDelete(null);
    },
    onError: (error) => {
      toast.error(
        error.message || t("purchaseDeleteFailed", { ns: "purchases" })
      );
      setItemToDelete(null);
    },
  });

  // --- Reset page on filter change ---
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const MemoizedTableRow = React.memo(
    ({ purchase }: { purchase: Purchase }) => (
      <TableRow key={purchase.id}>
        <TableCell>{format(new Date(purchase.purchase_date), "PPP")}</TableCell>
        <TableCell className="font-medium">
          {purchase.supplier?.name || "-"}
        </TableCell>
        <TableCell className="font-mono text-xs">
          {purchase.reference_number || "-"}
        </TableCell>
        <TableCell>
          <PurchaseStatusBadge status={purchase.status} />
        </TableCell>
        <TableCell className="text-right rtl:text-left font-semibold">
          {formatCurrency(purchase.total_amount, "USD", i18n.language)}
        </TableCell>
        <TableCell className="text-right rtl:text-left">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigate(`/purchases/${purchase.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                {t("viewDetails")}
              </DropdownMenuItem>
              {can("purchase:update") && (
                <DropdownMenuItem
                  onClick={() => navigate(`/purchases/${purchase.id}/edit`)}
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  {t("edit")}
                </DropdownMenuItem>
              )}
              {can("purchase:delete") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setItemToDelete(purchase)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("delete")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
  );

  return (
    <div>
      <PageHeader
        title={t("title", { ns: "purchases" })}
        description={t("description", { ns: "purchases" })}
        actionButton={
          can("purchase:create")
            ? {
                label: t("newPurchase", { ns: "purchases" }),
                icon: PlusCircle,
                to: "/purchases/new",
              }
            : undefined
        }
        showRefreshButton
        onRefresh={refetch}
        isRefreshing={isFetching && isLoading}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">{t("filters")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Select
            value={filters.supplier_id || ""}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                supplier_id: value === "all" ? undefined : value,
              }))
            }
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue
                placeholder={t("filterBySupplier", { ns: "purchases" })}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("allSuppliers", { ns: "purchases" })}
              </SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status || ""}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                status: value === "all" ? undefined : value,
              }))
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue
                placeholder={t("filterByStatus", { ns: "purchases" })}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("allStatuses", { ns: "purchases" })}
              </SelectItem>
              {(purchaseStatusOptions as string[]).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {t(`status_${opt}`, { ns: "purchases" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* TODO: Add Date Range Picker here for purchase_date */}
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("purchaseDate", { ns: "purchases" })}</TableHead>
              <TableHead className="min-w-[200px]">
                {t("supplier", { ns: "purchases" })}
              </TableHead>
              <TableHead>{t("reference", { ns: "purchases" })}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="text-right">
                {t("totalAmount", { ns: "purchases" })}
              </TableHead>
              <TableHead className="text-right w-[80px]">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : purchases.length > 0 ? (
              purchases.map((purchase) => (
                <MemoizedTableRow key={purchase.id} purchase={purchase} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
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
              {" "}
              {t("firstPage")}{" "}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isFetching}
            >
              {" "}
              {t("previous")}{" "}
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
              {" "}
              {t("next")}{" "}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || isFetching}
            >
              {" "}
              {t("lastPage")}{" "}
            </Button>
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) deleteMutation.mutate(itemToDelete.id);
        }}
        itemName={`${t("purchaseRef", {
          ns: "purchases",
          ref: itemToDelete?.reference_number || itemToDelete?.id,
        })}`}
        itemType="purchaseLC" // "purchase" (lowercase)
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};
export default PurchasesListPage;
