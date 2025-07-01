// src/features/settings/components/AccountSettings.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

import { updateUserPassword, ChangePasswordData } from "@/api/profileService";

const passwordSchema = z
  .object({
    current_password: z
      .string()
      .nonempty({ message: "validation.currentPasswordRequired" }),
    password: z.string().min(8, { message: "validation.passwordMin" }),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "validation.passwordsDoNotMatch",
    path: ["password_confirmation"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export const AccountSettings: React.FC = () => {
  const { t } = useTranslation(["settings", "common", "validation", "auth"]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const mutation = useMutation<{ message: string }, Error, ChangePasswordData>({
    mutationFn: updateUserPassword,
    onSuccess: (data) => {
      toast.success(data.message || t("passwordUpdatedSuccess"));
      reset();
    },
    onError: (error: any) => {
      const backendError =
        error.response?.data?.errors?.current_password?.[0] ||
        error.response?.data?.errors?.password?.[0] ||
        error.response?.data?.message;
      toast.error(backendError || error.message || t("passwordUpdateFailed"));
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("changePasswordTitle")}</CardTitle>
        <CardDescription>{t("changePasswordDescription")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <CardContent className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="current_password">
              {t("currentPassword", { ns: "auth" })}
            </Label>
            <Input
              id="current_password"
              type="password"
              {...register("current_password")}
            />
            {errors.current_password && (
              <p className="text-sm text-destructive">
                {t(errors.current_password.message as string)}
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="new_password">
              {t("newPassword", { ns: "auth" })}
            </Label>
            <Input
              id="new_password"
              type="password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {t(errors.password.message as string)}
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirm_new_password">
              {t("confirmNewPassword", { ns: "auth" })}
            </Label>
            <Input
              id="confirm_new_password"
              type="password"
              {...register("password_confirmation")}
            />
            {errors.password_confirmation && (
              <p className="text-sm text-destructive">
                {t(errors.password_confirmation.message as string)}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
            )}
            {t("updatePasswordBtn")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
