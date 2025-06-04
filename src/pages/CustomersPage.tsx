// src/pages/CustomersPage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
// import apiClient from '@/lib/axios';
import { Customer } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';

// Mock data
const mockCustomers: Customer[] = [
  { id: 'CUS001', name: 'Alice Wonderland', email: 'alice@example.com', phone: '555-0101', registeredDate: new Date(Date.now() - 2592000000).toISOString(), totalOrders: 5 },
  { id: 'CUS002', name: 'Bob The Builder', email: 'bob@example.com', phone: '555-0102', registeredDate: new Date(Date.now() - 5184000000).toISOString(), totalOrders: 12 },
  { id: 'CUS003', name: 'Charlie Brown', email: 'charlie@example.com', phone: '555-0103', registeredDate: new Date().toISOString(), totalOrders: 1 },
];

// const fetchCustomers = async (): Promise<Customer[]> => {
//   // const { data } = await apiClient.get('/customers');
//   // return data;
//   return new Promise(resolve => setTimeout(() => resolve(mockCustomers), 1000));
// };


const CustomersPage = () => {
  const { t } = useTranslation(['common', 'customers']); // Add 'customers' namespace
  const navigate = useNavigate();

  // const { data: customers = [], isLoading, error } = useQuery<Customer[]>({
  //   queryKey: ['customers'],
  //   queryFn: fetchCustomers,
  // });
  const customers = mockCustomers;
  const isLoading = false;

  const columns: ColumnDef<Customer>[] = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
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
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t('name', { ns: 'common' })} <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "email",
      header: t('email', { ns: 'common' }),
    },
    {
      accessorKey: "phone",
      header: t('phone', { ns: 'customers' }),
    },
    {
      accessorKey: "totalOrders",
      header: () => <div className="text-center">{t('totalOrders', { ns: 'customers' })}</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue("totalOrders")}</div>,
    },
    {
      accessorKey: "registeredDate",
      header: t('registeredDate', { ns: 'customers' }),
      cell: ({ row }) => <div>{format(new Date(row.getValue("registeredDate")), "PPP")}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t('actions', { ns: 'common' })}</div>,
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t('openMenu', {ns: 'common'})}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('actions', { ns: 'common' })}</DropdownMenuLabel>
                <DropdownMenuItem /* onClick={() => navigate(`/customers/${customer.id}`)} */ >
                  {t('viewProfile', { ns: 'customers', defaultValue: 'View Profile' })}
                </DropdownMenuItem>
                <DropdownMenuItem /* onClick={() => handleEditCustomer(customer.id)} */>
                  {t('editCustomer', { ns: 'customers', defaultValue: 'Edit Customer' })}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [t, navigate]);


  if (isLoading) return <p>{t('loadingCustomers', {ns: 'customers', defaultValue: 'Loading customers...'})}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('title', { ns: 'customers' })}</h1>
        <Button asChild /* onClick={() => navigate('/customers/new')} */ >
          {/* <Link to="/customers/new"> Link to new customer page */}
            <PlusCircle className="mr-2 h-4 w-4" /> {t('newCustomer', { ns: 'customers' })}
          {/* </Link> */}
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={customers}
        searchColumnId="name"
        searchPlaceholder={t('searchByName', {ns: 'customers', defaultValue: 'Search by name...'})}
      />
    </div>
  );
};

export default CustomersPage;