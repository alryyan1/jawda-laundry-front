import React from 'react';
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/context/SearchContext";

export const POSSearch: React.FC = () => {
  const { t } = useTranslation(["services"]);
  const { searchTerm, setSearchTerm, isSearchVisible } = useSearch();

  if (!isSearchVisible) {
    return null;
  }

  return (
    <div className="relative max-w-md w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={t("searchProductsByNameOrId", { ns: "services" })}
        className="pl-9 bg-muted/50 dark:bg-muted/20 border-border/50 focus:border-primary"
      />
    </div>
  );
}; 