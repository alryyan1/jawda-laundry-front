// src/pages/services/service-actions/ServiceActionsListPage.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ServiceAction } from "@/types";
import {
  getServiceActions,
  deleteServiceAction,
} from "@/api/serviceActionService";

import { PageHeader } from "@/components/shared/PageHeader";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { ServiceActionFormModal } from "./ServiceActionFormModal";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Edit3,
  Trash2,
  MoreHorizontal,
  Loader2,
  Search,
  X,
} from "lucide-react";

const ServiceActionsListPage: React.FC = () => {
  const { t, i18n } = useTranslation(["common", "services", "validation"]);
  const queryClient = useQueryClient();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ServiceAction | null>(
    null
  );
  const [itemToDelete, setItemToDelete] = useState<ServiceAction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Service Actions list is usually small, so we fetch all without pagination.
  // If it becomes large, add pagination state and update getServiceActions service.
  const {
    data: actions = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<ServiceAction[], Error>({
    queryKey: ["serviceActions"],
    queryFn: getServiceActions,
  });

  // Filter actions based on search term
  const filteredActions = actions.filter((action) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      action.name.toLowerCase().includes(searchLower) ||
      (action.description && action.description.toLowerCase().includes(searchLower))
    );
  });

  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: (id) => deleteServiceAction(id).then(() => {}),
    onSuccess: () => {
      toast.success(
        t("serviceActionDeletedSuccess", {
          ns: "services",
          name: itemToDelete?.name || "",
        })
      );
      queryClient.invalidateQueries({ queryKey: ["serviceActions"] });
      queryClient.invalidateQueries({ queryKey: ["serviceActionsForSelect"] });
      setItemToDelete(null);
    },
    onError: (error) => {
      toast.error(
        error.message || t("serviceActionDeleteFailed", { ns: "services" })
      );
      setItemToDelete(null);
    },
  });

  const handleOpenAddModal = () => {
    setEditingAction(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (action: ServiceAction) => {
    setEditingAction(action);
    setIsFormModalOpen(true);
  };

  const MemoizedTableRow = React.memo(
    ({ action }: { action: ServiceAction }) => (
      <TableRow key={action.id}>
        <TableCell className="font-medium text-center">{action.name}</TableCell>
        <TableCell className="text-muted-foreground text-center">{action.description || "-"}</TableCell>
        <TableCell className="text-center">{action.base_duration_minutes ? `${action.base_duration_minutes} ${t("minutesUnit", { ns: "services", defaultValue: "min" })}` : "-"}</TableCell>
        <TableCell className="text-center">{/* actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("openMenu")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={i18n.dir() === "rtl" ? "start" : "end"}>
              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleOpenEditModal(action)}>
                <Edit3 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => setItemToDelete(action)}
                onSelect={(e) => e.preventDefault()}
              >
                <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
  );

  return (
    <div>
      <PageHeader
        title={t("serviceActionsTitle", { ns: "services" })}
        description={t("serviceActionsDescription", { ns: "services" })}
        actionButton={{
          label: t("newServiceActionBtn", { ns: "services" }),
          icon: PlusCircle,
          onClick: handleOpenAddModal,
        }}
        showRefreshButton
        onRefresh={refetch}
        isRefreshing={isFetching && !isLoading}
      />

      {/* Search Bar */}
      <div className="mb-4 flex gap-2 items-center">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("searchServiceActions", { ns: "services", defaultValue: "Search service actions..." })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        {searchTerm && (
          <div className="text-sm text-muted-foreground">
            {t("searchingFor", { defaultValue: "Searching for" })}: "{searchTerm}"
            {filteredActions.length !== actions.length && (
              <span className="ml-2">
                ({filteredActions.length} of {actions.length} results)
              </span>
            )}
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px] text-center">{t("name")}</TableHead>
              <TableHead className="text-center">{t("description")}</TableHead>
              <TableHead className="w-[150px] text-center">{t("durationMinutes", { ns: "services" })}</TableHead>
              <TableHead className="text-center w-[80px]">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex justify-center items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>
                      {t("loadingServiceActions", {
                        ns: "services",
                        defaultValue: "Loading service actions...",
                      })}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredActions.length > 0 ? (
              filteredActions.map((action) => (
                <MemoizedTableRow key={action.id} action={action} />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-muted-foreground"
                >
                  {searchTerm ? t("noSearchResults", { defaultValue: "No service actions found matching your search." }) : t("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination is omitted since we are fetching all actions. Add if pagination is implemented. */}

      <ServiceActionFormModal
        isOpen={isFormModalOpen}
        onOpenChange={(isOpen) => {
          setIsFormModalOpen(isOpen);
          if (!isOpen) setEditingAction(null);
        }}
        editingAction={editingAction}
      />

      <DeleteConfirmDialog
        isOpen={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) deleteMutation.mutate(itemToDelete.id);
        }}
        itemName={itemToDelete?.name}
        itemType="serviceActionLC" // Translation key in services.json: "service action"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};

export default ServiceActionsListPage;
