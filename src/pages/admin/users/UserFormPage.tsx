// src/pages/admin/users/UserFormPage.tsx
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

import type { User } from '@/types';
import type { UserFormData } from '@/api/userService';
import { createUserAsAdmin, updateUserAsAdmin, getUserById } from '@/api/userService';
import { getAllRoles } from '@/api/roleService';

// Define Role type since it's not exported from @/types
type Role = {
    id: number;
    name: string;
    description?: string;
};

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
    name: z.string().nonempty({ message: "validation.nameRequired" }).min(2, { message: "validation.nameMin" }),
    email: z.string().nonempty({ message: "validation.emailRequired" }).email({ message: "validation.emailInvalid" }),
    role_ids: z.array(z.union([z.string(), z.number()])).optional(),
};

const newUserSchema = z.object({
    ...userFormSchemaBase,
    password: z.string().min(8, { message: "validation.passwordMin" }),
    password_confirmation: z.string(),
}).refine(data => data.password === data.password_confirmation, {
    message: "validation.passwordsDoNotMatch",
    path: ["password_confirmation"],
});

const editUserSchema = z.object({
    ...userFormSchemaBase,
    password: z.string().optional().or(z.literal('')),
    password_confirmation: z.string().optional().or(z.literal('')),
}).refine(data => !data.password || (data.password && data.password === data.password_confirmation), {
    message: "validation.passwordsDoNotMatchIfChanging",
    path: ["password_confirmation"],
});

