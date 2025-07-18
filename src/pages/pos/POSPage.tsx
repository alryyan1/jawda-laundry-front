import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from 'uuid';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import { materialColors } from "@/lib/colors";
import { ORDER_STATUSES } from "@/lib/constants";
import { useAuth } from "@/features/auth/hooks/useAuth";

import type { ProductType, ServiceOffering, OrderItemFormLine, NewOrderFormData, QuoteItemPayload, QuoteItemResponse, Order, OrderStatus, PricingStrategy } from '@/types';
import type { DiningTable } from '@/types/dining.types';
import { CategoryColumn } from '@/features/pos/components/CategoryColumn';
import { ProductColumn } from '@/features/pos/components/ProductColumn';
import { ProductListColumn } from '@/features/pos/components/ProductListColumn';
import { ServiceOfferingColumn } from '@/features/pos/components/ServiceOfferingColumn';
import { CartColumn } from '@/features/pos/components/CartColumn';
import { CustomerSelection } from '@/features/pos/components/CustomerSelection';
import { CustomerFormModal } from '@/features/pos/components/CustomerFormModal';
import { TodayOrders } from '@/features/pos/components/TodayOrders';
import { TodayOrdersColumn } from '@/features/pos/components/TodayOrdersColumn';
import PdfPreviewDialog from '@/features/orders/components/PdfDialog';
import { RecordPaymentModal } from '@/features/orders/components/RecordPaymentModal';
import PaymentCalculator from '@/components/shared/PaymentCalculator';
import { createOrder, getOrderItemQuote, updateOrderStatus, sendOrderWhatsAppInvoice, getTodayOrders, updateOrder } from "@/api/orderService";
import { getAllServiceOfferingsForSelect } from "@/api/serviceOfferingService";
import { getDiningTables, updateDiningTableStatus } from "@/api/diningTableService";
import { useDebounce } from "@/hooks/useDebounce";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import settingService from "@/services/settingService";
import { getTodayDate } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Printer,
  Calculator,
} from "lucide-react";


interface CartItem {
  id: string;
  productType: ProductType;
  serviceOffering: ServiceOffering;
  quantity: number;
  price: number;
  notes?: string;
  length_meters?: number;
  width_meters?: number;
  _isQuoting?: boolean;
  _quoteError?: string | null;
  _quotedSubTotal?: number;
}

// Re-usable OrderStatusBadgeComponent
const OrderStatusBadgeComponent: React.FC<{
  status: OrderStatus;
  className?: string;
}> = ({ status, className }) => {
  const { t } = useTranslation("orders");
  let bgColor = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  if (status === "pending")
    bgColor =
      "bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/50";
  if (status === "processing")
    bgColor =
      "bg-blue-400/20 text-blue-600 dark:text-blue-400 border border-blue-500/50";
  if (status === "ready_for_pickup")
    bgColor =
      "bg-green-400/20 text-green-600 dark:text-green-400 border border-green-500/50";
  if (status === "completed")
    bgColor =
      "bg-slate-400/20 text-slate-600 dark:text-slate-400 border border-slate-500/50";
  if (status === "cancelled")
    bgColor =
      "bg-red-400/20 text-red-600 dark:text-red-400 border border-red-500/50";

  return (
    <Badge
      className={`capitalize px-2.5 py-1 text-xs font-medium ${bgColor} ${className}`}
    >
      {t(`status_${status}`)}
    </Badge>
  );
};

