// src/pages/services/offerings/NewServiceOfferingPage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft } from 'lucide-react';

import type { ProductType, ServiceAction, ServiceOffering, PricingStrategy } from '@/types';
import { getAllProductTypes } from '@/api/productTypeService';
import { getServiceActions } from '@/api/serviceActionService';
import { createServiceOffering } from '@/api/serviceOfferingService';

// Zod Schema for ServiceOfferingFormData
const pricingStrategiesArray: [PricingStrategy, ...PricingStrategy[]] = ['fixed', 'per_unit_product', 'dimension_based', 'customer_specific'];

export const serviceOfferingSchema = z.object({
    product_type_id: z.string().min(1, { message: "validation.productTypeRequired" }),
    service_action_id: z.string().min(1, { message: "validation.serviceActionRequired" }),
    name_override: z.string(),
    description_override: z.string(),
    pricing_strategy: z.enum(pricingStrategiesArray, { required_error: "validation.pricingStrategyRequired" }),
    default_price: z.string().optional(),
    default_price_per_sq_meter: z.string().optional(),
    applicable_unit: z.string(),
    is_active: z.boolean(),
}).refine(data => {
    if (data.pricing_strategy === 'fixed' && !data.default_price) {
        return false;
    }
    if (data.pricing_strategy === 'dimension_based' && !data.default_price_per_sq_meter) {
        return false;
    }
    return true;
}, {
    message: "validation.conditionalPriceRequired",
    path: ["default_price"],
});

type FormData = z.infer<typeof serviceOfferingSchema>;

