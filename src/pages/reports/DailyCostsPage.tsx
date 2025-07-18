// src/pages/reports/DailyCostsPage.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, getYear, getMonth } from 'date-fns';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

import type { DailyCostsReport } from '@/types';
import { getDailyCostsReport } from '@/api/reportService';
import { useAuth } from '@/features/auth/hooks/useAuth';

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { useCurrency } from '@/hooks/useCurrency';
import { TrendingDown, ClipboardList, CalendarDays } from 'lucide-react';

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

const DailyCostsPage: React.FC = () => {
    const { t, i18n } = useTranslation(['reports', 'common', 'expenses']);
    const { can } = useAuth();
    const queryClient = useQueryClient();
    const { currencyCode } = useCurrency();

    const [date, setDate] = useState({ month: getMonth(new Date()) + 1, year: getYear(new Date()) });

    const queryKey = ['dailyCostsReport', date.year, date.month];
    const { data: report, isLoading, isFetching } = useQuery<DailyCostsReport, Error>({
        queryKey,
        queryFn: () => getDailyCostsReport(date.month, date.year),
        enabled: can('report:view-financial'),
    });

    const months = Array.from({ length: 12 }, (_, i) => ({ label: format(new Date(2000, i), 'MMMM'), value: i + 1 }));
    const years = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - i);

    if (!can('report:view-financial')) { /* ... Access Denied ... */ }

    return (
        <div className="max-w-7xl mx-auto">
            <PageHeader
                title={t('dailyCostsTitle')}
                description={t('dailyCostsDescription')}
                showRefreshButton
                onRefresh={() => queryClient.invalidateQueries({ queryKey })}
                isRefreshing={isFetching}
            >
                <div className="flex items-center gap-2">
                    <Select value={String(date.month)} onValueChange={(val) => setDate(d => ({ ...d, month: Number(val) }))}>
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                     <Select value={String(date.year)} onValueChange={(val) => setDate(d => ({ ...d, year: Number(val) }))}>
                        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </PageHeader>

            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <StatCard
                    title={t('totalCost')}
                    icon={TrendingDown}
                    value={report?.summary.total_cost !== undefined ? formatCurrency(report.summary.total_cost, currencyCode, i18n.language) : undefined}
                    isLoading={isLoading}
                />
                <StatCard
                    title={t('totalExpenseEntries')}
                    icon={ClipboardList}
                    value={report?.summary.total_entries}
                    isLoading={isLoading}
                />
                <StatCard
                    title={t('averageDailyCost')}
                    icon={CalendarDays}
                    value={report?.summary.average_daily_cost !== undefined ? formatCurrency(report.summary.average_daily_cost, currencyCode, i18n.language) : undefined}
                    isLoading={isLoading}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('costTrendFor', { month: report?.report_details.month_name || '...' })}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="w-full h-[350px]" /> : (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={report?.daily_data}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis dataKey="date" tickFormatter={(dateStr) => format(parseISO(dateStr), 'd')} fontSize={12} />
                                <YAxis tickFormatter={(val) => formatCurrency(val, currencyCode, i18n.language).replace(/\.00$/, '')} fontSize={12} />
                                <Tooltip
                                    formatter={(value: number) => [formatCurrency(value, currencyCode, i18n.language), t('cost')]}
                                    labelFormatter={(label) => format(parseISO(label), 'EEEE, MMM d')}
                                />
                                <Legend verticalAlign="top" height={36}/>
                                <Bar dataKey="daily_cost" name={t('cost')} radius={[4, 4, 0, 0]} fill="hsl(var(--destructive))" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">{t('dailyBreakdown')}</h3>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('date')}</TableHead>
                                <TableHead className="text-center">{t('expenseEntries')}</TableHead>
                                <TableHead className="text-right">{t('dailyCost')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8 w-full"/></TableCell></TableRow>)
                            : report?.daily_data.map(day => (
                                <TableRow 
                                    key={day.date}
                                    className={day.daily_cost > 0 ? 'font-bold text-lg text-red-600' : ''}
                                >
                                    <TableCell className={`font-medium ${day.daily_cost > 0 ? 'font-bold text-lg text-red-600' : ''}`}>
                                        {format(parseISO(day.date), 'EEEE, MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className={`text-center ${day.daily_cost > 0 ? 'font-bold text-lg text-red-600' : ''}`}>
                                        {day.expense_count}
                                    </TableCell>
                                    <TableCell className={`text-right font-mono ${day.daily_cost > 0 ? 'font-bold text-lg text-red-600' : ''}`}>
                                                                                    {formatCurrency(day.daily_cost, currencyCode, i18n.language)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};
export default DailyCostsPage;