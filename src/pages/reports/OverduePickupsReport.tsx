// src/pages/reports/OverduePickupsReport.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

import type { Order, PaginatedResponse } from '@/types';
import { getOverduePickupOrders } from '@/api/reportService';
// سنحتاج إلى دالة لإرسال رسالة واتساب مخصصة
// import { sendOverdueReminder } from '@/api/whatsappService'; // TODO: Create this service function

import { PageHeader } from '@/components/shared/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquareWarning } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Link } from 'react-router-dom';

const OverduePickupsReport: React.FC = () => {
    const { t } = useTranslation(['reports', 'common', 'orders']);
    const { can } = useAuth();

    const [overdueDaysFilter, setOverdueDaysFilter] = useState<number | ''>(7); // Default to overdue by 7 days

    const { data: paginatedData, isLoading, isFetching, refetch } = useQuery<PaginatedResponse<Order>, Error>({
        queryKey: ['overdueOrders', overdueDaysFilter],
        queryFn: () => getOverduePickupOrders(1, 15, overdueDaysFilter || undefined),
        enabled: can('report:view-operational'),
    });
    
    // TODO: Create a mutation for sending the reminder
    const sendReminderMutation = useMutation<void, Error, Order>({
        mutationFn: async (order) => { 
            /* TODO: call sendOverdueReminder(order.id) */ 
            toast.info(`Sending reminder for #${order.order_number}...`);
        },
        onSuccess: () => { toast.success(t('reminderSentSuccess', {ns:'reports'})) },
        onError: (error) => { toast.error(error.message || t('reminderSentFailed', {ns:'reports'})) }
    });

    const orders = paginatedData?.data || [];

    if (!can('report:view-operational')) {
        return <p className="p-8 text-center text-destructive">{t('accessDenied')}</p>;
    }

    return (
        <div>
            <PageHeader
                title={t('overduePickupsTitle')}
                description={t('overduePickupsDescription')}
                showRefreshButton
                onRefresh={refetch}
                isRefreshing={isFetching}
            />

            <Card className="mb-4">
                <CardContent className="pt-6">
                    <div className="flex items-end gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="overdue-days">{t('showOrdersOverdueBy', {ns:'reports'})}</Label>
                            <Input
                                id="overdue-days"
                                type="number"
                                placeholder={t('egDays', {ns:'reports', days: 7})}
                                value={overdueDaysFilter}
                                onChange={(e) => setOverdueDaysFilter(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                className="w-48"
                            />
                        </div>
                         <p className="text-sm text-muted-foreground pb-2">{t('daysOrMore', {ns:'reports'})}</p>
                    </div>
                </CardContent>
            </Card>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>{t('customerName')}</TableHead>
                            <TableHead>{t('customerPhone', {ns:'customers'})}</TableHead>
                            <TableHead>{t('dueDate')}</TableHead>
                            <TableHead className="text-center">{t('daysOverdue', {ns:'reports'})}</TableHead>
                            <TableHead className="text-right">{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                        : orders.length > 0 ? (
                            orders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell><Link to={`/orders/${order.id}`} className="font-medium hover:underline text-primary">{order.order_number}</Link></TableCell>
                                    <TableCell>{order.customer.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{order.customer.phone || '-'}</TableCell>
                                    <TableCell>{format(new Date(order.due_date!), 'PP')}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="destructive">{order.overdue_days}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => sendReminderMutation.mutate(order)}
                                            disabled={sendReminderMutation.isPending}
                                        >
                                            <MessageSquareWarning className="mr-2 h-4 w-4" />
                                            {t('sendReminder', {ns:'reports'})}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={6} className="h-32 text-center">{t('noOverdueOrdersFound')}</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
             {/* Pagination Controls */}
        </div>
    );
};

export default OverduePickupsReport;