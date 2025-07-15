import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

import { createTableReservation } from '@/api/tableReservationService';
import { getDiningTables } from '@/api/diningTableService';
import { getAllCustomers } from '@/api/customerService';
import type { TableReservationFormData, DiningTable } from '@/types/dining.types';

const reservationSchema = z.object({
  dining_table_id: z.number().min(1, 'Table is required'),
  customer_id: z.number().min(1, 'Customer is required'),
  reservation_date: z.string().min(1, 'Reservation date is required'),
  party_size: z.number().min(1, 'Party size must be at least 1').max(20, 'Party size cannot exceed 20'),
  notes: z.string().optional(),
  contact_phone: z.string().optional(),
});

interface TableReservationFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  selectedTable?: DiningTable | null;
}

export const TableReservationFormModal: React.FC<TableReservationFormModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
  selectedTable,
}) => {
  const { t } = useTranslation(['dining']);
  const queryClient = useQueryClient();
  const [selectedDateTime, setSelectedDateTime] = useState('');

  // Fetch available tables
  const { data: tables = [] } = useQuery({
    queryKey: ['diningTables'],
    queryFn: getDiningTables,
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: getAllCustomers,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TableReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      dining_table_id: selectedTable?.id || 0,
      customer_id: 0,
      reservation_date: '',
      party_size: 2,
      notes: '',
      contact_phone: '',
    },
  });

  const createReservationMutation = useMutation({
    mutationFn: createTableReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayReservations'] });
      queryClient.invalidateQueries({ queryKey: ['diningTables'] });
      reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || t('reservationCreateFailed', { ns: 'dining' }));
    },
  });

  const onSubmit = (data: TableReservationFormData) => {
    // Combine date and time
    const dateTime = new Date(data.reservation_date);
    if (selectedDateTime) {
      const [hours, minutes] = selectedDateTime.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    
    const reservationData = {
      ...data,
      reservation_date: dateTime.toISOString(),
    };

    createReservationMutation.mutate(reservationData);
  };

  const handleClose = () => {
    reset();
    setSelectedDateTime('');
    onOpenChange(false);
  };

  const availableTables = tables.filter(table => 
    table.status === 'available' || table.status === 'reserved'
  );

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getMinDate = () => {
    const today = new Date();
    return formatDateForInput(today);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('addNewReservation', { ns: 'dining' })}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dining_table_id">{t('table', { ns: 'dining' })} *</Label>
              <Select
                value={watch('dining_table_id')?.toString() || ''}
                onValueChange={(value) => setValue('dining_table_id', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectTable', { ns: 'dining' })} />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table.id} value={table.id.toString()}>
                      {table.name} ({table.capacity} {t('seats', { ns: 'dining' })})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.dining_table_id && (
                <p className="text-sm text-destructive">{errors.dining_table_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_id">{t('customer', { ns: 'dining' })} *</Label>
              <Select
                value={watch('customer_id')?.toString() || ''}
                onValueChange={(value) => setValue('customer_id', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectCustomer', { ns: 'dining' })} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customer_id && (
                <p className="text-sm text-destructive">{errors.customer_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reservation_date">{t('date', { ns: 'dining' })} *</Label>
              <Input
                id="reservation_date"
                type="date"
                min={getMinDate()}
                {...register('reservation_date')}
              />
              {errors.reservation_date && (
                <p className="text-sm text-destructive">{errors.reservation_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">{t('time', { ns: 'dining' })} *</Label>
              <Input
                id="time"
                type="time"
                value={selectedDateTime}
                onChange={(e) => setSelectedDateTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="party_size">{t('partySize', { ns: 'dining' })} *</Label>
              <Input
                id="party_size"
                type="number"
                min="1"
                max="20"
                {...register('party_size', { valueAsNumber: true })}
                placeholder="2"
              />
              {errors.party_size && (
                <p className="text-sm text-destructive">{errors.party_size.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">{t('contactPhone', { ns: 'dining' })}</Label>
              <Input
                id="contact_phone"
                {...register('contact_phone')}
                placeholder={t('enterPhoneNumber', { ns: 'dining' })}
              />
              {errors.contact_phone && (
                <p className="text-sm text-destructive">{errors.contact_phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('notes', { ns: 'dining' })}</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder={t('enterNotes', { ns: 'dining' })}
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={createReservationMutation.isPending}>
              {createReservationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('createReservation', { ns: 'dining' })}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 