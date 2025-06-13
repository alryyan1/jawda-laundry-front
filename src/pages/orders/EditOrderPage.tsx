// src/pages/orders/EditOrderPage.tsx
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Feature Components
import { OrderItemsManager } from '@/features/orders/components/OrderItemsManager';
import { OrderOverallDetails } from '@/features/orders/components/OrderOverallDetails';
import { OrderSummaryAndActions } from '@/features/orders/components/OrderSummaryAndActions';

import type {
    ProductType,
    ServiceOffering,
    NewOrderFormData,
    Order,
    OrderItem as BackendOrderItem,
    OrderItemFormLine
} from '@/types';

// API services
import { getAllProductTypes } from '@/api/productTypeService';
import { getAllServiceOfferingsForSelect } from '@/api/serviceOfferingService';
import { getOrderById, updateOrder, getOrderItemQuote } from '@/api/orderService';
import { useDebounce } from '@/hooks/useDebounce';

// Define types for quote-related data
type QuoteItemPayload = {
    service_offering_id: string;
    customer_id: string;
    quantity: number;
    length_meters?: number;
    width_meters?: number;
};

type QuoteItemResponse = {
    calculated_price_per_unit_item: number;
    sub_total: number;
    applied_unit: string;
};

// Define the schema here since it's not found in the imported file
const newOrderFormSchema = z.object({
    customer_id: z.string().min(1, { message: "validation.customerRequired" }),
    items: z.array(z.object({
        id: z.string(),
        product_type_id: z.string().min(1, { message: "validation.productTypeRequired" }),
        service_action_id: z.string().min(1, { message: "validation.serviceActionRequired" }),
        quantity: z.number().min(1, { message: "validation.quantityMin" }),
        product_description_custom: z.string().optional(),
        length_meters: z.string().optional(),
        width_meters: z.string().optional(),
        notes: z.string().optional(),
        _derivedServiceOffering: z.any().optional(),
        _pricingStrategy: z.string().optional(),
        _quoted_price_per_unit_item: z.number().nullable().optional(),
        _quoted_sub_total: z.number().nullable().optional(),
        _quoted_applied_unit: z.string().nullable().optional(),
        _isQuoting: z.boolean().optional(),
        _quoteError: z.string().nullable().optional(),
    })).min(1, { message: "validation.atLeastOneItem" }),
    notes: z.string().optional(),
    due_date: z.string().optional(),
});

