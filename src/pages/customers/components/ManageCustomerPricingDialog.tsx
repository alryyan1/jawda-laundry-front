// src/pages/customers/components/ManageCustomerPricingDialog.tsx
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';

// MUI imports
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { getServiceActions } from '@/api/serviceActionService';
import { customerProductTypeService } from '@/api/customerProductTypeService';
import apiClient from '@/lib/axios';
import type { CustomerProductType } from '@/types/customerProductTypes.types';
import type { ServiceAction } from '@/types';

// MUI theme to match the application's design
const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#3b82f6',
    },
    secondary: {
      main: '#6b7280',
    },
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '0.5rem',
          maxWidth: '90vw',
          width: '1200px',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '0.5rem',
          },
        },
        popper: {
          zIndex: 9999,
        },
      },
    },
  },
});

interface ManageCustomerPricingDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customerProductType: CustomerProductType;
    customerId: number;
}

// A component for a single editable row
const CustomerPricingRow: React.FC<{
    serviceAction: ServiceAction;
    customerData: any;
    onUpdate: (serviceActionId: number, data: any) => void;
    onDelete: (serviceActionId: number) => void;
    isUpdating: boolean;
    productType: any;
}> = ({ serviceAction, customerData, onUpdate, onDelete, isUpdating, productType }) => {
    const [customPrice, setCustomPrice] = useState(customerData?.custom_price?.toString() || '');
    const [customPricePerSqMeter, setCustomPricePerSqMeter] = useState(customerData?.custom_price_per_sq_meter?.toString() || '');
    const [isActive, setIsActive] = useState(customerData?.is_active ?? true);

    const isDimensionBased = productType?.is_dimension_based;

    // Auto-save function
    const autoSave = (newCustomPrice: string, newCustomPricePerSqMeter: string, newIsActive: boolean) => {
        const dataToUpdate: any = {};
        
        if (isDimensionBased) {
            const newCustomPricePerSqMeterNum = parseFloat(newCustomPricePerSqMeter);
            if (!isNaN(newCustomPricePerSqMeterNum) && newCustomPricePerSqMeterNum !== (customerData?.custom_price_per_sq_meter || 0)) {
                dataToUpdate.custom_price_per_sq_meter = newCustomPricePerSqMeterNum;
            }
        } else {
            const newCustomPriceNum = parseFloat(newCustomPrice);
            if (!isNaN(newCustomPriceNum) && newCustomPriceNum !== (customerData?.custom_price || 0)) {
                dataToUpdate.custom_price = newCustomPriceNum;
            }
        }
        
        if (newIsActive !== (customerData?.is_active ?? true)) {
            dataToUpdate.is_active = newIsActive;
        }

        if (Object.keys(dataToUpdate).length > 0) {
            onUpdate(serviceAction.id, dataToUpdate);
        }
    };

    // Handle custom price change with auto-save
    const handleCustomPriceChange = (newCustomPrice: string) => {
        setCustomPrice(newCustomPrice);
        autoSave(newCustomPrice, customPricePerSqMeter, isActive);
    };

    // Handle custom price per sq meter change with auto-save
    const handleCustomPricePerSqMeterChange = (newCustomPricePerSqMeter: string) => {
        setCustomPricePerSqMeter(newCustomPricePerSqMeter);
        autoSave(customPrice, newCustomPricePerSqMeter, isActive);
    };

    // Handle active status change with auto-save
    const handleActiveChange = (newIsActive: boolean) => {
        setIsActive(newIsActive);
        autoSave(customPrice, customPricePerSqMeter, newIsActive);
    };

    return (
        <TableRow>
            <TableCell className="font-medium text-center">{serviceAction.name}</TableCell>
            <TableCell className="text-center">
                <div className="text-sm text-muted-foreground">
                    {isDimensionBased 
                        ? `${customerData?.default_price_per_sq_meter || 0} / sq.m`
                        : `${customerData?.default_price || 0}`
                    }
                </div>
            </TableCell>
            <TableCell className="text-center">
                <div className="flex justify-center">
                    {isDimensionBased ? (
                        <Input
                            onFocus={(e) => e.target.select()}
                            type="number"
                            step="0.01"
                            value={customPricePerSqMeter}
                            onChange={(e) => handleCustomPricePerSqMeterChange(e.target.value)}
                            className="h-8 max-w-[120px]"
                            disabled={isUpdating}
                        />
                    ) : (
                        <Input
                            onFocus={(e) => e.target.select()}
                            type="number"
                            step="0.01"
                            value={customPrice}
                            onChange={(e) => handleCustomPriceChange(e.target.value)}
                            className="h-8 max-w-[120px]"
                            disabled={isUpdating}
                        />
                    )}
                </div>
            </TableCell>
            <TableCell className="text-center w-[120px]">
                <div className="flex justify-center">
                    <Switch
                        checked={isActive}
                        onCheckedChange={handleActiveChange}
                        disabled={isUpdating}
                    />
                </div>
            </TableCell>
            <TableCell className="text-center">
                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(serviceAction.id)}
                        disabled={isUpdating}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
};

