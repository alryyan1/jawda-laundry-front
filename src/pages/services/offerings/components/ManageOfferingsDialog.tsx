// src/pages/services/offerings/components/ManageOfferingsDialog.tsx
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input'; // For inline editing
import { Switch } from '@/components/ui/switch'; // For inline editing
import { Loader2, PlusCircle, Check, Trash2 } from 'lucide-react';
import {
    createAllOfferingsForProductType
} from '@/api/productTypeService';
import {
    updateServiceOffering,
    deleteServiceOffering,
    getServiceOfferings, // To get offerings for one product type
    type ServiceOfferingFormData
} from '@/api/serviceOfferingService';

import type { ProductType, ServiceOffering } from '@/types';


interface ManageOfferingsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    productType: ProductType;
}

// A component for a single editable row
const OfferingRow: React.FC<{
    offering: ServiceOffering;
    onUpdate: (id: number, data: Partial<ServiceOfferingFormData>) => void;
    onDelete: (offering: ServiceOffering) => void;
    isUpdating: boolean;
}> = ({ offering, onUpdate, onDelete, isUpdating }) => {
    const [price, setPrice] = useState(offering.default_price?.toString() || '');
    const [pricePerSqMeter, setPricePerSqMeter] = useState(offering.default_price_per_sq_meter?.toString() || '');
    const [isActive, setIsActive] = useState(offering.is_active);

    const isDimensionBased = offering.productType?.is_dimension_based;

    const handleSave = () => {
        const dataToUpdate: Partial<ServiceOfferingFormData> = {};
        if (isDimensionBased) {
            if (parseFloat(pricePerSqMeter) !== offering.default_price_per_sq_meter) {
                dataToUpdate.default_price_per_sq_meter = pricePerSqMeter;
            }
        } else {
            if (parseFloat(price) !== offering.default_price) {
                dataToUpdate.default_price = price;
            }
        }
        if (isActive !== offering.is_active) {
            dataToUpdate.is_active = isActive;
        }

        if (Object.keys(dataToUpdate).length > 0) {
            onUpdate(offering.id, dataToUpdate);
        }
    };

    const hasChanged = useMemo(() => {
        if (isActive !== offering.is_active) return true;
        if (isDimensionBased) {
            return parseFloat(pricePerSqMeter) !== (offering.default_price_per_sq_meter || 0);
        } else {
            return parseFloat(price) !== (offering.default_price || 0);
        }
    }, [price, pricePerSqMeter, isActive, offering, isDimensionBased]);

    return (
        <TableRow>
            <TableCell className="font-medium text-center">{offering.serviceAction?.name}</TableCell>
            <TableCell className="text-center">
                {isDimensionBased ? (
                    <Input
                        onFocus={(e) => e.target.select()}
                        type="number"
                        step="0.01"
                        value={pricePerSqMeter}
                        onChange={(e) => setPricePerSqMeter(e.target.value)}
                        className="h-8 max-w-[120px]"
                        disabled={isUpdating}
                    />
                ) : (
                    <Input
                        onFocus={(e) => e.target.select()}
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="h-8 max-w-[120px]"
                        disabled={isUpdating}
                    />
                )}
            </TableCell>
            <TableCell className="text-center w-[120px]">
                <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    disabled={isUpdating}
                />
            </TableCell>
            <TableCell className="text-center space-x-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(offering)}
                    disabled={isUpdating}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:text-green-600"
                    onClick={handleSave}
                    disabled={isUpdating || !hasChanged}
                >
                    <Check className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    )
}


export const ManageOfferingsDialog: React.FC<ManageOfferingsDialogProps> = ({ isOpen, onOpenChange, productType }) => {
    const { t } = useTranslation(['common', 'services']);

    // Fetch service offerings specifically for this productType
    const { data: offerings = [], isLoading, refetch } = useQuery<ServiceOffering[], Error>({
        queryKey: ['serviceOfferingsForProductType', productType?.id],
        queryFn: async () => {
            if (!productType?.id) {
                throw new Error('Product type ID is required');
            }
            const result = await getServiceOfferings(1, 1000, { product_type_id: productType.id }); // Fetch all for this type
            return result.data;
        },
        enabled: isOpen && !!productType?.id, // Only fetch when dialog is open and productType exists
    });

    const createAllMutation = useMutation<ServiceOffering[], Error, number | string>({
        mutationFn: createAllOfferingsForProductType,
        onSuccess: () => {
            toast.success(t('allOfferingsCreatedSuccess', { ns: 'services' }));
            refetch(); // Refetch the list of offerings
        },
        onError: (error) => {
            toast.error(error.message || t('allOfferingsCreateFailed', { ns: 'services' }));
        }
    });

    const updateMutation = useMutation<ServiceOffering, Error, { id: number; data: Partial<ServiceOfferingFormData> }>({
        mutationFn: ({ id, data }) => updateServiceOffering(id, data),
        onSuccess: () => {
            toast.success(t('offeringUpdatedSuccess', { ns: 'services' }));
            refetch();
        },
        onError: (error) => {
            toast.error(error.message || t('offeringUpdateFailed', { ns: 'services' }));
        }
    });

    const deleteMutation = useMutation<void, Error, number>({
        mutationFn: (id) => deleteServiceOffering(id).then(() => {}),
        onSuccess: () => {
            toast.success(t('offeringDeletedSuccess', { ns: 'services' }));
            refetch();
        },
        onError: (error) => {
            toast.error(error.message || t('offeringDeleteFailed', { ns: 'services' }));
        }
    });

    const handleUpdate = (id: number, data: Partial<ServiceOfferingFormData>) => {
        updateMutation.mutate({ id, data });
    };

    const handleDelete = (offering: ServiceOffering) => {
        deleteMutation.mutate(offering.id);
    };

    const isMutating = createAllMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    // Don't render if productType is undefined
    if (!productType) {
        return null;
    }

    console.log(productType, 'productType');

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[90vw] w-[1200px] sm:max-w-[90vw] md:max-w-[90vw]">
                    <DialogHeader>
                        <DialogTitle>{productType.name}</DialogTitle>
                        <DialogDescription>{t('manageOfferingsDescription', { ns: 'services' })}</DialogDescription>
                    </DialogHeader>
                    <div className="my-4">
                        <Button
                            onClick={() => createAllMutation.mutate(productType.id)}
                            disabled={isMutating}
                            size="sm"
                        >
                            {createAllMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            {t('createAllMissingOfferings', { ns: 'services' })}
                        </Button>
                    </div>

                    <div className="rounded-md border max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className='text-center'>{t('serviceAction', { ns: 'services' })}</TableHead>
                                    <TableHead className='text-center'>{productType.is_dimension_based ? t('pricePerSqMeter', {ns:'services'}) : t('pricePerItem', {ns:'services'})}</TableHead>
                                    <TableHead className="text-center">{t('active')}</TableHead>
                                    <TableHead className="text-center rtl:text-left w-[120px]">{t('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                ) : offerings.length > 0 ? (
                                    offerings.map(offering => (
                                        <OfferingRow
                                            key={offering.id}
                                            offering={offering}
                                            onUpdate={handleUpdate}
                                            onDelete={handleDelete}
                                            isUpdating={updateMutation.isPending && updateMutation.variables?.id === offering.id}
                                        />
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">{t('noOfferingsForProduct', {ns:'services'})}</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};