const POSPage: React.FC = () => {
  const { t } = useTranslation(["common", "orders"]);
  const queryClient = useQueryClient();
  const { can } = useAuth();
  
  // Initialize real-time updates
  useRealtimeUpdates();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string>(' ');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'in_house' | 'take_away' | 'delivery'>('in_house');

  const [isProcessing, setIsProcessing] = useState(false);
  const [lastQuotedInputs, setLastQuotedInputs] = useState<Record<string, string>>({});
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isTodayOrdersOpen, setIsTodayOrdersOpen] = useState(false);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  console.log(selectedOrder,'selectedOrder')
  const debouncedCartItems = useDebounce(cartItems, 500);

  // Get today's date for statistics (using local timezone)
  const today = getTodayDate(); // YYYY-MM-DD format

  // Fetch all service offerings for order creation
  const { data: allServiceOfferings = [] } = useQuery<ServiceOffering[], Error>({
    queryKey: ["allServiceOfferingsForSelect"],
    queryFn: () => getAllServiceOfferingsForSelect(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch dining tables for in-house orders
  const { data: diningTables = [] } = useQuery<DiningTable[], Error>({
    queryKey: ["diningTables"],
    queryFn: getDiningTables,
  });

  // Fetch settings to determine POS display options
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: settingService.getSettings,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch today's orders for table availability checking
  const { data: todayOrders = [] } = useQuery<Order[], Error>({
    queryKey: ["todayOrders"],
    queryFn: getTodayOrders,
    staleTime: 5 * 60 * 1000,
  });



  const createOrderMutation = useMutation({
    mutationFn: (orderData: NewOrderFormData) => createOrder(orderData, allServiceOfferings),
    onSuccess: async (createdOrder) => {
      toast.success(t("orderCreatedSuccessfully", { ns: "orders" }));
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
      
      // Update table status to occupied if order has a dining table
      if (createdOrder.table_id) {
        try {
          await updateDiningTableStatus(createdOrder.table_id, 'occupied');
          queryClient.invalidateQueries({ queryKey: ["diningTables"] });
        } catch (error) {
          console.error('Failed to update table status:', error);
        }
      }
      
      // Clear the cart and reset selections
      setCartItems([]);
      setSelectedCustomerId(null);
      setSelectedCategoryId(null);
      setSelectedProductType(null);
      setSelectedOfferingId(null);
      setSelectedTableId(' ');
      setOrderType('in_house');
      setIsProcessing(false);
      
      // Automatically select the newly created order
      if (createdOrder) {
        setSelectedOrder(createdOrder);
        
        // Auto-show PDF if setting is enabled
        if (settings?.pos_auto_show_pdf) {
          setIsPdfDialogOpen(true);
        }
      }
    },
    onError: (error) => {
      console.error('Failed to create order:', error);
      toast.error(t("failedToCreateOrder", { ns: "orders" }));
      setIsProcessing(false);
    },
  });

  // Mutation for updating order status
  const updateStatusMutation = useMutation<
    Order,
    Error,
    { orderId: string | number; status: OrderStatus }
  >({
    mutationFn: ({ orderId, status }) => updateOrderStatus(orderId, status),
    onSuccess: async (updatedOrder) => {
      toast.success(
        t("orderStatusUpdatedSuccess", {
          ns: "orders",
          status: t(`status_${updatedOrder.status}`, { ns: "orders" }),
        })
      );
      queryClient.setQueryData(["order", updatedOrder.id], updatedOrder);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
      
      // Release table if order is completed and has a dining table
      if (updatedOrder.status === 'completed' && updatedOrder.table_id) {
        try {
          await updateDiningTableStatus(updatedOrder.table_id, 'available');
          queryClient.invalidateQueries({ queryKey: ["diningTables"] });
        } catch (error) {
          console.error('Failed to release table:', error);
        }
      }
      
      // Update the selected order if it's the same one
      if (selectedOrder && selectedOrder.id === updatedOrder.id) {
        setSelectedOrder(updatedOrder);
        
        // If the order was completed, automatically reset to new order mode after a short delay
        if (updatedOrder.status === 'completed') {
          setTimeout(() => {
            setSelectedOrder(null);
            setCartItems([]);
            setSelectedCustomerId(null);
            setSelectedCategoryId(null);
            setSelectedProductType(null);
            setSelectedOfferingId(null);
            setSelectedTableId(' ');
            setOrderType('in_house');
          }, 2000); // 2 second delay to show completion status
        }
      }
    },
    onError: (error) => {
      toast.error(
        error.message || t("orderStatusUpdateFailed", { ns: "orders" })
      );
    },
  });

  // Mutation for sending WhatsApp invoice
  const sendWhatsAppInvoiceMutation = useMutation<
    { message: string },
    Error,
    string | number
  >({
    mutationFn: (orderId) => sendOrderWhatsAppInvoice(orderId),
    onSuccess: () => {
      toast.success(t("whatsappInvoiceSentSuccess", { ns: "orders" }));
      // Refresh the order data to get updated WhatsApp status
      if (selectedOrder) {
        queryClient.invalidateQueries({ queryKey: ["order", selectedOrder.id] });
        queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
      }
    },
    onError: (error) => {
      toast.error(
        error.message || t("whatsappInvoiceSendFailed", { ns: "orders" })
      );
    },
  });

  const quoteItemMutation = useMutation<
    QuoteItemResponse,
    Error,
    { itemId: string; payload: QuoteItemPayload }
  >({
    mutationFn: async ({ payload }) => getOrderItemQuote(payload),
    onSuccess: (data, variables) => {
      setCartItems(prev => prev.map(item => {
        if (item.id === variables.itemId) {
          return {
            ...item,
            price: data.calculated_price_per_unit_item,
            _quotedSubTotal: data.sub_total,
            _isQuoting: false,
            _quoteError: null,
          };
        }
        return item;
      }));
    },
    onError: (error, variables) => {
      setCartItems(prev => prev.map(item => {
        if (item.id === variables.itemId) {
          return {
            ...item,
            _isQuoting: false,
            _quoteError: error.message || t("quoteFailedForItemGeneric", { ns: "orders" }),
            _quotedSubTotal: undefined, // Clear quoted subtotal on error
          };
        }
        return item;
      }));
    },
  });

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedProductType(null);
  };

  const handleSelectProduct = (product: ProductType) => {
    setSelectedProductType(product);
    setSelectedOfferingId(null); // Reset selected offering when product changes
    
    // Check if product has only one service offering and auto-add to cart
    const productOfferings = allServiceOfferings.filter(
      offering => offering.product_type_id === product.id
    );
    
    // Use selectedCustomerId or customer from selected order
    const hasCustomer = selectedCustomerId || selectedOrder?.customer;
    
    if (productOfferings.length === 1 && hasCustomer) {
      const offering = productOfferings[0];
      setSelectedOfferingId(offering.id.toString());
      const newItem: CartItem = {
        id: uuidv4(),
        productType: product,
        serviceOffering: offering,
        quantity: 1,
        price: product.is_dimension_based 
          ? offering.default_price_per_sq_meter || 0
          : offering.default_price || 0,
        _isQuoting: false,
      };
      setCartItems(prev => [...prev, newItem]);
    }
  };

  const handleSelectOffering = (offering: ServiceOffering) => {
    setSelectedOfferingId(offering.id.toString());
    const newItem: CartItem = {
      id: uuidv4(),
      productType: selectedProductType!,
      serviceOffering: offering,
      quantity: 1,
      price: selectedProductType?.is_dimension_based 
        ? offering.default_price_per_sq_meter || 0
        : offering.default_price || 0,
      _isQuoting: false,
    };
    setCartItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));

    // Trigger immediate quote for dimension-based items when quantity changes
    const item = cartItems.find(cartItem => cartItem.id === id);
    // Use selectedCustomerId or customer from selected order
    const customerId = selectedCustomerId || selectedOrder?.customer?.id?.toString();
    if (item && item.productType.is_dimension_based && customerId && quantity > 0) {
      const lengthNum = item.length_meters || 0;
      const widthNum = item.width_meters || 0;
      
      if (lengthNum > 0 && widthNum > 0) {
        const quotePayload: QuoteItemPayload = {
          service_offering_id: item.serviceOffering.id,
          customer_id: customerId,
          quantity: quantity,
          length_meters: lengthNum,
          width_meters: widthNum,
        };

        const currentQuoteInputSignature = JSON.stringify(quotePayload);

        if (lastQuotedInputs[item.id] !== currentQuoteInputSignature) {
          setLastQuotedInputs(prev => ({
            ...prev,
            [item.id]: currentQuoteInputSignature,
          }));

          setCartItems(prev => prev.map(cartItem => 
            cartItem.id === id ? { ...cartItem, _isQuoting: true, _quoteError: null } : cartItem
          ));

          quoteItemMutation.mutate({ itemId: id, payload: quotePayload });
        }
      }
    }
  };

  const handleUpdateDimensions = (id: string, dimensions: { length?: number; width?: number }) => {
    setCartItems(prev => prev.map(item =>
      item.id === id
        ? {
            ...item,
            length_meters: dimensions.length,
            width_meters: dimensions.width,
          }
        : item
    ));

    // Trigger immediate quote for dimension-based items
    const item = cartItems.find(cartItem => cartItem.id === id);
    // Use selectedCustomerId or customer from selected order
    const customerId = selectedCustomerId || selectedOrder?.customer?.id?.toString();
    if (item && item.productType.is_dimension_based && customerId && item.quantity > 0) {
      const lengthNum = dimensions.length || 0;
      const widthNum = dimensions.width || 0;
      
      if (lengthNum > 0 && widthNum > 0) {
        const quotePayload: QuoteItemPayload = {
          service_offering_id: item.serviceOffering.id,
          customer_id: customerId,
          quantity: item.quantity,
          length_meters: lengthNum,
          width_meters: widthNum,
        };

        const currentQuoteInputSignature = JSON.stringify(quotePayload);

        if (lastQuotedInputs[item.id] !== currentQuoteInputSignature) {
          setLastQuotedInputs(prev => ({
            ...prev,
            [item.id]: currentQuoteInputSignature,
          }));

          setCartItems(prev => prev.map(cartItem => 
            cartItem.id === id ? { ...cartItem, _isQuoting: true, _quoteError: null } : cartItem
          ));

          quoteItemMutation.mutate({ itemId: id, payload: quotePayload });
        }
      }
    }
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setCartItems(prev => prev.map(item =>
      item.id === id ? { ...item, notes } : item
    ));
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    
    // Update dining table status to occupied if the order has a table
    if (order.table_id) {
      updateDiningTableStatus(order.table_id, 'occupied')
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["diningTables"] });
        })
        .catch((error) => {
          console.error('Failed to update table status:', error);
        });
    }
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (selectedOrder && newStatus !== selectedOrder.status) {
      updateStatusMutation.mutate({ orderId: selectedOrder.id, status: newStatus });
    }
  };

  const handleSendWhatsAppInvoice = () => {
    if (selectedOrder) {
      sendWhatsAppInvoiceMutation.mutate(selectedOrder.id);
    }
  };





  const handleAddItemsToOrder = async () => {
    if (!selectedOrder) {
      toast.error(t("noOrderSelected", { ns: "orders", defaultValue: "No order selected" }));
      return;
    }

    if (cartItems.length === 0) {
      toast.error(t("noItemsToAdd", { ns: "orders", defaultValue: "No items to add" }));
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare the order data with existing items + new items
      const existingItems = selectedOrder.items?.map(item => ({
        id: item.id.toString(),
        service_offering_id: item.serviceOffering?.id || 0,
        product_type_id: item.serviceOffering?.productType?.id?.toString() || '',
        service_action_id: item.serviceOffering?.serviceAction?.id?.toString() || '',
        quantity: item.quantity,
        notes: item.notes || undefined,
        length_meters: item.length_meters || undefined,
        width_meters: item.width_meters || undefined,
        _derivedServiceOffering: item.serviceOffering,
        _pricingStrategy: (item.serviceOffering?.productType?.is_dimension_based ? 'dimension_based' : 'fixed') as 'fixed' | 'dimension_based',
        _quoted_price_per_unit_item: item.calculated_price_per_unit_item,
        _quoted_sub_total: item.sub_total,
      })) || [];

      const newItems = cartItems.map(item => ({
        id: item.id,
        service_offering_id: item.serviceOffering.id,
        product_type_id: item.productType.id.toString(),
        service_action_id: item.serviceOffering.service_action_id.toString(),
        quantity: item.quantity,
        notes: item.notes,
        length_meters: item.length_meters,
        width_meters: item.width_meters,
        _derivedServiceOffering: item.serviceOffering,
        _pricingStrategy: (item.productType.is_dimension_based ? 'dimension_based' : 'fixed') as PricingStrategy,
        _quoted_price_per_unit_item: item.price,
        _quoted_sub_total: item._quotedSubTotal || (item.price * item.quantity),
      }));

      const orderData = {
        customer_id: selectedOrder.customer?.id?.toString() || '',
        items: [...existingItems, ...newItems],
        notes: selectedOrder.notes || undefined,
        due_date: selectedOrder.due_date || undefined,
        order_type: selectedOrder.order_type,
        dining_table_id: selectedOrder.dining_table_id,
      };

      // Call the updateOrder API to add items to the existing order
      const updatedOrder = await updateOrder(selectedOrder.id, orderData, allServiceOfferings);
      
      // Update the selected order with the new data
      setSelectedOrder(updatedOrder);
      
      // Clear the cart items
      setCartItems([]);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
      
      toast.success(t("itemsAddedToOrder", { ns: "orders", defaultValue: "Items added to order successfully" }));
    } catch (error) {
      console.error('Failed to add items to order:', error);
      toast.error(t("failedToAddItems", { ns: "orders", defaultValue: "Failed to add items to order" }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedCustomerId) {
      toast.error(t("pleaseSelectCustomer", { ns: "orders" }));
      return;
    }

    if (cartItems.length === 0) {
      toast.error(t("cartIsEmpty", { ns: "orders" }));
      return;
    }

    // Validate table selection for in-house orders
    if (orderType === 'in_house' && !selectedTableId) {
      toast.error(t("pleaseSelectTable", { ns: "dining", defaultValue: "Please select a table for in-house orders" }));
      return;
    }

    setIsProcessing(true);

    const orderItems: OrderItemFormLine[] = cartItems.map(item => ({
      id: item.id,
      service_offering_id: item.serviceOffering.id,
      product_type_id: item.productType.id.toString(),
      service_action_id: item.serviceOffering.service_action_id.toString(),
      quantity: item.quantity,
      notes: item.notes,
      length_meters: item.length_meters,
      width_meters: item.width_meters,
      _derivedServiceOffering: item.serviceOffering,
      _pricingStrategy: item.productType.is_dimension_based ? 'dimension_based' : 'fixed',
      _quoted_price_per_unit_item: item.price,
      _quoted_sub_total: item._quotedSubTotal || (item.price * item.quantity),
    }));

    const orderData: NewOrderFormData = {
      customer_id: selectedCustomerId,
      items: orderItems,
      notes: undefined, // TODO: Add UI for order notes
      due_date: undefined, // TODO: Add UI for due date
      order_type: orderType,
      dining_table_id: selectedTableId ? parseInt(selectedTableId) : null, // Use dining_table_id for dining tables
    };

    console.log('Creating order with dining table ID:', orderData.dining_table_id);
    createOrderMutation.mutate(orderData);
  };

  // Effect for quoting items
  useEffect(() => {
    // Use selectedCustomerId or customer from selected order
    const customerId = selectedCustomerId || selectedOrder?.customer?.id?.toString();
    if (!debouncedCartItems || debouncedCartItems.length === 0 || !customerId) return;

    debouncedCartItems.forEach((item) => {
      if (!item._isQuoting && item.quantity > 0) {
        let readyToQuote = true;
        const quotePayload: QuoteItemPayload = {
          service_offering_id: item.serviceOffering.id,
          customer_id: customerId,
          quantity: item.quantity,
        };

        if (item.productType.is_dimension_based) {
          if (item.length_meters && item.width_meters) {
            quotePayload.length_meters = item.length_meters;
            quotePayload.width_meters = item.width_meters;
          } else {
            readyToQuote = false;
          }
        }

        const currentQuoteInputSignature = JSON.stringify(quotePayload);

        if (readyToQuote && lastQuotedInputs[item.id] !== currentQuoteInputSignature) {
          setLastQuotedInputs(prev => ({
            ...prev,
            [item.id]: currentQuoteInputSignature,
          }));

          setCartItems(prev => prev.map(cartItem => 
            cartItem.id === item.id ? { ...cartItem, _isQuoting: true } : cartItem
          ));

          quoteItemMutation.mutate({ itemId: item.id, payload: quotePayload });
        }
      }
    });
  }, [debouncedCartItems, selectedCustomerId]);

  return (
    <div style={{
      userSelect: 'none',
    }} className="flex flex-col h-[calc(100vh-64px)] ">
      {/* Customer Selection Bar */}
      <div className="border-b shadow-sm bg-background flex-shrink-0" style={{ borderColor: materialColors.divider }}>
        <div className="container mx-auto px-4 py-1 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <CustomerSelection
              selectedCustomerId={selectedCustomerId}
              onCustomerSelected={setSelectedCustomerId}
              onNewCustomerClick={() => setIsCustomerModalOpen(true)}
              disabled={!!selectedOrder}
              forcedCustomer={selectedOrder?.customer || null}
            />
            
            {/* Order Type Selection - Only show when not viewing an existing order */}
            {!selectedOrder && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">
                  {t("orderType", { ns: "orders", defaultValue: "Order Type" })}:
                </Label>
                <Select
                  value={orderType}
                  onValueChange={(newOrderType: 'in_house' | 'take_away' | 'delivery') => {
                    setOrderType(newOrderType);
                    setSelectedTableId(' '); // Reset table selection when order type changes
                  }}
                  disabled={isProcessing}
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_house">{t('inHouse', { ns: 'orders', defaultValue: 'In House' })}</SelectItem>
                    <SelectItem value="take_away">{t('takeAway', { ns: 'orders', defaultValue: 'Take Away' })}</SelectItem>
                    <SelectItem value="delivery">{t('delivery', { ns: 'orders', defaultValue: 'Delivery' })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Table Selection - Only show for in-house orders when not viewing an existing order */}
            {!selectedOrder && orderType === 'in_house' && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">
                  {t("table", { ns: "dining", defaultValue: "Table" })}:
                </Label>
                <Select
                  value={selectedTableId || ''}
                  onValueChange={(tableId) => setSelectedTableId(tableId || ' ')}
                  disabled={isProcessing}
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue placeholder={t("selectTable", { ns: "dining", defaultValue: "Select Table" })} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">{t("noTable", { ns: "dining", defaultValue: "No Table" })}</SelectItem>
                    {diningTables
                      .filter(table => {
                        // Only show tables that are available or reserved
                        const isStatusAvailable = table.status === 'available' || table.status === 'reserved';
                        
                        // Check if this table has any incomplete orders
                        const hasIncompleteOrders = todayOrders.some((order: Order) => 
                          order.table_id === table.id && 
                          order.status !== 'completed' && 
                          order.status !== 'cancelled'
                        );
                        
                        return isStatusAvailable && !hasIncompleteOrders;
                      })
                      .map((table) => (
                        <SelectItem key={table.id} value={table.id.toString()}>
                          {table.name} ({table.capacity} {t("seats", { ns: "dining", defaultValue: "seats" })})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {/* Calculator Button - Always visible */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCalculatorOpen(true)}
            >
              <Calculator className="h-4 w-4 mr-1" />
              {t("calculator", { defaultValue: "Calculator" })}
            </Button>
          </div>

          {/* Order Action Buttons - Only show when an order is selected */}
          {selectedOrder && (
            <div className="flex items-center gap-2">
              {/* Status Badge */}
              <OrderStatusBadgeComponent
                status={selectedOrder.status}
                className="text-sm px-2 py-1"
              />
              
              {/* Table Display - Show when order has a dining table */}
              {(selectedOrder.dining_table || selectedOrder.dining_table_id) && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    {t("table", { ns: "dining", defaultValue: "Table" })}:
                  </Label>
                  <Badge variant="outline" className="text-xs px-2 py-1 bg-primary/10 border-primary/30 text-primary">
                    {selectedOrder.dining_table ? (
                      `${selectedOrder.dining_table.name} (${selectedOrder.dining_table.capacity} ${t("seats", { ns: "dining", defaultValue: "seats" })})`
                    ) : (
                      `Table ${selectedOrder.dining_table_id}`
                    )}
                  </Badge>
                </div>
              )}
              
              {/* Status Change Select */}
              {can("order:update-status") && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    {t("changeStatus", { ns: "orders" })}:
                  </Label>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(newStatus: OrderStatus) =>
                      handleStatusChange(newStatus)
                    }
                    disabled={updateStatusMutation.isPending || selectedOrder.status === 'completed' || selectedOrder.status === 'cancelled'}
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue
                        placeholder={t("changeStatus", { ns: "orders" })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(`status_${status}`, { ns: "orders" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {updateStatusMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              )}

              {/* Print and Download Buttons */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPdfDialogOpen(true)}
              >
                <Printer className="h-4 w-4 mr-1" />
              </Button>
             
              
              {/* Payment Button */}
              {can("order:record-payment") && selectedOrder && (selectedOrder.amount_due || 0) > 0 && (
                selectedOrder.status !== 'cancelled' && 
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  {t("recordOrUpdatePayment", {
                    ns: "orders",
                    defaultValue: "Record/Update Payment",
                  })}
                </Button>
                
              )}
              
              {/* WhatsApp Buttons */}
              {can("order:send-whatsapp") && selectedOrder.customer?.phone && (
                <>
                  <Button
                    size="sm"
                    variant={selectedOrder.whatsapp_text_sent ? "default" : "outline"}
                    className={selectedOrder.whatsapp_text_sent ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                    disabled
                  >
                    <WhatsAppIcon className="h-4 w-4 mr-1" />
                    {selectedOrder.whatsapp_text_sent ? t("messageSent", { ns: "orders" }) : t("sendMessage", { ns: "orders" })}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={selectedOrder.whatsapp_pdf_sent ? "default" : "outline"}
                    className={selectedOrder.whatsapp_pdf_sent ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                    onClick={handleSendWhatsAppInvoice}
                    disabled={sendWhatsAppInvoiceMutation.isPending}
                  >
                    <WhatsAppIcon className="h-4 w-4 mr-1" />
                    {sendWhatsAppInvoiceMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    {selectedOrder.whatsapp_pdf_sent ? t("invoiceSent", { ns: "orders" }) : t("sendInvoice", { ns: "orders" })}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-4 overflow-hidden">
        <div className="flex gap-4 h-full">
          {/* Left Section: Categories */}
          <div className="w-[170px] bg-background rounded-lg shadow-sm overflow-hidden">
            <CategoryColumn
              onSelectCategory={handleSelectCategory}
              selectedCategoryId={selectedCategoryId}
            />
          </div>

          {/* Middle Section: Products and Services */}
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Products */}
            <div className={`flex-1 bg-background rounded-lg shadow-sm overflow-hidden flex flex-col min-w-[160px] ${selectedOrder?.status === 'completed' ? 'blur-sm pointer-events-none' : ''}`}>
              <h2 className="text-lg font-semibold p-4 border-b" style={{ borderColor: materialColors.divider }}>
                {t("product", { ns: "common" })}
              </h2>
              <div className="flex-1 min-h-0">
                {settings?.pos_show_products_as_list ? (
                  <ProductListColumn
                    categoryId={selectedCategoryId}
                    onSelectProduct={handleSelectProduct}
                    activeProductId={selectedProductType?.id.toString()}
                  />
                ) : (
                  <ProductColumn
                    categoryId={selectedCategoryId}
                    onSelectProduct={handleSelectProduct}
                    activeProductId={selectedProductType?.id.toString()}
                  />
                )}
              </div>
            </div>

            {/* Services */}
            <div className={`flex-1 bg-background rounded-lg shadow-sm overflow-hidden flex flex-col min-w-[160px] ${selectedOrder?.status === 'completed' ? 'blur-sm pointer-events-none' : ''}`}>
              <h2 className="text-lg font-semibold p-4 border-b" style={{ borderColor: materialColors.divider }}>
                {t("serviceOffering", { ns: "common" })}
              </h2>
              <div className="flex-1 min-h-0">
                <ServiceOfferingColumn
                  productType={selectedProductType}
                  onSelectOffering={handleSelectOffering}
                  disabled={!selectedCustomerId && !selectedOrder?.customer}
                  disabledMessage={t("selectCustomerFirst", { ns: "orders" })}
                  activeOfferingId={selectedOfferingId}
                />
              </div>
            </div>
          </div>

          {/* Today's Orders Column */}
       
          {/* Right Section: Cart */}
          <div className="w-[400px] bg-background rounded-lg shadow-sm overflow-hidden">
            <CartColumn
              items={selectedOrder ? [
                // Existing order items
                ...(selectedOrder.items?.map(item => ({
                  id: item.id.toString(),
                  productType: item.serviceOffering?.productType || {} as ProductType,
                  serviceOffering: item.serviceOffering || {} as ServiceOffering,
                  quantity: item.quantity,
                  price: item.calculated_price_per_unit_item,
                  notes: item.notes || undefined,
                  length_meters: item.length_meters || undefined,
                  width_meters: item.width_meters || undefined,
                  _quotedSubTotal: item.sub_total,
                  _isExistingOrderItem: true, // Flag to identify existing order items
                })) || []),
                // New cart items being added
                ...cartItems
              ] : cartItems}
              onRemoveItem={selectedOrder ? (id: string) => {
                // If it's an existing order item, we can't remove it from the cart
                // but we could potentially mark it for removal when updating the order
                if (cartItems.find(item => item.id === id)) {
                  handleRemoveItem(id);
                }
                // For existing order items, we'll need to implement order item removal logic
              } : handleRemoveItem}
              onUpdateQuantity={selectedOrder ? (id: string, quantity: number) => {
                // If it's a new cart item, update it normally
                if (cartItems.find(item => item.id === id)) {
                  handleUpdateQuantity(id, quantity);
                }
                // For existing order items, we'll need to implement order item update logic
              } : handleUpdateQuantity}
              onUpdateDimensions={selectedOrder ? (id: string, dimensions: { length?: number; width?: number }) => {
                if (cartItems.find(item => item.id === id)) {
                  handleUpdateDimensions(id, dimensions);
                }
              } : handleUpdateDimensions}
              onUpdateNotes={selectedOrder ? (id: string, notes: string) => {
                if (cartItems.find(item => item.id === id)) {
                  handleUpdateNotes(id, notes);
                }
              } : handleUpdateNotes}
              onCheckout={selectedOrder ? () => {
                // If we have new items to add to the existing order
                if (cartItems.length > 0) {
                  handleAddItemsToOrder();
                }
              } : handleCheckout}
              isProcessing={isProcessing}
              mode={selectedOrder ? 'order_edit' : 'cart'}
              orderNumber={selectedOrder?.daily_order_number?.toString() || selectedOrder?.order_number}
              isReadOnly={selectedOrder?.status === 'completed'}
            />
          </div>
          <TodayOrdersColumn
            onOrderSelect={handleOrderSelect}
            selectedOrderId={selectedOrder?.id.toString()}
            isOrderViewMode={!!selectedOrder}
            onNewOrder={() => {
              setSelectedOrder(null);
              setCartItems([]);
              setSelectedCustomerId(null);
              setSelectedCategoryId(null);
              setSelectedProductType(null);
              setSelectedOfferingId(null);
              setSelectedTableId(' ');
              setOrderType('in_house');
            }}
          />


        </div>
      </main>

      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onOpenChange={setIsCustomerModalOpen}
        onSuccess={(customer) => {
          setSelectedCustomerId(customer.id.toString());
          queryClient.invalidateQueries({ queryKey: ['customersForSelect'] });
        }}
      />

      <TodayOrders
        isOpen={isTodayOrdersOpen}
        onOpenChange={setIsTodayOrdersOpen}
        onOrderSelect={handleOrderSelect}
        selectedOrderId={selectedOrder?.id.toString()}
      />

      <PdfPreviewDialog
        isOpen={isPdfDialogOpen}
        onOpenChange={setIsPdfDialogOpen}
        pdfUrl={selectedOrder ? `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/orders/${selectedOrder.id}/pos-invoice-pdf` : null}
        title={t("paymentReceipt", { ns: "orders", defaultValue: "Payment Receipt" })}
        fileName={`receipt-${selectedOrder?.id || 'order'}.pdf`}
        widthClass="w-[300px]"
      />

      {/* Payment Modal */}
      {can("order:record-payment") && (
        <RecordPaymentModal
          order={selectedOrder}
          isOpen={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          onOrderUpdate={(updatedOrder) => setSelectedOrder(updatedOrder)}
        />
      )}

      {/* Payment Calculator */}
      <PaymentCalculator
        isOpen={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
        dateFrom={today}
        dateTo={today}
      />
    </div>
  );
};

export default POSPage; 