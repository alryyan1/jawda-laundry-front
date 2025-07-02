// src/pages/suppliers/SuppliersListPage.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { SupplierFormModal } from "@/features/suppliers/components/SupplierFormModal";
import { getSuppliers, deleteSupplier } from "@/api/supplierService";
import type { Supplier, PaginatedResponse } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/features/auth/hooks/useAuth";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Edit3,
  Trash2,
  Loader2,
  Building2,
} from "lucide-react";

const SuppliersListPage: React.FC = () => {
  const { t } = useTranslation(["common", "suppliers"]);
  const queryClient = useQueryClient();
  const { can } = useAuth(); // Use the auth hook for permissions

  // --- State Management ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Supplier | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const itemsPerPage = 15;

  // --- Data Fetching ---
  const queryKey = useMemo(
    () => ["suppliers", currentPage, itemsPerPage, debouncedSearch],
    [currentPage, itemsPerPage, debouncedSearch]
  );
  const {
    data: paginatedData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<PaginatedResponse<Supplier>, Error>({
    queryKey,
    queryFn: () => getSuppliers(currentPage, itemsPerPage, debouncedSearch),
    placeholderData: keepPreviousData,
  });

  const suppliers = paginatedData?.data || [];
  const totalItems = paginatedData?.meta?.total || 0;
  const totalPages = paginatedData?.meta?.last_page || 1;

  // --- Mutations ---
  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: (id) => deleteSupplier(id).then(() => {}),
    onSuccess: () => {
      toast.success(t("supplierDeletedSuccess", { ns: "suppliers" }));
      refetch(); // Refetch current page after delete
      setItemToDelete(null);
    },
    onError: (error) => {
      toast.error(
        error.message || t("supplierDeleteFailed", { ns: "suppliers" })
      );
      setItemToDelete(null);
    },
  });

  // --- Handlers ---
  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setIsFormModalOpen(true);
  };
  const handleOpenEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsFormModalOpen(true);
  };

  // Reset page to 1 when search term changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);

  // Memoize table rows for performance
  const MemoizedTableRow = React.memo(
    ({ supplier }: { supplier: Supplier }) => (
      <TableRow key={supplier.id}>
        <TableCell className="text-center">
          <div className="font-medium">{supplier.name}</div>
          <div className="text-xs text-muted-foreground">
            {supplier.contact_person}
          </div>
        </TableCell>
        <TableCell className="text-center">
          <div className="text-sm">{supplier.email || "-"}</div>
          <div className="text-sm text-muted-foreground">
            {supplier.phone || "-"}
          </div>
        </TableCell>
        <TableCell className="text-center">
          {supplier.purchases_count ?? 0}
        </TableCell>
        <TableCell className="text-center">
          {(can("supplier:update") || can("supplier:delete")) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t("openMenu")}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                {can("supplier:update") && (
                  <DropdownMenuItem
                    onClick={() => handleOpenEditModal(supplier)}
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    {t("edit")}
                  </DropdownMenuItem>
                )}
                {can("supplier:delete") && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setItemToDelete(supplier)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("delete")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TableCell>
      </TableRow>
    )
  );

  return (
    <div>
      <PageHeader
        title={t("title", { ns: "suppliers" })}
        description={t("description", { ns: "suppliers" })}
        actionButton={
          can("supplier:create")
            ? {
                label: t("newSupplier", { ns: "suppliers" }),
                icon: PlusCircle,
                onClick: handleOpenAddModal,
              }
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
        <CardContent>
          <Input
            placeholder={t("searchSuppliers", { ns: "suppliers" })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[250px] text-center">
                {t("supplierName", { ns: "suppliers" })}
              </TableHead>
              <TableHead className="min-w-[250px] text-center">
                {t("contactInfo", { ns: "suppliers" })}
              </TableHead>
              <TableHead className="text-center">
                {t("purchases", { ns: "suppliers" })}
              </TableHead>
              <TableHead className="text-center w-[80px]">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : suppliers.length > 0 ? (
              suppliers.map((supplier) => (
                <MemoizedTableRow key={supplier.id} supplier={supplier} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Building2 className="h-10 w-10" />
                    <h3 className="font-semibold">
                      {t("noSuppliersFound", { ns: "suppliers" })}
                    </h3>
                    <p className="text-sm">
                      {t("noSuppliersFoundHint", { ns: "suppliers" })}
                    </p>
                    {can("supplier:create") && (
                      <Button
                        size="sm"
                        className="mt-4"
                        onClick={handleOpenAddModal}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t("addFirstSupplier", { ns: "suppliers" })}
                      </Button>
                    )}
                  </div>
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

      {/* The modal is only rendered when needed, but its state is managed here */}
      {can("supplier:create") || can("supplier:update") ? (
        <SupplierFormModal
          isOpen={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          editingSupplier={editingSupplier}
        />
      ) : null}

      {can("supplier:delete") && (
        <DeleteConfirmDialog
          isOpen={!!itemToDelete}
          onOpenChange={(open) => !open && setItemToDelete(null)}
          onConfirm={() => {
            if (itemToDelete) deleteMutation.mutate(itemToDelete.id);
          }}
          itemName={itemToDelete?.name}
          itemType="supplierLC"
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default SuppliersListPage;
