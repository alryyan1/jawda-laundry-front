import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Loader2, Shirt } from 'lucide-react';
import { getAllProductTypes } from '@/api/productTypeService';
import { getServiceOfferings } from '@/api/serviceOfferingService';
import type { ProductType, ServiceOffering } from '@/types';

const MenuPage: React.FC = () => {
  const { t } = useTranslation(['common', 'services']);
  const [offeringsMap, setOfferingsMap] = useState<Record<number, ServiceOffering[]>>({});
  const [loadingOfferings, setLoadingOfferings] = useState<Record<number, boolean>>({});

  // Fetch all product types (not paginated, for menu)
  const { data: productTypes = [], isLoading: isLoadingTypes } = useQuery<ProductType[]>({
    queryKey: ['allProductTypesForMenu'],
    queryFn: () => getAllProductTypes(),
  });

  // Fetch offerings for each product type
  useEffect(() => {
    if (!productTypes.length) return;
    productTypes.forEach((pt) => {
      if (offeringsMap[pt.id] !== undefined) return; // Already fetched
      setLoadingOfferings((prev) => ({ ...prev, [pt.id]: true }));
      getServiceOfferings(1, 1000, { product_type_id: pt.id })
        .then((res) => {
          setOfferingsMap((prev) => ({ ...prev, [pt.id]: res.data }));
        })
        .finally(() => {
          setLoadingOfferings((prev) => ({ ...prev, [pt.id]: false }));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productTypes]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('menuPageTitle', { ns: 'services', defaultValue: 'Service Menu' })}</h1>
      {isLoadingTypes ? (
        <div className="flex justify-center items-center h-32 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          {t('loadingProductTypes', { ns: 'services' })}
        </div>
      ) : (
        <div className="space-y-8">
          {productTypes.map((pt) => (
            <Card key={pt.id} className="p-4">
              <div className="flex items-center gap-4 mb-2">
                <Avatar className="h-12 w-12 rounded-md">
                  <AvatarImage src={pt.image_url || undefined} alt={pt.name} />
                  <AvatarFallback className="rounded-md bg-muted">
                    <Shirt className="h-6 w-6 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-lg">{pt.name}</div>
                  <div className="text-sm text-muted-foreground">{pt.category?.name}</div>
                  {pt.description && <div className="text-xs text-muted-foreground mt-1">{pt.description}</div>}
                </div>
              </div>
              <div className="mt-2">
                {loadingOfferings[pt.id] ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t('loadingServiceOfferings', { ns: 'services', defaultValue: 'Loading service offerings...' })}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('serviceAction', { ns: 'services', defaultValue: 'Service Action' })}</TableHead>
                        <TableHead>{t('price', { ns: 'services', defaultValue: 'Price' })}</TableHead>
                        <TableHead>{t('unit', { ns: 'services', defaultValue: 'Unit' })}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(offeringsMap[pt.id]?.length ?? 0) > 0 ? (
                        offeringsMap[pt.id].map((off) => (
                          <TableRow key={off.id}>
                            <TableCell>{off.serviceAction?.name || '-'}</TableCell>
                            <TableCell>
                              {pt.is_dimension_based
                                ? off.default_price_per_sq_meter != null
                                  ? `${off.default_price_per_sq_meter} /m²`
                                  : '-'
                                : off.default_price != null
                                ? off.default_price
                                : '-'}
                            </TableCell>
                            <TableCell>{off.applicable_unit || (pt.is_dimension_based ? t('squareMeter', { ns: 'services', defaultValue: 'm²' }) : t('piece', { ns: 'services', defaultValue: 'piece' }))}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            {t('noServiceOfferings', { ns: 'services', defaultValue: 'No service offerings found.' })}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuPage; 