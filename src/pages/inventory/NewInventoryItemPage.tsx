import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createInventoryItem } from '@/api/inventoryService';
import { getAllProductTypes } from '@/api/productTypeService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Package, DollarSign, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Autocomplete, TextField, Chip, ThemeProvider, createTheme } from '@mui/material';
import { useTheme } from '@/components/theme-provider';

interface ProductType {
  id: number;
  name: string;
  category?: { id: number; name: string };
}

const NewInventoryItemPage: React.FC = () => {
  const { t } = useTranslation(['common', 'inventory']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useTheme();

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

  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);

  const { data: productTypes = [] } = useQuery({
    queryKey: ['product-types-all'],
    queryFn: () => getAllProductTypes(),
    staleTime: 10 * 60 * 1000,
  });

  // Create MUI theme based on current theme
  const muiTheme = createTheme({
    palette: {
      mode: theme === 'dark' ? 'dark' : 'light',
      background: {
        default: theme === 'dark' ? '#0f0f0f' : '#ffffff',
        paper: theme === 'dark' ? '#1a1a1a' : '#ffffff',
      },
      text: {
        primary: theme === 'dark' ? '#ffffff' : '#000000',
        secondary: theme === 'dark' ? '#a0a0a0' : '#666666',
      },
      primary: {
        main: theme === 'dark' ? '#3b82f6' : '#2563eb',
      },
      divider: theme === 'dark' ? '#374151' : '#e5e7eb',
    },
    components: {
      MuiAutocomplete: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
              borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme === 'dark' ? '#4b5563' : '#9ca3af',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
              },
            },
            '& .MuiInputLabel-root': {
              color: theme === 'dark' ? '#a0a0a0' : '#6b7280',
              '&.Mui-focused': {
                color: theme === 'dark' ? '#3b82f6' : '#2563eb',
              },
            },
            '& .MuiInputBase-input': {
              color: theme === 'dark' ? '#ffffff' : '#000000',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
            color: theme === 'dark' ? '#ffffff' : '#000000',
            '&:hover': {
              backgroundColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
            },
          },
        },
      },
    },
  });

  const mutation = useMutation({
    mutationFn: createInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      toast.success(t('common.createSuccess'));
      navigate('/inventory/items');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || t('common.createFailed');
      toast.error(errorMessage);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductTypeChange = (event: any, newValue: ProductType | null) => {
    setSelectedProductType(newValue);
    setForm(prev => ({ 
      ...prev, 
      product_type_id: newValue ? newValue.id.toString() : '' 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="sm" asChild>
          <Link to="/inventory/items">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back', { ns: 'common', defaultValue: 'Back' })}
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('addItem', { ns: 'inventory', defaultValue: 'Add Inventory Item' })}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('addItemDescription', { ns: 'inventory', defaultValue: 'Create a new inventory item to track stock levels and costs' })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              {t('basicInformation', { ns: 'common', defaultValue: 'Basic Information' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Type */}
              <div className="space-y-2">
                <Label htmlFor="product_type_id" className="text-sm font-medium">
                  {t('productType', { ns: 'inventory', defaultValue: 'Product Type' })} *
                </Label>
                <ThemeProvider theme={muiTheme}>
                  <Autocomplete
                    options={productTypes}
                    getOptionLabel={(option) => option.name}
                    value={selectedProductType}
                    onChange={handleProductTypeChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={t('selectProductType', { ns: 'inventory', defaultValue: 'Select Product Type' })}
                        variant="outlined"
                        size="small"
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            height: '40px',
                            fontSize: '14px',
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: '14px',
                          },
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <div className="flex flex-col w-full">
                          <span className="font-medium">{option.name}</span>
                          {option.category && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{option.category.name}</span>
                          )}
                        </div>
                      </li>
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={option.id}
                          label={option.name}
                          size="small"
                        />
                      ))
                    }
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    noOptionsText={t('noProductTypes', { ns: 'inventory', defaultValue: 'No product types found' })}
                    loadingText={t('loading', { ns: 'common', defaultValue: 'Loading...' })}
                    sx={{
                      '& .MuiAutocomplete-listbox': {
                        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      },
                      '& .MuiAutocomplete-option': {
                        '&:hover': {
                          backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                        },
                        '&[aria-selected="true"]': {
                          backgroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
                          color: '#ffffff',
                        },
                      },
                    }}
                  />
                </ThemeProvider>
                {selectedProductType && (
                  <div className="flex items-center gap-2 mt-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">
                      {selectedProductType.category?.name && (
                        <Badge variant="secondary" className="text-xs">
                          {selectedProductType.category.name}
                        </Badge>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* SKU */}
              <div className="space-y-2">
                <Label htmlFor="sku" className="text-sm font-medium">
                  {t('sku', { ns: 'inventory', defaultValue: 'SKU' })}
                  <span className="text-muted-foreground ml-1">({t('optional', { ns: 'common', defaultValue: 'Optional' })})</span>
                </Label>
                <Input
                  id="sku"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  placeholder="e.g., DET-001, WASH-002"
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Stock Keeping Unit - unique identifier for tracking
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                {t('description', { ns: 'common', defaultValue: 'Description' })}
                <span className="text-muted-foreground ml-1">({t('optional', { ns: 'common', defaultValue: 'Optional' })})</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter detailed description of the inventory item..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <Label htmlFor="unit" className="text-sm font-medium">
                {t('unit', { ns: 'inventory', defaultValue: 'Unit' })} *
              </Label>
              <Input
                id="unit"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                placeholder="e.g., pieces, kg, liters, meters"
                className="h-10"
                required
              />
              <p className="text-xs text-muted-foreground">
                Measurement unit for this inventory item
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stock Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              {t('stockManagement', { ns: 'inventory', defaultValue: 'Stock Management' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Min Stock Level */}
              <div className="space-y-2">
                <Label htmlFor="min_stock_level" className="text-sm font-medium">
                  {t('minStockLevel', { ns: 'inventory', defaultValue: 'Minimum Stock Level' })}
                </Label>
                <Input
                  id="min_stock_level"
                  name="min_stock_level"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.min_stock_level}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Alert will be triggered when stock falls below this level
                </p>
              </div>

              {/* Max Stock Level */}
              <div className="space-y-2">
                <Label htmlFor="max_stock_level" className="text-sm font-medium">
                  {t('maxStockLevel', { ns: 'inventory', defaultValue: 'Maximum Stock Level' })}
                  <span className="text-muted-foreground ml-1">({t('optional', { ns: 'common', defaultValue: 'Optional' })})</span>
                </Label>
                <Input
                  id="max_stock_level"
                  name="max_stock_level"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.max_stock_level}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum recommended stock level
                </p>
              </div>
            </div>

            {/* Stock Level Validation */}
            {form.min_stock_level && form.max_stock_level && 
             parseFloat(form.min_stock_level) >= parseFloat(form.max_stock_level) && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-900/20 dark:border-yellow-800">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  Minimum stock level should be less than maximum stock level
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              {t('financialInformation', { ns: 'inventory', defaultValue: 'Financial Information' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cost_per_unit" className="text-sm font-medium">
                {t('costPerUnit', { ns: 'inventory', defaultValue: 'Cost per Unit' })}
                <span className="text-muted-foreground ml-1">({t('optional', { ns: 'common', defaultValue: 'Optional' })})</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="cost_per_unit"
                  name="cost_per_unit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cost_per_unit}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="h-10 pl-8"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Cost per unit for inventory valuation and reporting
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button type="button" variant="outline" asChild>
            <Link to="/inventory/items">
              {t('cancel', { ns: 'common', defaultValue: 'Cancel' })}
            </Link>
          </Button>
          <Button 
            type="submit" 
            disabled={mutation.isPending || !form.product_type_id || !form.unit}
            className="min-w-[120px]"
          >
            <Save className="h-4 w-4 mr-2" />
            {mutation.isPending ? t('creating', { ns: 'common', defaultValue: 'Creating...' }) : t('create', { ns: 'common', defaultValue: 'Create' })}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewInventoryItemPage; 