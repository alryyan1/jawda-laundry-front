// src/pages/services/service-actions/ServiceActionFormModal.tsx
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

import type { ServiceAction, ServiceActionFormData } from "@/types";
import {
  createServiceAction,
  updateServiceAction,
} from "@/api/serviceActionService";

const actionSchema = z.object({
  name: z.string().nonempty({ message: "validation.nameRequired" }),
  description: z.string().optional().or(z.literal("")),
  base_duration_minutes: z.preprocess(
    (val) =>
      val === "" ||
      val === null ||
      val === undefined ||
      Number.isNaN(parseInt(String(val)))
        ? undefined
        : parseInt(String(val), 10),
    z
      .number({ invalid_type_error: "validation.durationMustBeNumber" })
      .int()
      .min(0, { message: "validation.durationNonNegative" })
      .optional()
  ),
});

type ActionFormValues = z.infer<typeof actionSchema>;

interface ServiceActionFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingAction?: ServiceAction | null;
}

export const ServiceActionFormModal: React.FC<ServiceActionFormModalProps> = ({
  isOpen,
  onOpenChange,
  editingAction,
}) => {
  const { t } = useTranslation(["common", "services", "validation"]);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ActionFormValues>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      name: "",
      description: "",
      base_duration_minutes: undefined,
    },
  });

  useEffect(() => {
    if (editingAction && isOpen) {
      setValue("name", editingAction.name);
      setValue("description", editingAction.description || "");
      setValue(
        "base_duration_minutes",
        editingAction.base_duration_minutes ?? undefined
      );
    } else if (!isOpen) {
      reset({ name: "", description: "", base_duration_minutes: undefined });
    }
  }, [editingAction, isOpen, setValue, reset]);

  const formMutation = useMutation<ServiceAction, Error, ServiceActionFormData>(
    {
      mutationFn: (data) => {
        const payload = {
          ...data,
          base_duration_minutes: data.base_duration_minutes
            ? Number(data.base_duration_minutes)
            : undefined,
        };
        return editingAction
          ? updateServiceAction(editingAction.id, payload)
          : createServiceAction(payload);
      },
      onSuccess: (data) => {
        toast.success(
          editingAction
            ? t("serviceActionUpdatedSuccess", {
                ns: "services",
                name: data.name,
              })
            : t("serviceActionCreatedSuccess", {
                ns: "services",
                name: data.name,
              })
        );
        queryClient.invalidateQueries({ queryKey: ["serviceActions"] });
        queryClient.invalidateQueries({
          queryKey: ["serviceActionsForSelect"],
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(
          error.message ||
            (editingAction
              ? t("serviceActionUpdateFailed", { ns: "services" })
              : t("serviceActionCreationFailed", { ns: "services" }))
        );
      },
    }
  );

  const onSubmit = (formData: ActionFormValues) => {
    if (isDirty || !editingAction) {
      formMutation.mutate(formData as ServiceActionFormData);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {editingAction
              ? t("editServiceActionTitle", { ns: "services" })
              : t("newServiceActionTitle", { ns: "services" })}
          </DialogTitle>
          <DialogDescription>
            {editingAction
              ? t("editServiceActionDescription", { ns: "services" })
              : t("newServiceActionDescription", { ns: "services" })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div>
            <Label htmlFor="sa-name">
              {t("name")}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sa-name"
              {...register("name")}
              placeholder={t("egServiceActionName", {
                ns: "services",
                defaultValue: "e.g., Espresso Brew, Cappuccino Preparation",
              })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {t(errors.name.message as string)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="sa-description">{t("descriptionOptional")}</Label>
            <Textarea
              id="sa-description"
              {...register("description")}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="sa-duration">
              {t("durationMinutesOptional", { ns: "services" })}
            </Label>
            <Input
              id="sa-duration"
              type="number"
              {...register("base_duration_minutes")}
              placeholder={t("egMinutes", { ns: "services" })}
            />
            {errors.base_duration_minutes && (
              <p className="text-sm text-destructive">
                {t(errors.base_duration_minutes.message as string)}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={formMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={formMutation.isPending || (!isDirty && !!editingAction)}
            >
              {formMutation.isPending && (
                <Loader2 className="animate-spin h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              )}
              {editingAction ? t("saveChanges") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
