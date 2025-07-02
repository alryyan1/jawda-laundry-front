// src/features/settings/components/ProfileSettings.tsx
import React, { useEffect } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { updateUserProfile } from "@/api/profileService";
import type { UserProfileUpdateData } from "@/api/profileService";
import type { User } from "@/types";

// Zod schema for this specific form's validation
const profileSchema = z.object({
  name: z
    .string()
    .nonempty({ message: "validation.nameRequired" })
    .min(2, { message: "validation.nameMin" }),
  email: z.string().email(), // Email is read-only, but kept in form state for context
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const ProfileSettings: React.FC = () => {
  const { t } = useTranslation(["settings", "common", "validation"]);
  const { user, setUser: setAuthUser, fetchUser } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  // Effect to pre-fill the form once the user object is available from the auth store
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
      });
    } else {
      // If the page loads and user isn't in the store yet (e.g., from a deep link/refresh)
      // trigger a fetch. The useAuth hook will eventually update `user` and re-run this effect.
      fetchUser();
    }
  }, [user, reset, fetchUser]);

  const mutation = useMutation<User, Error, UserProfileUpdateData>({
    mutationFn: updateUserProfile,
    onSuccess: (updatedUser) => {
      toast.success(t("profileUpdatedSuccess"));
      setAuthUser(updatedUser); // Update user in global Zustand store
      reset(updatedUser); // Reset form with new data to clear isDirty state
    },
    onError: (error) => {
      toast.error(error.message || t("profileUpdateFailed"));
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    // We only send the fields that can actually be changed
    const updateData: UserProfileUpdateData = { name: data.name };
    mutation.mutate(updateData);
  };

  // Show a loading skeleton while the initial user object is being fetched
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-20 w-20 rounded-full" />
          </div>
          <div className="grid gap-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-32" />
        </CardFooter>
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
            <div>
              <p className="text-sm text-muted-foreground">
                {t("avatarHint", {
                  defaultValue: "Avatars are generated automatically.",
                })}
              </p>
              {/* <Button type="button" variant="outline" disabled>{t('changeAvatar')}</Button>
              <p className="text-xs text-muted-foreground mt-1">{t('avatarUploadHint')}</p> */}
            </div>
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
            {t("updateProfileBtn", { defaultValue: "Update Profile" })}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
