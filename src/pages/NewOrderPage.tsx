// src/pages/NewOrderPage.tsx
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea" // Add if you need a notes field
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner"
// import apiClient from '@/lib/axios'; // For actual API call
import { ServiceItem } from '@/types'; // Import ServiceItem type
import { useQuery } from '@tanstack/react-query';

// Mock service items - replace with API call
const mockServiceItems: ServiceItem[] = [
  { id: 'srv001', name: 'Wash & Fold (per kg)', price: 5.00, category: 'Washing' },
  { id: 'srv002', name: 'Dry Cleaning - Suit', price: 15.00, category: 'Dry Cleaning' },
  { id: 'srv003', name: 'Ironing - Shirt', price: 2.50, category: 'Ironing' },
];

// Placeholder for API fetching function
// const fetchServiceItems = async (): Promise<ServiceItem[]> => {
//   // const { data } = await apiClient.get('/services');
//   // return data;
//   return new Promise(resolve => setTimeout(() => resolve(mockServiceItems), 500));
// };


const newOrderSchema = z.object({
  customerName: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
  // Example: A customer can be an existing one (ID) or a new one (name, phone for quick add)
  // For simplicity now, just a name.
  // customerId: z.string().optional(), // If selecting existing customer
  // newCustomerPhone: z.string().optional(), // If adding new on the fly

  serviceItems: z.array(
    z.object({
      serviceId: z.string().min(1, { message: "Please select a service."}),
      quantity: z.number().min(1, { message: "Quantity must be at least 1."}),
      // priceAtOrder: z.number(), // Good to store price at time of order
    })
  ).min(1, { message: "Please add at least one service item."}),
  notes: z.string().optional(),
});

type NewOrderFormData = z.infer<typeof newOrderSchema>;

const NewOrderPage = () => {
  const { t } = useTranslation(['common', 'orders', 'services']); // Add 'services' namespace
  const navigate = useNavigate();

  // For actual data fetching of services:
  // const { data: serviceItems = [], isLoading: isLoadingServices } = useQuery<ServiceItem[]>({
  //   queryKey: ['serviceItems'],
  //   queryFn: fetchServiceItems,
  // });
  // For now, using mock data:
  const serviceItems = mockServiceItems;
  const isLoadingServices = false;


  const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NewOrderFormData>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: {
      customerName: '',
      serviceItems: [{ serviceId: '', quantity: 1 }], // Start with one item row
      notes: '',
    }
  });

  // For dynamic service items (react-hook-form's useFieldArray)
  // const { fields, append, remove } = useFieldArray({
  //   control,
  //   name: "serviceItems",
  // });


  const onSubmit = async (data: NewOrderFormData) => {
    console.log('New Order Data:', data);
    toast.info("Submitting order...", { id: "submit-order" });
    try {
      // await apiClient.post('/orders', data);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Order created successfully!", { id: "submit-order" });
      navigate('/orders');
    } catch (error) {
      toast.error("Failed to create order.", { id: "submit-order" });
      console.error("Order creation failed:", error);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{t('newOrder', { ns: 'common' })}</CardTitle>
        <CardDescription>{t('newOrderDescription', { ns: 'orders', defaultValue: 'Fill in the details to create a new laundry order.' })}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="customerName">{t('customerName', { ns: 'common' })}</Label>
            <Input
              id="customerName"
              {...register('customerName')}
              placeholder={t('customerNamePlaceholder', {ns: 'common', defaultValue: 'e.g., John Doe'})}
            />
            {errors.customerName && <p className="text-sm text-destructive">{errors.customerName.message}</p>}
          </div>

          {/* Simplified Service Item Section - For full dynamic items, useFieldArray is better */}
          <div className="space-y-4 border p-4 rounded-md">
             <h3 className="text-lg font-medium">{t('serviceItemsTitle', {ns: 'services', defaultValue: 'Service Items'})}</h3>
            {/* This is a simplified single item. For multiple, you'd map `fields` from `useFieldArray` */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="serviceItems.0.serviceId">{t('service', {ns: 'services'})}</Label>
                    <Controller
                        name="serviceItems.0.serviceId" // Assuming only one item for simplicity
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingServices}>
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingServices ? t('loadingServices', {ns: 'services', defaultValue: 'Loading services...'}) : t('selectService', {ns: 'services', defaultValue: 'Select a service'})} />
                                </SelectTrigger>
                                <SelectContent>
                                    {serviceItems.map(service => (
                                        <SelectItem key={service.id} value={service.id}>
                                            {service.name} (${service.price.toFixed(2)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.serviceItems?.[0]?.serviceId && <p className="text-sm text-destructive">{errors.serviceItems[0].serviceId.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="serviceItems.0.quantity">{t('quantity', {ns: 'services'})}</Label>
                    <Input
                        id="serviceItems.0.quantity"
                        type="number"
                        {...register('serviceItems.0.quantity', { valueAsNumber: true })}
                        min="1"
                        placeholder="1"
                    />
                    {errors.serviceItems?.[0]?.quantity && <p className="text-sm text-destructive">{errors.serviceItems[0].quantity.message}</p>}
                </div>
            </div>
            {errors.serviceItems && !errors.serviceItems[0] && <p className="text-sm text-destructive">{errors.serviceItems.message}</p>}
            {/* <Button type="button" variant="outline" size="sm" onClick={() => append({ serviceId: '', quantity: 1 })} className="mt-2">
                Add Another Item
            </Button> */}
            <p className="text-xs text-muted-foreground">{t('serviceItemsHint', {ns: 'orders', defaultValue: 'For a full implementation, useFieldArray would allow adding/removing multiple items.'})}</p>
          </div>


          <div className="space-y-2">
            <Label htmlFor="notes">{t('notes', { ns: 'common', defaultValue: 'Notes (Optional)' })}</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder={t('notesPlaceholder', {ns: 'common', defaultValue: 'Any special instructions for this order?'})}
            />
            {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
          </div>

        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/orders')} disabled={isSubmitting}>
            {t('cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('creatingOrder', { ns: 'orders', defaultValue: 'Creating...' }) : t('createOrderCta', { ns: 'orders', defaultValue: 'Create Order' })}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
export default NewOrderPage;