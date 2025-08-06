import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { pricingRuleService, type PricingRule, type UpdatePricingRuleData } from '@/api/pricingRuleService';

interface EditPricingRuleDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  pricingRule: PricingRule | null;
  customerId: number;
}

export const EditPricingRuleDialog: React.FC<EditPricingRuleDialogProps> = ({
  isOpen,
  onOpenChange,
  pricingRule,
  customerId
}) => {
  const { t } = useTranslation(['common', 'customers']);
  const queryClient = useQueryClient();
  
  const [price, setPrice] = useState('');
  const [pricePerSqMeter, setPricePerSqMeter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serviceOffering = pricingRule?.service_offering;
  const productType = serviceOffering?.product_type;
  const isDimensionBased = productType?.is_dimension_based;

  // Reset form when pricing rule changes
  useEffect(() => {
    if (pricingRule) {
      setPrice(pricingRule.price?.toString() || '');
      setPricePerSqMeter(pricingRule.price_per_sq_meter?.toString() || '');
    }
  }, [pricingRule]);

  const updatePricingRuleMutation = useMutation({
    mutationFn: ({ customerId, pricingRuleId, data }: { 
      customerId: number; 
      pricingRuleId: number; 
      data: UpdatePricingRuleData 
    }) => pricingRuleService.updatePricingRule(customerId, pricingRuleId, data),
    onSuccess: () => {
      toast.success(t('pricingRuleUpdatedSuccessfully', { defaultValue: 'Pricing rule updated successfully' }));
      queryClient.invalidateQueries({ queryKey: ['customerPricingRules', customerId] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('failedToUpdatePricingRule', { defaultValue: 'Failed to update pricing rule' }));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingRule) return;

    const data: UpdatePricingRuleData = {};
    
    if (isDimensionBased) {
      const pricePerSqMeterNum = parseFloat(pricePerSqMeter);
      if (isNaN(pricePerSqMeterNum) || pricePerSqMeterNum < 0) {
        toast.error(t('invalidPricePerSqMeter', { defaultValue: 'Please enter a valid price per square meter' }));
        return;
      }
      data.price_per_sq_meter = pricePerSqMeterNum;
    } else {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        toast.error(t('invalidPrice', { defaultValue: 'Please enter a valid price' }));
        return;
      }
      data.price = priceNum;
    }

    updatePricingRuleMutation.mutate({
      customerId,
      pricingRuleId: pricingRule.id,
      data
    });
  };

  if (!pricingRule) return null;

  return (
    <Dialog open={isOpen} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('editPricingRule', { defaultValue: 'Edit Pricing Rule' })}
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('serviceOffering', { defaultValue: 'Service Offering' })}
            </Label>
            <p className="text-sm text-muted-foreground">
              {serviceOffering?.name}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('category', { defaultValue: 'Category' })}
            </Label>
            <p className="text-sm text-muted-foreground">
              {productType?.category?.name || t('uncategorized', { defaultValue: 'Uncategorized' })}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('serviceAction', { defaultValue: 'Service Action' })}
            </Label>
            <p className="text-sm text-muted-foreground">
              {serviceOffering?.service_action?.name}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('pricingType', { defaultValue: 'Pricing Type' })}
            </Label>
            <p className="text-sm text-muted-foreground">
              {isDimensionBased 
                ? t('dimensionBased', { defaultValue: 'Dimension Based' })
                : t('fixed', { defaultValue: 'Fixed' })
              }
            </p>
          </div>

          {isDimensionBased ? (
            <div className="space-y-2">
              <Label htmlFor="pricePerSqMeter" className="text-sm font-medium">
                {t('pricePerSqMeter', { defaultValue: 'Price per Square Meter' })}
              </Label>
              <Input
                id="pricePerSqMeter"
                type="number"
                step="0.01"
                min="0"
                value={pricePerSqMeter}
                onChange={(e) => setPricePerSqMeter(e.target.value)}
                placeholder={t('enterPricePerSqMeter', { defaultValue: 'Enter price per square meter' })}
                required
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium">
                {t('price', { defaultValue: 'Price' })}
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={t('enterPrice', { defaultValue: 'Enter price' })}
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updatePricingRuleMutation.isPending}
            >
              {t('cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              type="submit"
              disabled={updatePricingRuleMutation.isPending}
            >
              {updatePricingRuleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('updating', { defaultValue: 'Updating' })}
                </>
              ) : (
                t('update', { defaultValue: 'Update' })
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 