const EditOrderPage: React.FC = () => {
    const { t } = useTranslation(['common', 'orders', 'customers', 'services', 'validation']);
    const navigate = useNavigate();
    const { id: orderId } = useParams<{ id: string }>();
    const queryClient = useQueryClient();

    // --- Data Fetching for dropdowns & existing order ---
    const { data: existingOrder, isLoading: isLoadingExistingOrder, error: existingOrderError } = useQuery<Order, Error>({
        queryKey: ['order', orderId],
        queryFn: () => getOrderById(orderId!),
        enabled: !!orderId,
    });

    const { data: productTypes = [], isLoading: isLoadingPT } = useQuery<ProductType[], Error>({
        queryKey: ['allProductTypesForSelect'],
        queryFn: () => getAllProductTypes(),
    });

    const { data: allServiceOfferings = [], isLoading: isLoadingSO } = useQuery<ServiceOffering[], Error>({
        queryKey: ['allServiceOfferingsForSelect'],
        queryFn: () => getAllServiceOfferingsForSelect(),
    });

    const isLoadingPagePrerequisites = isLoadingPT || isLoadingSO;

    // --- Form Setup ---
    const methods = useForm<NewOrderFormData>({
        resolver: zodResolver(newOrderFormSchema),
        defaultValues: { customer_id: '', items: [], notes: '', due_date: '' }
    });
    const { control, handleSubmit, formState: { errors }, setValue, getValues, reset, setError, register } = methods;

    // Pre-fill form when existingOrder data is loaded
    useEffect(() => {
        if (existingOrder && allServiceOfferings.length > 0 && productTypes.length > 0) {
            const formItems: OrderItemFormLine[] = existingOrder.items.map((backendItem: BackendOrderItem) => {
                const offeringDetails = allServiceOfferings.find(so => so.id === backendItem.service_offering_id) || backendItem.serviceOffering;

                return {
                    id: uuidv4(),
                    product_type_id: offeringDetails?.productType?.id.toString() || '',
                    service_action_id: offeringDetails?.serviceAction?.id.toString() || '',
                    product_description_custom: backendItem.product_description_custom || '',
                    quantity: backendItem.quantity,
                    length_meters: backendItem.length_meters !== null && backendItem.length_meters !== undefined ? backendItem.length_meters.toString() : '',
                    width_meters: backendItem.width_meters !== null && backendItem.width_meters !== undefined ? backendItem.width_meters.toString() : '',
                    notes: backendItem.notes || '',
                    _derivedServiceOffering: offeringDetails || null,
                    _pricingStrategy: offeringDetails?.pricing_strategy || null,
                    _quoted_price_per_unit_item: backendItem.calculated_price_per_unit_item,
                    _quoted_sub_total: backendItem.sub_total,
                    _quoted_applied_unit: offeringDetails?.applicable_unit || null,
                    _isQuoting: false,
                    _quoteError: null,
                };
            });

            reset({
                customer_id: existingOrder.customer_id.toString(),
                items: formItems,
                notes: existingOrder.notes || '',
                due_date: existingOrder.due_date ? format(new Date(existingOrder.due_date), 'yyyy-MM-dd') : '',
            });
        }
    }, [existingOrder, allServiceOfferings, productTypes, reset]);

    const watchedAllItems = useWatch({ control, name: "items" });
    const watchedCustomerId = useWatch({ control, name: "customer_id" });

    // --- Quote Mutation ---
    const quoteItemMutation = useMutation<QuoteItemResponse, Error, { itemIndex: number; payload: QuoteItemPayload }>({
        mutationFn: async ({ payload }) => getOrderItemQuote(payload),
        onSuccess: (data, variables) => {
            setValue(`items.${variables.itemIndex}._quoted_price_per_unit_item`, data.calculated_price_per_unit_item);
            setValue(`items.${variables.itemIndex}._quoted_sub_total`, data.sub_total);
            setValue(`items.${variables.itemIndex}._quoted_applied_unit`, data.applied_unit);
            setValue(`items.${variables.itemIndex}._isQuoting`, false);
            setValue(`items.${variables.itemIndex}._quoteError`, null);
        },
        onError: (error, variables) => {
            const errorMessage = error.message || t('quoteFailedForItemGeneric', { ns: 'orders' });
            setValue(`items.${variables.itemIndex}._isQuoting`, false);
            setValue(`items.${variables.itemIndex}._quoted_price_per_unit_item`, null);
            setValue(`items.${variables.itemIndex}._quoted_sub_total`, null);
            setValue(`items.${variables.itemIndex}._quoted_applied_unit`, null);
            setValue(`items.${variables.itemIndex}._quoteError`, errorMessage);
        }
    });

    const debouncedWatchedItems = useDebounce(watchedAllItems, 1000);

    // --- Effect for Deriving Service Offering & Triggering Quotes ---
    useEffect(() => {
        if (!debouncedWatchedItems?.length || !allServiceOfferings?.length || !watchedCustomerId) {
            return;
        }

        debouncedWatchedItems.forEach((watchedItemState, index) => {
            const currentFormItem = getValues(`items.${index}`);
            if (!currentFormItem) return;

            // Only proceed if the item has changed
            const hasItemChanged = 
                currentFormItem.product_type_id !== watchedItemState.product_type_id ||
                currentFormItem.service_action_id !== watchedItemState.service_action_id ||
                currentFormItem.quantity !== watchedItemState.quantity ||
                currentFormItem.length_meters !== watchedItemState.length_meters ||
                currentFormItem.width_meters !== watchedItemState.width_meters;

            if (!hasItemChanged) return;

            let newOffering: ServiceOffering | null = null;
            if (watchedItemState.product_type_id && watchedItemState.service_action_id) {
                newOffering = allServiceOfferings.find(so =>
                    so.productType?.id.toString() === watchedItemState.product_type_id &&
                    so.serviceAction?.id.toString() === watchedItemState.service_action_id
                ) || null;
            }

            if (currentFormItem._derivedServiceOffering?.id !== newOffering?.id) {
                setValue(`items.${index}._derivedServiceOffering`, newOffering, { shouldValidate: true });
                setValue(`items.${index}._pricingStrategy`, newOffering?.pricing_strategy || null);
                if (newOffering?.pricing_strategy !== 'dimension_based') {
                    setValue(`items.${index}.length_meters`, '');
                    setValue(`items.${index}.width_meters`, '');
                }
                setValue(`items.${index}._quoted_price_per_unit_item`, null);
                setValue(`items.${index}._quoted_sub_total`, null);
                setValue(`items.${index}._quoted_applied_unit`, null);
                setValue(`items.${index}._quoteError`, null);
                setValue(`items.${index}._isQuoting`, false);
            }

            const offeringToQuote = newOffering || currentFormItem._derivedServiceOffering;
            const quantityStr = String(watchedItemState.quantity);
            const quantityNum = quantityStr && !isNaN(parseInt(quantityStr)) ? parseInt(quantityStr, 10) : 0;

            if (offeringToQuote && quantityNum > 0) {
                let readyToQuote = true;
                const quotePayload: QuoteItemPayload = {
                    service_offering_id: offeringToQuote.id,
                    customer_id: watchedCustomerId,
                    quantity: quantityNum,
                };

                if (offeringToQuote.pricing_strategy === 'dimension_based') {
                    const lengthStr = String(watchedItemState.length_meters);
                    const widthStr = String(watchedItemState.width_meters);
                    const lengthNum = lengthStr && !isNaN(parseFloat(lengthStr)) ? parseFloat(lengthStr) : 0;
                    const widthNum = widthStr && !isNaN(parseFloat(widthStr)) ? parseFloat(widthStr) : 0;
                    if (lengthNum > 0 && widthNum > 0) {
                        quotePayload.length_meters = lengthNum;
                        quotePayload.width_meters = widthNum;
                    } else {
                        readyToQuote = false;
                    }
                }

                if (readyToQuote && !currentFormItem._isQuoting) {
                    setValue(`items.${index}._isQuoting`, true);
                    setValue(`items.${index}._quoteError`, null);
                    quoteItemMutation.mutate({ itemIndex: index, payload: quotePayload });
                }
            }
        });
    }, [debouncedWatchedItems, allServiceOfferings, watchedCustomerId, setValue, getValues, quoteItemMutation]);

    // --- Update Order Mutation ---
    const updateOrderMutation = useMutation<Order, Error, NewOrderFormData>({
        mutationFn: (formData) => updateOrder(orderId!, formData, allServiceOfferings),
        onSuccess: (data) => {
            toast.success(t('orderUpdatedSuccess', { ns: 'orders', orderNumber: data.order_number }));
            queryClient.invalidateQueries({ queryKey: ['orders'] }); // Invalidate list
            queryClient.setQueryData(['order', orderId], data); // Update cache for this specific order
            navigate(`/orders/${orderId}`); // Navigate to order details page
        },
        onError: (error) => {
            toast.error(error.message || t('orderUpdateFailed', { ns: 'orders' }));
        }
    });

    const onSubmit = (data: NewOrderFormData) => {
        // Final client-side validation for derived offerings and dimensions (same as NewOrderPage)
        let allItemsValid = true;
        data.items.forEach((item, index) => {
            const offering = allServiceOfferings.find(so =>
                so.productType?.id.toString() === item.product_type_id &&
                so.serviceAction?.id.toString() === item.service_action_id
            ) || item._derivedServiceOffering; // Use derived if already set

            if (!offering) {
                setError(`items.${index}._derivedServiceOffering`, { type: 'manual', message: t('validation.serviceOfferingRequired') });
                allItemsValid = false;
            }
            if (offering?.pricing_strategy === 'dimension_based') {
                const length = item.length_meters ? Number(item.length_meters) : 0;
                const width = item.width_meters ? Number(item.width_meters) : 0;
                if (!(length > 0 && width > 0)) {
                    if(!errors.items?.[index]?.length_meters) setError(`items.${index}.length_meters`, { type: 'manual', message: t('validation.dimensionsRequiredForStrategy') });
                    if(!errors.items?.[index]?.width_meters) setError(`items.${index}.width_meters`, { type: 'manual', message: " " });
                    allItemsValid = false;
                }
            }
             if(item._quoteError){ allItemsValid = false; }
        });
        if (!allItemsValid) {
            toast.error(t('pleaseCorrectErrorsInItems', {ns:'orders'}));
            return;
        }
        updateOrderMutation.mutate(data);
    };

    const orderTotal = useMemo(() => { /* ... (Same as NewOrderPage) ... */
         return watchedAllItems.reduce((total, item) => {
            return total + (item._quoted_sub_total || 0);
        }, 0);
    }, [watchedAllItems]);


    if (isLoadingExistingOrder || (orderId && !existingOrder && !existingOrderError)) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3 text-lg">{t('loadingOrderDetails', {ns:'orders'})}</p>
            </div>
        );
    }

    if (existingOrderError) {
        return (
            <div className="text-center py-10">
                <p className="text-destructive text-lg">
                    {t('errorLoading', { ns: 'common' })}
                </p>
                <p className="text-muted-foreground">{existingOrderError.message}</p>
                <Button asChild className="mt-4">
                    <Link to="/orders">{t('backToOrders', { ns: 'orders' })}</Link>
                </Button>
            </div>
        );
    }

    if (!existingOrder) {
        return (
            <div className="text-center py-10">
                <p className="text-lg">{t('orderNotFound', { ns: 'orders' })}</p>
                <Button asChild className="mt-4">
                    <Link to="/orders">{t('backToOrders', { ns: 'orders' })}</Link>
                </Button>
            </div>
        );
    }

    return (
        <FormProvider {...methods}>
            <div className="max-w-4xl mx-auto pb-20">
                <div className="mb-6 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" asChild className="h-9 w-9">
                            <Link to={`/orders/${orderId}`}> {/* Link back to order details */}
                                <ArrowLeft className="h-5 w-5" />
                                <span className="sr-only">{t('backToOrderDetails', { ns: 'orders' })}</span>
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{t('editOrderTitle', { ns: 'orders', orderNumber: existingOrder.order_number })}</h1>
                            <p className="text-sm text-muted-foreground">{t('editOrderPageDescription', { ns: 'orders', defaultValue: 'Modify the order details and items below.' })}</p>
                        </div>
                    </div>
                </div>
                <Card className="shadow-lg">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-6 pt-6">
                            {/* Customer is usually not editable for an existing order, display it or make it read-only */}
                            <div className="grid gap-1.5">
                                <Label>{t('customer', { ns: 'customers' })}</Label>
                                <Input value={existingOrder.customer.name} disabled className="font-medium"/>
                                {/* Hidden input to keep customer_id in form data if needed, or manage it separately */}
                                <input type="hidden" {...register('customer_id')} />
                            </div>

                            <OrderItemsManager
                                productTypes={productTypes}
                                allServiceOfferings={allServiceOfferings}
                                isSubmittingOrder={updateOrderMutation.isPending}
                                isLoadingDropdowns={isLoadingPagePrerequisites}
                                itemsArrayErrors={errors.items}
                                serviceActions={[]} // Add empty array for now, should be fetched from API
                            />

                            <OrderOverallDetails
                                disabled={updateOrderMutation.isPending}
                                notesError={errors.notes}
                                dueDateError={errors.due_date}
                            />
                        </CardContent>

                        <OrderSummaryAndActions
                            orderTotal={orderTotal}
                            isSubmitting={updateOrderMutation.isPending}
                            isQuotingAnyItem={watchedAllItems?.some(item => item._isQuoting) || false}
                            isLoadingDropdowns={isLoadingPagePrerequisites}
                            isCustomerSelected={!!watchedCustomerId} // customer_id is pre-filled
                            hasItems={watchedAllItems?.length > 0}
                        />
                    </form>
                </Card>
            </div>
        </FormProvider>
    );
};

export default EditOrderPage;