// src/pages/admin/roles/RoleFormPage.tsx
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

import { createRole, updateRole, getRoleById, getAllPermissions } from '@/api/roleService';

// Define types since they're not exported from @/types
type Permission = {
    id: number;
    name: string;
    description?: string;
};

type Role = {
    id: number;
    name: string;
    description?: string;
    permissions?: Permission[];
    created_at: string;
    updated_at: string;
};

type RoleFormData = {
    name: string;
    permission_ids: (string | number)[];
};

const roleFormSchema = z.object({
    name: z.string().nonempty({ message: "validation.nameRequired" }).min(3, {message: "validation.roleNameMin"}),
    permission_ids: z.array(z.union([z.string(), z.number()])),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

interface ApiErrorResponse {
    response?: {
        data?: {
            errors?: Record<string, string[]>;
        };
    };
    message?: string;
}

const RoleFormPage: React.FC = () => {
    const { t } = useTranslation(['common', 'admin', 'validation']);
    const navigate = useNavigate();
    const { id: roleId } = useParams<{ id?: string }>();
    const queryClient = useQueryClient();
    const isEditMode = !!roleId;

    const { data: existingRole, isLoading: isLoadingRole } = useQuery<Role, Error>({
        queryKey: ['adminRole', roleId],
        queryFn: () => getRoleById(roleId!),
        enabled: isEditMode,
    });

    const { data: allPermissions = [], isLoading: isLoadingPermissions } = useQuery<Permission[], Error>({
        queryKey: ['allPermissionsForAssignment'],
        queryFn: getAllPermissions,
    });

    const { control, register, handleSubmit, reset, setError, formState: { errors, isDirty } } = useForm<RoleFormValues>({
        resolver: zodResolver(roleFormSchema),
        defaultValues: { name: '', permission_ids: [] },
    });

    useEffect(() => {
        if (isEditMode && existingRole) {
            reset({
                name: existingRole.name,
                permission_ids: existingRole.permissions?.map((p: Permission) => p.id.toString()) || [],
            });
        } else if (!isEditMode) {
            reset({ name: '', permission_ids: [] });
        }
    }, [existingRole, isEditMode, reset]);

    const mutation = useMutation<Role, Error, RoleFormData>({
        mutationFn: (data) => {
            const payload = {
                ...data,
                permission_ids: data.permission_ids.map((id: string | number) => Number(id))
            };
            return isEditMode ? updateRole(roleId!, payload) : createRole(payload);
        },
        onSuccess: (data) => {
            toast.success(isEditMode ? t('roleUpdatedSuccess', {ns:'admin', name: data.name}) : t('roleCreatedSuccess', {ns:'admin', name: data.name}));
            queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
            if(isEditMode) queryClient.invalidateQueries({ queryKey: ['adminRole', roleId] });
            navigate('/admin/roles');
        },
        onError: (error: ApiErrorResponse) => {
            const apiErrors = error.response?.data?.errors;
            if (apiErrors) {
                Object.keys(apiErrors).forEach((key) => {
                    setError(key as keyof RoleFormValues, { type: 'server', message: apiErrors[key][0] });
                });
                toast.error(t('validation.fixErrorsServer', {ns:'validation'}));
            } else {
                toast.error(error.message || (isEditMode ? t('roleUpdateFailed', {ns:'admin'}) : t('roleCreateFailed', {ns:'admin'})));
            }
        }
    });

    const onSubmit: SubmitHandler<RoleFormValues> = (data) => {
        mutation.mutate(data);
    };

    const groupedPermissions = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        allPermissions.forEach((p: Permission) => {
            const groupName = p.name.split('_')[0] || 'other';
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(p);
        });
        return groups;
    }, [allPermissions]);

    if ((isEditMode && isLoadingRole) || isLoadingPermissions) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">{t('loadingRoleData', {ns:'admin'})}</p>
            </div>
        );
    }

    if (isEditMode && !existingRole) {
        return (
            <div className="text-center py-10">
                <p>{t('roleNotFound', {ns:'admin'})}</p>
                <Button asChild className="mt-4">
                    <Link to="/admin/roles">{t('backToRoles', {ns:'admin'})}</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-4">
                <Button variant="outline" size="sm" asChild>
                    <Link to="/admin/roles">
                        <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                        {t('backToRoles', { ns: 'admin', defaultValue: 'Back to Roles' })}
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{isEditMode ? t('editRoleTitle', { ns: 'admin', name: existingRole?.name || '' }) : t('newRoleTitle', { ns: 'admin' })}</CardTitle>
                    <CardDescription>{isEditMode ? t('editRoleDescription', { ns: 'admin' }) : t('newRoleDescription', { ns: 'admin' })}</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        <div className="grid gap-1.5">
                            <Label htmlFor="roleName">{t('roleName', { ns: 'admin' })} <span className="text-destructive">*</span></Label>
                            <Input id="roleName" {...register('name')} />
                            {errors.name && <p className="text-sm text-destructive">{t(errors.name.message as string)}</p>}
                        </div>

                        <Separator />

                        <div>
                            <h3 className="text-lg font-medium mb-3">{t('assignPermissions', {ns:'admin'})}</h3>
                            {isLoadingPermissions && <p>{t('loadingPermissions', {ns:'admin'})}</p>}
                            <Controller
                                name="permission_ids"
                                control={control}
                                render={({ field }) => (
                                    <ScrollArea className="h-72 w-full rounded-md border p-4">
                                        <div className="space-y-4">
                                            {Object.entries(groupedPermissions).map(([groupName, permissionsInGroup]) => (
                                                <div key={groupName}>
                                                    <h4 className="font-semibold mb-2 capitalize text-primary">
                                                        {t(`permissionGroup.${groupName}`, {ns:'admin', defaultValue: groupName.replace(/_/g, ' ') + ' Management'})}
                                                    </h4>
                                                    <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                                        {permissionsInGroup.map((permission: Permission) => (
                                                            <div key={permission.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                                                                <Checkbox
                                                                    id={`perm-${permission.id}`}
                                                                    checked={field.value?.map(String).includes(String(permission.id))}
                                                                    onCheckedChange={(checked) => {
                                                                        const currentValues = field.value || [];
                                                                        const newValues = checked
                                                                            ? [...currentValues, permission.id.toString()]
                                                                            : currentValues.filter(val => String(val) !== String(permission.id));
                                                                        field.onChange(newValues);
                                                                    }}
                                                                />
                                                                <Label htmlFor={`perm-${permission.id}`} className="font-normal cursor-pointer text-sm">
                                                                    {t(`permissions.${permission.name}`, {ns:'admin', defaultValue: permission.name.replace(/_/g, ' ')})}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {Object.keys(groupedPermissions)[Object.keys(groupedPermissions).length - 1] !== groupName && 
                                                        <Separator className="mt-4"/>
                                                    }
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            />
                            {errors.permission_ids && <p className="text-sm text-destructive mt-2">{t(errors.permission_ids.message as string)}</p>}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => navigate('/admin/roles')} disabled={mutation.isPending}>
                            {t('cancel', { ns: 'common' })}
                        </Button>
                        <Button type="submit" disabled={mutation.isPending || (!isDirty && isEditMode)}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />}
                            {isEditMode ? t('saveChanges', { ns: 'common' }) : t('createRoleBtn', { ns: 'admin', defaultValue: 'Create Role' })}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default RoleFormPage;