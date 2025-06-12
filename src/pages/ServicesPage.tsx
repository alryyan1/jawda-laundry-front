// src/pages/ServicesPage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, ArrowUpDown, Edit2, Trash2 } from 'lucide-react';
// Removed Link and useNavigate for now, will use Dialog for create/edit
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Service, ServiceFormData } from '@/types'; // Import Service type
import { DataTable } from '@/components/shared/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from '@/components/ui/textarea';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { getServices, createService, updateService, deleteService } from '@/services/serviceOfferingService'; // Import API functions
import i18n from '@/i18n';

// Zod Schema for Service Form
const serviceFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  price: z.preprocess(
    (val) => (val === "" ? undefined : parseFloat(String(val))), // Allow empty string to be undefined, then parse
    z.number({ invalid_type_error: "Price must be a number." }).min(0, { message: "Price must be non-negative." })
  ),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});


const ServicesPage = () => {
  const { t } = useTranslation(['services', 'common']);
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<Service | null>(null); // For edit/delete

  // TanStack Query for fetching services
  const { data: servicesResponse, isLoading, error } = useQuery({
    queryKey: ['services'], // Add pagination/filters to key if used: ['services', page, searchTerm]
    queryFn: () => getServices(), // Pass params if needed
  });
  const services = servicesResponse?.data || [];

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting: isFormSubmitting } } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
        name: '',
        price: '', // Input type number can still provide string
        category: '',
        description: ''
    }
  });

  // Mutation for creating a service
  const createMutation = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      toast.success(t('serviceCreatedSuccess'));
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsFormOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('serviceCreatedError'));
    }
  });

  // Mutation for updating a service
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ServiceFormData }) => updateService(id, data),
    onSuccess: () => {
      toast.success(t('serviceUpdatedSuccess'));
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsFormOpen(false);
      reset();
      setSelectedService(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('serviceUpdatedError'));
    }
  });

  // Mutation for deleting a service
  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      toast.success(t('serviceDeletedSuccess'));
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsDeleteDialogOpen(false);
      setSelectedService(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('serviceDeletedError'));
    }
  });

  const handleOpenForm = (service?: Service) => {
    setSelectedService(service || null);
    if (service) {
        setValue('name', service.name);
        setValue('price', service.price); // Number will be stringified by input
        setValue('category', service.category || '');
        setValue('description', service.description || '');
    } else {
        reset(); // Reset to defaultValues for new service
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: ServiceFormData) => {
    if (selectedService && selectedService.id) {
      updateMutation.mutate({ id: selectedService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleOpenDeleteDialog = (service: Service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedService && selectedService.id) {
      deleteMutation.mutate(selectedService.id);
    }
  };


  const columns: ColumnDef<Service>[] = React.useMemo(() => [
    // { id: "select", ... (same as before if needed) },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t('serviceName')} <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "category",
      header: t('category'),
      cell: ({ row }) => row.getValue("category") || '-',
    },
    {
      accessorKey: "price",
      header: () => <div className="text-right">{t('price')}</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("price"))
        const formatted = new Intl.NumberFormat(i18n.language, { // Use current i18n language for locale
          style: "currency",
          currency: "USD", // TODO: Make currency configurable (e.g., from settings or user profile)
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
        accessorKey: "description",
        header: t('description', {ns: 'common', defaultValue: 'Description'}),
        cell: ({ row }) => {
            const desc = row.getValue("description") as string;
            return <div className="truncate max-w-xs">{desc || '-'}</div>;
        }
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t('actions', { ns: 'common' })}</div>,
      cell: ({ row }) => {
        const service = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t('openMenu', { ns: 'common' })}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('actions', { ns: 'common' })}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleOpenForm(service)}>
                  <Edit2 className="mr-2 h-4 w-4" /> {t('edit', { ns: 'common' })}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenDeleteDialog(service)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" /> {t('delete', { ns: 'common' })}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [t, i18n.language, handleOpenForm, handleOpenDeleteDialog]); // Added i18n.language for currency formatting


  if (isLoading) return <p>{t('loadingServices', { defaultValue: 'Loading services...' })}</p>;
  if (error) return <p>{t('errorLoadingServices', { defaultValue: 'Error loading services: '})} {(error as Error).message}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2 h-4 w-4" /> {t('newService')}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={services}
        searchColumnId="name" // Enable search for service name
        searchPlaceholder={t('searchByName', { defaultValue: 'Search by name...' })}
      />

      {/* Service Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
          setIsFormOpen(isOpen);
          if (!isOpen) {
              reset();
              setSelectedService(null);
          }
      }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{selectedService ? t('editServiceTitle') : t('newServiceTitle')}</DialogTitle>
            <DialogDescription>
              {selectedService ? t('editServiceDescription') : t('newServiceDescription')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('serviceName')}</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">{t('price')}</Label>
              <Input id="price" type="number" step="0.01" {...register('price')} />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">{t('category')}</Label>
              <Input id="category" {...register('category')} />
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t('description', { ns: 'common' })}</Label>
              <Textarea id="description" {...register('description')} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline">{t('cancel', {ns: 'common'})}</Button>
              <Button type="submit" disabled={isFormSubmitting || createMutation.isPending || updateMutation.isPending}>
                {isFormSubmitting || createMutation.isPending || updateMutation.isPending ? t('saving', { ns: 'common' }) : t('save', { ns: 'common' })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteServiceConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteServiceConfirmDescription', { serviceName: selectedService?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel', { ns: 'common' })}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteMutation.isPending} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending ? t('deleting', { ns: 'common' }) : t('delete', { ns: 'common' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default ServicesPage;