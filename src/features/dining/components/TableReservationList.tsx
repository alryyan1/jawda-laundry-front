import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Clock, Users, Calendar, Loader2 } from 'lucide-react';

import type { TableReservation } from '@/types/dining.types';
import { updateTableReservation, deleteTableReservation } from '@/api/tableReservationService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface TableReservationListProps {
  reservations: TableReservation[];
  isLoading: boolean;
  onReservationUpdated: () => void;
}

export const TableReservationList: React.FC<TableReservationListProps> = ({
  reservations,
  isLoading,
  onReservationUpdated,
}) => {
  const { t } = useTranslation(['dining']);
  const queryClient = useQueryClient();

  const updateReservationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TableReservation> }) =>
      updateTableReservation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayReservations'] });
      queryClient.invalidateQueries({ queryKey: ['diningTables'] });
      onReservationUpdated();
      toast.success(t('reservationUpdatedSuccess', { ns: 'dining' }));
    },
    onError: (error) => {
      toast.error(error.message || t('reservationUpdateFailed', { ns: 'dining' }));
    },
  });

  const deleteReservationMutation = useMutation({
    mutationFn: (id: number) => deleteTableReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayReservations'] });
      queryClient.invalidateQueries({ queryKey: ['diningTables'] });
      onReservationUpdated();
      toast.success(t('reservationDeletedSuccess', { ns: 'dining' }));
    },
    onError: (error) => {
      toast.error(error.message || t('reservationDeleteFailed', { ns: 'dining' }));
    },
  });

  const getStatusColor = (status: TableReservation['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'seated':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleStatusChange = (reservationId: number, newStatus: TableReservation['status']) => {
    updateReservationMutation.mutate({ id: reservationId, data: { status: newStatus } });
  };

  const handleDelete = (reservationId: number) => {
    if (confirm(t('confirmDeleteReservation', { ns: 'dining' }))) {
      deleteReservationMutation.mutate(reservationId);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('loading', { ns: 'common' })}</span>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('noReservationsToday', { ns: 'dining' })}</h3>
          <p className="text-muted-foreground">{t('noReservationsDescription', { ns: 'dining' })}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('todayReservations', { ns: 'dining' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table', { ns: 'dining' })}</TableHead>
              <TableHead>{t('customer', { ns: 'dining' })}</TableHead>
              <TableHead>{t('time', { ns: 'dining' })}</TableHead>
              <TableHead>{t('partySize', { ns: 'dining' })}</TableHead>
              <TableHead>{t('status', { ns: 'dining' })}</TableHead>
              <TableHead>{t('order', { ns: 'dining' })}</TableHead>
              <TableHead className="text-right">{t('actions', { ns: 'dining' })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((reservation) => (
              <TableRow key={reservation.id}>
                <TableCell>
                  <div className="font-medium">{reservation.dining_table?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {reservation.dining_table?.capacity} {t('seats', { ns: 'dining' })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{reservation.customer?.name}</div>
                  {reservation.contact_phone && (
                    <div className="text-sm text-muted-foreground">{reservation.contact_phone}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(reservation.reservation_date)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {reservation.party_size}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(reservation.status)}>
                    {t(`reservation_status_${reservation.status}`, { ns: 'dining' })}
                  </Badge>
                </TableCell>
                <TableCell>
                  {reservation.order ? (
                    <div className="text-sm">
                      <div className="font-medium">
                        #{reservation.order.daily_order_number || reservation.order.order_number}
                      </div>
                      <div className="text-muted-foreground">
                        ${reservation.order.total_amount.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">{t('noOrder', { ns: 'dining' })}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                        disabled={reservation.status === 'confirmed'}
                      >
                        {t('markConfirmed', { ns: 'dining' })}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(reservation.id, 'seated')}
                        disabled={reservation.status === 'seated'}
                      >
                        {t('markSeated', { ns: 'dining' })}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(reservation.id, 'completed')}
                        disabled={reservation.status === 'completed'}
                      >
                        {t('markCompleted', { ns: 'dining' })}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                        disabled={reservation.status === 'cancelled'}
                      >
                        {t('markCancelled', { ns: 'dining' })}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(reservation.id)}
                        className="text-red-600"
                      >
                        {t('delete', { ns: 'dining' })}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}; 