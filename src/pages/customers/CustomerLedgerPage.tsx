// src/pages/customers/CustomerLedgerPage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import type { CustomerLedger } from '@/types';
import { getCustomerLedger } from '@/api/customerService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatCurrency, formatDateTime } from '@/lib/formatters';

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; className?: string }> = ({ title, value, icon: Icon, className }) => (
    <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
);

const CustomerLedgerPage: React.FC = () => {
    const { t, i18n } = useTranslation(['reports', 'common', 'customers']);
    const { id: customerId } = useParams<{ id: string }>();
    const { can } = useAuth();

    const { data: ledger, isLoading, error } = useQuery<CustomerLedger, Error>({
        queryKey: ['customerLedger', customerId],
        queryFn: () => getCustomerLedger(customerId!),
        enabled: !!customerId && can('customer:view-ledger'),
    });

    if (!can('customer:view-ledger')) {
        return <div className="p-8 text-center text-destructive">{t('accessDenied')}</div>;
    }
    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <div className="p-8 text-center text-destructive">{error.message}</div>;
    if (!ledger) return <div className="p-8 text-center">{t('ledgerNotFound', { ns: 'reports' })}</div>;

    const { customer, summary, transactions } = ledger;

    return (
        <div className="max-w-5xl mx-auto">
            <PageHeader
                title={t('customerLedgerTitle', {ns:'reports'})}
                description={t('customerLedgerDescription', {ns:'reports', name: customer.name})}
            >
                <Button variant="outline" asChild><Link to="/customers"><ArrowLeft className="mr-2 h-4 w-4" />{t('backToCustomers', {ns:'customers'})}</Link></Button>
            </PageHeader>

            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <StatCard title={t('totalDebits')} value={formatCurrency(summary.total_debits, 'USD', i18n.language)} icon={TrendingUp} className="border-red-500/20" />
                <StatCard title={t('totalCredits')} value={formatCurrency(summary.total_credits, 'USD', i18n.language)} icon={TrendingDown} className="border-green-500/20" />
                <StatCard title={t('currentBalance')} value={formatCurrency(summary.current_balance, 'USD', i18n.language)} icon={FileText} className={cn(summary.current_balance > 0 ? "border-destructive" : "border-green-500/20")} />
            </div>

            <Card>
                <CardHeader><CardTitle>{t('transactionHistory')}</CardTitle></CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('date')}</TableHead>
                                    <TableHead className="w-[40%]">{t('description')}</TableHead>
                                    <TableHead className="text-right">{t('debit')}</TableHead>
                                    <TableHead className="text-right">{t('credit')}</TableHead>
                                    <TableHead className="text-right">{t('balance')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length > 0 ? transactions.map((tx, index) => (
                                    <TableRow key={`${tx.date}-${index}`}>
                                        <TableCell className="text-xs text-muted-foreground">{formatDateTime(tx.date, 'PP', i18n.language)}</TableCell>
                                        <TableCell>
                                            <Link to={`/orders/${tx.reference_id}`} className="font-medium hover:underline text-primary">{tx.description}</Link>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{tx.debit > 0 ? formatCurrency(tx.debit, 'USD', i18n.language) : '-'}</TableCell>
                                        <TableCell className="text-right font-mono text-green-600">{tx.credit > 0 ? formatCurrency(tx.credit, 'USD', i18n.language) : '-'}</TableCell>
                                        <TableCell className={cn("text-right font-semibold", tx.balance > 0 && "text-destructive")}>{formatCurrency(tx.balance, 'USD', i18n.language)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center">{t('noTransactionsFound')}</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CustomerLedgerPage;