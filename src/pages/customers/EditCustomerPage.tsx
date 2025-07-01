// src/pages/customers/EditCustomerPage.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, PlusCircle } from 'lucide-react';

import { CustomerTypeFormModal } from '@/features/customers/components/CustomerTypeFormModal';
import type { CustomerFormData, Customer, CustomerType } from '@/types';
import { getCustomerById, updateCustomer } from '@/api/customerService';
import { getCustomerTypes } from '@/api/customerTypeService';

// Zod schema
const customerSchema = z.object({
  name: z.string().nonempty({ message: "validation.nameRequired" }).min(2, { message: "validation.nameMin" }),
  email: z.string().email({ message: "validation.emailInvalid" }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  customer_type_id: z.union([z.string(), z.number(), z.null()]).optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const EditCustomerPage: React.FC = () => {
    const { t } = useTranslation(['common', 'customers', 'validation']);
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

    // --- Data Fetching ---
    const { data: customerTypes = [], isLoading: isLoadingTypes } = useQuery<CustomerType[], Error>({
        queryKey: ['customerTypesForSelect'],
        queryFn: getCustomerTypes,
    });

    const { data: existingCustomer, isLoading: isLoadingCustomer, error: loadingError } = useQuery<Customer, Error>({
        queryKey: ['customer', id],
        queryFn: () => getCustomerById(id!),
        enabled: !!id,
    });

    // --- Form Setup ---
    const { control, register, handleSubmit, formState: { errors, isDirty }, reset, setValue } = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
    });

    useEffect(() => {
        if (existingCustomer) {
            reset({
                name: existingCustomer.name,
                email: existingCustomer.email || '',
                phone: existingCustomer.phone || '',
                address: existingCustomer.address || '',
                notes: existingCustomer.notes || '',
                customer_type_id: existingCustomer.customer_type_id?.toString() || '',
            });
        }
    }, [existingCustomer, reset]);

    // --- Mutations ---
    const mutation = useMutation<Customer, Error, CustomerFormData>({
        mutationFn: (data) => {
             const payload = { ...data, customer_type_id: data.customer_type_id ? parseInt(data.customer_type_id as string, 10) : null };
             return updateCustomer(id!, payload)
        },
        onSuccess: (data) => {
            toast.success(t('customerUpdatedSuccess', { ns: 'customers', name: data.name }));
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customer', id] });
            queryClient.invalidateQueries({ queryKey: ['customersForSelect'] });
            navigate('/customers');
        },
        onError: (error) => {
            toast.error(error.message || t('customerUpdateFailed', { ns: 'customers' }));
        }
    });

    const onSubmit = (data: CustomerFormValues) => {
        const payload: CustomerFormData = {
            ...data,
            customer_type_id: data.customer_type_id ? parseInt(data.customer_type_id as string, 10) : null,
        };
        mutation.mutate(payload);
    };

    // --- Render Logic ---
    if (isLoadingCustomer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">{t('loading', { ns: 'common' })}</p>
            </div>
        );
    }
    
    if (loadingError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-sm text-destructive">{t('errorLoading', { ns: 'common' })}</p>
                <Button onClick={() => window.location.reload()} className="mt-2">
                    {t('tryAgain', { ns: 'common' })}
                </Button>
            </div>
        );
    }
    
    if (!existingCustomer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-sm text-muted-foreground">{t('customerNotFound', { ns: 'customers' })}</p>
                <Button onClick={() => navigate('/customers')} className="mt-2">
                    {t('backToCustomers', { ns: 'customers' })}
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-2xl mx-auto">
                <div className="mb-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/customers">
                            <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                            {t('backToCustomers', { ns: 'customers' })}
                        </Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('editCustomerTitle', { ns: 'customers', name: existingCustomer.name })}</CardTitle>
                        <CardDescription>{t('editCustomerDescription', { ns: 'customers' })}</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4">
                            {/* Name, Email, Phone fields */}
                             <div className="grid gap-1.5">
                                <Label htmlFor="name">{t('name')}<span className="text-destructive">*</span></Label>
                                <Input id="name" {...register('name')} />
                                {errors.name && <p className="text-sm text-destructive">{t(errors.name.message as string)}</p>}
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="email">{t('emailOptional')}</Label>
                                    <Input id="email" type="email" {...register('email')} />
                                    {errors.email && <p className="text-sm text-destructive">{t(errors.email.message as string)}</p>}
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="phone">{t('phoneOptional', {ns:'customers'})}</Label>
                                    <Input id="phone" type="tel" {...register('phone')} />
                                </div>
                            </div>
                            
                            {/* Customer Type Field with Quick Add */}
                             <div className="grid gap-1.5">
                                <Label htmlFor="customer_type_id">{t('customerTypeOptional', {ns:'customers'})}</Label>
                                <div className="flex items-center gap-2">
                                    <Controller
                                        name="customer_type_id"
                                        control={control}
                                        render={({ field }) => (
                                            <Select 
                                                onValueChange={field.onChange} 
                                                value={field.value?.toString() || ''} 
                                                disabled={isLoadingTypes}
                                            >
                                                <SelectTrigger id="customer_type_id">
                                                    <SelectValue placeholder={isLoadingTypes ? t('loading') : t('selectCustomerType', { ns: 'customers' })} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">{t('noneUnit', {ns:'services'})}</SelectItem>
                                                    {customerTypes.map(type => (
                                                        <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    <Button type="button" variant="outline" size="icon" onClick={() => setIsTypeModalOpen(true)}>
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                                {errors.customer_type_id && <p className="text-sm text-destructive">{t(errors.customer_type_id.message as string)}</p>}
                            </div>
                            
                            {/* Address & Notes fields */}
                            <div className="grid gap-1.5">
                                <Label htmlFor="address">{t('addressOptional', { ns: 'customers' })}</Label>
                                <Textarea id="address" {...register('address')} rows={2} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="notes">{t('notesOptional')}</Label>
                                <Textarea id="notes" {...register('notes')} rows={2} placeholder={t('customerNotesPlaceholder', {ns: 'customers'})} />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => navigate('/customers')} disabled={mutation.isPending}>
                                {t('cancel')}
                            </Button>
                            <Button type="submit" disabled={mutation.isPending || !isDirty}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />}
                                {t('saveChanges')}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
            {/* Render the modal */}
             <CustomerTypeFormModal
                isOpen={isTypeModalOpen}
                onOpenChange={setIsTypeModalOpen}
                onSuccess={(newType: CustomerType) => {
                    setValue('customer_type_id', newType.id.toString(), { shouldDirty: true });
                }}
            />
        </>
    );
};

export default EditCustomerPage;