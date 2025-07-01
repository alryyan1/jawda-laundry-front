// src/features/settings/components/ProfileSettings.tsx
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { updateUserProfile, UserProfileUpdateData } from "@/api/profileService";
import { User } from "@/types";

const profileSchema = z.object({
  name: z
    .string()
    .nonempty({ message: "validation.nameRequired" })
    .min(2, { message: "validation.nameMin" }),
  email: z.string().email({ message: "validation.emailInvalid" }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const ProfileSettings: React.FC = () => {
  const { t } = useTranslation(["settings", "common", "validation"]);
  const { user, setUser: setAuthUser } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" },
  });

  useEffect(() => {
    if (user) {
      reset({ name: user.name, email: user.email });
    }
  }, [user, reset]);

  const mutation = useMutation<User, Error, UserProfileUpdateData>({
    mutationFn: updateUserProfile,
    onSuccess: (updatedUser) => {
      toast.success(t("profileUpdatedSuccess"));
      setAuthUser(updatedUser); // Update user in global auth store
      reset(updatedUser); // Reset form with new data to clear isDirty state
    },
    onError: (error) => {
      toast.error(error.message || t("profileUpdateFailed"));
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    const updateData: UserProfileUpdateData = { name: data.name };
    mutation.mutate(updateData);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profileInformation")}</CardTitle>
        <CardDescription>{t("updateYourProfileDetails")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={
                  user.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.name
                  )}&background=random&size=128`
                }
                alt={user.name}
              />
              <AvatarFallback>
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* <div>
              <Button type="button" variant="outline" disabled>{t('changeAvatar')}</Button>
              <p className="text-xs text-muted-foreground mt-1">{t('avatarUploadHint')}</p>
            </div> */}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="profile-name">{t("name", { ns: "common" })}</Label>
            <Input id="profile-name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">
                {t(errors.name.message as string)}
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="profile-email">
              {t("email", { ns: "common" })}
            </Label>
            <Input
              id="profile-email"
              type="email"
              value={user.email}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              {t("emailCannotBeChangedHere")}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
            )}
            {t("saveChanges", { ns: "common" })}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
