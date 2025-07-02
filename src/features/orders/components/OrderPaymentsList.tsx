// src/features/orders/components/OrderPaymentsList.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { Payment } from '@/types';

interface OrderPaymentsListProps {
  payments: Payment[];
}

export const OrderPaymentsList: React.FC<OrderPaymentsListProps> = ({ payments }) => {
    const { t, i18n } = useTranslation(['common', 'orders']);

    if (!payments || payments.length === 0) {
        return (
             <Card>
                <CardHeader><CardTitle>{t('paymentHistory', {ns:'orders'})}</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{t('noPaymentsRecorded', {ns:'orders'})}</p></CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader><CardTitle>{t('paymentHistory', {ns:'orders'})}</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('date')}</TableHead>
                            <TableHead>{t('type', {ns:'orders'})}</TableHead>
                            <TableHead>{t('method', {ns:'orders'})}</TableHead>
                            <TableHead className="text-right">{t('amount')}</TableHead>
                            <TableHead>{t('recordedBy')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map(p => (
                            <TableRow key={p.id}>
                                <TableCell className="text-sm">{formatDateTime(p.payment_date, 'PP p', i18n.language)}</TableCell>
                                <TableCell className={cn("capitalize font-medium", p.type === 'refund' && 'text-destructive')}>
                                    {t(`payment_type_${p.type}`, {ns:'orders', defaultValue: p.type})}
                                </TableCell>
                                <TableCell className="capitalize">{t(`payment_method_${p.method}`, {ns:'orders', defaultValue: p.method})}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(p.amount, 'USD', i18n.language)}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{p.user?.name || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}