import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Autocomplete, TextField } from '@mui/material';
import { getProductCategories } from '@/api/productCategoryService';
import { getAllProductTypes } from '@/api/productTypeService';
import type { ProductType } from '@/types';

interface CustomerPriceListFiltersProps {
  selectedProductType: ProductType | null;
  onProductTypeChange: (productType: ProductType | null) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
}

export const CustomerPriceListFilters: React.FC<CustomerPriceListFiltersProps> = ({
  selectedProductType,
  onProductTypeChange,
  selectedCategory,
  onCategoryChange,
  itemsPerPage,
  onItemsPerPageChange
}) => {
  const { t } = useTranslation(['common', 'customers']);
  const [productTypeSearch, setProductTypeSearch] = useState('');

  // Fetch categories from database
  const { data: categories = [] } = useQuery({
    queryKey: ['productCategories'],
    queryFn: getProductCategories,
  });

  // Fetch product types for autocomplete
  const { data: productTypes = [] } = useQuery({
    queryKey: ['productTypes', productTypeSearch],
    queryFn: () => getAllProductTypes(undefined, productTypeSearch),
    enabled: productTypeSearch.length > 0,
  });

  return (
    <div className="mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
      <Autocomplete
        fullWidth
        options={productTypes}
        getOptionLabel={(option) => option.name}
        value={selectedProductType}
        onChange={(_, newValue) => onProductTypeChange(newValue)}
        onInputChange={(_, newInputValue) => setProductTypeSearch(newInputValue)}
        renderInput={(params) => (
          <TextField
            sx={{
              minWidth: '300px',
            }}
            {...params}
            label={t('selectProductType', { defaultValue: 'Select Product Type' })}
            size="small"
            className="min-w-[200px]"
          />
        )}
        renderOption={(props, option) => (
          <li {...props}>
            <div>
              <div className="font-medium">
                {option.name}
              </div>
              <div className="text-sm text-gray-500">
                {option.category?.name || t('uncategorized', { defaultValue: 'Uncategorized' })}
              </div>
            </div>
          </li>
        )}
      />
      <select
        className="border rounded px-3 py-2 text-sm"
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="all">{t('allCategories', { defaultValue: 'All Categories' })}</option>
        {categories.map(category => (
          <option key={category.id} value={category.name}>{category.name}</option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground whitespace-nowrap">
          {t('rowsPerPage', { defaultValue: 'Rows per page' })}:
        </label>
        <select
          className="border rounded px-3 py-2 text-sm"
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
      </div>
    </div>
  );
}; 