export const ManageCustomerPricingDialog: React.FC<ManageCustomerPricingDialogProps> = ({ 
    isOpen, 
    onOpenChange, 
    customerProductType, 
    customerId 
}) => {
    const { t } = useTranslation(['common', 'services']);
    const [selectedServiceAction, setSelectedServiceAction] = useState<ServiceAction | null>(null);

    // Fetch customer service offerings for this product type
    const { data: serviceOfferingsData = { service_offerings: [] }, isLoading, refetch } = useQuery({
        queryKey: ['customerServiceOfferings', customerId, customerProductType?.product_type?.id],
        queryFn: async () => {
            if (!customerProductType?.product_type?.id) {
                throw new Error('Product type ID is required');
            }
            const response = await apiClient.get(`/customers/${customerId}/product-types/${customerProductType.product_type.id}/service-offerings`);
            return response.data;
        },
        enabled: isOpen && !!customerProductType?.product_type?.id,
    });

    // Fetch all service actions for the autocomplete
    const { data: serviceActions = [], isLoading: isLoadingServiceActions } = useQuery<ServiceAction[], Error>({
        queryKey: ['serviceActions'],
        queryFn: getServiceActions,
        enabled: isOpen,
    });

    // Filter out service actions that are already added to this customer's product type
    const availableServiceActions = useMemo(() => {
        const existingServiceActionIds = serviceOfferingsData.service_offerings
            .filter((offering: any) => offering.has_custom_pricing)
            .map((offering: any) => offering.service_action.id);
        return serviceActions.filter(action => !existingServiceActionIds.includes(action.id));
    }, [serviceActions, serviceOfferingsData]);

    const updateCustomerPricingMutation = useMutation({
        mutationFn: ({ serviceActionId, data }: { serviceActionId: number; data: any }) =>
            customerProductTypeService.updateCustomerPricing(customerId, customerProductType.product_type.id, serviceActionId, data),
        onSuccess: () => {
            toast.success(t('customerPricingUpdatedSuccess', { defaultValue: 'Customer pricing updated successfully' }));
            refetch();
        },
        onError: (error: any) => {
            toast.error(error.message || t('customerPricingUpdateFailed', { defaultValue: 'Failed to update customer pricing' }));
        },
    });

    const deleteCustomerPricingMutation = useMutation({
        mutationFn: ({ serviceActionId }: { serviceActionId: number }) =>
            customerProductTypeService.deleteCustomerPricing(customerId, customerProductType.product_type.id, serviceActionId),
        onSuccess: () => {
            toast.success(t('customerPricingDeletedSuccess', { defaultValue: 'Customer pricing deleted successfully' }));
            refetch();
        },
        onError: (error: any) => {
            toast.error(error.message || t('customerPricingDeleteFailed', { defaultValue: 'Failed to delete customer pricing' }));
        },
    });

    const createCustomerPricingMutation = useMutation({
        mutationFn: ({ serviceActionId }: { serviceActionId: number }) =>
            customerProductTypeService.createCustomerPricing(customerId, customerProductType.product_type.id, serviceActionId),
        onSuccess: () => {
            toast.success(t('customerPricingCreatedSuccess', { defaultValue: 'Customer pricing created successfully' }));
            refetch();
            setSelectedServiceAction(null);
        },
        onError: (error: any) => {
            toast.error(error.message || t('customerPricingCreateFailed', { defaultValue: 'Failed to create customer pricing' }));
        },
    });

    const handleUpdate = (serviceActionId: number, data: any) => {
        updateCustomerPricingMutation.mutate({ serviceActionId, data });
    };

    const handleDelete = (serviceActionId: number) => {
        deleteCustomerPricingMutation.mutate({ serviceActionId });
    };

    const handleAddServiceAction = (serviceAction: ServiceAction) => {
        createCustomerPricingMutation.mutate({
            serviceActionId: serviceAction.id
        });
    };

    const isMutating = updateCustomerPricingMutation.isPending || deleteCustomerPricingMutation.isPending || createCustomerPricingMutation.isPending;

    // Don't render if customerProductType is undefined
    if (!customerProductType) {
        return null;
    }

    const serviceOfferings = serviceOfferingsData.service_offerings || [];

    return (
        <ThemeProvider theme={muiTheme}>
            <Dialog 
                open={isOpen} 
                onClose={() => onOpenChange(false)}
                maxWidth={false}
                fullWidth
            >
                <DialogContent sx={{ p: 3 }}>
                    <DialogTitle sx={{ pb: 1 }}>
                        {t('manageCustomerPricingFor', { defaultValue: 'Manage Customer Pricing for' })} {customerProductType.product_type.name}
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground mb-4">
                        {t('manageCustomerPricingDescription', { defaultValue: 'Set custom pricing for this customer\'s service offerings' })}
                    </div>
                    
                    {/* Add Service Action Section */}
                    <div className="my-4 space-y-4">
                        {/* Service Action Autocomplete */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
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
                                    disablePortal={false}
                                    slotProps={{
                                        popper: {
                                            style: { zIndex: 9999 }
                                        }
                                    }}
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
                                    className="bg-primary text-white hover:bg-primary/90"
                                >
                                    {createCustomerPricingMutation.isPending ? (
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
                                    <TableHead className='text-center'>{t('defaultPrice', { defaultValue: 'Default Price' })}</TableHead>
                                    <TableHead className='text-center'>{t('customPrice', { defaultValue: 'Custom Price' })}</TableHead>
                                    <TableHead className="text-center">{t('active')}</TableHead>
                                    <TableHead className="text-center w-[120px]">{t('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : serviceOfferings.length > 0 ? (
                                    serviceOfferings.map((offering: any) => (
                                        <CustomerPricingRow
                                            key={offering.service_action.id}
                                            serviceAction={offering.service_action}
                                            customerData={offering.has_custom_pricing ? offering : null}
                                            onUpdate={handleUpdate}
                                            onDelete={handleDelete}
                                            isUpdating={updateCustomerPricingMutation.isPending && updateCustomerPricingMutation.variables?.serviceActionId === offering.service_action.id}
                                            productType={customerProductType.product_type}
                                        />
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            {t('noOfferingsForProduct', {ns:'services'})}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </ThemeProvider>
    );
}; 