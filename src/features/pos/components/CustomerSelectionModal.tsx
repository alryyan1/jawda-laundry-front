import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, Search, UserPlus } from 'lucide-react';

import type { Customer, PaginatedResponse } from '@/types';
import { getCustomers } from '@/api/customerService';

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerSelected: (customer: Customer) => void;
  onNewCustomerClick: () => void;
}

export const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
  isOpen,
  onOpenChange,
  onCustomerSelected,
  onNewCustomerClick,
}) => {
  const { t } = useTranslation(['common', 'customers']);
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: customersResponse, isLoading } = useQuery<
    PaginatedResponse<Customer>,
    Error
  >({
    queryKey: ['customersForSelect'],
    queryFn: () => getCustomers(1, 1000),
    staleTime: 5 * 60 * 1000,
  });

  const filteredCustomers = React.useMemo(() => {
    if (!customersResponse?.data) return [];
    
    return customersResponse.data.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    );
  }, [customersResponse?.data, searchTerm]);

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelected(customer);
    onOpenChange(false);
    setSearchTerm('');
  };

  const handleNewCustomer = () => {
    onNewCustomerClick();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('selectCustomer', { ns: 'customers', defaultValue: 'Select Customer' })}
          </DialogTitle>
          <DialogDescription>
            {t('selectCustomerDescription', { 
              ns: 'customers', 
              defaultValue: 'Choose a customer for this order' 
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchCustomers', { 
                ns: 'customers', 
                defaultValue: 'Search customers...' 
              })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Customer List */}
          <ScrollArea className="h-64">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('noCustomersFound', { 
                  ns: 'customers', 
                  defaultValue: 'No customers found' 
                })}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCustomers.map((customer) => (
                  <Button
                    key={customer.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-4"
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    <div className="flex flex-col items-start">
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {customer.phone}
                        {customer.address && ` • ${customer.address}`}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* New Customer Button */}
          <Button
            onClick={handleNewCustomer}
            className="w-full"
            variant="outline"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {t('createNewCustomer', { 
              ns: 'customers', 
              defaultValue: 'Create New Customer' 
            })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 