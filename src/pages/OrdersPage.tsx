// src/pages/OrdersPage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
// import apiClient from '@/lib/axios'; // We'll mock data for now
import { Order, OrderStatus } from '@/types'; // Import Order type
import { DataTable } from '@/components/shared/DataTable'; // Import DataTable
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns'; // For date formatting

// Mock data - replace with API call
const mockOrders: Order[] = [
  { id: 'ORD001', customerName: 'Alice Wonderland', orderDate: new Date().toISOString(), status: 'pending', totalAmount: 25.50, itemCount: 3 },
  { id: 'ORD002', customerName: 'Bob The Builder', orderDate: new Date(Date.now() - 86400000).toISOString(), status: 'processing', totalAmount: 70.00, itemCount: 5 },
  { id: 'ORD003', customerName: 'Charlie Brown', orderDate: new Date(Date.now() - 172800000).toISOString(), status: 'ready_for_pickup', totalAmount: 45.20, itemCount: 2 },
  { id: 'ORD004', customerName: 'Diana Prince', orderDate: new Date(Date.now() - 259200000).toISOString(), status: 'completed', totalAmount: 15.00, itemCount: 1 },
];

// Placeholder for API fetching function
// const fetchOrders = async (): Promise<Order[]> => {
//   // const { data } = await apiClient.get('/orders');
//   // return data;
//   return new Promise(resolve => setTimeout(() => resolve(mockOrders), 1000)); // Simulate API delay
// };

const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const { t } = useTranslation('orders');
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  switch (status) {
    case 'pending': variant = 'default'; break; // Often yellow/orange
    case 'processing': variant = 'secondary'; break; // Often blue
    case 'ready_for_pickup': variant = 'outline'; break; // Often green
    case 'completed': variant = 'default'; break; // Often gray or a lighter green
    case 'cancelled': variant = 'destructive'; break;
  }
  // You might need to adjust badge colors in your global CSS or theme
  // For now, we use default shadcn badge variants.
  // Example: 'pending' might be better with a specific color.
  // Consider adding custom CSS for status-specific badge colors or use clsx to conditionally apply Tailwind classes.
  let bgColor = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'; // Default (like completed)
  if (status === 'pending') bgColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-300';
  if (status === 'processing') bgColor = 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-300';
  if (status === 'ready_for_pickup') bgColor = 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-300';
  if (status === 'cancelled') bgColor = 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-300';


  return <Badge variant={variant} className={bgColor}>{t(`status_${status}`)}</Badge>;
};


const OrdersPage = () => {
  const { t } = useTranslation(['common', 'orders']);
  const navigate = useNavigate();

  // For actual data fetching:
  // const { data: orders = [], isLoading, error } = useQuery<Order[]>({
  //   queryKey: ['orders'],
  //   queryFn: fetchOrders,
  // });
  // For now, using mock data directly:
  const orders = mockOrders;
  const isLoading = false; // Simulate loading finished
  // const error = null; // Simulate no error

  const columns: ColumnDef<Order>[] = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: t('orderId', { ns: 'orders' }),
      cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "customerName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t('customerName', { ns: 'common' })}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("customerName")}</div>,
    },
    {
      accessorKey: "orderDate",
      header: t('orderDate', { ns: 'common' }),
      cell: ({ row }) => <div>{format(new Date(row.getValue("orderDate")), "PPp")}</div>, // Using date-fns
    },
    {
      accessorKey: "status",
      header: t('status', { ns: 'common' }),
      cell: ({ row }) => <OrderStatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "totalAmount",
      header: () => <div className="text-right">{t('total', { ns: 'common' })}</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("totalAmount"))
        const formatted = new Intl.NumberFormat("en-US", { // Use locale from i18n if needed
          style: "currency",
          currency: "USD", // Make this configurable
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "itemCount",
      header: () => <div className="text-center">{t('itemCount', {ns: 'orders', defaultValue: 'Items'})}</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue("itemCount")}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t('actions', { ns: 'common' })}</div>,
      enableHiding: false,
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t('openMenu', {ns: 'common', defaultValue: 'Open menu'})}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('actions', { ns: 'common' })}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
                  {t('viewDetails', { ns: 'common' })}
                </DropdownMenuItem>
                <DropdownMenuItem /* onClick={() => handleEdit(order.id)} */>
                  {t('editOrder', {ns: 'orders', defaultValue: 'Edit Order'})}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  {t('cancelOrder', {ns: 'orders', defaultValue: 'Cancel Order'})}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ], [t, navigate]); // Add t and navigate to dependency array for i18n and navigation

  if (isLoading) return <p>{t('loading', {ns: 'common', defaultValue: 'Loading orders...'})}</p>;
  // if (error) return <p>{t('errorLoading', {ns: 'common', defaultValue: 'Error loading orders: '})} {error.message}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('title', { ns: 'orders' })}</h1>
        <Button asChild>
          <Link to="/orders/new">
            <PlusCircle className="mr-2 h-4 w-4" /> {t('newOrder', { ns: 'common' })}
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={orders}
        searchColumnId="customerName" // Enable search for customerName
        searchPlaceholder={t('searchByCustomer', {ns: 'orders', defaultValue: 'Search by customer name...'})}
      />
    </div>
  );
};

export default OrdersPage;