const UserFormPage: React.FC = () => {
    const { t } = useTranslation(['common', 'admin', 'auth', 'validation']);
    const navigate = useNavigate();
    const { id: userId } = useParams<{ id?: string }>();
    const queryClient = useQueryClient();
    const isEditMode = !!userId;

    const { data: existingUser, isLoading: isLoadingUser } = useQuery<User, Error>({
        queryKey: ['adminUser', userId],
        queryFn: () => getUserById(userId!),
        enabled: isEditMode,
    });

    const { data: allRoles = [], isLoading: isLoadingRoles } = useQuery<Role[], Error>({
        queryKey: ['allRolesForAssignment'],
        queryFn: getAllRoles,
    });

    const currentSchema = isEditMode ? editUserSchema : newUserSchema;
    type UserFormValues = z.infer<typeof currentSchema>;

    const { control, register, handleSubmit, reset, formState: { errors, isDirty }, setError } = useForm<UserFormValues>({
        resolver: zodResolver(currentSchema),
        defaultValues: { name: '', email: '', password: '', password_confirmation: '', role_ids: [] },
    });

    useEffect(() => {
        if (isEditMode && existingUser) {
            reset({
                name: existingUser.name,
                email: existingUser.email,
                password: '',
                password_confirmation: '',
                role_ids: Array.isArray(existingUser.role) 
                    ? existingUser.role.map((role: Role) => role.id.toString())
                    : [],
            });
        }
    }, [existingUser, isEditMode, reset]);

    const mutation = useMutation<User, Error, UserFormData>({
        mutationFn: (data) => isEditMode ? updateUserAsAdmin(userId!, data) : createUserAsAdmin(data),
        onSuccess: (data) => {
            toast.success(isEditMode ? t('userUpdatedSuccess', {ns:'admin', name: data.name}) : t('userCreatedSuccess', {ns:'admin', name: data.name}));
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            if(isEditMode) queryClient.invalidateQueries({ queryKey: ['adminUser', userId] });
            navigate('/admin/users');
        },
        onError: (error: ApiErrorResponse) => {
            const apiErrors = error.response?.data?.errors;
            if (apiErrors) {
                Object.keys(apiErrors).forEach((key) => {
                    setError(key as keyof UserFormValues, { type: 'server', message: apiErrors[key][0] });
                });
                toast.error(t('validation.fixErrorsServer', {ns:'validation'}));
            } else {
                toast.error(error.message || (isEditMode ? t('userUpdateFailed', {ns:'admin'}) : t('userCreateFailed', {ns:'admin'})));
            }
        }
    });

    const onSubmit = (data: UserFormValues) => {
        const payload: UserFormData = {
            name: data.name,
            email: data.email,
            role_ids: data.role_ids?.map(id => Number(id)),
        };
        if (data.password && data.password.length > 0) {
            payload.password = data.password;
            payload.password_confirmation = data.password_confirmation;
        }
        mutation.mutate(payload);
    };

    if ((isEditMode && isLoadingUser) || isLoadingRoles) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-lg">{t('loading', { ns: 'common' })}</p>
            </div>
        );
    }

    if (isEditMode && !existingUser) {
        return (
            <div className="text-center py-10">
                <p className="text-lg">{t('userNotFound', { ns: 'admin' })}</p>
                <Button asChild className="mt-4">
                    <Link to="/admin/users">{t('backToUsers', { ns: 'admin' })}</Link>
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
                        {t('backToUsers', { ns: 'admin', defaultValue: 'Back to Users' })}
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{isEditMode ? t('editUserTitle', { ns: 'admin', name: existingUser?.name || '' }) : t('newUserTitle', { ns: 'admin' })}</CardTitle>
                    <CardDescription>{isEditMode ? t('editUserDescription', { ns: 'admin' }) : t('newUserDescription', { ns: 'admin' })}</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="userName">{t('name', { ns: 'common' })} <span className="text-destructive">*</span></Label>
                            <Input id="userName" {...register('name')} />
                            {errors.name && <p className="text-sm text-destructive">{t(errors.name.message as string)}</p>}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="userEmail">{t('email', { ns: 'common' })} <span className="text-destructive">*</span></Label>
                            <Input id="userEmail" type="email" {...register('email')} />
                            {errors.email && <p className="text-sm text-destructive">{t(errors.email.message as string)}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="userPassword">{isEditMode ? t('newPasswordOptional', {ns:'auth'}) : t('password', {ns:'common'})} { !isEditMode && <span className="text-destructive">*</span>}</Label>
                                <Input id="userPassword" type="password" {...register('password')} placeholder={isEditMode ? t('leaveBlankToKeepCurrent', {ns:'auth'}) : ''} />
                                {errors.password && <p className="text-sm text-destructive">{t(errors.password.message as string)}</p>}
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="userPasswordConfirmation">{isEditMode ? t('confirmNewPasswordOptional', {ns:'auth'}) : t('confirmPassword', {ns:'common'})} { !isEditMode && <span className="text-destructive">*</span>}</Label>
                                <Input id="userPasswordConfirmation" type="password" {...register('password_confirmation')} />
                                {errors.password_confirmation && <p className="text-sm text-destructive">{t(errors.password_confirmation.message as string)}</p>}
                            </div>
                        </div>
                        <Separator className="my-6"/>
                        <div>
                            <h3 className="text-lg font-medium mb-2">{t('assignRoles', {ns:'admin'})}</h3>
                            <Controller
                                name="role_ids"
                                control={control}
                                render={({ field }) => (
                                    <div className="space-y-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                                        {allRoles.map(role => (
                                            <div key={role.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                                                <Checkbox
                                                    id={`role-${role.id}`}
                                                    checked={field.value?.map(String).includes(String(role.id))}
                                                    onCheckedChange={(checked) => {
                                                        const currentValues = field.value || [];
                                                        const newValues = checked
                                                            ? [...currentValues, role.id.toString()]
                                                            : currentValues.filter(val => String(val) !== String(role.id));
                                                        field.onChange(newValues);
                                                    }}
                                                />
                                                <Label htmlFor={`role-${role.id}`} className="font-normal cursor-pointer">{role.name}</Label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            />
                            {errors.role_ids && <p className="text-sm text-destructive mt-2">{t(errors.role_ids.message as string)}</p>}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => navigate('/admin/users')} disabled={mutation.isPending}>
                            {t('cancel', { ns: 'common' })}
                        </Button>
                        <Button type="submit" disabled={mutation.isPending || (!isDirty && isEditMode)}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />}
                            {isEditMode ? t('saveChanges', { ns: 'common' }) : t('createUser', { ns: 'admin' })}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default UserFormPage;