import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getInventoryItemById, updateInventoryItem } from '@/api/inventoryService';
import { getAllProductTypes } from '@/api/productTypeService';

const EditInventoryItemPage: React.FC = () => {
  const { t } = useTranslation(['common', 'inventory']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [form, setForm] = useState({
    product_type_id: '',
    sku: '',
    description: '',
    unit: '',
    min_stock_level: '',
    max_stock_level: '',
    cost_per_unit: '',
    supplier_id: '',
  });

  // Fetch inventory item
  const { data: inventoryItem, isLoading: isLoadingItem } = useQuery({
    queryKey: ['inventoryItem', id],
    queryFn: () => getInventoryItemById(parseInt(id!)),
    enabled: !!id,
  });

  // Fetch product types
  const { data: productTypes = [] } = useQuery({
    queryKey: ['product-types-all'],
    queryFn: () => getAllProductTypes(),
    staleTime: 10 * 60 * 1000,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateInventoryItem(parseInt(id!), data),
    onSuccess: () => {
      toast.success(t('common.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['inventoryItem', id] });
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      navigate(`/inventory/items/${id}`);
    },
    onError: (error: unknown) => {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || t('common.updateFailed');
      toast.error(errorMessage);
    },
  });

  // Populate form when item loads
  useEffect(() => {
    if (inventoryItem) {
      setForm({
        product_type_id: inventoryItem.product_type_id?.toString() || '',
        sku: inventoryItem.sku || '',
        description: inventoryItem.description || '',
        unit: inventoryItem.unit || '',
        min_stock_level: inventoryItem.min_stock_level?.toString() || '',
        max_stock_level: inventoryItem.max_stock_level?.toString() || '',
        cost_per_unit: inventoryItem.cost_per_unit?.toString() || '',
        supplier_id: inventoryItem.supplier_id?.toString() || '',
      });
    }
  }, [inventoryItem]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      product_type_id: form.product_type_id ? parseInt(form.product_type_id) : undefined,
      sku: form.sku || undefined,
      description: form.description || undefined,
      unit: form.unit,
      min_stock_level: form.min_stock_level ? parseFloat(form.min_stock_level) : 0,
      max_stock_level: form.max_stock_level ? parseFloat(form.max_stock_level) : undefined,
      cost_per_unit: form.cost_per_unit ? parseFloat(form.cost_per_unit) : undefined,
      supplier_id: form.supplier_id ? parseInt(form.supplier_id) : undefined,
    });
  };

  if (isLoadingItem) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!inventoryItem) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="flex justify-center items-center h-64">
          <div className="text-destructive">Failed to load inventory item</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/inventory/items/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back', { ns: 'common', defaultValue: 'Back' })}
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {t('editItem', { ns: 'inventory', defaultValue: 'Edit Inventory Item' })}
          </h1>
          <p className="text-muted-foreground">
            {inventoryItem.product_type?.name || 'Unknown Item'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {t('itemDetails', { ns: 'inventory', defaultValue: 'Item Details' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Product Type */}
            <div>
              <Label htmlFor="product_type_id">
                {t('productType', { ns: 'inventory', defaultValue: 'Product Type' })}
              </Label>
              <Select 
                value={form.product_type_id} 
                onValueChange={(v) => handleSelectChange('product_type_id', v)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectProductType', { ns: 'inventory', defaultValue: 'Select Product Type' })} />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map((pt: { id: number; name: string }) => (
                    <SelectItem key={pt.id} value={pt.id.toString()}>{pt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SKU */}
            <div>
              <Label htmlFor="sku">{t('sku', { ns: 'inventory', defaultValue: 'SKU' })}</Label>
              <Input
                id="sku"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder={t('optional', { ns: 'common', defaultValue: 'Optional' })}
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">{t('description', { ns: 'common', defaultValue: 'Description' })}</Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder={t('optional', { ns: 'common', defaultValue: 'Optional' })}
              />
            </div>

            {/* Unit */}
            <div>
              <Label htmlFor="unit">{t('unit', { ns: 'inventory', defaultValue: 'Unit' })}</Label>
              <Input
                id="unit"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                placeholder="pieces, kg, liters, etc."
                required
              />
            </div>

            {/* Stock Levels */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_stock_level">
                  {t('minStockLevel', { ns: 'inventory', defaultValue: 'Min Stock Level' })}
                </Label>
                <Input
                  id="min_stock_level"
                  name="min_stock_level"
                  type="number"
                  step="0.01"
                  value={form.min_stock_level}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="max_stock_level">
                  {t('maxStockLevel', { ns: 'inventory', defaultValue: 'Max Stock Level' })}
                </Label>
                <Input
                  id="max_stock_level"
                  name="max_stock_level"
                  type="number"
                  step="0.01"
                  value={form.max_stock_level}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Cost per Unit */}
            <div>
              <Label htmlFor="cost_per_unit">
                {t('costPerUnit', { ns: 'inventory', defaultValue: 'Cost per Unit' })}
              </Label>
              <Input
                id="cost_per_unit"
                name="cost_per_unit"
                type="number"
                step="0.01"
                value={form.cost_per_unit}
                onChange={handleChange}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link to={`/inventory/items/${id}`}>
                  {t('cancel', { ns: 'common', defaultValue: 'Cancel' })}
                </Link>
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? t('saving', { ns: 'common', defaultValue: 'Saving...' }) : t('save', { ns: 'common', defaultValue: 'Save' })}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditInventoryItemPage; 