const NewServiceOfferingPage: React.FC = () => {
    const { t } = useTranslation(['common', 'services', 'validation']);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: productTypes = [], isLoading: isLoadingPT } = useQuery<ProductType[], Error>({
        queryKey: ['allProductTypesForSelect'],
        queryFn: () => getAllProductTypes(),
    });
    const { data: serviceActions = [], isLoading: isLoadingSA } = useQuery<ServiceAction[], Error>({
        queryKey: ['serviceActionsForSelect'],
        queryFn: getServiceActions,
    });

    const { control, register, handleSubmit, formState: { errors }, watch, reset } = useForm<FormData>({
        resolver: zodResolver(serviceOfferingSchema),
        defaultValues: {
            is_active: true,
            pricing_strategy: 'fixed',
            name_override: '',
            description_override: '',
            applicable_unit: '',
            default_price: '',
            default_price_per_sq_meter: '',
            product_type_id: '',
            service_action_id: '',
        }
    });

    const watchedPricingStrategy = watch("pricing_strategy");

    const mutation = useMutation<ServiceOffering, Error, FormData>({
        mutationFn: createServiceOffering,
        onSuccess: (data) => {
            toast.success(t('serviceOfferingCreatedSuccess', { ns: 'services', name: data.display_name }));
            queryClient.invalidateQueries({ queryKey: ['serviceOfferings'] });
            queryClient.invalidateQueries({ queryKey: ['serviceOfferingsForSelect']});
            reset();
            navigate('/service-offerings');
        },
        onError: (error) => {
            toast.error(error.message || t('serviceOfferingCreationFailed', { ns: 'services' }));
        }
    });

    const onSubmit: SubmitHandler<FormData> = (formData) => {
        mutation.mutate(formData);
    };

    const isLoadingDropdowns = isLoadingPT || isLoadingSA;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-4">
                <Button variant="outline" size="sm" asChild>
                    <Link to="/service-offerings">
                        <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                        {t('backToOfferings', { ns: 'services', defaultValue: 'Back to Offerings' })}
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t('newServiceOfferingTitle', { ns: 'services', defaultValue: 'Create New Service Offering' })}</CardTitle>
                    <CardDescription>{t('newServiceOfferingDescription', { ns: 'services', defaultValue: 'Define a specific service for a product type.' })}</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        {/* Product Type */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="product_type_id">{t('productType', {ns:'services'})} <span className="text-destructive">*</span></Label>
                            <Controller name="product_type_id" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingDropdowns}>
                                    <SelectTrigger><SelectValue placeholder={isLoadingPT ? t('loading') : t('selectProductType', {ns:'services'})} /></SelectTrigger>
                                    <SelectContent>{productTypes.map(pt => <SelectItem key={pt.id} value={pt.id.toString()}>{pt.name} ({pt.category?.name || 'N/A'})</SelectItem>)}</SelectContent>
                                </Select>
                            )} />
                            {errors.product_type_id && <p className="text-sm text-destructive">{t(errors.product_type_id.message as string)}</p>}
                        </div>

                        {/* Service Action */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="service_action_id">{t('serviceAction', {ns:'services'})} <span className="text-destructive">*</span></Label>
                            <Controller name="service_action_id" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingDropdowns}>
                                    <SelectTrigger><SelectValue placeholder={isLoadingSA ? t('loading') : t('selectServiceAction', {ns:'services'})} /></SelectTrigger>
                                    <SelectContent>{serviceActions.map(sa => <SelectItem key={sa.id} value={sa.id.toString()}>{sa.name}</SelectItem>)}</SelectContent>
                                </Select>
                            )} />
                            {errors.service_action_id && <p className="text-sm text-destructive">{t(errors.service_action_id.message as string)}</p>}
                        </div>

                        {/* Pricing Strategy */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="pricing_strategy">{t('pricingStrategy', {ns:'services'})} <span className="text-destructive">*</span></Label>
                            <Controller name="pricing_strategy" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue placeholder={t('selectPricingStrategy', {ns:'services'})} /></SelectTrigger>
                                    <SelectContent>
                                        {pricingStrategiesArray.map(ps => (
                                            <SelectItem key={ps} value={ps}>{t(`strategy.${ps}`, {ns: 'services'})}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )} />
                            {errors.pricing_strategy && <p className="text-sm text-destructive">{t(errors.pricing_strategy.message as string)}</p>}
                        </div>

                        {/* Conditional Price Fields */}
                        {watchedPricingStrategy === 'fixed' && (
                            <div className="grid gap-1.5">
                                <Label htmlFor="default_price">{t('defaultPriceForItem', {ns:'services', defaultValue:'Default Price (per item/unit)'})} <span className="text-destructive">*</span></Label>
                                <Input id="default_price" type="number" step="0.01" {...register('default_price')} placeholder="e.g., 10.50" />
                                {errors.default_price && <p className="text-sm text-destructive">{t(errors.default_price.message as string)}</p>}
                            </div>
                        )}
                        {watchedPricingStrategy === 'dimension_based' && (
                            <div className="grid gap-1.5">
                                <Label htmlFor="default_price_per_sq_meter">{t('defaultPricePerSqMeter', {ns:'services'})} <span className="text-destructive">*</span></Label>
                                <Input id="default_price_per_sq_meter" type="number" step="0.01" {...register('default_price_per_sq_meter')} placeholder="e.g., 5.00" />
                                {errors.default_price_per_sq_meter && <p className="text-sm text-destructive">{t(errors.default_price_per_sq_meter.message as string)}</p>}
                            </div>
                        )}
                         {watchedPricingStrategy === 'per_unit_product' && ( // Typically for kg, piece if quantity varies
                            <div className="grid gap-1.5">
                                <Label htmlFor="default_price">{t('defaultPricePerUnit', {ns:'services', defaultValue:'Default Price (per defined unit)'})} <span className="text-destructive">*</span></Label>
                                <Input id="default_price" type="number" step="0.01" {...register('default_price')} placeholder="e.g., 7.25"/>
                                {errors.default_price && <p className="text-sm text-destructive">{t(errors.default_price.message as string)}</p>}
                            </div>
                        )}
                        {/* For customer_specific, default prices might be optional or a base rate */}


                        {/* Optional Overrides & Details */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="name_override">{t('nameOverrideOptional', {ns:'services', defaultValue:'Name Override (Optional)'})}</Label>
                            <Input id="name_override" {...register('name_override')} placeholder={t('nameOverridePlaceholder', {ns:'services', defaultValue: 'e.g., Premium T-Shirt Wash'})} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="description_override">{t('descriptionOverrideOptional', {ns:'services', defaultValue:'Description Override (Optional)'})}</Label>
                            <Textarea id="description_override" {...register('description_override')} rows={2} />
                        </div>
                        <div className="grid gap-1.5">
                             <Label htmlFor="applicable_unit">{t('applicableUnitOptional', {ns:'services', defaultValue:'Applicable Unit (e.g., item, kg, sq_meter - Optional)'})}</Label>
                            <Input id="applicable_unit" {...register('applicable_unit')} placeholder={t('applicableUnitPlaceholder', {ns:'services', defaultValue:'Defaults to product type unit if empty'})} />
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Controller
                                name="is_active"
                                control={control}
                                render={({ field }) => (
                                    <Switch
                                        id="is_active"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label htmlFor="is_active">{t('isActive', {ns:'services', defaultValue:'Active Offering'})}</Label>
                        </div>
                         {errors.root?.message && <p className="text-sm text-destructive">{t(errors.root.message as string)}</p>} {/* For refine error */}


                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => navigate('/service-offerings')} disabled={mutation.isPending}>
                            {t('cancel', { ns: 'common' })}
                        </Button>
                        <Button type="submit" disabled={mutation.isPending || isLoadingDropdowns}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />}
                            {t('createOfferingBtn', { ns: 'services', defaultValue: 'Create Offering' })}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};
export default NewServiceOfferingPage;