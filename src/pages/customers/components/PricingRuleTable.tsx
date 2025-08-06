import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PricingRuleTableRow } from './PricingRuleTableRow';
import type { PricingRule } from '@/api/pricingRuleService';

interface PricingRuleTableProps {
  pricingRules: PricingRule[];
  isLoading: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  onEdit: (pricingRule: PricingRule) => void;
  onDelete: (pricingRuleId: number) => void;
  isDeleting: boolean;
}

export const PricingRuleTable: React.FC<PricingRuleTableProps> = ({
  pricingRules,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  isDeleting
}) => {
  const { t } = useTranslation(['common', 'customers']);

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="rounded-md border">
      <div className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="w-16 cursor-pointer hover:bg-muted/50 text-center"
                  onClick={() => onSort("id")}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs">{t("id", { ns: "common" })}</span>
                    {getSortIcon("id")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-center"
                  onClick={() => onSort("name")}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t("serviceOffering", { defaultValue: "Service Offering" })}
                    {getSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead className="text-center hidden lg:table-cell">
                  {t("category", { defaultValue: "Category" })}
                </TableHead>
                <TableHead className="text-center hidden lg:table-cell">
                  {t("serviceAction", { defaultValue: "Service Action" })}
                </TableHead>
                <TableHead className="text-center w-24">
                  {t('price', { defaultValue: 'Price' })}
                </TableHead>
                <TableHead className="text-center w-24 hidden xl:table-cell">
                  {t('edit', { ns: 'common', defaultValue: 'Edit' })}
                </TableHead>
                <TableHead className="text-center w-16">
                  {t("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && pricingRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>
                        {t("loadingPricingRules", {
                          defaultValue: "Loading pricing rules...",
                        })}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : pricingRules.length > 0 ? (
                pricingRules.map((pricingRule) => (
                  <PricingRuleTableRow 
                    key={pricingRule.id} 
                    pricingRule={pricingRule}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isDeleting={isDeleting}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {t("noPricingRulesFound", { defaultValue: 'No pricing rules found' })}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}; 