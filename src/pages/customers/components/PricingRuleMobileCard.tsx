import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Package, MoreHorizontal, SlidersHorizontal, Trash2 } from 'lucide-react';
import type { PricingRule } from '@/api/pricingRuleService';

interface PricingRuleMobileCardProps {
  pricingRule: PricingRule;
  onEdit: (pricingRule: PricingRule) => void;
  onDelete: (pricingRuleId: number) => void;
  isDeleting: boolean;
}

export const PricingRuleMobileCard: React.FC<PricingRuleMobileCardProps> = React.memo(({
  pricingRule,
  onEdit,
  onDelete,
  isDeleting
}) => {
  const { t } = useTranslation(['common', 'customers', 'services']);

  const serviceOffering = pricingRule.service_offering;
  const productType = serviceOffering?.product_type;
  const isDimensionBased = productType?.is_dimension_based;

  return (
    <div className="p-4 border-b last:border-b-0">
      {/* Header with Avatar and Name */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-12 w-12 rounded-md flex-shrink-0">
          <AvatarFallback className="rounded-md bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm leading-tight truncate" title={serviceOffering?.name || ''}>
                {serviceOffering?.name || ''}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {productType?.category?.name || t('uncategorized', { defaultValue: 'Uncategorized' })}
              </p>
              <p className="text-xs text-muted-foreground">
                {serviceOffering?.service_action?.name || ''}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                  <span className="sr-only">{t('openMenu')}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(pricingRule)}>
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  {t('editPricing', { defaultValue: 'Edit Pricing' })}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => onDelete(pricingRule.id)}
                  onSelect={(e) => e.preventDefault()}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('delete', { defaultValue: 'Delete' })}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Pricing Rule Details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('price', { defaultValue: 'Price' })}:</span>
          <span className="font-mono font-medium">
            {isDimensionBased 
              ? `${pricingRule.price_per_sq_meter} ${t('perSqMeter', { defaultValue: '/m²' })}`
              : `${pricingRule.price}`
            }
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onEdit(pricingRule)}
          className="flex-1"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4"/>
          {t('editPricing', { defaultValue: 'Edit Pricing' })}
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => onDelete(pricingRule.id)}
          disabled={isDeleting}
        >
          {t('delete', { defaultValue: 'Delete' })}
        </Button>
      </div>
    </div>
  );
}); 