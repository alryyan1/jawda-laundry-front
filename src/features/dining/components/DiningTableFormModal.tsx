import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

import { createDiningTable } from '@/api/diningTableService';
import type { DiningTableFormData } from '@/types/dining.types';

const diningTableSchema = z.object({
  name: z.string().min(1, 'Table name is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(20, 'Capacity cannot exceed 20'),
  description: z.string().optional(),
});

interface DiningTableFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const DiningTableFormModal: React.FC<DiningTableFormModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation(['dining']);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DiningTableFormData>({
    resolver: zodResolver(diningTableSchema),
    defaultValues: {
      name: '',
      capacity: 4,
      description: '',
    },
  });

  const createTableMutation = useMutation({
    mutationFn: createDiningTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diningTables'] });
      queryClient.invalidateQueries({ queryKey: ['diningTableStatistics'] });
      reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || t('tableCreateFailed', { ns: 'dining' }));
    },
  });

  const onSubmit = (data: DiningTableFormData) => {
    createTableMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('addNewTable', { ns: 'dining' })}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('tableName', { ns: 'dining' })} *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder={t('enterTableName', { ns: 'dining' })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">{t('capacity', { ns: 'dining' })} *</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="20"
              {...register('capacity', { valueAsNumber: true })}
              placeholder="4"
            />
            {errors.capacity && (
              <p className="text-sm text-destructive">{errors.capacity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('description', { ns: 'dining' })}</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder={t('enterDescription', { ns: 'dining' })}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={createTableMutation.isPending}>
              {createTableMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('createTable', { ns: 'dining' })}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 