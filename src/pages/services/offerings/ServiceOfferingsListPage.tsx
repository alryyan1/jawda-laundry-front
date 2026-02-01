// src/pages/services/offerings/ServiceOfferingsListPage.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import type { ProductType, PaginatedResponse } from "@/types";
import { getProductTypesPaginated } from "@/api/productTypeService";
import { useDebounce } from "@/hooks/useDebounce";
import { getImageUrl } from "@/lib/utils";

import { ManageOfferingsDialog } from "./components/ManageOfferingsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, Shirt, Search, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ServiceOfferingsListPage: React.FC = () => {
  const { t } = useTranslation(["common", "services"]);

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedProductType, setSelectedProductType] =
    useState<ProductType | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Table view standard
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    data: paginatedData,
    isLoading,
    isFetching,
  } = useQuery<PaginatedResponse<ProductType>, Error>({
    queryKey: [
      "productTypesForOfferingsPage",
      currentPage,
      itemsPerPage,
      debouncedSearchTerm,
    ],
    queryFn: () =>
      getProductTypesPaginated(currentPage, itemsPerPage, debouncedSearchTerm),
    placeholderData: (prevData) => prevData,
  });

  const productTypes = paginatedData?.data || [];
  const totalPages = paginatedData?.meta?.last_page || 1;

  const handleManageOfferings = (productType: ProductType) => {
    setSelectedProductType(productType);
    setIsManageModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Search Bar - Full Width like image */}
      <div className="mb-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchProductTypes", {
              ns: "services",
              defaultValue: "Search Here",
            })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full bg-white h-12 text-lg"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead className="w-[300px]">
                {t("serviceName", { defaultValue: "SERVICE NAME" })}
              </TableHead>
              <TableHead>
                {t("serviceTypes", { defaultValue: "SERVICE TYPES" })}
              </TableHead>
              <TableHead className="w-[100px] text-right">
                {t("status", { defaultValue: "STATUS" })}
              </TableHead>
              <TableHead className="w-[100px] text-right">
                {t("actions", { defaultValue: "ACTIONS" })}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-full bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-16 bg-muted animate-pulse rounded ml-auto" />
                  </TableCell>
                  <TableCell>
                    <div className="h-8 w-20 bg-muted animate-pulse rounded ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : productTypes.length > 0 ? (
              productTypes.map((pt, index) => (
                <TableRow key={pt.id} className="hover:bg-muted/5">
                  <TableCell className="font-medium text-muted-foreground">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 flex-shrink-0 rounded bg-muted/20 border overflow-hidden">
                        {pt.image_url ? (
                          <img
                            src={getImageUrl(
                              pt.image_url.startsWith("http") ||
                                pt.image_url.startsWith("product_types/")
                                ? pt.image_url
                                : `product_types/${pt.image_url}`,
                            )}
                            alt={pt.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Shirt className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-[15px]">{pt.name}</span>
                        {pt.description && (
                          <p className="text-xs text-muted-foreground">
                            {pt.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {pt.service_offerings &&
                      pt.service_offerings.length > 0 ? (
                        pt.service_offerings
                          // Optional: deduplicate actions if simplified view needed, or show all offerings
                          // Showing action names as badges
                          .map((offering) => (
                            <Badge
                              key={offering.id}
                              variant="secondary"
                              className="px-2 py-0.5 text-xs font-semibold bg-slate-700 text-white hover:bg-slate-800"
                            >
                              {offering.serviceAction?.name ||
                                offering.display_name}
                            </Badge>
                          ))
                      ) : (
                        <span className="text-muted-foreground text-sm italic">
                          -
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="default"
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      {t("active", { defaultValue: "ACTIVE" })}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleManageOfferings(pt)}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center sm:justify-end space-x-2 py-4 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1 || isFetching}
          >
            
            {t("firstPage")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isFetching}
          >
            
            {t("previous")}
          </Button>
          <span className="text-sm font-medium mx-2">
            {t("pageWithTotal", { currentPage, totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages || isFetching}
          >
            
            {t("next")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || isFetching}
          >
            
            {t("lastPage")}
          </Button>
        </div>
      )}

      {selectedProductType && (
        <ManageOfferingsDialog
          isOpen={isManageModalOpen}
          onOpenChange={(isOpen) => {
            setIsManageModalOpen(isOpen);
            if (!isOpen) setSelectedProductType(null);
          }}
          productType={selectedProductType}
        />
      )}
    </div>
  );
};
export default ServiceOfferingsListPage;
