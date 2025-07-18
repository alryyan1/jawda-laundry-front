// src/pages/purchases/NewPurchasePage.tsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { PurchaseFormData, Supplier } from '@/types';
import { purchaseStatusOptions } from '@/types';
import { createPurchase } from '@/api/purchaseService';
import { getAllSuppliers } from '@/api/supplierService';
import { formatCurrency } from '@/lib/formatters';
import { useCurrency } from '@/hooks/useCurrency';

// Zod schemas for validation
const purchaseItemSchema = z.object({
    id: z.string(),
    item_name: z.string().nonempty({ message: "validation.itemNameRequired" }),
    description: z.string().optional().or(z.literal('')),
    quantity: z.preprocess(
        val => parseInt(String(val), 10) || 1,
        z.number({ invalid_type_error: "validation.quantityMustBeNumber" }).min(1, { message: "validation.quantityMin" })
    ),
    unit: z.string().optional().or(z.literal('')),
    unit_price: z.preprocess(
        val => parseFloat(String(val).replace(/,/g, '')) || 0,
        z.number({ invalid_type_error: "validation.priceMustBeNumber" }).min(0, { message: "validation.priceNonNegative" })
    ),
});

const purchaseFormSchema = z.object({
    supplier_id: z.string().min(1, { message: "validation.supplierRequired" }),
    reference_number: z.string().optional().or(z.literal('')),
    purchase_date: z.string().nonempty({ message: "validation.dateRequired" }),
    status: z.enum(purchaseStatusOptions as [string, ...string[]]),
    notes: z.string().optional().or(z.literal('')),
    items: z.array(purchaseItemSchema).min(1, { message: "validation.atLeastOneItem" }),
});


