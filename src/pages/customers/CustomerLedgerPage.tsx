// src/pages/customers/CustomerLedgerPage.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import type { CustomerLedger, LedgerTransaction } from '@/types';
import { getCustomerLedger } from '@/api/customerService';
import { recordOrderPayment } from '@/api/paymentService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { useCurrency } from '@/hooks/useCurrency';
import { PAYMENT_METHODS } from '@/lib/constants';

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, FileText, Plus, Wallet, CalendarIcon, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const paymentSchema = z.object({
    amount: z.any(),
    method: z.enum(PAYMENT_METHODS, { required_error: "validation.paymentMethodRequired" }),
    notes: z.string().optional().or(z.literal('')),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const AddPaymentDialog: React.FC<{
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    customerId: string;
    currentBalance: number;
    onPaymentSuccess: () => void;
}> = ({ isOpen, onOpenChange, customerId, currentBalance, onPaymentSuccess }) => {
    const { t, i18n } = useTranslation(['common', 'orders', 'validation', 'customers']);
    const queryClient = useQueryClient();
    const { currencyCode } = useCurrency();

    const {
        control,
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors }
    } = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema) as any,
        defaultValues: {
            amount: 0,
            method: 'cash',
            notes: '',
        }
    });

    const watchedAmount = watch('amount');

    const paymentMethodOptions = PAYMENT_METHODS.map(method => ({
        key: method,
        value: t(`${method}`, { ns: 'orders' })
    }));

    // Get unpaid orders for preview
    const { data: ledgerData } = useQuery({
        queryKey: ['customerLedger', customerId],
        queryFn: () => getCustomerLedger(customerId),
        enabled: isOpen && !!customerId,
    });

    const unpaidOrders = ledgerData?.transactions
        ?.filter((tx: LedgerTransaction) => 
            tx.debit > 0 && 
            tx.balance > 0 && 
            tx.payment_status === 'unpaid' && 
            tx.remaining_balance && 
            tx.remaining_balance > 0
        )
        .sort((a: LedgerTransaction, b: LedgerTransaction) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

    // Calculate how the payment will be distributed
    const calculatePaymentDistribution = (amount: number) => {
        let remainingAmount = amount;
        const distribution: Array<{
            id: number;
            orderNumber: string;
            amount: number;
            originalBalance: number;
            remainingAfterPayment: number;
            date: string;
        }> = [];

        // Filter only orders that are not fully paid and sort by oldest first
        const partiallyPaidOrders = unpaidOrders.filter(order => order.remaining_balance && order.remaining_balance > 0);

        for (const order of partiallyPaidOrders) {
            if (remainingAmount <= 0) break;
            const orderRemainingBalance = order.remaining_balance || 0;
            const paymentAmount = Math.min(remainingAmount, orderRemainingBalance);
            const remainingAfterPayment = orderRemainingBalance - paymentAmount;
            
            distribution.push({
                id: order.reference_id,
                orderNumber: order.description,
                amount: paymentAmount,
                originalBalance: order.balance,
                remainingAfterPayment: remainingAfterPayment,
                date: order.date
            });
            remainingAmount -= paymentAmount;
        }

        return distribution;
    };

    const paymentDistribution = calculatePaymentDistribution(watchedAmount || 0);
    const totalDistributed = paymentDistribution.reduce((sum, item) => sum + item.amount, 0);
    const remainingAfterPayment = (watchedAmount || 0) - totalDistributed;
    
    // Calculate the maximum amount that can be paid (sum of all remaining balances)
    const maxPayableAmount = unpaidOrders.reduce((sum, order) => sum + (order.remaining_balance || 0), 0);

    const mutation = useMutation({
        mutationFn: async (data: PaymentFormValues) => {
            // Get customer's unpaid orders sorted by date (oldest first)
            const ledgerData = await getCustomerLedger(customerId);
            
            // Get orders that have outstanding balances (debit > 0 and remaining_balance > 0)
            const unpaidOrders = ledgerData.transactions
                .filter((tx: LedgerTransaction) => 
                    tx.debit > 0 && 
                    tx.remaining_balance && 
                    tx.remaining_balance > 0 && 
                    tx.payment_status === 'unpaid'
                )
                .sort((a: LedgerTransaction, b: LedgerTransaction) => new Date(a.date).getTime() - new Date(b.date).getTime());

            let remainingAmount = data.amount;
            const payments: Array<{
                orderId: number;
                amount: number;
                orderNumber: string;
            }> = [];

            // Process payments for each unpaid order (oldest first)
            for (const order of unpaidOrders) {
                if (remainingAmount <= 0) break;

                // Calculate how much is still owed on this order
                const orderBalance = order.remaining_balance || 0;
                const paymentAmount = Math.min(remainingAmount, orderBalance);

                // Record payment for this order
                await recordOrderPayment(order.reference_id, {
                    amount: paymentAmount,
                    method: data.method,
                    payment_date: format(new Date(), 'yyyy-MM-dd'),
                    notes: data.notes,
                    type: 'payment'
                });

                payments.push({
                    orderId: order.reference_id,
                    amount: paymentAmount,
                    orderNumber: order.description
                });

                remainingAmount -= paymentAmount;
            }

            return payments;
        },
        onSuccess: (payments) => {
            if (payments.length > 0) {
                const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
                toast.success(t('paymentRecordedSuccess', { ns: 'orders' }) + ` - ${formatCurrency(totalPaid, currencyCode, i18n.language)}`);
            } else {
                toast.success(t('paymentRecordedSuccess', { ns: 'orders' }));
            }
            queryClient.invalidateQueries({ queryKey: ['customerLedger', customerId] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            reset();
            onOpenChange(false);
            onPaymentSuccess();
        },
        onError: (error: Error) => {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message = axiosError.response?.data?.message || t('paymentRecordFailed', { ns: 'orders' });
            toast.error(message);
        }
    });

    const onSubmit = (data: PaymentFormValues) => {
        if (paymentDistribution.length === 0) {
            toast.error(t('noUnpaidOrders', { ns: 'customers' }));
            return;
        }
        

        
        // Show confirmation dialog
        const confirmMessage = t('confirmPayment', { 
            ns: 'customers', 
            amount: formatCurrency(data.amount, currencyCode, i18n.language),
            orders: paymentDistribution.map(p => p.orderNumber).join(', ')
        });
        
        if (window.confirm(confirmMessage)) {
            mutation.mutate(data);
        }
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Wallet className="h-5 w-5 text-primary" />
                        {t('addPayment', { ns: 'customers' })}
                    </DialogTitle>
                    <DialogDescription>
                        {t('currentBalance', { ns: 'customers' })}: <span className="font-semibold text-primary">{formatCurrency(currentBalance, currencyCode, i18n.language)}</span>
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="amount" className="text-sm">{t('amountPaid', { ns: 'orders' })}<span className="text-destructive">*</span></Label>
                        <Input 
                            id="amount" 
                            type="number" 
                            step="0.01" 
                            className="h-9"
                            {...register('amount')} 
                        />
                        {errors.amount && <p className="text-xs text-destructive">{t(errors.amount.message as string)}</p>}

                        {watchedAmount > 0 && watchedAmount <= maxPayableAmount && paymentDistribution.length === 0 && (
                            <p className="text-xs text-muted-foreground">{t('noUnpaidOrders', { ns: 'customers' })}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="method" className="text-sm">{t('paymentMethod', { ns: 'orders' })}<span className="text-destructive">*</span></Label>
                        <Controller
                            name="method"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                    <SelectTrigger id="method" className="h-9">
                                        <SelectValue placeholder={t('selectPaymentMethod', { ns: 'orders' })} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethodOptions.map(opt => (
                                            <SelectItem key={opt.key} value={opt.key}>{opt.value}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.method && <p className="text-xs text-destructive">{t(errors.method.message as string)}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes" className="text-sm">{t('notesOptional')}</Label>
                        <Textarea 
                            id="notes" 
                            {...register('notes')} 
                            rows={2} 
                            className="text-sm"
                            placeholder={t('paymentNotesPlaceholder', { ns: 'orders' })}
                        />
                    </div>

                    {/* Payment Distribution Preview */}
                    {watchedAmount > 0 && (
                        <div className="grid gap-2">
                            <Label className="text-sm">{t('paymentDistribution', { ns: 'customers' })}</Label>
                            <div className="rounded-md border p-3 space-y-2 max-h-32 overflow-y-auto">
                                {paymentDistribution.length > 0 ? (
                                    <>
                                        {paymentDistribution.map((item, index) => (
                                            <div key={index} className="space-y-1 border-b border-muted pb-2 last:border-b-0">
                                                <div className="flex justify-between items-start text-xs">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">{item.id}</div>
                                                        <div className="text-muted-foreground text-xs">
                                                            {formatDateTime(item.date, 'PP', i18n.language)}
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 ml-2 text-right">
                                                        <div className="font-medium text-primary">
                                                            {formatCurrency(item.amount, currencyCode, i18n.language)}
                                                        </div>
                                                        <div className="text-muted-foreground text-xs">
                                                            {t('of', { ns: 'common' })} {formatCurrency(item.originalBalance, currencyCode, i18n.language)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {item.remainingAfterPayment > 0 && (
                                                    <div className="flex justify-between items-center text-xs text-muted-foreground pl-2">
                                                        <span className="text-xs">- {t('remainingAfterPayment', { ns: 'customers' })}:</span>
                                                        <span className="text-xs text-destructive">
                                                            {formatCurrency(item.remainingAfterPayment, currencyCode, i18n.language)}
                                                        </span>
                                                    </div>
                                                )}
                                                {item.remainingAfterPayment === 0 && (
                                                    <div className="flex justify-between items-center text-xs text-green-600 pl-2">
                                                        <span className="text-xs">✓ {t('fullyPaid', { ns: 'customers' })}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center text-xs font-semibold border-t pt-2 mt-2">
                                            <span>{t('total', { ns: 'common' })}</span>
                                            <span className="text-primary">
                                                {formatCurrency(totalDistributed, currencyCode, i18n.language)}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-xs text-muted-foreground">
                                        {t('noUnpaidOrders', { ns: 'customers' })}
                                    </div>
                                )}

                                {remainingAfterPayment > 0 && (
                                    <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                                        {t('remainingAmount', { ns: 'customers' })}: {formatCurrency(remainingAfterPayment, currencyCode, i18n.language)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleClose} 
                            disabled={mutation.isPending}
                            className="w-full sm:w-auto"
                        >
                            {t('cancel')}
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={mutation.isPending || paymentDistribution.length === 0}
                            className="w-full sm:w-auto"
                        >
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('recordPaymentBtn', { ns: 'orders' })}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; className?: string }> = ({ title, value, icon: Icon, className }) => (
    <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-lg md:text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const DateFilterCard: React.FC<{
    fromDate: Date | undefined;
    toDate: Date | undefined;
    onFromDateChange: (date: Date | undefined) => void;
    onToDateChange: (date: Date | undefined) => void;
}> = ({ fromDate, toDate, onFromDateChange, onToDateChange }) => {
    const { t } = useTranslation(['common', 'customers']);

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Filter className="h-4 w-4" />
                    {t('filterByDate', { ns: 'customers' })}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label className="text-sm">{t('fromDate', { ns: 'customers' })}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className={cn("w-full justify-start text-left font-normal h-9", !fromDate && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {fromDate ? format(fromDate, 'PP') : <span>{t('selectDate')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={fromDate} onSelect={onFromDateChange} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-sm">{t('toDate', { ns: 'customers' })}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className={cn("w-full justify-start text-left font-normal h-9", !toDate && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {toDate ? format(toDate, 'PP') : <span>{t('selectDate')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={toDate} onSelect={onToDateChange} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const CustomerLedgerPage: React.FC = () => {
    const { t, i18n } = useTranslation(['reports', 'common', 'customers']);
    const { id: customerId } = useParams<{ id: string }>();
    const { can } = useAuth();
    const { currencyCode } = useCurrency();
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    
    // Date filter state - default to current month
    const [fromDate, setFromDate] = useState<Date>(startOfMonth(new Date()));
    const [toDate, setToDate] = useState<Date>(endOfMonth(new Date()));

    const { data: ledger, isLoading, error, refetch } = useQuery<CustomerLedger, Error>({
        queryKey: ['customerLedger', customerId],
        queryFn: () => getCustomerLedger(customerId!),
        enabled: !!customerId && can('customer:view-ledger'),
    });

    // Filter transactions by date range
    const filteredTransactions = ledger?.transactions?.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= fromDate && txDate <= toDate;
    }) || [];

    if (!can('customer:view-ledger')) {
        return <div className="p-8 text-center text-destructive">{t('accessDenied')}</div>;
    }
    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <div className="p-8 text-center text-destructive">{error.message}</div>;
    if (!ledger) return <div className="p-8 text-center">{t('ledgerNotFound', { ns: 'reports' })}</div>;

    const { customer, summary } = ledger;

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header */}
            <div className="md:hidden bg-card border-b p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-lg font-semibold">{t('customerLedgerTitle', {ns:'reports'})}</h1>
                        <p className="text-sm text-muted-foreground">{customer.name}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/customers">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                
                {/* Mobile Action Buttons */}
                <div className="flex gap-2">
                    {summary.current_balance > 0 && can('order:record-payment') && (
                        <Button size="sm" className="flex-1" onClick={() => setShowPaymentDialog(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('addPayment', {ns:'customers'})}
                        </Button>
                    )}
                    {summary.current_balance > 0 && !can('order:record-payment') && (
                        <Button variant="outline" size="sm" className="flex-1" disabled>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('noPermissionToRecordPayment', {ns:'customers'})}
                        </Button>
                    )}
                    {summary.current_balance <= 0 && (
                        <Button variant="outline" size="sm" className="flex-1" disabled>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('noBalanceToPay', {ns:'customers'})}
                        </Button>
                    )}
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:block max-w-7xl mx-auto px-6 py-8">
                <PageHeader
                    title={t('customerLedgerTitle', {ns:'reports'})}
                    description={t('customerLedgerDescription', {ns:'reports', name: customer.name})}
                >
                    <div className="flex gap-2">
                        {summary.current_balance > 0 && can('order:record-payment') && (
                            <Button onClick={() => setShowPaymentDialog(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                {t('addPayment', {ns:'customers'})}
                            </Button>
                        )}
                        {summary.current_balance > 0 && !can('order:record-payment') && (
                            <Button variant="outline" disabled>
                                <Plus className="mr-2 h-4 w-4" />
                                {t('noPermissionToRecordPayment', {ns:'customers'})}
                            </Button>
                        )}
                        {summary.current_balance <= 0 && (
                            <Button variant="outline" disabled>
                                <Plus className="mr-2 h-4 w-4" />
                                {t('noBalanceToPay', {ns:'customers'})}
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link to="/customers">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {t('backToCustomers', {ns:'customers'})}
                            </Link>
                        </Button>
                    </div>
                </PageHeader>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 pb-8">
                {/* Mobile Layout */}
                <div className="md:hidden space-y-6">
                    {/* Stats Cards - Mobile */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                            <StatCard 
                                title={t('totalDebits')} 
                                value={formatCurrency(summary.total_debits, currencyCode, i18n.language)} 
                                icon={TrendingUp} 
                                className="border-red-500/20" 
                            />
                            <StatCard 
                                title={t('totalCredits')} 
                                value={formatCurrency(summary.total_credits, currencyCode, i18n.language)} 
                                icon={TrendingDown} 
                                className="border-green-500/20" 
                            />
                            <StatCard 
                                title={t('currentBalance')} 
                                value={formatCurrency(summary.current_balance, currencyCode, i18n.language)} 
                                icon={FileText} 
                                className={cn(summary.current_balance > 0 ? "border-destructive" : "border-green-500/20")} 
                            />
                        </div>
                    </div>

                    {/* Date Filter - Mobile */}
                    <DateFilterCard
                        fromDate={fromDate}
                        toDate={toDate}
                        onFromDateChange={(date) => date && setFromDate(date)}
                        onToDateChange={(date) => date && setToDate(date)}
                    />

                    {/* Transaction History - Mobile */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <span>{t('transactionHistory')}</span>
                                <span className="text-sm font-normal text-muted-foreground">
                                    {t('showingResults', { ns: 'customers', count: filteredTransactions.length, total: ledger?.transactions?.length || 0 })}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {filteredTransactions.length > 0 ? (
                                <div className="space-y-3 p-4">
                                    {filteredTransactions.map((tx, index) => (
                                        <div 
                                            key={`${tx.date}-${index}`}
                                            className="bg-card border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => window.open(`/#/orders/${tx.reference_id}`, '_blank')}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-muted-foreground">{formatDateTime(tx.date, 'PP', i18n.language)}</span>
                                                <span className="font-medium text-primary">#{tx.reference_id}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                <div className="text-center">
                                                    <div className="text-muted-foreground">{t('debit')}</div>
                                                    <div className="font-mono">{tx.debit > 0 ? formatCurrency(tx.debit, currencyCode, i18n.language) : '-'}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-muted-foreground">{t('credit')}</div>
                                                    <div className="font-mono text-green-600">{tx.credit > 0 ? formatCurrency(tx.credit, currencyCode, i18n.language) : '-'}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-muted-foreground">{t('balance')}</div>
                                                    <div className={cn("font-semibold", tx.balance > 0 && "text-destructive")}>
                                                        {formatCurrency(tx.balance, currencyCode, i18n.language)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-32 flex items-center justify-center text-muted-foreground">
                                    {t('noTransactionsFound')}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Desktop Layout - Two Columns */}
                <div className="hidden md:grid md:grid-cols-3 md:gap-6">
                    {/* Left Column - Transaction History */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <span>{t('transactionHistory')}</span>
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {t('showingResults', { ns: 'customers', count: filteredTransactions.length, total: ledger?.transactions?.length || 0 })}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="rounded-md border">
                                    <div className="max-h-[calc(100vh-300px)] overflow-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-sm sticky top-0 bg-background">{t('date')}</TableHead>
                                                    <TableHead className="w-[40%] text-sm sticky top-0 bg-background">{t('id')}</TableHead>
                                                    <TableHead className="text-right text-sm sticky top-0 bg-background">{t('debit')}</TableHead>
                                                    <TableHead className="text-right text-sm sticky top-0 bg-background">{t('credit')}</TableHead>
                                                    <TableHead className="text-right text-sm sticky top-0 bg-background">{t('balance')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredTransactions.length > 0 ? filteredTransactions.map((tx, index) => (
                                                    <TableRow 
                                                        key={`${tx.date}-${index}`}
                                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                        onClick={() => window.open(`/#/orders/${tx.reference_id}`, '_blank')}
                                                    >
                                                        <TableCell className="text-sm text-muted-foreground">{formatDateTime(tx.date, 'PP', i18n.language)}</TableCell>
                                                        <TableCell>
                                                            <span className="font-medium text-primary">#{tx.reference_id}</span>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">{tx.debit > 0 ? formatCurrency(tx.debit, currencyCode, i18n.language) : '-'}</TableCell>
                                                        <TableCell className="text-right font-mono text-green-600">{tx.credit > 0 ? formatCurrency(tx.credit, currencyCode, i18n.language) : '-'}</TableCell>
                                                        <TableCell className={cn("text-right font-semibold", tx.balance > 0 && "text-destructive")}>{formatCurrency(tx.balance, currencyCode, i18n.language)}</TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow><TableCell colSpan={5} className="h-24 text-center">{t('noTransactionsFound')}</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Stats Cards and Date Filter */}
                    <div className="md:col-span-1 space-y-6">
                        {/* Stats Cards */}
                        <div className="space-y-4">
                            <StatCard 
                                title={t('totalDebits')} 
                                value={formatCurrency(summary.total_debits, currencyCode, i18n.language)} 
                                icon={TrendingUp} 
                                className="border-red-500/20" 
                            />
                            <StatCard 
                                title={t('totalCredits')} 
                                value={formatCurrency(summary.total_credits, currencyCode, i18n.language)} 
                                icon={TrendingDown} 
                                className="border-green-500/20" 
                            />
                            <StatCard 
                                title={t('currentBalance')} 
                                value={formatCurrency(summary.current_balance, currencyCode, i18n.language)} 
                                icon={FileText} 
                                className={cn(summary.current_balance > 0 ? "border-destructive" : "border-green-500/20")} 
                            />
                        </div>

                        {/* Date Filter */}
                        <DateFilterCard
                            fromDate={fromDate}
                            toDate={toDate}
                            onFromDateChange={(date) => date && setFromDate(date)}
                            onToDateChange={(date) => date && setToDate(date)}
                        />
                    </div>
                </div>
            </div>

            <AddPaymentDialog
                isOpen={showPaymentDialog}
                onOpenChange={setShowPaymentDialog}
                customerId={customerId!}
                currentBalance={summary.current_balance}
                onPaymentSuccess={() => refetch()}
            />
        </div>
    );
};

export default CustomerLedgerPage;