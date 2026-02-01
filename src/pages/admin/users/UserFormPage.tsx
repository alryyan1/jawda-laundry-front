// src/pages/admin/users/UserFormPage.tsx
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";

import type { User } from "@/types";
import type { UserFormData } from "@/api/userService";
import {
  createUserAsAdmin,
  updateUserAsAdmin,
  getUserById,
} from "@/api/userService";

// Define API error response type
type ApiErrorResponse = {
  response?: {
    data?: {
      errors?: Record<string, string[]>;
    };
  };
  message?: string;
};

const userFormSchemaBase = {
  name: z
    .string()
    .nonempty({ message: "validation.nameRequired" })
    .min(2, { message: "validation.nameMin" }),
  username: z
    .string()
    .nonempty({ message: "validation.usernameRequired" })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "validation.usernameInvalid" }),
  email: z
    .string()
    .nonempty({ message: "validation.emailRequired" })
    .email({ message: "validation.emailInvalid" }),
  user_type: z.enum(["admin", "staff"], {
    required_error: "validation.roleRequired",
  }),
};

const newUserSchema = z
  .object({
    ...userFormSchemaBase,
    password: z.string().min(8, { message: "validation.passwordMin" }),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "validation.passwordsDoNotMatch",
    path: ["password_confirmation"],
  });

const editUserSchema = z
  .object({
    ...userFormSchemaBase,
    password: z.string().optional().or(z.literal("")),
    password_confirmation: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) =>
      !data.password ||
      (data.password && data.password === data.password_confirmation),
    {
      message: "validation.passwordsDoNotMatchIfChanging",
      path: ["password_confirmation"],
    },
  );

const UserFormPage: React.FC = () => {
  const { t } = useTranslation(["common", "admin", "auth", "validation"]);
  const navigate = useNavigate();
  const { id: userId } = useParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const isEditMode = !!userId;

  const { data: existingUser, isLoading: isLoadingUser } = useQuery<
    User,
    Error
  >({
    queryKey: ["adminUser", userId],
    queryFn: () => getUserById(userId!),
    enabled: isEditMode,
  });

  const currentSchema = isEditMode ? editUserSchema : newUserSchema;
  type UserFormValues = z.infer<typeof currentSchema>;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
    setError,
  } = useForm<UserFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      password_confirmation: "",
      user_type: "staff",
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (isEditMode && existingUser) {
      reset({
        name: existingUser.name,
        username: existingUser.username,
        email: existingUser.email,
        password: "",
        password_confirmation: "",
        user_type: existingUser.user_type || "staff",
      });
    }
  }, [existingUser, isEditMode, reset]);

  const mutation = useMutation<User, Error, UserFormData>({
    mutationFn: (data) =>
      isEditMode ? updateUserAsAdmin(userId!, data) : createUserAsAdmin(data),
    onSuccess: (data) => {
      toast.success(
        isEditMode
          ? t("userUpdatedSuccess", { ns: "admin", name: data.name })
          : t("userCreatedSuccess", { ns: "admin", name: data.name }),
      );
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      if (isEditMode)
        queryClient.invalidateQueries({ queryKey: ["adminUser", userId] });
      navigate("/admin/users");
    },
    onError: (error: ApiErrorResponse) => {
      const apiErrors = error.response?.data?.errors;
      if (apiErrors) {
        Object.keys(apiErrors).forEach((key) => {
          setError(key as keyof UserFormValues, {
            type: "server",
            message: apiErrors[key][0],
          });
        });
        toast.error(t("validation.fixErrorsServer", { ns: "validation" }));
      } else {
        toast.error(
          error.message ||
            (isEditMode
              ? t("userUpdateFailed", { ns: "admin" })
              : t("userCreateFailed", { ns: "admin" })),
        );
      }
    },
  });

  const onSubmit = (data: UserFormValues) => {
    const payload: UserFormData = {
      name: data.name,
      username: data.username,
      email: data.email,
      user_type: data.user_type,
    };
    if (data.password && data.password.length > 0) {
      payload.password = data.password;
      payload.password_confirmation = data.password_confirmation;
    }

    mutation.mutate(payload);
  };

  if (isEditMode && isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg">{t("loading", { ns: "common" })}</p>
      </div>
    );
  }

  if (isEditMode && !existingUser) {
    return (
      <div className="text-center py-10">
        <p className="text-lg">{t("userNotFound", { ns: "admin" })}</p>
        <Button asChild className="mt-4">
          <Link to="/admin/users">{t("backToUsers", { ns: "admin" })}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t("backToUsers", { ns: "admin", defaultValue: "Back to Users" })}
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode
              ? t("editUserTitle", {
                  ns: "admin",
                  name: existingUser?.name || "",
                })
              : t("newUserTitle", { ns: "admin" })}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? t("editUserDescription", { ns: "admin" })
              : t("newUserDescription", { ns: "admin" })}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="userName">
                {t("name", { ns: "common" })}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input id="userName" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {t(errors.name.message as string)}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="userUsername">
                {t("username", { ns: "admin" })}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input id="userUsername" {...register("username")} />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {t(errors.username.message as string)}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="userEmail">
                {t("email", { ns: "common" })}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input id="userEmail" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {t(errors.email.message as string)}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label>
                {t("userType", { defaultValue: "User Type" })}
                <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="user_type"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="userPassword">
                  {isEditMode
                    ? t("newPasswordOptional", { ns: "auth" })
                    : t("password", { ns: "common" })}{" "}
                  {!isEditMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="userPassword"
                  type="password"
                  {...register("password")}
                  placeholder={
                    isEditMode
                      ? t("leaveBlankToKeepCurrent", { ns: "auth" })
                      : ""
                  }
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {t(errors.password.message as string)}
                  </p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="userPasswordConfirmation">
                  {isEditMode
                    ? t("confirmNewPasswordOptional", { ns: "auth" })
                    : t("confirmPassword", { ns: "common" })}{" "}
                  {!isEditMode && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="userPasswordConfirmation"
                  type="password"
                  {...register("password_confirmation")}
                />
                {errors.password_confirmation && (
                  <p className="text-sm text-destructive">
                    {t(errors.password_confirmation.message as string)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/users")}
              disabled={mutation.isPending}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || (!isDirty && isEditMode)}
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
              )}
              {isEditMode
                ? t("saveChanges", { ns: "common" })
                : t("createUser", { ns: "admin" })}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default UserFormPage;
