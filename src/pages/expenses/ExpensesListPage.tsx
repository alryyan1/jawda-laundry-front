// src/pages/expenses/ExpensesListPage.tsx
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

import { PageHeader } from "@/components/shared/PageHeader";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { ExpenseFormModal } from "@/features/expenses/components/ExpenseFormModal";
import {
  getExpenses,
  deleteExpense,
  getExpenseCategories,
} from "@/api/expenseService";
import type { Expense, PaginatedResponse } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
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
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker"; // Assuming you create this reusable component
import {
  PlusCircle,
  MoreHorizontal,
  Edit3,
  Trash2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";

const ExpensesListPage: React.FC = () => {
  const { t, i18n } = useTranslation(["common", "expenses"]);
  const queryClient = useQueryClient();
  const { can } = useAuth(); // For permission checks

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Expense | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{
    search?: string;
    category?: string;
    dateRange?: DateRange;
  }>({});
  const debouncedSearch = useDebounce(filters.search, 500);
  const itemsPerPage = 15;

  const { data: categories = [] } = useQuery<string[], Error>({
    queryKey: ["expenseCategories"],
    queryFn: getExpenseCategories,
  });

  const queryKey = useMemo(
    () => [
      "expenses",
      currentPage,
      itemsPerPage,
      debouncedSearch,
      filters.category,
      filters.dateRange,
    ],
    [
      currentPage,
      itemsPerPage,
      debouncedSearch,
      filters.category,
      filters.dateRange,
    ]
  );

  const {
    data: paginatedData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<PaginatedResponse<Expense>, Error>({
    queryKey,
    queryFn: () =>
      getExpenses(currentPage, itemsPerPage, {
        search: debouncedSearch,
        category: filters.category,
        date_from: filters.dateRange?.from
          ? format(filters.dateRange.from, "yyyy-MM-dd")
          : undefined,
        date_to: filters.dateRange?.to
          ? format(filters.dateRange.to, "yyyy-MM-dd")
          : undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const expenses = paginatedData?.data || [];
  const totalItems = paginatedData?.meta?.total || 0;
  const totalPages = paginatedData?.meta?.last_page || 1;

  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: (id) => deleteExpense(id).then(() => {}),
    onSuccess: () => {
      toast.success(t("expenseDeletedSuccess", { ns: "expenses" }));
      refetch();
      setItemToDelete(null);
    },
    onError: (error) => {
      toast.error(
        error.message || t("expenseDeleteFailed", { ns: "expenses" })
      );
      setItemToDelete(null);
    },
  });

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setIsFormModalOpen(true);
  };
  const handleOpenEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormModalOpen(true);
  };

  const MemoizedTableRow = React.memo(({ expense }: { expense: Expense }) => (
    <TableRow key={expense.id}>
      <TableCell>
        <div className="font-medium">{expense.name}</div>
        <div className="text-xs text-muted-foreground truncate max-w-xs">
          {expense.description}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-mono text-xs p-1 px-2 rounded-full bg-muted w-fit">
          {expense.category || "-"}
        </div>
      </TableCell>
      <TableCell>{format(new Date(expense.expense_date), "PPP")}</TableCell>
      <TableCell className="text-right rtl:text-left font-semibold">
        {formatCurrency(expense.amount, "USD", i18n.language)}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {expense.user?.name || "-"}
      </TableCell>
      <TableCell className="text-right rtl:text-left">
        {(can("expense:update") || can("expense:delete")) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
              {can("expense:update") && (
                <DropdownMenuItem onClick={() => handleOpenEditModal(expense)}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  {t("edit")}
                </DropdownMenuItem>
              )}
              {can("expense:delete") && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setItemToDelete(expense)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("delete")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  ));

  return (
    <div>
      <PageHeader
        title={t("title", { ns: "expenses" })}
        description={t("description", { ns: "expenses" })}
        actionButton={{
          label: t("newExpense", { ns: "expenses" }),
          icon: PlusCircle,
          onClick: handleOpenAddModal,
        }}
        showRefreshButton
        onRefresh={refetch}
        isRefreshing={isFetching && !isLoading}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">
            {t("filters", { ns: "common" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Input
            placeholder={t("searchExpenses", { ns: "expenses" })}
            value={filters.search || ""}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, search: e.target.value }));
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />
          <Select
            value={filters.category || ""}
            onValueChange={(value) => {
              setFilters((prev) => ({
                ...prev,
                category: value === "all" ? undefined : value,
              }));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue
                placeholder={t("filterByCategory", { ns: "expenses" })}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("allCategories", { ns: "expenses" })}
              </SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DatePickerWithRange
            date={filters.dateRange}
            onDateChange={(range) => {
              setFilters((prev) => ({ ...prev, dateRange: range }));
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto"
          />
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[250px]">
                {t("expenseName", { ns: "expenses" })}
              </TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("expenseDate", { ns: "expenses" })}</TableHead>
              <TableHead className="text-right rtl:text-left">
                {t("amount")}
              </TableHead>
              <TableHead>{t("recordedBy", { ns: "expenses" })}</TableHead>
              <TableHead className="text-right rtl:text-left w-[80px]">
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
            ) : expenses.length > 0 ? (
              expenses.map((expense) => (
                <MemoizedTableRow key={expense.id} expense={expense} />
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

      <ExpenseFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        editingExpense={editingExpense}
      />
      <DeleteConfirmDialog
        isOpen={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) deleteMutation.mutate(itemToDelete.id);
        }}
        itemName={itemToDelete?.name}
        itemType="expenseLC"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};

export default ExpensesListPage;
