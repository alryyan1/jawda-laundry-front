// src/features/admin/users/components/UserFormModal.tsx
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type { User, Role } from '@/types';
import { getRoles, createUser, updateUser } from '@/api/adminService';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

const userSchema = z.object({
  name: z.string().nonempty({ message: "validation.nameRequired" }),
  email: z.string().email({ message: "validation.emailInvalid" }),
  password: z.string().min(8, { message: "validation.passwordMin" }).optional().or(z.literal('')),
  password_confirmation: z.string().optional().or(z.literal('')),
  role_ids: z.array(z.number()).min(1, { message: "validation.roleRequired" }),
}).refine(data => data.password === data.password_confirmation, {
  message: "validation.passwordsDoNotMatch", path: ["password_confirmation"],
});

type UserFormValues = z.infer<typeof userSchema>;

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

    const { control, register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: { name: '', email: '', password: '', password_confirmation: '', role_ids: [] }
    });

    useEffect(() => {
        if (editingUser && isOpen) {
            reset({
                name: editingUser.name,
                email: editingUser.email,
                role_ids: editingUser.roles.map(role => role.id), // Assuming roles have IDs
                password: '',
                password_confirmation: '',
            });
        } else if (!isOpen) {
            reset();
        }
    }, [editingUser, isOpen, reset]);

    const mutation = useMutation<User, Error, any>({
        mutationFn: (data) => editingUser ? updateUser(editingUser.id, data) : createUser(data),
        onSuccess: () => {
            toast.success(editingUser ? t('userUpdatedSuccess') : t('userCreatedSuccess'));
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onOpenChange(false);
        },
        onError: (error) => { toast.error(error.message || t('userActionFailed')); }
    });

    const onSubmit = (data: UserFormValues) => {
        const payload: any = { name: data.name, email: data.email, roles: data.role_ids };
        if (data.password) { // Only send password if it's being set/changed
            payload.password = data.password;
            payload.password_confirmation = data.password_confirmation;
        }
        mutation.mutate(payload);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingUser ? t('editUserTitle') : t('newUserTitle')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Name, Email, Password fields */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="user-name">{t('name')}</Label><Input id="user-name" {...register('name')} />
                        {errors.name && <p className="text-sm text-destructive">{t(errors.name.message as string)}</p>}
                    </div>
                    {/* ... other inputs ... */}

                    {/* Role Assignment */}
                    <div className="grid gap-1.5">
                        <Label>{t('roles')}</Label>
                        <Controller name="role_ids" control={control} render={({ field }) => (
                            <div className="space-y-2 rounded-md border p-4">
                                {isLoadingRoles ? <Loader2 className="animate-spin" /> : roles.map(role => (
                                    <div key={role.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`role-${role.id}`}
                                            checked={field.value?.includes(role.id)}
                                            onCheckedChange={(checked) => {
                                                const newValue = checked
                                                    ? [...field.value, role.id]
                                                    : field.value?.filter(id => id !== role.id);
                                                field.onChange(newValue);
                                            }}
                                        />
                                        <Label htmlFor={`role-${role.id}`} className="font-normal">{role.name}</Label>
                                    </div>
                                ))}
                            </div>
                        )} />
                        {errors.role_ids && <p className="text-sm text-destructive">{t(errors.role_ids.message as string)}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>{t('cancel')}</Button>
                        <Button type="submit" disabled={mutation.isPending || (!isDirty && !!editingUser)}>{mutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />}{editingUser ? t('saveChanges') : t('createUserBtn')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};