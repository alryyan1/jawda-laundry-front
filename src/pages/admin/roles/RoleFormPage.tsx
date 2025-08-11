// src/pages/admin/roles/RoleFormPage.tsx
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowLeft, Shield, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { createRole, updateRole, getRoleById, getAllPermissions } from '@/api/roleService';

// Types
interface Permission {
    id: number;
    name: string;
    description?: string;
}

interface Role {
    id: number;
    name: string;
    description?: string;
    permissions?: Permission[];
    created_at: string;
    updated_at: string;
}

interface RoleFormData {
    name: string;
    permission_ids: (string | number)[];
}

interface ApiErrorResponse {
    response?: {
        data?: {
            errors?: Record<string, string[]>;
        };
    };
    message?: string;
}

// Validation Schema
const roleFormSchema = z.object({
    name: z.string()
        .min(1, { message: "validation.nameRequired" })
        .min(3, { message: "validation.roleNameMin" })
        .max(50, { message: "validation.roleNameMax" }),
    permission_ids: z.array(z.union([z.string(), z.number()])),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

const RoleFormPage: React.FC = () => {
    const { t } = useTranslation(['common', 'admin', 'validation']);
    const navigate = useNavigate();
    const { id: roleId } = useParams<{ id?: string }>();
    const queryClient = useQueryClient();
    const isEditMode = !!roleId;

    // Queries
    const { data: existingRole, isLoading: isLoadingRole } = useQuery<Role, Error>({
        queryKey: ['adminRole', roleId],
        queryFn: () => getRoleById(roleId!),
        enabled: isEditMode,
    });

    const { data: allPermissions = [], isLoading: isLoadingPermissions } = useQuery<Permission[], Error>({
        queryKey: ['allPermissionsForAssignment'],
        queryFn: getAllPermissions,
    });

    // Form
    const { 
        control, 
        handleSubmit, 
        reset, 
        setError, 
        watch,
        formState: { errors, isDirty, isValid } 
    } = useForm<RoleFormValues>({
        resolver: zodResolver(roleFormSchema),
        defaultValues: { name: '', permission_ids: [] },
        mode: 'onChange',
    });

    const watchedPermissionIds = watch('permission_ids');

    // Reset form when role data loads
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

    // Mutation
    const mutation = useMutation<Role, Error, RoleFormData>({
        mutationFn: (data) => {
            const payload = {
                ...data,
                permission_ids: data.permission_ids.map((id: string | number) => Number(id))
            };
            return isEditMode ? updateRole(roleId!, payload) : createRole(payload);
        },
        onSuccess: (data) => {
            const successMessage = isEditMode 
                ? t('roleUpdatedSuccess', { name: data.name })
                : t('roleCreatedSuccess', { name: data.name });
            
            toast.success(successMessage);
            queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
            if (isEditMode) {
                queryClient.invalidateQueries({ queryKey: ['adminRole', roleId] });
            }
            navigate('/admin/roles');
        },
        onError: (error: ApiErrorResponse) => {
            const apiErrors = error.response?.data?.errors;
            if (apiErrors) {
                Object.keys(apiErrors).forEach((key) => {
                    setError(key as keyof RoleFormValues, { 
                        type: 'server', 
                        message: apiErrors[key][0] 
                    });
                });
                toast.error(t('validation.fixErrorsServer'));
            } else {
                const errorMessage = isEditMode 
                    ? t('roleUpdateFailed')
                    : t('roleCreateFailed');
                toast.error(error.message || errorMessage);
            }
        }
    });

    // Loading states
    if ((isEditMode && isLoadingRole) || isLoadingPermissions) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">{t('loadingRoleData')}</p>
            </div>
        );
    }

    // Role not found
    if (isEditMode && !existingRole) {
        return (
            <div className="text-center py-10">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">{t('roleNotFound')}</p>
                <p className="text-muted-foreground mb-4">{t('roleNotFoundDescription')}</p>
                <Button asChild>
                    <Link to="/admin/roles">{t('backToRoles')}</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                    <Link to="/admin/roles">
                        <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                        {t('backToRoles')}
                    </Link>
                </Button>
                {isEditMode && existingRole && (
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">|</span>
                        <span className="font-medium">{existingRole.name}</span>
                    </div>
                )}
            </div>

            <Card className="w-full">
                <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
                    <CardContent className="space-y-8">
                        {/* Permissions */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    {t('assignPermissions') || 'Assign Permissions'}
                                </h3>
                                <Badge variant="secondary">
                                    {watchedPermissionIds?.length || 0} {t('selected') || 'selected'}
                                </Badge>
                            </div>

                            {isLoadingPermissions ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <p className="ml-2">{t('loadingPermissions') || 'Loading permissions...'}</p>
                                </div>
                            ) : (
                                <div className="max-h-96 overflow-y-auto border rounded-lg">
                                    <Controller
                                        name="permission_ids"
                                        control={control}
                                        render={({ field }) => (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-12">#</TableHead>
                                                        <TableHead>{t('permission') || 'Permission'}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {allPermissions.map((permission, permIndex) => (
                                                        <TableRow key={permission.id}>
                                                            <TableCell className="font-medium">
                                                                {permIndex + 1}
                                                            </TableCell>
                                                            <TableCell>
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
                                                                <Label 
                                                                    htmlFor={`perm-${permission.id}`} 
                                                                    className="font-normal cursor-pointer ml-2"
                                                                >
                                                                    {t(`permissions.${permission.name}`, { 
                                                                        defaultValue: permission.name.replace(/_/g, ' ') 
                                                                    })}
                                                                </Label>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    />
                                </div>
                            )}

                            {errors.permission_ids && (
                                <p className="text-sm text-destructive">
                                    {t(errors.permission_ids.message as string)}
                                </p>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-end gap-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => navigate('/admin/roles')} 
                            disabled={mutation.isPending}
                        >
                            {t('cancel')}
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={mutation.isPending || (!isDirty && isEditMode) || !isValid}
                        >
                            {mutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
                            )}
                            {isEditMode ? t('saveChanges') : t('createRoleBtn')}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default RoleFormPage;