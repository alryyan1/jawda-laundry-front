// src/features/orders/components/wizard/StepProductType.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import type { ProductType } from '@/types';
import { getAllProductTypes } from '@/api/productTypeService';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shirt, ArrowLeft } from 'lucide-react';

interface StepProductTypeProps {
  categoryId: string; // Non-nullable, as this step is only shown when a category is selected
  onSelectProductType: (productType: ProductType) => void;
  onBack: () => void;
}

export const StepProductType: React.FC<StepProductTypeProps> = ({
  categoryId,
  onSelectProductType,
  onBack,
}) => {
  const { t } = useTranslation(['services', 'common', 'orders']);

  const { data: products = [], isLoading } = useQuery<ProductType[], Error>({
    queryKey: ['allProductTypesForSelect', categoryId], // Query key is dynamic based on categoryId
    queryFn: () => getAllProductTypes(categoryId),
    enabled: !!categoryId, // This query runs only when categoryId is valid
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b shrink-0 flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={onBack} aria-label={t('goBack', { ns: 'common' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">{t('step3_selectProduct', { ns: 'orders' })}</h2>
          <p className="text-sm text-muted-foreground">{t('selectProductDescription', { ns: 'orders' })}</p>
        </div>
      </header>
      <ScrollArea className="flex-grow">
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground min-h-[200px] gap-4">
              <p>{t('noProductsInCategory', { ns: 'services' })}</p>
              <Button variant="outline" onClick={onBack}>{t('chooseAnotherCategory', { ns: 'services' })}</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <Card
                  key={product.id}
                  onClick={() => onSelectProductType(product)}
                  className="cursor-pointer hover:border-primary transition-all duration-200 ease-in-out transform hover:scale-105 group"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectProductType(product)}}
                >
                  <CardContent className="p-2 flex flex-col items-center justify-center gap-2 aspect-square group-hover:bg-muted/50 rounded-lg">
                    <Avatar className="h-14 w-14 rounded-md transition-transform duration-300 group-hover:scale-110">
                      <AvatarImage src={product.image_url || undefined} alt={product.name} />
                      <AvatarFallback className="rounded-md bg-secondary">
                        <Shirt className="h-7 w-7 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium text-center leading-tight px-1">{product.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};