// src/features/orders/components/RecordPaymentModal.tsx
import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, parse } from 'date-fns';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, CalendarIcon, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { useCurrency } from '@/hooks/useCurrency';


import type { Order, Payment, RecordPaymentFormData, PaymentMethod } from '@/types';
import { recordOrderPayment } from '@/api/paymentService';
import { getOrderById } from '@/api/orderService';
import type { AxiosError } from 'axios';
import { PAYMENT_METHODS } from '@/lib/constants';
import { PdfDialog } from './PdfDialog';

const paymentSchema = z.object({
  amount: z.preprocess(
    (val) => parseFloat(String(val).replace(/,/g, '')),
    z.number({ required_error: "validation.amountRequired", invalid_type_error: "validation.amountMustBeNumber" })
     .positive({ message: "validation.amountMustBePositive" })
  ),
  method: z.enum(PAYMENT_METHODS, { required_error: "validation.paymentMethodRequired" }),
  payment_date: z.string().nonempty({ message: "validation.dateRequired" }),
  transaction_id: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  discount_percentage: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? null : parseFloat(String(val)),
    z.number().min(0).max(100).nullable().optional()
  ),
});

// We only handle 'payment' type in this modal for simplicity. Refunds could be a separate feature.
type PaymentFormValues = {
  amount: number;
  method: PaymentMethod;
  payment_date: string;
  transaction_id?: string;
  notes?: string;
  discount_percentage?: number | null;
};

