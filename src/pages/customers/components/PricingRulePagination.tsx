import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface PricingRulePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isFetching: boolean;
}

export const PricingRulePagination: React.FC<PricingRulePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  isFetching
}) => {
  const { t } = useTranslation(['common']);

  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <div className="flex-1 text-sm text-muted-foreground">
        {t("pagination.showingItems", {
          ns: "common",
          first: ((currentPage - 1) * itemsPerPage) + 1,
          last: Math.min(currentPage * itemsPerPage, totalItems),
          total: totalItems,
        })}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || isFetching}
        >
          {t("firstPage")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isFetching}
        >
          {t("previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || isFetching}
        >
          {t("next")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || isFetching}
        >
          {t("lastPage")}
        </Button>
      </div>
    </div>
  );
}; 