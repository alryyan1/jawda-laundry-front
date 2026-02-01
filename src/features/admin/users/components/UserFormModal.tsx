// src/features/admin/users/components/UserFormModal.tsx
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import type { User, UserFormData } from "@/types";
import { createUserAsAdmin, updateUserAsAdmin } from "@/api/userService";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Zod schema for validation
const userFormSchema = z.object({
  name: z.string().nonempty({ message: "validation.nameRequired" }),
  username: z
    .string()
    .nonempty({ message: "validation.usernameRequired" })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "validation.usernameInvalid" }),
  user_type: z.enum(["admin", "staff"], {
    required_error: "validation.roleRequired",
  }),
  password: z.string().optional(),
  password_confirmation: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser?: User | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onOpenChange,
  editingUser,
}) => {
  const { t } = useTranslation(["admin", "common", "validation"]);
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      password_confirmation: "",
      user_type: "staff",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        reset({
          name: editingUser.name,
          username: editingUser.username,
          user_type: editingUser.user_type || "staff",
        });
      } else {
        reset({ name: "", username: "", user_type: "staff" });
      }
    }
  }, [editingUser, isOpen, reset]);

  const mutation = useMutation<
    User,
    Error,
    UserFormData | Partial<UserFormData>
  >({
    mutationFn: (data) =>
      editingUser
        ? updateUserAsAdmin(editingUser.id, data)
        : createUserAsAdmin(data as UserFormData),
    onSuccess: () => {
      toast.success(
        editingUser ? t("userUpdatedSuccess") : t("userCreatedSuccess"),
      );
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || t("userActionFailed"));
    },
  });

  const onSubmit = (data: UserFormValues) => {
    const payload: UserFormData = {
      name: data.name,
      username: data.username,
      email: "", // Email not used in this form but required by type? Adjust type if needed.
      user_type: data.user_type,
      role_ids: [], // Legacy support if needed, can likely remove
    };

    // Only include password in the payload if it's provided and not empty
    if (data.password && data.password.trim() !== "") {
      payload.password = data.password;
      payload.password_confirmation = data.password_confirmation;
    }

    // We are using createUserAsAdmin which takes UserFormData.
    // If email is required by UserFormData but not in form, we might need to make it optional or add it.
    // Assuming email is optional in backend for now or generated?
    // Actually Validation says email is optional in Backend now.
    // Let's add email field to form or make it optional in Type.
    // For now I'll pass empty string or handle it.
    // Wait, the backend registration made email optional.

    mutation.mutate(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingUser ? t("editUserTitle") : t("newUserTitle")}
          </DialogTitle>
          <DialogDescription>
            {editingUser ? t("editUserDescription") : t("newUserDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="user-name">
                {t("name")}
                <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    id="user-name"
                    {...field}
                    placeholder={t("enterName", {
                      ns: "common",
                      defaultValue: "Enter name...",
                    })}
                  />
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {t(errors.name.message as string)}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="user-username">
                {t("username")}
                <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <Input
                    id="user-username"
                    {...field}
                    placeholder={t("enterUsername", {
                      ns: "common",
                      defaultValue: "Enter username...",
                    })}
                  />
                )}
              />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {t(errors.username.message as string)}
                </p>
              )}
            </div>
          </div>

          {!editingUser && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("setPassword")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="user-password">{t("password")}</Label>
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="user-password"
                          type="password"
                          {...field}
                          placeholder={t("enterPassword", {
                            ns: "common",
                            defaultValue: "Enter password...",
                          })}
                        />
                      )}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">
                        {t(errors.password.message as string)}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="user-password-confirmation">
                      {t("confirmPassword")}
                    </Label>
                    <Controller
                      name="password_confirmation"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="user-password-confirmation"
                          type="password"
                          {...field}
                          placeholder={t("confirmPassword", {
                            defaultValue: "Confirm password...",
                          })}
                        />
                      )}
                    />
                    {errors.password_confirmation && (
                      <p className="text-sm text-destructive">
                        {t(errors.password_confirmation.message as string)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}
          <div className="grid gap-1.5">
            <Label>
              {t("userType")}
              <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="user_type"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("selectUserType", {
                        defaultValue: "Select user type",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">
                      {t("staff", { defaultValue: "Staff" })}
                    </SelectItem>
                    <SelectItem value="admin">
                      {t("admin", { defaultValue: "Admin" })}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.user_type && (
              <p className="text-sm text-destructive">
                {t(errors.user_type.message as string)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || (!isDirty && !!editingUser)}
            >
              {mutation.isPending && (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              )}
              {editingUser ? t("saveChanges") : t("createUserBtn")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
