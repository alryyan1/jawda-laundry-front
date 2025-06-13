// src/pages/orders/OrderDetailsPage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Added useNavigate
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For payment status
import { Label } from '@/components/ui/label';

import type { Order, OrderStatus, OrderItem as OrderItemType } from '@/types'; // Use OrderItemType alias
import { getOrderById } from '@/api/orderService';
// Assume an updateOrderStatus function exists in orderService
// import { updateOrderStatus } from '@/api/orderService'; // TODO: Implement this

import { ArrowLeft, Loader2, Printer, AlertCircle, CheckCircle2, Info, Edit3 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader'; // Using PageHeader

// Re-usable OrderStatusBadgeComponent (could be moved to shared components)
const OrderStatusBadgeComponent: React.FC<{ status: OrderStatus; className?: string }> = ({ status, className }) => {
  const { t } = useTranslation('orders');
  let bgColor = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  if (status === 'pending') bgColor = 'bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/50';
  if (status === 'processing') bgColor = 'bg-blue-400/20 text-blue-600 dark:text-blue-400 border border-blue-500/50';
  if (status === 'ready_for_pickup') bgColor = 'bg-green-400/20 text-green-600 dark:text-green-400 border border-green-500/50';
  if (status === 'completed') bgColor = 'bg-slate-400/20 text-slate-600 dark:text-slate-400 border border-slate-500/50';
  if (status === 'cancelled') bgColor = 'bg-red-400/20 text-red-600 dark:text-red-400 border border-red-500/50';

  return <Badge className={`capitalize px-2.5 py-1 text-xs font-medium ${bgColor} ${className}`}>{t(`status_${status}`)}</Badge>;
};

// Payment Status Display (Example)
const PaymentStatusAlert: React.FC<{ order: Order, className?:string, i18n: { language: string } }> = ({ order, className, i18n }) => {
    const { t } = useTranslation('orders');
    if (!order.payment_status) return null;

    // Only use allowed variants: "default" | "destructive" | null | undefined
    let variant: "default" | "destructive" | null | undefined = "default";
    let Icon = Info;
    const title = t(`payment_status_${order.payment_status}`);

    switch(order.payment_status) {
        case 'paid': variant = null; Icon = CheckCircle2; break; // Use null for success
        case 'pending': variant = "default"; Icon = AlertCircle; break;
        case 'partially_paid': variant = "default"; Icon = Info; break;
        case 'refunded': variant = "destructive"; Icon = AlertCircle; break;
    }

    return (
        <Alert variant={variant} className={className}>
            <Icon className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>
                {t('paidAmount')}: {new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(order.paid_amount)}
                {order.payment_method && ` (${t('via', {ns:'common'})} ${t(`payment_method_${order.payment_method}`, {ns:'orders', defaultValue: order.payment_method})})`}
                {order.amount_due && order.amount_due > 0 && (
                    <span className="block mt-1">{t('amountDue')}: <span className="font-semibold text-destructive">{new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(order.amount_due)}</span></span>
                )}
            </AlertDescription>
        </Alert>
    )
}


const OrderDetailsPage: React.FC = () => {
  const { t, i18n } = useTranslation(['common', 'orders', 'customers', 'services']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentLocale = i18n.language.startsWith('ar') ? arSA : enUS;

  const { data: order, isLoading, error, refetch } = useQuery<Order, Error>({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id!),
    enabled: !!id,
  });

  // TODO: Implement updateOrderStatus in orderService.ts and its backend controller method
  // const updateStatusMutation = useMutation<Order, Error, { orderId: string | number; status: OrderStatus }>({
  //   mutationFn: ({orderId, status}) => updateOrderStatus(orderId, status),
  //   onSuccess: (updatedOrder) => {
  //     toast.success(t('orderStatusUpdatedSuccess', {ns: 'orders', status: t(`status_${updatedOrder.status}`, {ns:'orders'})}));
  //     queryClient.invalidateQueries({ queryKey: ['order', id] });
  //     queryClient.invalidateQueries({ queryKey: ['orders'] }); // Invalidate list if status affects it
  //   },
  //   onError: (error) => {
  //     toast.error(error.message || t('orderStatusUpdateFailed', {ns: 'orders'}));
  //   }
  // });

  // const handleStatusChange = (newStatus: OrderStatus) => {
  //   if (order && newStatus !== order.status) {
  //     updateStatusMutation.mutate({ orderId: order.id, status: newStatus });
  //   }
  // };


  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ms-3 text-lg">{t("loadingOrder", { ns: "orders" })}</p>
    </div>
  );
  if (error) return (
    <div className="text-center py-10">
      <p className="text-destructive text-lg">{t("errorLoading", { ns: "common" })}</p>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={() => refetch()} className="mt-4">{t("retry", { ns: "common" })}</Button>
    </div>
  );
  if (!order) return (
    <div className="text-center py-10">
      <p className="text-destructive text-lg">{t("orderNotFound", { ns: "orders" })}</p>
      <Button onClick={() => navigate("/orders")} className="mt-4">{t("backToOrders", { ns: "orders" })}</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('orderDetailsTitle', { ns: 'orders' })} #${order.order_number}`}
        description={t('orderPlacedOn', {ns:'orders', date: format(new Date(order.order_date), 'PPP p', { locale: currentLocale })})}
      >
        {/* Action buttons for the page header */}
        <Button variant="outline" onClick={() => navigate('/orders')}>
            <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {t('backToOrders', { ns: 'orders' })}
        </Button>
        // src/pages/orders/OrderDetailsPage.tsx
// In the PageHeader actions or a separate button group:
<Button asChild variant="secondary">
    <Link to={`/orders/${order.id}/edit`}>
        <Edit3 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {t('editOrder', { ns: 'orders' })}
    </Link>
</Button>
        <Button variant="outline"><Printer className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {t('printInvoice', { ns: 'orders' })}</Button>
        {/* <Button><Edit3 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {t('editOrder', { ns: 'orders' })}</Button> */}
      </PageHeader>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Customer & Order Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('customerAndOrderInfo', {ns: 'orders', defaultValue: 'Customer & Order Information'})}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <h3 className="font-semibold mb-1">{t('customerDetails', {ns:'customers'})}</h3>
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                <div><strong>{t('name', {ns:'common'})}:</strong> {order.customer?.name}</div>
                <div><strong>{t('phone', {ns:'customers'})}:</strong> {order.customer?.phone || t('notAvailable', {ns:'common'})}</div>
                <div><strong>{t('email', {ns:'common'})}:</strong> {order.customer?.email || t('notAvailable', {ns:'common'})}</div>
            </div>
            <Separator className="my-3"/>
            <h3 className="font-semibold mb-1">{t('orderSpecifics', {ns:'orders', defaultValue:'Order Specifics'})}</h3>
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                <div><strong>{t('dueDate', {ns:'orders'})}:</strong> {order.due_date ? format(new Date(order.due_date), 'PPP', { locale: currentLocale }) : t('notSet', {ns:'common'})}</div>
                {order.pickup_date && <div><strong>{t('pickupDate', {ns:'orders'})}:</strong> {format(new Date(order.pickup_date), 'PPP p', { locale: currentLocale })}</div>}
                {order.staff_user && <div><strong>{t('processedBy', {ns:'orders'})}:</strong> {order.staff_user.name}</div>}
            </div>
             {order.notes && (
                <> <Separator className="my-3"/> <div><strong>{t('overallOrderNotesOptional', {ns:'orders'})}:</strong> <p className="text-sm text-muted-foreground whitespace-pre-line">{order.notes}</p> </div></>
            )}
          </CardContent>
        </Card>

        {/* Status & Payment Card */}
        <Card>
            <CardHeader>
                <CardTitle>{t('statusAndPayment', { ns: 'orders' })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label className="text-xs text-muted-foreground">{t('currentStatus', { ns: 'orders' })}</Label>
                    <OrderStatusBadgeComponent status={order.status} className="mt-1 text-base px-3 py-1.5 w-full justify-center" />
                     {/* TODO: Add Select to change status
                     <Select
                        value={order.status}
                        onValueChange={(newStatus: OrderStatus) => handleStatusChange(newStatus)}
                        disabled={updateStatusMutation.isPending}
                    >
                        <SelectTrigger className="mt-2">
                            <SelectValue placeholder={t('changeStatus', {ns:'orders'})} />
                        </SelectTrigger>
                        <SelectContent>
                            {orderStatusOptions.map(statusOpt => (
                                <SelectItem key={statusOpt} value={statusOpt}>
                                    {t(`status_${statusOpt}`, {ns:'orders'})}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    */}
                </div>
                <Separator/>
                <PaymentStatusAlert order={order} i18n={i18n} />
            </CardContent>
            <CardFooter>
                 <Button className="w-full" onClick={() => {/* TODO: Open payment modal */}}>
                    {t('recordOrUpdatePayment', {ns:'orders', defaultValue:'Record/Update Payment'})}
                 </Button>
            </CardFooter>
        </Card>
      </div>


      {/* Items Table */}
      <Card>
        <CardHeader><CardTitle>{t('orderedItems', { ns: 'orders' })}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">{t('itemService', {ns:'orders', defaultValue:'Item / Service'})}</TableHead>
                <TableHead className="text-center">{t('quantity', {ns:'services'})}</TableHead>
                <TableHead className="text-center hidden sm:table-cell">{t('dimensionsLWH', {ns:'orders', defaultValue:'Dimensions (LxW)'})}</TableHead>
                <TableHead className="text-right rtl:text-left">{t('unitPrice', {ns:'orders', defaultValue:'Unit Price'})}</TableHead>
                <TableHead className="text-right rtl:text-left">{t('subtotal', {ns:'common'})}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {console.log(order,'order')}
              {order.items?.map((item: OrderItemType) => ( // Use alias
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.serviceOffering?.display_name || t('serviceOfferingDetailsMissing', {ns:'orders'})}</div>
                    {item.product_description_custom && <div className="text-xs text-muted-foreground">{item.product_description_custom}</div>}
                    {item.notes && <div className="text-xs text-info-foreground mt-1"><em>{t('notes')}: {item.notes}</em></div>}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    {item.length_meters && item.width_meters ? `${item.length_meters}m x ${item.width_meters}m` : '-'}
                  </TableCell>
                  <TableCell className="text-right rtl:text-left">
                    {new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(item.calculated_price_per_unit_item)}
                  </TableCell>
                  <TableCell className="text-right rtl:text-left">
                    {new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(item.sub_total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
             <TableFooter>
                <TableRow className="font-semibold bg-muted/50">
                    <TableCell colSpan={4} className="text-right rtl:text-left">{t('grandTotal', {ns:'common'})}</TableCell>
                    <TableCell className="text-right rtl:text-left text-lg">
                        {new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(order.total_amount)}
                    </TableCell>
                </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
export default OrderDetailsPage;