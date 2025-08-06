import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Download, Plus, Loader2 } from 'lucide-react';
import { Autocomplete, TextField } from '@mui/material';
import type { Customer } from '@/types/customer.types';
import type { AvailableServiceOffering } from '@/api/pricingRuleService';
import { getServiceOfferingDisplayName } from '@/api/pricingRuleService';

interface CustomerPriceListHeaderProps {
  customer: Customer;
  selectedServiceOffering: AvailableServiceOffering | null;
  onServiceOfferingChange: (serviceOffering: AvailableServiceOffering | null) => void;
  availableServiceOfferings: AvailableServiceOffering[];
  onImportAll: () => void;
  onAddPricingRule: () => void;
  isImporting: boolean;
  isAdding: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const CustomerPriceListHeader: React.FC<CustomerPriceListHeaderProps> = ({
  customer,
  selectedServiceOffering,
  onServiceOfferingChange,
  availableServiceOfferings,
  onImportAll,
  onAddPricingRule,
  isImporting,
  isAdding,
  onRefresh,
  isRefreshing
}) => {
  const { t } = useTranslation(['common', 'customers']);

  return (
    <div className="mb-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground mb-3 tracking-tight">
            {t('customerPriceList', { defaultValue: 'Customer Price List' })} for {customer.name}
          </h1>
          <div className="flex items-center gap-2  text-muted-foreground">
            <span>{customer.customerType?.name || t('noType', { defaultValue: 'No Type' })}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-grow flex-2 mx-1">
          <Button 
            onClick={onImportAll}
            disabled={isImporting}
            variant="outline"
            size="sm"
          >
            {isImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {t('importAllPricingRules', { defaultValue: 'Import All' })}
          </Button>

            <Autocomplete
              fullWidth
              options={availableServiceOfferings}
              getOptionLabel={(option) => getServiceOfferingDisplayName(option)}
              value={selectedServiceOffering}
              onChange={(_, newValue) => onServiceOfferingChange(newValue)}
              renderInput={(params) => (
                <TextField
                  sx={{
                    minWidth: '300px',
                  }}
                  {...params}
                  label={t('selectServiceOffering', { defaultValue: 'Select Service Offering' })}
                  size="small"
                  className="min-w-[200px]"
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <div>
                    <div className="font-medium">
                      {getServiceOfferingDisplayName(option)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {option.product_type?.category?.name || t('uncategorized', { defaultValue: 'Uncategorized' })}
                    </div>
                  </div>
                </li>
              )}
            />
            <Button 
              onClick={onAddPricingRule}
              disabled={!selectedServiceOffering || isAdding}
              size="sm"
            >
              {isAdding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {t('addPricingRule', { defaultValue: 'Add' })}
            </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="h-4 w-4" />
            )}
            {t('refresh', { defaultValue: 'Refresh' })}
          </Button>
        </div>
      </div>
      <div className="h-px bg-border" />
    </div>
  );
}; 