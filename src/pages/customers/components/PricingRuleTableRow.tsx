import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TableCell, TableRow } from "@/components/ui/table";
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

interface PricingRuleTableRowProps {
  pricingRule: PricingRule;
  onEdit: (pricingRule: PricingRule) => void;
  onDelete: (pricingRuleId: number) => void;
  isDeleting: boolean;
}

export const PricingRuleTableRow: React.FC<PricingRuleTableRowProps> = React.memo(({
  pricingRule,
  onEdit,
  onDelete,
  isDeleting
}) => {
  const { t, i18n } = useTranslation(['common', 'customers', 'services']);

  const serviceOffering = pricingRule.service_offering;
  const productType = serviceOffering?.product_type;
  const isDimensionBased = productType?.is_dimension_based;

  return (
    <TableRow>
      <TableCell className="text-center w-16">
        <span className="font-mono text-xs">{pricingRule.id}</span>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2 w-full min-w-0">
          <Avatar className="h-8 w-8 rounded-md flex-shrink-0">
            <AvatarFallback className="rounded-md bg-muted">
              <Package className="h-4 w-4 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
            <span 
              className="font-medium truncate flex-1 text-sm" 
              title={serviceOffering?.product_type.name || ''}
            >
              {serviceOffering?.product_type.name || ''}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center hidden lg:table-cell">
        <span 
          className="block px-1 text-xs"
          title={productType?.category?.name || t("uncategorized", { defaultValue: "Uncategorized" })}
        >
          {productType?.category?.name || t("uncategorized", { defaultValue: "Uncategorized" })}
        </span>
      </TableCell>
      <TableCell className="text-center hidden lg:table-cell">
        <span 
          className="block px-1 text-xs"
          title={serviceOffering?.service_action?.name || ''}
        >
          {serviceOffering?.service_action?.name || ''}
        </span>
      </TableCell>
      <TableCell className="text-center w-24">
        <span className="font-mono text-sm">
          {isDimensionBased 
            ? `${pricingRule.price_per_sq_meter} ${t('perSqMeter', { defaultValue: '/m²' })}`
            : `${pricingRule.price}`
          }
        </span>
      </TableCell>
      <TableCell className="text-center w-24 hidden xl:table-cell">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(pricingRule)}
          className="whitespace-nowrap text-xs h-6 px-2"
        >
          {t('edit', { ns: 'common', defaultValue: 'Edit' })}
        </Button>
      </TableCell>
      <TableCell className="text-center w-16">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-6 w-6 p-0">
              <span className="sr-only">{t("openMenu")}</span>
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={i18n.dir() === "rtl" ? "start" : "end"}
          >
            <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(pricingRule)}>
              <SlidersHorizontal className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t('editPricing', { defaultValue: 'Edit Pricing' })}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={() => onDelete(pricingRule.id)}
              onSelect={(e) => e.preventDefault()}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t('delete', { defaultValue: 'Delete' })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}); 