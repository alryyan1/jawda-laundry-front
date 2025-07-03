// src/pages/reports/CostSummaryPage.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

import type { CostSummaryReport } from '@/types';
import { getCostSummaryReport } from '@/api/reportService';
import { useAuth } from '@/features/auth/hooks/useAuth';

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { TrendingDown, FileText, ShoppingCart } from 'lucide-react';

const StatCard: React.FC<{ title: string; value?: string | number; isLoading?: boolean; icon: React.ElementType }> = ({ title, value, isLoading, icon: Icon }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{value ?? '-'}</div>}
        </CardContent>
    </Card>
);

const CostSummaryPage: React.FC = () => {
    const { t, i18n } = useTranslation(['reports', 'common']);
    const { can } = useAuth();
    const queryClient = useQueryClient();
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().setDate(new Date().getDate() - 29)),
        to: new Date(),
    });

    const queryKey = ['costSummaryReport', dateRange];
    const { data: report, isLoading, isFetching } = useQuery<CostSummaryReport, Error>({
        queryKey,
        queryFn: () => getCostSummaryReport(
            dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
            dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
        ),
        enabled: can('report:view-financial'),
    });

    if (!can('report:view-financial')) {
        return <div className="p-8 text-center text-destructive">{t('accessDenied')}</div>;
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

    return (
        <div>
            <PageHeader
                title={t('costSummaryTitle')}
                description={t('costSummaryDescription')}
                showRefreshButton
                onRefresh={() => queryClient.invalidateQueries({ queryKey })}
                isRefreshing={isFetching}
            >
                <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            </PageHeader>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <StatCard
                    title={t('totalCost')}
                    icon={TrendingDown}
                    value={report?.summary.total_cost !== undefined ? formatCurrency(report.summary.total_cost, 'USD', i18n.language) : undefined}
                    isLoading={isLoading}
                />
                <StatCard
                    title={t('totalExpenses')}
                    icon={FileText}
                    value={report?.summary.total_expenses !== undefined ? formatCurrency(report.summary.total_expenses, 'USD', i18n.language) : undefined}
                    isLoading={isLoading}
                />
                <StatCard
                    title={t('totalPurchases')}
                    icon={ShoppingCart}
                    value={report?.summary.total_purchases !== undefined ? formatCurrency(report.summary.total_purchases, 'USD', i18n.language) : undefined}
                    isLoading={isLoading}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('expensesByCategory')}</CardTitle>
                        <CardDescription>{t('topServicesDescription', { dateFrom: report?.date_range.from, dateTo: report?.date_range.to })}</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {isLoading ? <Skeleton className="w-full h-[300px]" /> : report?.expenses_by_category.length === 0 ? (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                {t('noDataForPeriod')}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={report?.expenses_by_category} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="category" width={120} tick={{ fontSize: 12 }} interval={0} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        formatter={(value: number) => formatCurrency(value, 'USD', i18n.language)}
                                    />
                                    <Bar dataKey="total_amount" name={t('totalAmount')} radius={[0, 4, 4, 0]}>
                                        {report?.expenses_by_category.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>{t('purchasesBySupplier')}</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>{t('supplier')}</TableHead><TableHead className="text-right">{t('totalAmount')}</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isLoading ? [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={2}><Skeleton className="h-8 w-full"/></TableCell></TableRow>)
                                : report?.purchases_by_supplier.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">
                                            {t('noDataForPeriod')}
                                        </TableCell>
                                    </TableRow>
                                ) : report?.purchases_by_supplier.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(item.total_amount, 'USD', i18n.language)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
export default CostSummaryPage;