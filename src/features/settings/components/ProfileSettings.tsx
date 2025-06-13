// src/features/settings/components/ProfileSettings.tsx
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/features/auth/hooks/useAuth'; // To get current user and update functions
import { updateUserProfile, UserProfileUpdateData } from '@/api/profileService'; // You'll need to create this service
import { User } from '@/types';

const profileSchema = z.object({
  name: z.string().nonempty({ message: "validation.nameRequired" }).min(2, { message: "validation.nameMin" }),
  email: z.string().email({ message: "validation.emailInvalid" }), // Email might not be updatable or require verification
  // avatar_url: z.string().url().optional().or(z.literal('')), // If you handle avatar uploads
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const ProfileSettings: React.FC = () => {
  const { t } = useTranslation(['settings', 'common', 'validation']);
  const { user, setUser: setAuthUser } = useAuth(); // setUser from useAuth (which calls authStore.setUser)
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    }
  });

  useEffect(() => { // Re-populate form if user object changes (e.g., after initial load)
    if (user) {
      reset({
        name: user.name,
        email: user.email,
      });
    }
  }, [user, reset]);

  const mutation = useMutation<User, Error, UserProfileUpdateData>({
    mutationFn: updateUserProfile,
    onSuccess: (updatedUser) => {
      toast.success(t('profileUpdatedSuccess'));
      setAuthUser(updatedUser); // Update user in global auth store
      queryClient.invalidateQueries({ queryKey: ['authenticatedUser'] }); // If you fetch user with this key elsewhere
      reset(updatedUser); // Reset form with new data to clear isDirty
    },
    onError: (error) => {
      toast.error(error.message || t('profileUpdateFailed'));
    }
  });

  const onSubmit = (data: ProfileFormValues) => {
    // For email change, you might need a separate verification flow.
    // For now, we'll assume email is not changed or backend handles it.
    const updateData: UserProfileUpdateData = { name: data.name };
    if (data.email !== user?.email) {
        // updateData.email = data.email; // Only include email if it's part of UserProfileUpdateData
        toast.info(t('emailChangeNotice', {defaultValue: "Email change requires verification. This feature is illustrative."}));
    }
    mutation.mutate(updateData);
  };

  if (!user) {
    return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profileInformation')}</CardTitle>
        <CardDescription>{t('updateYourProfileDetails')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=128`} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              {/* <Button type="button" variant="outline" disabled>
                {t('changeAvatar')}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">{t('avatarUploadHint')}</p> */}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="profile-name">{t('name', { ns: 'common' })}</Label>
            <Input id="profile-name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{t(errors.name.message as string)}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="profile-email">{t('email', { ns: 'common' })}</Label>
            <Input id="profile-email" type="email" {...register('email')} disabled />
            {/* Email change usually has a more complex flow with verification */}
            {errors.email && <p className="text-sm text-destructive">{t(errors.email.message as string)}</p>}
            <p className="text-xs text-muted-foreground">{t('emailCannotBeChangedHere', {defaultValue: "Email address cannot be changed here."})}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />}
            {t('saveChanges', { ns: 'common' })}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};