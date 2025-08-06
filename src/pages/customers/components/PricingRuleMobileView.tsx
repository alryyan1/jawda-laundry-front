import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { PricingRuleMobileCard } from './PricingRuleMobileCard';
import type { PricingRule } from '@/api/pricingRuleService';

interface PricingRuleMobileViewProps {
  pricingRules: PricingRule[];
  isLoading: boolean;
  onEdit: (pricingRule: PricingRule) => void;
  onDelete: (pricingRuleId: number) => void;
  isDeleting: boolean;
}

export const PricingRuleMobileView: React.FC<PricingRuleMobileViewProps> = ({
  pricingRules,
  isLoading,
  onEdit,
  onDelete,
  isDeleting
}) => {
  const { t } = useTranslation(['common', 'customers']);

  return (
    <div className="md:hidden">
      {isLoading && pricingRules.length === 0 ? (
        <div className="p-8 text-center">
          <div className="flex justify-center items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>
              {t("loadingPricingRules", {
                defaultValue: "Loading pricing rules...",
              })}
            </span>
          </div>
        </div>
      ) : pricingRules.length > 0 ? (
        <div className="divide-y">
          {pricingRules.map((pricingRule) => (
            <PricingRuleMobileCard 
              key={pricingRule.id} 
              pricingRule={pricingRule}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          {t("noPricingRulesFound", { defaultValue: 'No pricing rules found' })}
        </div>
      )}
    </div>
  );
}; 