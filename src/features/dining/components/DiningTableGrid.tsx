import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Users, Clock, FileText, Calendar } from 'lucide-react';

import type { DiningTable } from '@/types/dining.types';
import { updateDiningTableStatus } from '@/api/diningTableService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface DiningTableGridProps {
  tables: DiningTable[];
  onTableClick: (table: DiningTable) => void;
  onTableUpdated: () => void;
}

export const DiningTableGrid: React.FC<DiningTableGridProps> = ({
  tables,
  onTableClick,
  onTableUpdated,
}) => {
  const { t } = useTranslation(['dining']);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: DiningTable['status'] }) =>
      updateDiningTableStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diningTables'] });
      queryClient.invalidateQueries({ queryKey: ['diningTableStatistics'] });
      onTableUpdated();
      toast.success(t('tableStatusUpdated', { ns: 'dining' }));
    },
    onError: (error) => {
      toast.error(error.message || t('tableStatusUpdateFailed', { ns: 'dining' }));
    },
  });

  const getStatusColor = (status: DiningTable['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200';
      case 'occupied':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200';
      case 'maintenance':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 border-gray-200';
    }
  };

  const getStatusIcon = (status: DiningTable['status']) => {
    switch (status) {
      case 'available':
        return '🟢';
      case 'occupied':
        return '🔴';
      case 'reserved':
        return '🟡';
      case 'maintenance':
        return '🔧';
      default:
        return '⚪';
    }
  };

  const handleStatusChange = (tableId: number, newStatus: DiningTable['status']) => {
    updateStatusMutation.mutate({ id: tableId, status: newStatus });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {tables.map((table) => (
        <Card
          key={table.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            table.status === 'occupied' ? 'ring-2 ring-red-200' :
            table.status === 'reserved' ? 'ring-2 ring-yellow-200' :
            table.status === 'maintenance' ? 'ring-2 ring-gray-200' : ''
          }`}
          onClick={() => onTableClick(table)}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getStatusIcon(table.status)}</span>
                <div>
                  <h3 className="font-semibold text-lg">{table.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{table.capacity} {t('seats', { ns: 'dining' })}</span>
                  </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(table.id, 'available');
                    }}
                    disabled={table.status === 'available'}
                  >
                    {t('markAvailable', { ns: 'dining' })}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(table.id, 'occupied');
                    }}
                    disabled={table.status === 'occupied'}
                  >
                    {t('markOccupied', { ns: 'dining' })}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(table.id, 'reserved');
                    }}
                    disabled={table.status === 'reserved'}
                  >
                    {t('markReserved', { ns: 'dining' })}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(table.id, 'maintenance');
                    }}
                    disabled={table.status === 'maintenance'}
                  >
                    {t('markMaintenance', { ns: 'dining' })}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Badge className={`${getStatusColor(table.status)} mb-3`}>
              {t(`status_${table.status}`, { ns: 'dining' })}
            </Badge>

            {/* Active Reservation */}
            {table.active_reservation && (
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {t('reservation', { ns: 'dining' })}
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {table.active_reservation.customer_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(table.active_reservation.reservation_date)}</span>
                  <span>•</span>
                  <span>{table.active_reservation.party_size} {t('people', { ns: 'dining' })}</span>
                </div>
              </div>
            )}

            {/* Active Order */}
            {table.active_order && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    {t('activeOrder', { ns: 'dining' })}
                  </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {table.active_order.customer_name}
                </p>
                <div className="flex items-center justify-between text-xs text-green-600 dark:text-green-400">
                  <span>#{table.active_order.daily_order_number || table.active_order.order_number}</span>
                  <span className="font-medium">
                    ${table.active_order.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {table.description && (
              <p className="text-xs text-muted-foreground mt-2">{table.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 