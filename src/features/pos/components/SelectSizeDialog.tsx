// src/features/pos/components/SelectSizeDialog.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import type { ProductType, PredefinedSize } from '@/types';
import { useAuth } from '@/features/auth/hooks/useAuth';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Trash2, Ruler } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { createPredefinedSize, deletePredefinedSize, getPredefinedSizes } from '@/api/predefinedSizeService';

// --- Inner Modal for Managing Sizes ---
const sizeSchema = z.object({
  name: z.string().min(1, { message: "validation.nameRequired" }),
  length_meters: z.number().positive(),
  width_meters: z.number().positive(),
});
type SizeFormData = z.infer<typeof sizeSchema>;

const ManageSizesModal: React.FC<{
  productType: ProductType;
  currentSizes: PredefinedSize[];
  onClose: () => void;
}> = ({ productType, currentSizes, onClose }) => {
    const { t } = useTranslation(['services', 'common', 'validation']);
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset } = useForm<SizeFormData>({ 
      resolver: zodResolver(sizeSchema),
      defaultValues: {
        name: '',
        length_meters: 0,
        width_meters: 0
      }
    });

    const createMutation = useMutation<PredefinedSize, Error, SizeFormData>({
        mutationFn: (data) => createPredefinedSize(productType.id, data),
        onSuccess: () => {
            toast.success(t('sizeAddedSuccess'));
            queryClient.invalidateQueries({ queryKey: ['predefinedSizes', productType.id] });
            reset();
        },
        onError: (error) => {
            toast.error(error.message || t('sizeActionFailed'));
        }
    });

     const deleteMutation = useMutation<void, Error, number>({
        mutationFn: (sizeId) => deletePredefinedSize(productType.id, sizeId),
        onSuccess: () => {
            toast.success(t('sizeDeletedSuccess'));
            queryClient.invalidateQueries({ queryKey: ['predefinedSizes', productType.id] });
        },
        onError: (error) => {
            toast.error(error.message || t('sizeActionFailed'));
        }
    });

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('managePredefinedSizesFor', { name: productType.name })}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {/* List of existing sizes with delete buttons */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {currentSizes.map(size => (
                            <div key={size.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                <span>{size.name} ({size.length_meters}m x {size.width_meters}m)</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(size.id)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        ))}
                    </div>
                    <Separator />
                    {/* Form to add a new size */}
                    <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-3 p-1">
                        <h4 className="font-semibold text-sm">{t('addNewSize')}</h4>
                         <div className="grid grid-cols-3 gap-2">
                            <Input {...register('name')} placeholder={t('sizeName', {defaultValue: 'Size Name'})} />
                            <Input type="number" step="0.01" {...register('length_meters', { valueAsNumber: true })} placeholder={t('lengthMeters', {ns:'orders'})} />
                            <Input type="number" step="0.01" {...register('width_meters', { valueAsNumber: true })} placeholder={t('widthMeters', {ns:'orders'})} />
                         </div>
                         <Button type="submit" size="sm" disabled={createMutation.isPending}>{createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2"/>}{t('addSize')}</Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};


// --- Main Dialog for Selecting a Size ---
interface SelectSizeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  productType: ProductType;
  onSelect: (size: { length_meters: number; width_meters: number }) => void;
}

export const SelectSizeDialog: React.FC<SelectSizeDialogProps> = ({ isOpen, onOpenChange, productType, onSelect }) => {
    const { t } = useTranslation(['services', 'common']);
    const { can } = useAuth();
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    const { data: sizes = [], isLoading } = useQuery<PredefinedSize[], Error>({
        queryKey: ['predefinedSizes', productType.id],
        queryFn: () => getPredefinedSizes(productType.id),
        enabled: isOpen,
    });

    const handleSelectAndClose = (size: PredefinedSize) => {
        onSelect({ length_meters: size.length_meters, width_meters: size.width_meters });
        onOpenChange(false);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('selectPredefinedSizeFor', { name: productType.name })}</DialogTitle>
                        <DialogDescription>{t('selectSizeHint')}</DialogDescription>
                    </DialogHeader>
                    {isLoading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin"/></div>
                    : sizes.length === 0 ? (
                        <Alert>
                            <Ruler className="h-4 w-4" />
                            <AlertTitle>{t('noPredefinedSizes')}</AlertTitle>
                            <AlertDescription>{t('noPredefinedSizesHint')}</AlertDescription>
                        </Alert>
                    ) : (
                        <ScrollArea className="max-h-[50vh]">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-1">
                                {sizes.map(size => (
                                    <Button key={size.id} variant="outline" className="h-auto p-3 flex flex-col items-center gap-1" onClick={() => handleSelectAndClose(size)}>
                                        <span className="font-semibold">{size.name}</span>
                                        <span className="text-xs text-muted-foreground">{size.length_meters}m x {size.width_meters}m</span>
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                    <DialogFooter className="sm:justify-between">
                         {can('service-admin:manage') && <Button variant="secondary" onClick={() => setIsManageModalOpen(true)}>{t('manageSizes')}</Button>}
                         <Button variant="outline" onClick={() => onOpenChange(false)}>{t('close')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Nested Modal for Admins */}
            {isManageModalOpen && (
                <ManageSizesModal
                    productType={productType}
                    currentSizes={sizes}
                    onClose={() => setIsManageModalOpen(false)}
                />
            )}
        </>
    );
};