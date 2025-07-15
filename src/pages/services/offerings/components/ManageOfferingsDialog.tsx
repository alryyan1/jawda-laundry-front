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
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';

// MUI Autocomplete imports
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import {
    createAllOfferingsForProductType
} from '@/api/productTypeService';
import {
    updateServiceOffering,
    deleteServiceOffering,
    getServiceOfferings, // To get offerings for one product type
    createServiceOffering,
    type ServiceOfferingFormData
} from '@/api/serviceOfferingService';
import { getServiceActions } from '@/api/serviceActionService';

import type { ProductType, ServiceOffering, ServiceAction } from '@/types';

// MUI theme to match the application's design
const muiTheme = createTheme({
  palette: {
    primary: {
      main: 'hsl(var(--primary))',
    },
    secondary: {
      main: 'hsl(var(--secondary))',
    },
  },
  components: {
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '0.5rem',
          },
        },
        popper: {
          zIndex: 1500, // Higher than dialog z-index
        },
      },
    },
  },
});

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

    // Auto-save function
    const autoSave = (newPrice: string, newPricePerSqMeter: string, newIsActive: boolean) => {
        const dataToUpdate: Partial<ServiceOfferingFormData> = {};
        
        if (isDimensionBased) {
            const newPricePerSqMeterNum = parseFloat(newPricePerSqMeter);
            if (!isNaN(newPricePerSqMeterNum) && newPricePerSqMeterNum !== (offering.default_price_per_sq_meter || 0)) {
                dataToUpdate.default_price_per_sq_meter = newPricePerSqMeterNum;
            }
        } else {
            const newPriceNum = parseFloat(newPrice);
            if (!isNaN(newPriceNum) && newPriceNum !== (offering.default_price || 0)) {
                dataToUpdate.default_price = newPriceNum;
            }
        }
        
        if (newIsActive !== offering.is_active) {
            dataToUpdate.is_active = newIsActive;
        }

        if (Object.keys(dataToUpdate).length > 0) {
            onUpdate(offering.id, dataToUpdate);
        }
    };

    // Handle price change with auto-save
    const handlePriceChange = (newPrice: string) => {
        setPrice(newPrice);
        autoSave(newPrice, pricePerSqMeter, isActive);
    };

    // Handle price per sq meter change with auto-save
    const handlePricePerSqMeterChange = (newPricePerSqMeter: string) => {
        setPricePerSqMeter(newPricePerSqMeter);
        autoSave(price, newPricePerSqMeter, isActive);
    };

    // Handle active status change with auto-save
    const handleActiveChange = (newIsActive: boolean) => {
        setIsActive(newIsActive);
        autoSave(price, pricePerSqMeter, newIsActive);
    };



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
                        onChange={(e) => handlePricePerSqMeterChange(e.target.value)}
                        className="h-8 max-w-[120px]"
                        // disabled={isUpdating}
                    />
                ) : (
                    <Input
                        onFocus={(e) => e.target.select()}
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        className="h-8 max-w-[120px]"
                        // disabled={isUpdating}
                    />
                )}
            </TableCell>
            <TableCell className="text-center w-[120px]">
                <Switch
                    checked={isActive}
                    onCheckedChange={handleActiveChange}
                    disabled={isUpdating}
                />
            </TableCell>
            <TableCell className="text-center">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(offering)}
                    disabled={isUpdating}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    )
}


