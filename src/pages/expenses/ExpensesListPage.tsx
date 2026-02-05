// src/pages/expenses/ExpensesListPage.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  useQuery,
  useMutation,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Menu,
  Chip,
  CircularProgress,
  Stack,
  Card,
  CardContent,
  CardHeader,
  Pagination,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  AccountBalanceWallet as BankIcon,
  AttachMoney as CashIcon,
  FolderOpen as FolderOpenIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import { ExpenseFormModal } from "@/features/expenses/components/ExpenseFormModal";
import {
  getExpenses,
  deleteExpense,
  getExpenseCategories,
} from "@/api/expenseService";
import type { Expense, PaginatedResponse } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency } from "@/lib/formatters";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSettings } from "@/context/SettingsContext";

const ExpensesListPage: React.FC = () => {
  const { t, i18n } = useTranslation(["common", "expenses"]);
  const { can } = useAuth();
  const { getSetting } = useSettings();
  const theme = useTheme();

  // Get currency from settings, fallback to USD
  const currency = getSetting("currency_symbol", "USD");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Expense | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{
    search?: string;
    category?: string;
    dateRange?: DateRange;
  }>({});
  const debouncedSearch = useDebounce(filters.search, 500);
  const itemsPerPage = 15;

  const { data: categoriesData } = useQuery<
    { id: number; name: string; description?: string }[],
    Error
  >({
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

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearch, filters.category, filters.dateRange]);

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormModalOpen(true);
    handleMenuClose();
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    expense: Expense
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedExpense(expense);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExpense(null);
  };

  const handleDeleteClick = (expense: Expense) => {
    setItemToDelete(expense);
    handleMenuClose();
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ maxWidth: "1400px", mx: "auto", px: 3, py: 4 }}>
        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 4,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              {t("title", { ns: "expenses" })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("description", { ns: "expenses" })}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            {can("expense:create") && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAddModal}
                sx={{ minWidth: 140 }}
              >
                {t("newExpense", { ns: "expenses" })}
              </Button>
            )}
            <Tooltip title={t("refresh")}>
              <IconButton
                onClick={() => refetch()}
                disabled={isFetching && !isLoading}
                color="primary"
              >
                <RefreshIcon
                  sx={{
                    animation: isFetching && !isLoading ? "spin 1s linear infinite" : "none",
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Filters Card */}
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title={
              <Typography variant="h6" fontWeight="600">
                {t("filters")}
              </Typography>
            }
            sx={{ pb: 1 }}
          />
          <CardContent>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              flexWrap="wrap"
            >
              <TextField
                placeholder={t("searchExpenses", { ns: "expenses" })}
                value={filters.search || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                size="small"
                sx={{ minWidth: { xs: "100%", sm: 300 } }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                }}
              />
              <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 200 } }}>
                <InputLabel>{t("filterByCategory", { ns: "expenses" })}</InputLabel>
                <Select
                  value={filters.category || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: e.target.value === "all" ? undefined : e.target.value,
                    }))
                  }
                  label={t("filterByCategory", { ns: "expenses" })}
                >
                  <MenuItem value="all">
                    {t("allCategories", { ns: "expenses" })}
                  </MenuItem>
                  {categoriesData?.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <DatePicker
                label={t("fromDate", { ns: "common", defaultValue: "From Date" })}
                value={filters.dateRange?.from || null}
                onChange={(newValue) => {
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: {
                      from: newValue || undefined,
                      to: prev.dateRange?.to,
                    },
                  }));
                }}
                maxDate={filters.dateRange?.to || undefined}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { minWidth: { xs: "100%", sm: 150 } },
                  },
                }}
              />
              <DatePicker
                label={t("toDate", { ns: "common", defaultValue: "To Date" })}
                value={filters.dateRange?.to || null}
                onChange={(newValue) => {
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: {
                      from: prev.dateRange?.from,
                      to: newValue || undefined,
                    },
                  }));
                }}
                minDate={filters.dateRange?.from || undefined}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { minWidth: { xs: "100%", sm: 150 } },
                  },
                }}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Table Section */}
        <TableContainer component={Paper} elevation={1}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)" }}>
                <TableCell align="center" sx={{ fontWeight: 600, minWidth: 250 }}>
                  {t("expenseName", { ns: "expenses" })}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {t("category")}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {t("paymentMethod", { ns: "expenses" })}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {t("expenseDate", { ns: "expenses" })}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {t("amount")}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {t("recordedBy", { ns: "expenses" })}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: 80 }}>
                  {t("actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : expenses.length > 0 ? (
                expenses.map((expense) => (
                  <TableRow
                    key={expense.id}
                    hover
                    sx={{
                      "&:hover": {
                        backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.01)",
                      },
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {expense.name}
                        </Typography>
                        {expense.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 300,
                            }}
                          >
                            {expense.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          expense.expense_category_id
                            ? categoriesData?.find(
                                (cat) => cat.id === expense.expense_category_id
                              )?.name || "-"
                            : "-"
                        }
                        size="small"
                        variant="outlined"
                        sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="center"
                      >
                        {expense.payment_method === "cash" ? (
                          <CashIcon sx={{ fontSize: 18, color: "success.main" }} />
                        ) : (
                          <BankIcon sx={{ fontSize: 18, color: "primary.main" }} />
                        )}
                        <Typography variant="body2" textTransform="capitalize">
                          {t(`method_${expense.payment_method}`, {
                            ns: "expenses",
                            defaultValue: expense.payment_method,
                          })}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      {format(new Date(expense.expense_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="semibold">
                        {formatCurrency(expense.amount, currency, i18n.language)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {expense.user?.name || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {(can("expense:update") || can("expense:delete")) && (
                        <>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, expense)}
                            aria-label="more actions"
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                          <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl && selectedExpense?.id === expense.id)}
                            onClose={handleMenuClose}
                            anchorOrigin={{
                              vertical: "bottom",
                              horizontal: "right",
                            }}
                            transformOrigin={{
                              vertical: "top",
                              horizontal: "right",
                            }}
                          >
                            {can("expense:update") && (
                              <MenuItem onClick={() => handleOpenEditModal(expense)}>
                                <EditIcon sx={{ mr: 1, fontSize: 18 }} />
                                {t("edit")}
                              </MenuItem>
                            )}
                            {can("expense:delete") && (
                              <MenuItem
                                onClick={() => handleDeleteClick(expense)}
                                sx={{ color: "error.main" }}
                              >
                                <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
                                {t("delete")}
                              </MenuItem>
                            )}
                          </Menu>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Stack spacing={2} alignItems="center">
                      <FolderOpenIcon sx={{ fontSize: 48, color: "text.secondary" }} />
                      <Typography variant="h6" fontWeight="semibold">
                        {t("noExpensesFound", { ns: "expenses" })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t("noExpensesFoundHint", { ns: "expenses" })}
                      </Typography>
                      {can("expense:create") && (
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleOpenAddModal}
                          sx={{ mt: 2 }}
                        >
                          {t("addFirstExpense", { ns: "expenses" })}
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 3,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("pagination.showingItems", {
                first: paginatedData?.meta.from || 0,
                last: paginatedData?.meta.to || 0,
                total: totalItems,
              })}
            </Typography>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              color="primary"
              shape="rounded"
              disabled={isFetching}
              showFirstButton
              showLastButton
            />
          </Box>
        )}

        {/* Modals */}
        {(can("expense:create") || can("expense:update")) && (
          <ExpenseFormModal
            isOpen={isFormModalOpen}
            onOpenChange={setIsFormModalOpen}
            editingExpense={editingExpense}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {can("expense:delete") && itemToDelete && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1300,
            }}
            onClick={() => setItemToDelete(null)}
          >
            <Paper
              sx={{
                p: 4,
                maxWidth: 400,
                mx: 2,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {t("deleteConfirmationTitle", {
                  item: t("expenseLC", { ns: "expenses", defaultValue: "expense" }),
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t("deleteConfirmationMessage", {
                  itemName: itemToDelete.name || t("thisItem", { defaultValue: "this item" }),
                })}
                <br />
                {t("irreversibleAction")}
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => setItemToDelete(null)}
                  disabled={deleteMutation.isPending}
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleConfirmDelete}
                  disabled={deleteMutation.isPending}
                  startIcon={
                    deleteMutation.isPending ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <DeleteIcon />
                    )
                  }
                >
                  {t("delete")}
                </Button>
              </Stack>
            </Paper>
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default ExpensesListPage;
