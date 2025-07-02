// src/features/orders/components/PaymentsListDialog.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from "@/components/ui/table";
import { Loader2, Wallet } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { Payment, Order } from '@/types';
import { getOrderPayments } from '@/api/paymentService';
import { Badge } from '@/components/ui/badge';

interface PaymentsListDialogProps {
  order: Order | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaymentsListDialog: React.FC<PaymentsListDialogProps> = ({ order, isOpen, onOpenChange }) => {
    const { t, i18n } = useTranslation(['common', 'orders']);
    
    // Fetch payments for the specific order ID, only when the dialog is open and an order is provided.
    const { data: payments = [], isLoading } = useQuery<Payment[], Error>({
        queryKey: ['orderPayments', order?.id],
        queryFn: () => getOrderPayments(order!.id),
        enabled: !!order && isOpen, // Crucial for performance
        staleTime: 1 * 60 * 1000, // Cache for 1 minute
    });

    if (!order) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-primary"/>
                        {t('paymentHistoryForOrder', {ns: 'orders', orderNumber: order.order_number})}
                    </DialogTitle>
                    <DialogDescription>
                        {t('allTransactionsAreListed', {ns:'orders', defaultValue: 'All recorded payments and refunds for this order are listed below.'})}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto py-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('date', {ns:'common'})}</TableHead>
                                    <TableHead>{t('type', {ns:'orders'})}</TableHead>
                                    <TableHead>{t('method', {ns:'orders'})}</TableHead>
                                    <TableHead className="text-right">{t('amount', {ns:'common'})}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.length > 0 ? (
                                    payments.map(payment => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="text-sm">
                                                {formatDateTime(payment.payment_date, 'PP', i18n.language)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={payment.type === 'refund' ? 'destructive' : 'outline'}
                                                    className="capitalize"
                                                >
                                                    {t(`payment_type_${payment.type}`, {ns:'orders', defaultValue: payment.type})}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                {t(`payment_method_${payment.method}`, {ns:'orders', defaultValue: payment.method})}
                                            </TableCell>
                                            <TableCell className={cn(
                                                "text-right font-mono",
                                                payment.type === 'refund' && 'text-destructive'
                                            )}>
                                                {formatCurrency(payment.amount, 'USD', i18n.language)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            {t('noPaymentsRecorded', {ns:'orders'})}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            {payments.length > 0 && (
                                <TableFooter>
                                     <TableRow className="bg-muted/50">
                                        <TableCell colSpan={3} className="font-semibold text-right">{t('totalPaid', {ns:'orders', defaultValue: 'Total Paid'})}</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(order.paid_amount, 'USD', i18n.language)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={3} className="font-semibold text-right">{t('amountDue')}</TableCell>
                                        <TableCell className="text-right font-bold text-destructive">{formatCurrency(order.amount_due || 0, 'USD', i18n.language)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            )}
                        </Table>
                    )}
                </div>
                 {/* No footer buttons needed for a read-only dialog */}
            </DialogContent>
        </Dialog>
    );
};