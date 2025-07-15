import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { restaurantTableService } from '@/api/restaurantTableService';
import { RestaurantTable, CreateRestaurantTableRequest, UpdateRestaurantTableRequest } from '@/types/restaurantTable.types';

interface RestaurantTableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  table?: RestaurantTable | null;
}

export const RestaurantTableFormModal: React.FC<RestaurantTableFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  table,
}) => {
  const { t } = useTranslation(['common', 'admin']);
  const queryClient = useQueryClient();
  const isEditing = !!table;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateRestaurantTableRequest>({
    defaultValues: {
      name: '',
      number: '',
      capacity: 4,
      description: '',
      status: 'available',
      is_active: true,
    },
  });

  // Reset form when table changes
  React.useEffect(() => {
    if (table) {
      reset({
        name: table.name,
        number: table.number,
        capacity: table.capacity,
        description: table.description || '',
        status: table.status,
        is_active: table.is_active,
      });
    } else {
      reset({
        name: '',
        number: '',
        capacity: 4,
        description: '',
        status: 'available',
        is_active: true,
      });
    }
  }, [table, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreateRestaurantTableRequest) => restaurantTableService.create(data),
    onSuccess: () => {
      toast.success(t('tableCreatedSuccess', { ns: 'admin' }));
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      onSubmit();
    },
    onError: (error: any) => {
      toast.error(error.message || t('tableCreateFailed', { ns: 'admin' }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateRestaurantTableRequest) => 
      restaurantTableService.update(table!.id, data),
    onSuccess: () => {
      toast.success(t('tableUpdatedSuccess', { ns: 'admin' }));
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      onSubmit();
    },
    onError: (error: any) => {
      toast.error(error.message || t('tableUpdateFailed', { ns: 'admin' }));
    },
  });

  const handleFormSubmit = (data: CreateRestaurantTableRequest) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('editTable', { ns: 'admin' }) : t('addTable', { ns: 'admin' })}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('tableName', { ns: 'admin' })} *</Label>
              <Input
                id="name"
                {...register('name', { required: t('tableNameRequired', { ns: 'admin' }) })}
                placeholder={t('enterTableName', { ns: 'admin' })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">{t('tableNumber', { ns: 'admin' })} *</Label>
              <Input
                id="number"
                {...register('number', { required: t('tableNumberRequired', { ns: 'admin' }) })}
                placeholder={t('enterTableNumber', { ns: 'admin' })}
              />
              {errors.number && (
                <p className="text-sm text-destructive">{errors.number.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">{t('capacity', { ns: 'admin' })} *</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="20"
              {...register('capacity', { 
                required: t('capacityRequired', { ns: 'admin' }),
                min: { value: 1, message: t('capacityMin', { ns: 'admin' }) },
                max: { value: 20, message: t('capacityMax', { ns: 'admin' }) },
              })}
            />
            {errors.capacity && (
              <p className="text-sm text-destructive">{errors.capacity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('description', { ns: 'common' })}</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder={t('enterDescription', { ns: 'admin' })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">{t('status', { ns: 'common' })}</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">
                    {t('tableStatus_available', { ns: 'admin' })}
                  </SelectItem>
                  <SelectItem value="occupied">
                    {t('tableStatus_occupied', { ns: 'admin' })}
                  </SelectItem>
                  <SelectItem value="reserved">
                    {t('tableStatus_reserved', { ns: 'admin' })}
                  </SelectItem>
                  <SelectItem value="maintenance">
                    {t('tableStatus_maintenance', { ns: 'admin' })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_active">{t('active', { ns: 'common' })}</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={watch('is_active')}
                  onCheckedChange={(checked) => setValue('is_active', checked)}
                />
                <Label htmlFor="is_active" className="text-sm">
                  {watch('is_active') ? t('yes', { ns: 'common' }) : t('no', { ns: 'common' })}
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('saving', { ns: 'common' }) : (isEditing ? t('update', { ns: 'common' }) : t('create', { ns: 'common' }))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 