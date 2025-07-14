// src/pages/reports/DailyRevenuePage.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, getYear, getMonth } from 'date-fns';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

import type { DailyRevenueReport } from '@/types';
import { getDailyRevenueReport } from '@/api/reportService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSettings } from '@/context/SettingsContext';

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { TrendingUp, FileText, DollarSign } from 'lucide-react';

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

const DailyRevenuePage: React.FC = () => {
    const { t, i18n } = useTranslation(['reports', 'common']);
    const { can } = useAuth();
    const { getSetting } = useSettings();
    const queryClient = useQueryClient();

    const [date, setDate] = useState({ month: getMonth(new Date()) + 1, year: getYear(new Date()) });

    // Get currency from settings, fallback to USD
    const currency = getSetting('currency_symbol', 'USD');

    const queryKey = ['dailyRevenueReport', date.year, date.month];
    const { data: report, isLoading, isFetching } = useQuery<DailyRevenueReport, Error>({
        queryKey,
        queryFn: () => getDailyRevenueReport(date.month, date.year),
        enabled: can('report:view-financial'),
    });

    const months = Array.from({ length: 12 }, (_, i) => ({ label: format(new Date(0, i), 'MMMM'), value: i + 1 }));
    const years = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - i);

    if (!can('report:view-financial')) { /* ... Access Denied ... */ }

    return (
        <div className="max-w-7xl mx-auto">
            <PageHeader
                title={t('dailyRevenueTitle')}
                description={t('dailyRevenueDescription')}
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
                <StatCard title={t('totalRevenue')} value={report?.summary.total_revenue !== undefined ? formatCurrency(report.summary.total_revenue, currency, i18n.language) : undefined} isLoading={isLoading} icon={DollarSign} />
                <StatCard title={t('totalCompletedOrders')} value={report?.summary.total_orders} isLoading={isLoading} icon={FileText} />
                <StatCard title={t('averageDailyRevenue')} value={report?.summary.average_daily_revenue !== undefined ? formatCurrency(report.summary.average_daily_revenue, currency, i18n.language) : undefined} isLoading={isLoading} icon={TrendingUp} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('revenueTrendFor', { month: report?.report_details.month_name || '...' })}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="w-full h-[350px]" /> : (
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={report?.daily_data}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis dataKey="date" tickFormatter={(dateStr) => format(parseISO(dateStr), 'd')} fontSize={12} />
                                <YAxis yAxisId="left" tickFormatter={(val) => formatCurrency(val, currency, i18n.language).replace(/\.00$/, '')} fontSize={12} />
                                <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => val} allowDecimals={false} fontSize={12} />
                                <Tooltip formatter={(value, name) => name === 'Revenue' ? formatCurrency(Number(value), currency, i18n.language) : value} />
                                <Legend />
                                <Line 
                                    yAxisId="left" 
                                    type="monotone" 
                                    dataKey="daily_revenue" 
                                    name={t('revenue')} 
                                    stroke="hsl(var(--primary))" 
                                    strokeWidth={2} 
                                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                                    activeDot={{ r: 6, fill: "hsl(var(--primary))" }} 
                                />
                                <Line 
                                    yAxisId="right" 
                                    type="monotone" 
                                    dataKey="order_count" 
                                    name={t('orders')} 
                                    stroke="hsl(var(--muted-foreground))" 
                                    strokeDasharray="5 5"
                                    dot={{ r: 4, fill: "hsl(var(--muted-foreground))" }}
                                    activeDot={{ r: 6, fill: "hsl(var(--muted-foreground))" }}
                                />
                            </LineChart>
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
                                <TableHead className="text-center">{t('orderCount')}</TableHead>
                                <TableHead className="text-right">{t('dailyRevenue')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8 w-full"/></TableCell></TableRow>)
                            : report?.daily_data.map(day => (
                                <TableRow 
                                    key={day.date}
                                    className={day.daily_revenue > 0 ? 'bg-green-50 dark:bg-green-950/20 border-l-4 border-l-green-500' : ''}
                                >
                                    <TableCell className={`font-medium ${day.daily_revenue > 0 ? 'text-lg font-bold text-green-700 dark:text-green-300' : ''}`}>
                                        {format(parseISO(day.date), 'EEEE,  d/MM/yyyy')}
                                    </TableCell>
                                    <TableCell className={`text-center ${day.daily_revenue > 0 ? 'text-lg font-bold text-green-700 dark:text-green-300' : ''}`}>
                                        {day.order_count}
                                    </TableCell>
                                    <TableCell className={`text-right font-mono ${day.daily_revenue > 0 ? 'text-lg font-bold text-green-700 dark:text-green-300' : ''}`}>
                                        {formatCurrency(day.daily_revenue, currency, i18n.language)}
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
export default DailyRevenuePage;