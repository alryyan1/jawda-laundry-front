// src/features/customers/components/PriceRuleEditDialog.tsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, DollarSign, Package, Ruler } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

import type { ServiceOfferingPriceItem, PriceRuleFormData } from '@/types/customerPriceList.types';
import { formatCurrency } from '@/lib/formatters';
import { useSettings } from '@/context/SettingsContext';

// Validation schema
const priceRuleSchema = z.object({
  price: z.number().min(0, 'Price must be positive').optional(),
  price_per_sq_meter: z.number().min(0, 'Price per sq meter must be positive').optional(),
  valid_from: z.string().optional(),
  valid_to: z.string().optional(),
  min_quantity: z.number().min(1, 'Minimum quantity must be at least 1').optional(),
  min_area_sq_meter: z.number().min(0, 'Minimum area must be positive').optional(),
}).refine((data) => {
  // At least one price field must be provided
  return data.price !== undefined || data.price_per_sq_meter !== undefined;
}, {
  message: 'At least one price field must be provided',
  path: ['price'],
}).refine((data) => {
  // If valid_to is provided, valid_from must also be provided
  if (data.valid_to && !data.valid_from) {
    return false;
  }
  return true;
}, {
  message: 'Valid from date is required when valid to date is provided',
  path: ['valid_from'],
}).refine((data) => {
  // valid_to must be after valid_from
  if (data.valid_from && data.valid_to) {
    return new Date(data.valid_to) > new Date(data.valid_from);
  }
  return true;
}, {
  message: 'Valid to date must be after valid from date',
  path: ['valid_to'],
});

interface PriceRuleEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: ServiceOfferingPriceItem | null;
  onSave: (data: PriceRuleFormData) => void;
  isLoading?: boolean;
}

const PriceRuleEditDialog: React.FC<PriceRuleEditDialogProps> = ({
  isOpen,
  onOpenChange,
  item,
  onSave,
  isLoading = false,
}) => {
  const { t } = useTranslation(['common', 'customers', 'orders']);
  const { getSetting } = useSettings();
  const currency = getSetting('currency_symbol', 'USD');

  const form = useForm<PriceRuleFormData>({
    resolver: zodResolver(priceRuleSchema),
    defaultValues: {
      service_offering_id: 0,
      price: undefined,
      price_per_sq_meter: undefined,
      valid_from: undefined,
      valid_to: undefined,
      min_quantity: undefined,
      min_area_sq_meter: undefined,
    },
  });

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      form.reset({
        service_offering_id: item.id,
        price: item.customer_specific_price?.price,
        price_per_sq_meter: item.customer_specific_price?.price_per_sq_meter,
        valid_from: item.customer_specific_price?.valid_from,
        valid_to: item.customer_specific_price?.valid_to,
        min_quantity: item.customer_specific_price?.min_quantity,
        min_area_sq_meter: item.customer_specific_price?.min_area_sq_meter,
      });
    }
  }, [item, form]);

  const handleSubmit = (data: PriceRuleFormData) => {
    onSave(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('editPriceRule', { defaultValue: 'Edit Price Rule' })}
          </DialogTitle>
          <DialogDescription>
            {t('editPriceRuleDescription', { defaultValue: 'Set custom pricing for this service offering.' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Offering Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4" />
              <h3 className="font-semibold">{item.display_name}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('product', { defaultValue: 'Product' })}:</span>
                <span className="ml-2">{item.product_type.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('service', { defaultValue: 'Service' })}:</span>
                <span className="ml-2">{item.service_action.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('pricingStrategy', { defaultValue: 'Pricing Strategy' })}:</span>
                <Badge variant="outline" className="ml-2">
                  {item.pricing_strategy === 'dimension_based' 
                    ? t('dimensionBased', { defaultValue: 'Dimension Based' })
                    : t('fixed', { defaultValue: 'Fixed' })
                  }
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">{t('defaultPrice', { defaultValue: 'Default Price' })}:</span>
                <span className="ml-2 font-medium">
                  {item.default_price 
                    ? formatCurrency(item.default_price, currency)
                    : item.default_price_per_sq_meter 
                      ? `${formatCurrency(item.default_price_per_sq_meter, currency)}/${t('sqMeter', { defaultValue: 'sq m' })}`
                      : t('notSet', { defaultValue: 'Not Set' })
                  }
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Price Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Pricing Section */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t('pricing', { defaultValue: 'Pricing' })}
                </h4>

                {item.pricing_strategy === 'fixed' ? (
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('price', { defaultValue: 'Price' })}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-10"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          {t('pricePerItem', { defaultValue: 'Price per item' })}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="price_per_sq_meter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pricePerSqMeter', { defaultValue: 'Price per Square Meter' })}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-10"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          {t('pricePerSqMeterDescription', { defaultValue: 'Price per square meter' })}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Separator />

              {/* Validity Period */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('validityPeriod', { defaultValue: 'Validity Period' })}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valid_from"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('validFrom', { defaultValue: 'Valid From' })}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('validFromDescription', { defaultValue: 'Leave empty for no start date' })}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valid_to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('validTo', { defaultValue: 'Valid To' })}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('validToDescription', { defaultValue: 'Leave empty for no end date' })}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Minimum Requirements */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  {t('minimumRequirements', { defaultValue: 'Minimum Requirements' })}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="min_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('minimumQuantity', { defaultValue: 'Minimum Quantity' })}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            placeholder="1"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('minimumQuantityDescription', { defaultValue: 'Minimum quantity required for this price' })}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="min_area_sq_meter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('minimumArea', { defaultValue: 'Minimum Area (sq m)' })}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('minimumAreaDescription', { defaultValue: 'Minimum area required for this price' })}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  {t('cancel', { defaultValue: 'Cancel' })}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <DollarSign className="h-4 w-4 mr-2" />
                  )}
                  {t('savePriceRule', { defaultValue: 'Save Price Rule' })}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriceRuleEditDialog; 