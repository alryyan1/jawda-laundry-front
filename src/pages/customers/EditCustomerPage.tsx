// src/pages/customers/EditCustomerPage.tsx
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft } from 'lucide-react';

import { CustomerFormData, getCustomerById, updateCustomer } from '@/api/customerService';
import { Customer } from '@/types';

// Same Zod schema as NewCustomerPage
const customerSchema = z.object({
  name: z.string().nonempty({ message: "validation.nameRequired" }).min(2, { message: "validation.nameMin" }),
  email: z.string().email({ message: "validation.emailInvalid" }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

const EditCustomerPage: React.FC = () => {
  const { t } = useTranslation(['common', 'customers', 'validation']);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: customer, isLoading: isLoadingCustomer, error: customerLoadingError } = useQuery<Customer, Error>({
    queryKey: ['customer', id],
    queryFn: () => getCustomerById(id!),
    enabled: !!id,
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        notes: customer.notes || '',
      });
    }
  }, [customer, reset]);

  const mutation = useMutation<Customer, Error, CustomerFormData>({
    mutationFn: (data) => updateCustomer(id!, data),
    onSuccess: (data) => {
      toast.success(t('customerUpdatedSuccess', { ns: 'customers', name: data.name }));
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customersForSelect'] });
      navigate('/customers');
    },
    onError: (error) => {
      toast.error(error.message || t('customerUpdateFailed', { ns: 'customers' }));
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    mutation.mutate(data);
  };

  if (isLoadingCustomer) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ms-2">{t('loadingCustomerData', { ns: 'customers' })}</p>
    </div>
  );

  if (customerLoadingError) return (
    <div className="text-center py-10">
        <p className="text-destructive text-lg">{t('errorLoading', { ns: 'common' })}</p>
        <p className="text-muted-foreground">{customerLoadingError.message}</p>
        <Button onClick={() => queryClient.refetchQueries({queryKey: ['customer', id]})} className="mt-4">{t('retry', {ns:'common'})}</Button>
    </div>
  );

  if (!customer) return (
    <div className="text-center py-10">
        <p className="text-lg">{t('customerNotFound', { ns: 'customers' })}</p>
        <Button asChild className="mt-4"><Link to="/customers">{t('backToCustomers', {ns:'customers'})}</Link></Button>
    </div>
  );

  return (
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
          <CardTitle>{t('editCustomerTitle', { ns: 'customers', name: customer.name })}</CardTitle>
          <CardDescription>{t('editCustomerDescription', { ns: 'customers' })}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Form fields are identical to NewCustomerPage */}
            <div className="grid gap-1.5">
              <Label htmlFor="name">{t('name', { ns: 'common' })} <span className="text-destructive">*</span></Label>
              <Input id="name" {...register('name')} aria-invalid={errors.name ? "true" : "false"} />
              {errors.name && <p className="text-sm text-destructive">{t(errors.name.message as string)}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email">{t('emailOptional', { ns: 'common' })}</Label>
                <Input id="email" type="email" {...register('email')} aria-invalid={errors.email ? "true" : "false"} />
                {errors.email && <p className="text-sm text-destructive">{t(errors.email.message as string)}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="phone">{t('phoneOptional', { ns: 'customers' })}</Label>
                <Input id="phone" type="tel" {...register('phone')} />
                {errors.phone && <p className="text-sm text-destructive">{t(errors.phone.message as string)}</p>}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="address">{t('addressOptional', { ns: 'customers' })}</Label>
              <Textarea id="address" {...register('address')} rows={3} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="notes">{t('notesOptional', { ns: 'common' })}</Label>
              <Textarea id="notes" {...register('notes')} rows={3} placeholder={t('customerNotesPlaceholder', {ns: 'customers'})} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/customers')} disabled={mutation.isPending}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />}
              {t('saveChanges', { ns: 'common' })}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default EditCustomerPage;