export const ManageOfferingsDialog: React.FC<ManageOfferingsDialogProps> = ({ isOpen, onOpenChange, productType }) => {
    const { t } = useTranslation(['common', 'services']);
    const [selectedServiceAction, setSelectedServiceAction] = useState<ServiceAction | null>(null);

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

    // Fetch all service actions for the autocomplete
    const { data: serviceActions = [], isLoading: isLoadingServiceActions } = useQuery<ServiceAction[], Error>({
        queryKey: ['serviceActions'],
        queryFn: getServiceActions,
        enabled: isOpen,
    });

    // Filter out service actions that are already added to this product type
    const availableServiceActions = useMemo(() => {
        const existingServiceActionIds = offerings.map(offering => offering.service_action_id);
        return serviceActions.filter(action => !existingServiceActionIds.includes(action.id));
    }, [serviceActions, offerings]);

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

    const createOfferingMutation = useMutation<ServiceOffering, Error, { serviceActionId: number; productTypeId: number }>({
        mutationFn: async ({ serviceActionId, productTypeId }) => {
            const formData: ServiceOfferingFormData = {
                product_type_id: productTypeId,
                service_action_id: serviceActionId,
                pricing_strategy: productType.is_dimension_based ? 'dimension_based' : 'fixed',
                default_price: productType.is_dimension_based ? null : 0,
                default_price_per_sq_meter: productType.is_dimension_based ? 0 : null,
                is_active: true,
            };
            return createServiceOffering(formData);
        },
        onSuccess: () => {
            toast.success(t('offeringCreatedSuccess', { ns: 'services' }));
            refetch();
            setSelectedServiceAction(null);
        },
        onError: (error) => {
            toast.error(error.message || t('offeringCreateFailed', { ns: 'services' }));
        }
    });

    const handleUpdate = (id: number, data: Partial<ServiceOfferingFormData>) => {
        updateMutation.mutate({ id, data });
    };

    const handleDelete = (offering: ServiceOffering) => {
        deleteMutation.mutate(offering.id);
    };

    const handleAddServiceAction = (serviceAction: ServiceAction) => {
        if (productType?.id) {
            createOfferingMutation.mutate({
                serviceActionId: serviceAction.id,
                productTypeId: productType.id
            });
        }
    };

    const isMutating = createAllMutation.isPending || updateMutation.isPending || deleteMutation.isPending || createOfferingMutation.isPending;

    // Don't render if productType is undefined
    if (!productType) {
        return null;
    }

    console.log(productType, 'productType');

    return (
        <ThemeProvider theme={muiTheme}>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[90vw] w-[1200px] sm:max-w-[90vw] md:max-w-[90vw] z-[1000]">
                    <DialogHeader>
                        <DialogTitle>{productType.name}</DialogTitle>
                        <DialogDescription>{t('manageOfferingsDescription', { ns: 'services' })}</DialogDescription>
                    </DialogHeader>
                    
                    {/* Add Service Action Section */}
                    <div className="my-4 space-y-4">
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={() => createAllMutation.mutate(productType.id)}
                                disabled={isMutating}
                                size="sm"
                            >
                                {createAllMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                {t('createAllMissingOfferings', { ns: 'services' })}
                            </Button>
                        </div>
                        
                        {/* Service Action Autocomplete */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t('addServiceAction', { ns: 'services', defaultValue: 'Add Service Action' })}
                            </label>
                            <div className="flex gap-2">
                                <Autocomplete
                                    options={availableServiceActions}
                                    getOptionLabel={(option) => option.name}
                                    value={selectedServiceAction}
                                    onChange={(_, newValue) => setSelectedServiceAction(newValue)}
                                    loading={isLoadingServiceActions}
                                    disabled={isMutating}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder={t('selectServiceAction', { ns: 'services', defaultValue: 'Select a service action...' })}
                                            size="small"
                                        />
                                    )}
                                    sx={{ flex: 1 }}
                                />
                                <Button
                                    onClick={() => selectedServiceAction && handleAddServiceAction(selectedServiceAction)}
                                    disabled={!selectedServiceAction || isMutating}
                                    size="sm"
                                >
                                    {createOfferingMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <PlusCircle className="h-4 w-4" />
                                    )}
                                    {t('add', { ns: 'common', defaultValue: 'Add' })}
                                </Button>
                            </div>
                        </div>
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
        </ThemeProvider>
    );
};