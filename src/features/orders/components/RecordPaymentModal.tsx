// src/features/orders/components/RecordPaymentModal.tsx
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
import { Loader2, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

import type { Order, Payment, RecordPaymentFormData } from '@/types';
import { PAYMENT_METHODS } from '@/lib/constants'; // <-- Correct import location
import { recordOrderPayment } from '@/api/paymentService';

// Zod schema for form validation
const paymentSchema = z.object({
  amount: z.preprocess(
    (val) => parseFloat(String(val).replace(/,/g, '')), // Handle potential commas
    z.number({ required_error: "validation.amountRequired", invalid_type_error: "validation.amountMustBeNumber" })
     .positive({ message: "validation.amountMustBePositive" })
  ),
  method: z.enum(['cash', 'card', 'online', 'credit', 'bank_transfer'], { 
    required_error: "validation.paymentMethodRequired" 
  }),
  payment_date: z.string().nonempty({ message: "validation.dateRequired" }),
  transaction_id: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

// We only handle 'payment' type in this modal for simplicity. Refunds could be a separate modal.
type PaymentFormValues = z.infer<typeof paymentSchema>;

interface RecordPaymentModalProps {
    order: Order | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ order, isOpen, onOpenChange }) => {
    const { t, i18n } = useTranslation(['common', 'orders', 'validation']);
    const queryClient = useQueryClient();

    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: 0,
            method: 'cash' as const,
            payment_date: format(new Date(), 'yyyy-MM-dd'),
            transaction_id: '',
            notes: '',
        }
    });

    // Effect to pre-fill the amount with the amount due when the modal opens
    useEffect(() => {
        if (order && isOpen) {
            const amountDue = order.amount_due && order.amount_due > 0 ? order.amount_due : 0;
            reset({
                amount: amountDue,
                method: 'cash' as const,
                payment_date: format(new Date(), 'yyyy-MM-dd'),
                transaction_id: '',
                notes: '',
            });
        }
    }, [order, isOpen, reset]);


    const mutation = useMutation<Payment, Error, RecordPaymentFormData>({
        mutationFn: (data) => recordOrderPayment(order!.id, data),
        onSuccess: () => {
            toast.success(t('paymentRecordedSuccess', {ns:'orders'}));
            // Invalidate queries to refetch data on the OrderDetailsPage and OrdersListPage
            queryClient.invalidateQueries({ queryKey: ['order', String(order!.id)] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            onOpenChange(false); // Close the modal
        },
        onError: (error) => {
            toast.error(error.message || t('paymentRecordFailed', {ns:'orders'}));
        }
    });

    const onSubmit = (data: PaymentFormValues) => {
        const payload: RecordPaymentFormData = {
            ...data,
            type: 'payment', // Set the type to 'payment' for this modal
        };
        mutation.mutate(payload);
    };

    if (!order) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('recordPaymentForOrder', {ns:'orders', orderNumber: order.order_number})}</DialogTitle>
                    <DialogDescription>
                        {t('amountDue', {ns:'orders'})}: <span className="font-semibold text-primary">{formatCurrency(order.amount_due || 0, 'USD', i18n.language)}</span>
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="amount">{t('amountPaid', {ns:'orders'})}<span className="text-destructive">*</span></Label>
                            <Input id="amount" type="number" step="0.01" {...register('amount')} />
                            {errors.amount && <p className="text-sm text-destructive">{t(errors.amount.message as string)}</p>}
                        </div>
                         <div className="grid gap-1.5">
                            <Label htmlFor="method">{t('paymentMethod', {ns:'orders'})}<span className="text-destructive">*</span></Label>
                            <Controller name="method" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger id="method"><SelectValue placeholder={t('selectPaymentMethod', {ns:'orders'})} /></SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_METHODS.map(opt => (
                                            <SelectItem key={opt} value={opt}>{t(`payment_method_${opt}`, {ns:'orders', defaultValue: opt.charAt(0).toUpperCase() + opt.slice(1)})}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )} />
                             {errors.method && <p className="text-sm text-destructive">{t(errors.method.message as string)}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="payment_date">{t('paymentDate', {ns:'orders'})}</Label>
                            <Controller name="payment_date" control={control} render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(new Date(field.value), 'PPP') : <span>{t('pickADate', {ns:'common'})}</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')} initialFocus /></PopoverContent>
                                </Popover>
                            )} />
                            {errors.payment_date && <p className="text-sm text-destructive">{t(errors.payment_date.message as string)}</p>}
                        </div>
                         <div className="grid gap-1.5">
                            <Label htmlFor="transaction_id">{t('transactionIdOptional', {ns:'orders', defaultValue:'Transaction ID (Optional)'})}</Label>
                            <Input id="transaction_id" {...register('transaction_id')} />
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="notes">{t('notesOptional', {ns:'common'})}</Label>
                        <Textarea id="notes" {...register('notes')} rows={2} placeholder={t('paymentNotesPlaceholder', {ns:'orders', defaultValue:'e.g., Paid by customer\'s spouse'})}/>
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
    );
};