interface RecordPaymentModalProps {
    order: Order | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onOrderUpdate?: (updatedOrder: Order) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ order, isOpen, onOpenChange, onOrderUpdate }) => {
    const { t, i18n } = useTranslation(['common', 'orders', 'validation']);
    const queryClient = useQueryClient();
    const [showPdfDialog, setShowPdfDialog] = React.useState(false);
    const { currencyCode } = useCurrency();

    const {
        control,
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors }
    } = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema) as any,
        defaultValues: {
            amount: 0,
            method: 'cash' as PaymentMethod,
            payment_date: format(new Date(), 'yyyy-MM-dd'),
            transaction_id: '',
            notes: '',
            discount_percentage: null,
        }
    });

    const discountPercentage = watch('discount_percentage');
    // Calculate original total: if there's already a discount, reverse it; otherwise use current total
    const originalTotal = order 
        ? (order.discount_percentage && order.discount_percentage > 0 
            ? order.total_amount / (1 - (order.discount_percentage / 100))
            : order.total_amount)
        : 0;
    // Calculate discounted total based on the discount percentage entered
    const discountedTotal = discountPercentage && discountPercentage > 0 
        ? originalTotal * (1 - (discountPercentage / 100))
        : originalTotal;
    // Round the discounted total to 2 decimal places
    const roundedDiscountedTotal = Math.round(discountedTotal * 100) / 100;
    
    // Calculate new amount due based on discounted total
    const newAmountDue = order ? Math.max(0, roundedDiscountedTotal - (order.paid_amount || 0)) : 0;
    // Round the amount due to 2 decimal places
    const roundedAmountDue = Math.round(newAmountDue * 100) / 100;

    const paymentMethodOptions = useMemo(() => {
        return PAYMENT_METHODS.map(method => ({
            key: method as PaymentMethod,
            value: t(`${method}`, {ns:'orders'})
        }));
    }, [t]);

    useEffect(() => {
        if (order && isOpen) {
            const amountDue = order.amount_due && order.amount_due > 0 ? order.amount_due : 0;
            reset({
                amount: amountDue,
                method: 'cash' as PaymentMethod,
                payment_date: format(new Date(), 'yyyy-MM-dd'),
                discount_percentage: order.discount_percentage || null,
            });
        }
        // Reset PDF dialog when payment modal closes
        if (!isOpen) {
            setShowPdfDialog(false);
        }
    }, [order, isOpen, reset]);

    // Update amount paid field when discount percentage changes
    useEffect(() => {
        if (order && isOpen) {
            // Calculate new amount due based on current discount
            const originalTotal = order.discount_percentage && order.discount_percentage > 0 
                ? order.total_amount / (1 - (order.discount_percentage / 100))
                : order.total_amount;
            const currentDiscountedTotal = discountPercentage && discountPercentage > 0 
                ? originalTotal * (1 - (discountPercentage / 100))
                : originalTotal;
            // Round the discounted total to 2 decimal places
            const roundedDiscountedTotal = Math.round(currentDiscountedTotal * 100) / 100;
            const updatedAmountDue = Math.max(0, roundedDiscountedTotal - (order.paid_amount || 0));
            // Round the amount due to 2 decimal places
            const roundedAmountDue = Math.round(updatedAmountDue * 100) / 100;
            setValue('amount', roundedAmountDue);
        }
    }, [discountPercentage, order, isOpen, setValue]);


    const mutation = useMutation<Payment, Error, RecordPaymentFormData>({
        mutationFn: (data) => recordOrderPayment(order!.id, data),
        onSuccess: async (paymentData) => {
            toast.success(t('paymentRecordedSuccess', {ns:'orders'}));
            queryClient.invalidateQueries({ queryKey: ['order', String(order!.id)] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['todayOrders'] });
            
            // Fetch the updated order and call the callback
            try {
                const updatedOrder = await getOrderById(order!.id);
                if (onOrderUpdate) {
                    onOrderUpdate(updatedOrder);
                }
            } catch (error) {
                console.error('Failed to fetch updated order:', error);
            }
            
            // Close the payment modal after successful payment
            onOpenChange(false);
            // Show PDF dialog after successful payment
            setShowPdfDialog(true);
        },
        onError: (error: Error) => {
            const axiosError = error as AxiosError;
            const message = axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data 
                ? (axiosError.response.data as any).message 
                : t('paymentRecordFailed', {ns:'orders'});
            toast.error(message);
        }
    });

    const onSubmit = (data: PaymentFormValues) => {
        const payload: RecordPaymentFormData = { 
            ...data, 
            type: 'payment',
            discount_percentage: data.discount_percentage || null,
        };
        mutation.mutate(payload);
    };

    if (!order) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-primary" />
                        {t('recordPaymentForOrder', {ns:'orders', orderNumber: order.id})}
                    </DialogTitle>
                    <DialogDescription>
                        <div className="space-y-1">
                            <div>
                                {t('amountDue', {ns:'orders'})}: <span className="font-semibold text-primary">{formatCurrency(order.amount_due || 0, currencyCode, i18n.language)}</span>
                            </div>
                            {order.discount_percentage && order.discount_percentage > 0 && (
                                <div className="text-sm text-muted-foreground">
                                    {t('currentDiscount', {ns:'orders', defaultValue: 'Current Discount'})}: {order.discount_percentage}%
                                </div>
                            )}
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 py-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="amount">{t('amountPaid', {ns:'orders'})}<span className="text-destructive">*</span></Label>
                            <Input id="amount" type="number" step="0.01" {...register('amount')} />
                            {errors.amount && <p className="text-sm text-destructive">{t(errors.amount.message as string)}</p>}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="method">{t('paymentMethod', {ns:'orders'})}<span className="text-destructive">*</span></Label>
                            <Controller
                                name="method"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                        <SelectTrigger id="method"><SelectValue placeholder={t('selectPaymentMethod', {ns:'orders'})} /></SelectTrigger>
                                        <SelectContent>
                                            {paymentMethodOptions.length > 0 ? (
                                                paymentMethodOptions.map(opt => (
                                                    <SelectItem key={opt.key} value={opt.key}>{opt.value}</SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="cash">{t('payment_method_cash', {ns:'orders'})}</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.method && <p className="text-sm text-destructive">{t(errors.method.message as string)}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="discount_percentage">{t('discountPercentage', {ns:'orders', defaultValue: 'Discount Percentage'})} (%)</Label>
                            <Input 
                                id="discount_percentage" 
                                type="number" 
                                step="0.01" 
                                min="0" 
                                max="100"
                                placeholder="0"
                                {...register('discount_percentage', { valueAsNumber: true })}
                            />
                            {errors.discount_percentage && <p className="text-sm text-destructive">{t(errors.discount_percentage.message as string)}</p>}
                            {discountPercentage && discountPercentage > 0 && (
                                <div className="text-sm text-muted-foreground">
                                    {t('discountedTotal', {ns:'orders', defaultValue: 'Discounted Total'})}: <span className="font-semibold text-green-600">{formatCurrency(roundedDiscountedTotal, currencyCode, i18n.language)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="payment_date">{t('paymentDate', {ns:'orders'})}</Label>
                            <Controller name="payment_date" control={control} render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(parse(field.value, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy') : <span>{t('pickADate')}</span>}</Button></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')} initialFocus /></PopoverContent>
                                </Popover>
                            )} />
                        </div>
                         <div className="grid gap-1.5">
                            <Label htmlFor="transaction_id">{t('transactionIdOptional')}</Label>
                            <Input id="transaction_id" {...register('transaction_id')} />
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="notes">{t('notesOptional')}</Label>
                        <Textarea id="notes" {...register('notes')} rows={2} placeholder={t('paymentNotesPlaceholder', {ns:'orders'})}/>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>{t('cancel')}</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {t('recordPaymentBtn', {ns:'orders'})}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        
        {/* PDF Dialog for showing receipt after successful payment */}
        {order && (
            <PdfDialog
                orderId={order.id}
                isOpen={showPdfDialog}
                onOpenChange={setShowPdfDialog}
            />
        )}
    </>
    );
};