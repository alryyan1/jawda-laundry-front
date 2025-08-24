// src/pages/customers/NewCustomerPage.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
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
import { createCustomer } from '@/api/customerService';
import { getCustomerTypes } from '@/api/customerTypeService';



// Update CustomerFormData type if it's separate
// export interface CustomerFormData {
//   name: string;
//   phone: string;
//   address?: string;
//   notes?: string;
//   customer_type_id?: number | string | null;
// }


const NewCustomerPage: React.FC = () => {
    const { t } = useTranslation(['common', 'customers', 'validation']);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

    const { data: customerTypes, isLoading: isLoadingTypes, error: customerTypesError } = useQuery<CustomerType[], Error>({
        queryKey: ['customerTypesForSelect'],
        queryFn: getCustomerTypes,
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Ensure customerTypes is always an array
    const customerTypesArray = customerTypes || [];

    const { control, register, handleSubmit, formState: { errors }, setValue } = useForm<CustomerFormData>({
        defaultValues: { name: '', car_plate_number: '', phone: '', address: '', notes: '', customer_type_id: '' },
    });

    // Custom validation functions that evaluate translations at validation time
    const validateCarPlateNumber = (value: string) => {
        if (!value || value.trim() === '') {
            return t('validation.carPlateNumberRequired', { ns: 'validation' });
        }
        if (value.length < 1) {
            return t('validation.carPlateNumberMin', { ns: 'validation' });
        }
        return true;
    };

    const validateName = (value: string) => {
        if (value && value.trim() !== '' && value.length < 2) {
            return t('validation.nameMin', { ns: 'validation' });
        }
        return true;
    };

    const validatePhone = (value: string) => {
        if (value && value.trim() !== '' && value.length < 7) {
            return t('validation.phoneInvalid', { ns: 'validation' });
        }
        return true;
    };

    const mutation = useMutation<Customer, Error, CustomerFormData>({
        mutationFn: createCustomer,
        onSuccess: (data) => {
            toast.success(t('customerCreatedSuccess', { ns: 'customers', name: data.name }));
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customersForSelect'] });
            navigate('/customers');
        },
        onError: (error) => {
            toast.error(error.message || t('customerCreationFailed', { ns: 'customers' }));
        },
    });

    const onSubmit = (data: CustomerFormData) => {
        const payload: CustomerFormData = {
            ...data,
            customer_type_id: data.customer_type_id ? parseInt(data.customer_type_id as string, 10) : null,
        };
        mutation.mutate(payload);
    };

    return (
        <>
            <div className="container mx-auto px-4 py-6 max-w-4xl">
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
                        <CardTitle>{t('newCustomerTitle', { ns: 'customers' })}</CardTitle>
                        <CardDescription>{t('newCustomerDescription', { ns: 'customers' })}</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="car_plate_number">{t('carPlateNumber', { ns: 'customers', defaultValue: 'Car Plate Number' })}<span className="text-destructive">*</span></Label>
                                <Input 
                                    id="car_plate_number" 
                                    {...register('car_plate_number', { 
                                        validate: validateCarPlateNumber
                                    })} 
                                    placeholder={t('carPlateNumberPlaceholder', { ns: 'customers', defaultValue: 'Enter car plate number' })} 
                                />
                                {errors.car_plate_number && <p className="text-sm text-destructive">{errors.car_plate_number.message}</p>}
                            </div>
                            
                                                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                 <div className="grid gap-2">
                                     <Label htmlFor="name">{t('name')}</Label>
                                     <Input 
                                         id="name" 
                                         {...register('name', { 
                                             validate: validateName
                                         })} 
                                     />
                                     {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                                 </div>
                                 <div className="grid gap-2">
                                     <Label htmlFor="phone">{t('phone', {ns:'customers'})}</Label>
                                     <Input 
                                         id="phone" 
                                         type="tel" 
                                         {...register('phone', { 
                                             validate: validatePhone
                                         })} 
                                     />
                                     {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                                 </div>
                             </div>
                            
                            {/* Customer Type Field with Quick Add Button */}
                            <div className="grid gap-2">
                                <Label htmlFor="customer_type_id">{t('customerTypeOptional', {ns:'customers'})}</Label>
                                {customerTypesError && (
                                    <p className="text-sm text-destructive">
                                        {t('errorLoading', { ns: 'common' })}: {customerTypesError.message}
                                    </p>
                                )}
                                <div className="flex items-center gap-2">
                                    <Controller
                                        name="customer_type_id"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value || ''} disabled={isLoadingTypes}>
                                                <SelectTrigger id="customer_type_id">
                                                    <SelectValue placeholder={isLoadingTypes ? t('loading') : t('selectCustomerType', { ns: 'customers' })} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value=" ">{t('noneUnit', {ns:'services'})}</SelectItem>
                                                    {customerTypesArray && customerTypesArray.length > 0 && customerTypesArray.map(type => (
                                                        <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setIsTypeModalOpen(true)}
                                        aria-label={t('newCustomerTypeTitle', { ns: 'customers' })}
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                                {errors.customer_type_id && <p className="text-sm text-destructive">{t(errors.customer_type_id.message as string)}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">{t('addressOptional', { ns: 'customers' })}</Label>
                                <Textarea id="address" {...register('address')} rows={3} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes">{t('notesOptional')}</Label>
                                <Textarea id="notes" {...register('notes')} rows={3} placeholder={t('customerNotesPlaceholder', {ns: 'customers'})} />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => navigate('/customers')} disabled={mutation.isPending}>
                                {t('cancel')}
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />}
                                {t('createCustomerBtn', { ns: 'customers' })}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
            
            <CustomerTypeFormModal
                isOpen={isTypeModalOpen}
                onOpenChange={setIsTypeModalOpen}
                onSuccess={(newType) => {
                    setValue('customer_type_id', newType.id.toString(), { shouldDirty: true });
                }}
            />
        </>
    );
};
export default NewCustomerPage;