const NewPurchasePage: React.FC = () => {
    const { t, i18n } = useTranslation(['common', 'purchases', 'validation']);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { currencyCode } = useCurrency();

    const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery<Supplier[], Error>({
        queryKey: ['allSuppliers'],
        queryFn: getAllSuppliers,
    });

    const methods = useForm<PurchaseFormData>({
        resolver: zodResolver(purchaseFormSchema),
        defaultValues: {
            purchase_date: format(new Date(), 'yyyy-MM-dd'),
            status: 'received',
            items: [],
            reference_number: '',
            notes: ''
        },
    });
    const { control, register, handleSubmit, watch, formState: { errors } } = methods;

    const { fields, append, remove } = useFieldArray({ control, name: "items" });

    const watchedItems = watch("items");

    const totalAmount = useMemo(() => {
        return watchedItems.reduce((sum, item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unit_price) || 0;
            return sum + (qty * price);
        }, 0);
    }, [watchedItems]);

    const mutation = useMutation<any, Error, PurchaseFormData>({
        mutationFn: createPurchase,
        onSuccess: (data) => {
            toast.success(t('purchaseCreatedSuccess', {ns: 'purchases'}));
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            navigate('/purchases'); // Or to the new purchase's detail page: `/purchases/${data.id}`
        },
        onError: (error) => {
            toast.error(error.message || t('purchaseActionFailed', {ns: 'purchases'}));
        }
    });

    const onSubmit = (data: PurchaseFormData) => {
        mutation.mutate(data);
    };

    return (
        <FormProvider {...methods}>
            <div className="max-w-4xl mx-auto pb-10">
                <div className="mb-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/purchases"><ArrowLeft className="mr-2 h-4 w-4" />{t('backToPurchases', {ns:'purchases'})}</Link>
                    </Button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('newPurchaseTitle', {ns:'purchases'})}</CardTitle>
                            <CardDescription>{t('newPurchaseDescription', {ns:'purchases'})}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                                <div className="grid gap-1.5 lg:col-span-2">
                                    <Label htmlFor="supplier_id">{t('supplier', {ns:'purchases'})}<span className="text-destructive">*</span></Label>
                                    <Controller name="supplier_id" control={control} render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingSuppliers}>
                                            <SelectTrigger id="supplier_id"><SelectValue placeholder={isLoadingSuppliers ? t('loading') : t('selectSupplier', {ns:'purchases'})} /></SelectTrigger>
                                            <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    )} />
                                    {errors.supplier_id && <p className="text-sm text-destructive">{t(errors.supplier_id.message as string)}</p>}
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="purchase_date">{t('purchaseDate', {ns:'purchases'})}<span className="text-destructive">*</span></Label>
                                    <Controller name="purchase_date" control={control} render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(new Date(field.value), 'PPP') : <span>{t('pickADate')}</span>}</Button></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')} /></PopoverContent>
                                        </Popover>
                                    )} />
                                    {errors.purchase_date && <p className="text-sm text-destructive">{t(errors.purchase_date.message as string)}</p>}
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="status">{t('status')}<span className="text-destructive">*</span></Label>
                                    <Controller name="status" control={control} render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>{purchaseStatusOptions.map(opt => <SelectItem key={opt} value={opt}>{t(`status_${opt}`, {ns:'purchases'})}</SelectItem>)}</SelectContent>
                                        </Select>
                                    )} />
                                </div>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="reference_number">{t('referenceOptional', {ns:'purchases'})}</Label>
                                <Input id="reference_number" {...register('reference_number')} placeholder={t('referencePlaceholder', {ns:'purchases'})}/>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium">{t('items', {ns:'common'})}</h3>
                                    <Button type="button" size="sm" variant="outline" onClick={() => append({ id: uuidv4(), item_name: '', quantity: 1, unit: '', unit_price: '' })}>
                                        <PlusCircle className="mr-2 h-4 w-4" />{t('addItem', {ns:'orders'})}
                                    </Button>
                                </div>

                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-12 gap-x-3 gap-y-2 items-start p-3 border rounded-md bg-muted/30">
                                        <div className="col-span-12 sm:col-span-4 grid gap-1.5">
                                            <Label htmlFor={`items.${index}.item_name`} className="text-xs">{t('itemName', {ns:'purchases'})}</Label>
                                            <Input {...register(`items.${index}.item_name`)} placeholder={t('itemNamePlaceholder', {ns:'purchases'})} />
                                            {errors.items?.[index]?.item_name && <p className="text-xs text-destructive">{t(errors.items[index]?.item_name?.message as string)}</p>}
                                        </div>
                                        <div className="col-span-4 sm:col-span-2 grid gap-1.5">
                                            <Label htmlFor={`items.${index}.quantity`} className="text-xs">{t('quantity', {ns:'services'})}</Label>
                                            <Input type="number" {...register(`items.${index}.quantity`)} placeholder="1" />
                                            {errors.items?.[index]?.quantity && <p className="text-xs text-destructive">{t(errors.items[index]?.quantity?.message as string)}</p>}
                                        </div>
                                        <div className="col-span-4 sm:col-span-2 grid gap-1.5">
                                            <Label htmlFor={`items.${index}.unit`} className="text-xs">{t('unit', {ns:'purchases'})}</Label>
                                            <Input {...register(`items.${index}.unit`)} placeholder={t('unitPlaceholder', {ns:'purchases'})} />
                                        </div>
                                        <div className="col-span-4 sm:col-span-3 grid gap-1.5">
                                            <Label htmlFor={`items.${index}.unit_price`} className="text-xs">{t('unitPrice', {ns:'orders'})}</Label>
                                            <Input type="number" step="0.01" {...register(`items.${index}.unit_price`)} placeholder="0.00" />
                                             {errors.items?.[index]?.unit_price && <p className="text-xs text-destructive">{t(errors.items[index]?.unit_price?.message as string)}</p>}
                                        </div>
                                        <div className="col-span-12 sm:col-span-1 flex items-end h-full">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive h-9 w-9 self-end">
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">{t('removeItem')}</span>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {errors.items && !Array.isArray(errors.items) && <p className="text-sm text-destructive">{t(errors.items.message as string)}</p>}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="notes">{t('notesOptional')}</Label>
                                <Textarea id="notes" {...register('notes')} rows={3} />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center bg-muted/50 p-4 rounded-b-lg">
                            <div className="text-lg font-bold">
                                {t('totalAmount', {ns:'purchases'})}: <span className="text-primary">{formatCurrency(totalAmount, currencyCode, i18n.language)}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => navigate('/purchases')} disabled={mutation.isPending}>{t('cancel')}</Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('createPurchaseBtn', {ns:'purchases'})}
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </FormProvider>
    );
};
export default NewPurchasePage;