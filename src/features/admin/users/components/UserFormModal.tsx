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
const userFormSchema = z.object({
  name: z.string().nonempty({ message: "validation.nameRequired" }),
  username: z.string().nonempty({ message: "validation.usernameRequired" }).regex(/^[a-zA-Z0-9_-]+$/, { message: "validation.usernameInvalid" }),
  email: z.string().email({ message: "validation.emailInvalid" }),
  role_ids: z.array(z.number()).min(1, { message: "validation.roleRequired" }),
  password: z.string().optional(),
  password_confirmation: z.string().optional(),
})

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
        defaultValues: { name: '', username: '', email: '', password: '', password_confirmation: '', role_ids: [] }
    });
    
    // Debug logging to see what's happening with role_ids
    console.log('Form errors:', errors);
    console.log('Form values:', control._formValues);
    console.log('role_ids details:', {
        value: control._formValues.role_ids,
        type: typeof control._formValues.role_ids,
        isArray: Array.isArray(control._formValues.role_ids),
        length: control._formValues.role_ids?.length,
        items: control._formValues.role_ids?.map((item: unknown, index: number) => ({
            index,
            value: item,
            type: typeof item
        }))
    });
    useEffect(() => {
        if (isOpen) {
            if (editingUser) {
                // Handle both Role objects and string role names
                const roleIds = editingUser.roles.map(role => {
                    if (typeof role === 'string') {
                        // Find the role ID by name from the available roles
                        const foundRole = roles.find(r => r.name === role);
                        return foundRole?.id || 0;
                    }
                    return role.id;
                }).filter(id => id !== 0); // Remove any roles that weren't found
                
                reset({
                    name: editingUser.name,
                    username: editingUser.username,
                    email: editingUser.email,
                    role_ids: roleIds,
                });
            } else {
                reset({ name: '', username: '', email: '', role_ids: [] });
            }
        }
    }, [editingUser, isOpen, reset, roles]);

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
        console.log('Form data being submitted:', data);
        console.log('role_ids type:', typeof data.role_ids, 'value:', data.role_ids);
        
        // Ensure role_ids is an array of numbers
        const roleIds = Array.isArray(data.role_ids) 
            ? data.role_ids.map(id => Number(id)).filter(id => !isNaN(id))
            : [];
        
        const payload: Partial<UserFormData> = { 
            name: data.name, 
            username: data.username, 
            email: data.email, 
            role_ids: roleIds
        };
        
        // Only include password in the payload if it's provided and not empty
        if (data.password && data.password.trim() !== '') {
            payload.password = data.password;
            payload.password_confirmation = data.password_confirmation;
        }
        
        console.log('Final payload:', payload);
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
                            <Label htmlFor="user-username">{t('username')}<span className="text-destructive">*</span></Label>
                            <Controller
                                name="username"
                                control={control}
                                render={({ field }) => (
                                    <Input 
                                        id="user-username" 
                                        {...field}
                                        placeholder={t('enterUsername', { ns: 'common', defaultValue: 'Enter username...' })}
                                    />
                                )}
                            />
                            {errors.username && <p className="text-sm text-destructive">{t(errors.username.message as string)}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {!editingUser && (
                        <>
                            <Separator/>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">{t('setPassword')}</p>
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
                                                    placeholder={t('enterPassword', { ns: 'common', defaultValue: 'Enter password...' })}
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
                        </>
                    )}
                    <div className="grid gap-1.5">
                        <Label>{t('roles')}<span className="text-destructive">*</span></Label>
                        <ScrollArea className="h-40 rounded-md border p-4">
                            {isLoadingRoles ? <Loader2 className="animate-spin"/> : (
                                <Controller 
                                    name="role_ids" 
                                    control={control} 
                                    render={({ field }) => {
                                        // Ensure field.value is always an array of numbers
                                        const currentRoles = Array.isArray(field.value) 
                                            ? field.value.map(id => Number(id)).filter(id => !isNaN(id))
                                            : [];
                                        
                                        return (
                                            <div className="space-y-2">
                                                {roles.map(role => (
                                                    <div key={role.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`role-${role.id}`}
                                                            checked={currentRoles.includes(role.id)}
                                                            onCheckedChange={(checked) => {
                                                                const newRoles = checked 
                                                                    ? [...currentRoles, role.id] 
                                                                    : currentRoles.filter(id => id !== role.id);
                                                                field.onChange(newRoles);
                                                            }}
                                                        />
                                                        <Label htmlFor={`role-${role.id}`} className="font-normal capitalize cursor-pointer">{role.name}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }} 
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