import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { CategoryColumn } from '@/features/pos/components/CategoryColumn';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { getAllProductTypes } from '@/api/productTypeService';
import type { ProductType } from '@/types';

const MenuPage: React.FC = () => {
  const { t } = useTranslation(['common', 'services']);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Fetch product types for the selected category
  const { data: productTypes = [], isLoading } = useQuery<ProductType[]>({
    queryKey: ['menuProductTypes', selectedCategoryId],
    queryFn: () => getAllProductTypes(selectedCategoryId || undefined),
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6">{t('menuPageTitle', { ns: 'services', defaultValue: 'Service Menu' })}</h1>
      <div className="flex gap-6 min-h-[60vh]">
        {/* Left: CategoryColumn */}
        <div className="w-64 shrink-0">
          <CategoryColumn
            onSelectCategory={setSelectedCategoryId}
            selectedCategoryId={selectedCategoryId}
          />
        </div>
        {/* Right: ProductType Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-64 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              {t('loadingProductTypes', { ns: 'services' })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {productTypes.length === 0 ? (
                <div className="col-span-full text-center text-muted-foreground text-lg py-12">
                  {t('noProductTypesFound', { ns: 'services', defaultValue: 'No products found for this category.' })}
                </div>
              ) : (
                productTypes.map((pt) => (
                  <Card key={pt.id} className="group p-0 overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-200 hover:border-primary relative flex flex-col">
                    <div className="relative w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                      {pt.image_url ? (
                        <img
                          src={pt.image_url}
                          alt={pt.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-4xl text-gray-300">🧺</span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between p-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1 truncate" title={pt.name}>{pt.name}</h3>
                        {pt.description && <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{pt.description}</div>}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-primary font-bold text-xl">
                          {pt.first_service_offering && pt.first_service_offering.default_price != null
                            ? `${pt.first_service_offering.default_price} ${pt.first_service_offering.applicable_unit || t('piece', { ns: 'services', defaultValue: 'piece' })}`
                            : t('noPrice', { ns: 'services', defaultValue: 'No price' })}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPage; 