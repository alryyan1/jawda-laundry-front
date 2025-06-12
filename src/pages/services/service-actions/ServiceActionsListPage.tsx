// src/pages/services/service-actions/ServiceActionsListPage.tsx
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import type { ServiceAction } from "@/types"; // PaginatedResponse if actions can be many
import {
  getServiceActions, // Assuming this returns ServiceAction[] for now
  deleteServiceAction,
} from "@/api/serviceActionService";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { ServiceActionFormModal } from "./ServiceActionFormModal"; // Import the modal
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Edit3,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ServiceActionsListPage: React.FC = () => {
  const { t, i18n } = useTranslation(["common", "services", "validation"]);
  const queryClient = useQueryClient();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ServiceAction | null>(
    null
  );
  const [itemToDelete, setItemToDelete] = useState<ServiceAction | null>(null);

  // Assuming ServiceActions are not paginated for simplicity in this admin list
  // If they can be numerous, implement pagination like in ProductTypesListPage
  const {
    data: actions = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<ServiceAction[], Error>({
    queryKey: ["serviceActions"],
    queryFn: getServiceActions,
  });

  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: (id) => deleteServiceAction(id).then(() => {}), // Adapt if API returns more
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

  const columns: ColumnDef<ServiceAction>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: t("name", { ns: "common" }),
        cell: ({ row }) => (
          <div className="font-medium">{row.original.name}</div>
        ),
      },
      {
        accessorKey: "description",
        header: t("description", { ns: "common" }),
        cell: ({ row }) => (
          <p className="truncate max-w-sm text-sm text-muted-foreground">
            {row.original.description || "-"}
          </p>
        ),
      },
      {
        accessorKey: "base_duration_minutes",
        header: t("durationMinutes", { ns: "services" }),
        cell: ({ row }) => {
          const duration = row.original.base_duration_minutes;
          return duration
            ? `${duration} ${t("minutesUnit", {
                ns: "services",
                defaultValue: "min",
              })}`
            : "-";
        },
      },
      {
        id: "actions",
        header: () => (
          <div className="text-right rtl:text-left">
            {t("actions", { ns: "common" })}
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right rtl:text-left">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t("openMenu")}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={i18n.dir() === "rtl" ? "start" : "end"}
              >
                <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleOpenEditModal(row.original)}
                >
                  <Edit3 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t("edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => setItemToDelete(row.original)}
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [t, i18n.dir, handleOpenEditModal, setItemToDelete]
  );

  return (
    <div>
      <PageHeader
        title={t("serviceActionsTitle", {
          ns: "services",
          defaultValue: "Service Actions",
        })}
        description={t("serviceActionsDescription", {
          ns: "services",
          defaultValue: "Manage the types of service actions performed.",
        })}
        actionButton={{
          label: t("newServiceActionBtn", {
            ns: "services",
            defaultValue: "New Action",
          }),
          icon: PlusCircle,
          onClick: handleOpenAddModal,
        }}
        showRefreshButton
        onRefresh={refetch}
        isRefreshing={isFetching && !isLoading}
      />

      <DataTable
        columns={columns}
        data={actions}
        isLoading={isLoading || isFetching}
      />

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
        itemType="serviceActionLC" // Translation key for "service action"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};
export default ServiceActionsListPage;
