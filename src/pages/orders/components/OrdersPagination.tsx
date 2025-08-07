import React from "react";
import { Button } from "@/components/ui/button";

type OrdersPaginationProps = {
  currentPage: number;
  totalPages: number;
  isFetching: boolean;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  t: (key: string, options?: any) => string;
  showingText?: string;
};

export const OrdersPagination: React.FC<OrdersPaginationProps> = ({
  currentPage,
  totalPages,
  isFetching,
  setCurrentPage,
  t,
  showingText,
}) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 py-2 sm:py-4">
      <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left px-2 sm:px-0">
        {showingText}
      </div>
      <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1 || isFetching}
          className="h-7 sm:h-9 text-xs sm:text-sm px-1.5 sm:px-3 min-w-0"
        >
          <span className="hidden sm:inline">{t("firstPage")}</span>
          <span className="sm:hidden">1</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1 || isFetching}
          className="h-7 sm:h-9 text-xs sm:text-sm px-1.5 sm:px-3 min-w-0"
        >
          <span className="hidden sm:inline">{t("previous")}</span>
          <span className="sm:hidden">‹</span>
        </Button>
        <span className="text-xs sm:text-sm font-medium px-1 sm:px-2 min-w-0">
          {t("pageWithTotal", { currentPage, totalPages })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages || isFetching}
          className="h-7 sm:h-9 text-xs sm:text-sm px-1.5 sm:px-3 min-w-0"
        >
          <span className="hidden sm:inline">{t("next")}</span>
          <span className="sm:hidden">›</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages || isFetching}
          className="h-7 sm:h-9 text-xs sm:text-sm px-1.5 sm:px-3 min-w-0"
        >
          <span className="hidden sm:inline">{t("lastPage")}</span>
          <span className="sm:hidden">{totalPages}</span>
        </Button>
      </div>
    </div>
  );
};

export default OrdersPagination;

