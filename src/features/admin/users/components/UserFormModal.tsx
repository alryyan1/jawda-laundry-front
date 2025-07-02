// src/features/admin/users/components/UserFormModal.tsx
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type { User, Role, UserFormData } from '@/types';
import { getRoles, createUser, updateUser } from '@/api/adminService';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

// Zod schema for validation
const userFormSchemaBase = z.object({
  name: z.string().nonempty({ message: "validation.nameRequired" }),
  email: z.string().email({ message: "validation.emailInvalid" }),
  role_ids: z.array(z.number()).min(1, { message: "validation.roleRequired" }),
});

const userFormSchema = userFormSchemaBase.extend({
    password: z.string().optional().or(z.literal('')),
    password_confirmation: z.string().optional().or(z.literal('')),
}).refine(data => {
    // If password is provided, it must be valid and confirmed
    if (data.password) {
        return data.password.length >= 8 && data.password === data.password_confirmation;
    }
    return true; // Pass if no password is being set
}, {
    // This logic provides different messages based on which condition failed
    message: "validation.passwordsDoNotMatch", // Default message
    path: ["password_confirmation"],
    // A more advanced refine could return different messages, but this is a good start
}).refine(data => {
    // This refine is specifically for the password length if it exists
    if(data.password && data.password.length < 8) {
        return false;
    }
    return true;
}, {
    message: "validation.passwordMin",
    path: ["password"],
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser?: User | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onOpenChange, editingUser }) => {
    const { t } = useTranslation(['admin', 'common', 'validation']);
    const queryClient = useQueryClient();

    const { data: roles = [], isLoading: isLoadingRoles } = useQuery<Role[], Error>({
        queryKey: ['allRoles'],
        queryFn: getRoles,
    });

    const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: { name: '', email: '', password: '', password_confirmation: '', role_ids: [] }
    });

    useEffect(() => {
        if (isOpen) {
            if (editingUser) {
                reset({
                    name: editingUser.name,
                    email: editingUser.email,
                    role_ids: editingUser.roles.map(role => role.id),
                    password: '',
                    password_confirmation: '',
                });
            } else {
                reset({ name: '', email: '', password: '', password_confirmation: '', role_ids: [] });
            }
        }
    }, [editingUser, isOpen, reset]);

    const mutation = useMutation<User, Error, Partial<UserFormData>>({
        mutationFn: (data) => editingUser ? updateUser(editingUser.id, data) : createUser(data as UserFormData),
        onSuccess: () => {
            toast.success(editingUser ? t('userUpdatedSuccess') : t('userCreatedSuccess'));
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onOpenChange(false);
        },
        onError: (error) => { toast.error(error.message || t('userActionFailed')); }
    });

    const onSubmit = (data: UserFormValues) => {
        const payload: Partial<UserFormData> = { name: data.name, email: data.email, role_ids: data.role_ids };
        // Only include password in the payload if it's being set/changed
        if (data.password) {
            payload.password = data.password;
            payload.password_confirmation = data.password_confirmation;
        }
        mutation.mutate(payload);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editingUser ? t('editUserTitle') : t('newUserTitle')}</DialogTitle>
                    <DialogDescription>{editingUser ? t('editUserDescription') : t('newUserDescription')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="user-name">{t('name')}<span className="text-destructive">*</span></Label>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <Input 
                                        id="user-name" 
                                        {...field} 
                                        placeholder={t('enterName', { ns: 'common', defaultValue: 'Enter name...' })}
                                    />
                                )}
                            />
                            {errors.name && <p className="text-sm text-destructive">{t(errors.name.message as string)}</p>}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="user-email">{t('email')}<span className="text-destructive">*</span></Label>
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <Input 
                                        id="user-email" 
                                        type="email" 
                                        {...field}
                                        placeholder={t('enterEmail', { ns: 'common', defaultValue: 'Enter email...' })}
                                    />
                                )}
                            />
                            {errors.email && <p className="text-sm text-destructive">{t(errors.email.message as string)}</p>}
                        </div>
                    </div>
                    <Separator/>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">{editingUser ? t('changePasswordOptional') : t('setPassword')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="grid gap-1.5">
                                <Label htmlFor="user-password">{t('password')}</Label>
                                <Controller
                                    name="password"
                                    control={control}
                                    render={({ field }) => (
                                        <Input 
                                            id="user-password" 
                                            type="password" 
                                            {...field}
                                            placeholder={editingUser ? t('leaveBlankToKeep', { ns: 'common', defaultValue: 'Leave blank to keep current' }) : t('enterPassword', { ns: 'common', defaultValue: 'Enter password...' })}
                                        />
                                    )}
                                />
                                {errors.password && <p className="text-sm text-destructive">{t(errors.password.message as string)}</p>}
                            </div>
                             <div className="grid gap-1.5">
                                <Label htmlFor="user-password-confirmation">{t('confirmPassword')}</Label>
                                <Controller
                                    name="password_confirmation"
                                    control={control}
                                    render={({ field }) => (
                                        <Input 
                                            id="user-password-confirmation" 
                                            type="password" 
                                            {...field}
                                            placeholder={t('confirmPassword', { defaultValue: 'Confirm password...' })}
                                        />
                                    )}
                                />
                                {errors.password_confirmation && <p className="text-sm text-destructive">{t(errors.password_confirmation.message as string)}</p>}
                            </div>
                        </div>
                    </div>
                    <Separator/>
                    <div className="grid gap-1.5">
                        <Label>{t('roles')}<span className="text-destructive">*</span></Label>
                        <ScrollArea className="h-40 rounded-md border p-4">
                            {isLoadingRoles ? <Loader2 className="animate-spin"/> : (
                                <Controller 
                                    name="role_ids" 
                                    control={control} 
                                    render={({ field }) => (
                                        <div className="space-y-2">
                                            {roles.map(role => (
                                                <div key={role.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`role-${role.id}`}
                                                        checked={field.value?.includes(role.id)}
                                                        onCheckedChange={(checked) => {
                                                            const currentRoles = field.value || [];
                                                            const newRoles = checked ? [...currentRoles, role.id] : currentRoles.filter(id => id !== role.id);
                                                            field.onChange(newRoles);
                                                        }}
                                                    />
                                                    <Label htmlFor={`role-${role.id}`} className="font-normal capitalize cursor-pointer">{role.name}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    )} 
                                />
                            )}
                        </ScrollArea>
                        {errors.role_ids && <p className="text-sm text-destructive">{t(errors.role_ids.message as string)}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>{t('cancel')}</Button>
                        <Button type="submit" disabled={mutation.isPending || (!isDirty && !!editingUser)}>
                            {mutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />} 
                            {editingUser ? t('saveChanges') : t('createUserBtn')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};