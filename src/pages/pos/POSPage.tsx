import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from 'uuid';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNewOrder } from "@/context/NewOrderContext";

import type { ProductType, ServiceOffering, OrderItemFormLine, NewOrderFormData, QuoteItemPayload, QuoteItemResponse, Order, PricingStrategy } from '@/types';
import type { DiningTable } from '@/types/dining.types';
import { CategoryColumn } from '@/features/pos/components/CategoryColumn';
import { ProductColumn } from '@/features/pos/components/ProductColumn';
import { ProductListColumn } from '@/features/pos/components/ProductListColumn';
import { CartColumn } from '@/features/pos/components/CartColumn';
import { CustomerFormModal } from '@/features/pos/components/CustomerFormModal';
import { TodayOrders } from '@/features/pos/components/TodayOrders';
import { TodayOrdersColumn } from '@/features/pos/components/TodayOrdersColumn';
import { POSHeader } from '@/features/pos/components/POSHeader';
import PdfPreviewDialog from '@/features/orders/components/PdfDialog';
import { RecordPaymentModal } from '@/features/orders/components/RecordPaymentModal';
import PaymentCalculator from '@/components/shared/PaymentCalculator';
import { createOrder, getOrderItemQuote, getTodayOrders, updateOrder, updateOrderDetails } from "@/api/orderService";
import apiClient from "@/lib/axios";
import type { OrderResponseWithWarnings } from "@/api/orderService";
import { handleOrderResponse } from "@/utils/warningHandler";
import { getAllServiceOfferingsForSelect } from "@/api/serviceOfferingService";
import { getDiningTables, updateDiningTableStatus } from "@/api/diningTableService";
import { useDebounce } from "@/hooks/useDebounce";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import settingService from "@/services/settingService";
import { getTodayDate } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";



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
  _isAdding?: boolean; // Flag to show loading state while adding to backend
}

const POSPage: React.FC = () => {
  const { t } = useTranslation(["common", "orders"]);
  const queryClient = useQueryClient();
  const { can } = useAuth();
  const { newlyCreatedOrder, clearNewlyCreatedOrder } = useNewOrder();
  
  // Initialize real-time updates
  useRealtimeUpdates();
  
  // Auto-select newly created order
  useEffect(() => {
    if (newlyCreatedOrder) {
      setSelectedOrder(newlyCreatedOrder);
      // Reset customer selection to show "required" state for new orders
      setSelectedCustomerId(null);
      // Clear cart for new orders
      setCartItems([]);
      // Set new order mode
      setIsNewOrderMode(true);
      clearNewlyCreatedOrder();
    }
  }, [newlyCreatedOrder, clearNewlyCreatedOrder]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
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
  const [isServiceOfferingDialogOpen, setIsServiceOfferingDialogOpen] = useState(false);
  const [selectedProductForDialog, setSelectedProductForDialog] = useState<ProductType | null>(null);
  const [isIpadView, setIsIpadView] = useState(false);
  const [showCategoriesOnIpad, setShowCategoriesOnIpad] = useState(true);
  const [isNewOrderMode, setIsNewOrderMode] = useState(false);
  const debouncedCartItems = useDebounce(cartItems, 500);

  // Get today's date for statistics (using local timezone)
  const today = getTodayDate(); // YYYY-MM-DD format

  // Fetch customer service offerings with pricing rules if customer is selected
  const { data: customerServiceOfferings = [] } = useQuery({
    queryKey: ["customerServiceOfferings", selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return [];
      
      try {
        // Get customer pricing rules with service offerings
        const pricingRulesResponse = await apiClient.get(`/customers/${selectedCustomerId}/pricing-rules`);
        const pricingRules = pricingRulesResponse.data.pricing_rules || [];
        
        // Convert pricing rules to ServiceOffering format
        const customerOfferings: ServiceOffering[] = pricingRules.map((rule: any) => ({
          id: rule.service_offering.id,
          product_type_id: rule.service_offering.product_type.id,
          service_action_id: rule.service_offering.service_action.id,
          name: rule.service_offering.name,
          display_name: rule.service_offering.name,
          description: rule.service_offering.description,
          default_price: rule.price,
          default_price_per_sq_meter: rule.price_per_sq_meter,
          is_active: true,
          serviceAction: rule.service_offering.service_action,
          productType: rule.service_offering.product_type,
          created_at: rule.created_at,
          updated_at: rule.updated_at,
        } as ServiceOffering));
        
        return customerOfferings;
      } catch (error) {
        console.error('Failed to fetch customer service offerings:', error);
        return [];
      }
    },
    enabled: !!selectedCustomerId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all service offerings for order creation (fallback)
  const { data: allServiceOfferings = [] } = useQuery<ServiceOffering[], Error>({
    queryKey: ["allServiceOfferingsForSelect"],
    queryFn: () => getAllServiceOfferingsForSelect(),
    staleTime: 5 * 60 * 1000,
  });

  // Determine which service offerings to use
  const serviceOfferingsToUse = selectedCustomerId && customerServiceOfferings.length > 0 
    ? customerServiceOfferings 
    : allServiceOfferings;

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



  const createOrderMutation = useMutation<OrderResponseWithWarnings, Error, NewOrderFormData>({
    mutationFn: (orderData: NewOrderFormData) => createOrder(orderData, allServiceOfferings),
    onSuccess: async (response) => {
      const createdOrder = handleOrderResponse(response, t("orderCreatedSuccessfully", { ns: "orders" }));
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
      
      // Clear the cart and reset selections - ensure cart is empty for new orders
      setCartItems([]);
      
      // Always reset customer selection to null for new orders to show "required" state
      // This ensures the customer selection component shows the animation and required state
      setSelectedCustomerId(null);
      
      setSelectedCategoryId(null);
      setSelectedProductType(null);
      setSelectedTableId(createdOrder.dining_table_id?.toString() || ' ');
      setOrderType(createdOrder.order_type);
      setIsProcessing(false);
      
      // Clear dialog state
      setSelectedProductForDialog(null);
      setIsServiceOfferingDialogOpen(false);
      setIsNewOrderMode(true); // Keep new order mode active
      
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
    // Prevent adding items to completed orders
    if (selectedOrder?.status === 'completed') {
      toast.error(t("orderCompletedCannotEdit", { ns: "orders", defaultValue: "This order is completed and cannot be edited" }));
      return;
    }

    // Check if we have a customer (either from order or selected customer)
    const hasCustomer = selectedOrder?.customer || selectedCustomerId;
    if (!hasCustomer) {
      toast.error(t("orderNeedsCustomer", { ns: "orders", defaultValue: "Please select a customer for this order before adding items" }));
      return;
    }

    setSelectedProductType(product);
    
    // Check if product has only one service offering and auto-add to cart
    const productOfferings = serviceOfferingsToUse.filter(
      offering => offering.product_type_id === product.id
    );
    
    if (productOfferings.length === 1 && hasCustomer) {
      const offering = productOfferings[0];
      // Add to backend first, then show in cart
      handleAddItemToBackend(product, offering);
    } else if (productOfferings.length > 1 && hasCustomer) {
      // Show dialog for multiple service offerings
      setSelectedProductForDialog(product);
      setIsServiceOfferingDialogOpen(true);
    } else if (isIpadView && hasCustomer) {
      // For iPad view, switch to product view when category is selected
      setShowCategoriesOnIpad(false);
    }
  };

  // Remove handleSelectOffering function since it's no longer needed
  // const handleSelectOffering = (offering: ServiceOffering) => { ... };

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
    setIsNewOrderMode(false); // Exit new order mode when selecting an existing order
    
    // Clear current cart items
    setCartItems([]);
    
    // Set customer if order has one
    if (order.customer) {
      setSelectedCustomerId(order.customer.id.toString());
    } else {
      setSelectedCustomerId(null);
    }
    
    // Set order type
    setOrderType(order.order_type);
    
    // Set table if order has one
    if (order.dining_table_id) {
      setSelectedTableId(order.dining_table_id.toString());
    } else {
      setSelectedTableId(' ');
    }
    
    // Convert order items to cart items and populate cart only if order has items
    if (order.items && order.items.length > 0) {
      const cartItemsFromOrder: CartItem[] = order.items.map(item => ({
        id: uuidv4(), // Generate new ID for cart item
        productType: {
          id: item.serviceOffering?.product_type_id || 0,
          product_category_id: item.serviceOffering?.productType?.product_category_id || 0,
          name: item.serviceOffering?.productType?.name || 'Unknown Product',
          is_dimension_based: item.serviceOffering?.productType?.is_dimension_based || false,
          is_active: item.serviceOffering?.productType?.is_active || true,
        } as ProductType,
        serviceOffering: item.serviceOffering || {} as ServiceOffering,
        quantity: item.quantity,
        price: item.calculated_price_per_unit_item,
        notes: item.notes || undefined,
        length_meters: item.length_meters || undefined,
        width_meters: item.width_meters || undefined,
        _isQuoting: false,
        _quotedSubTotal: item.sub_total,
      }));
      
      setCartItems(cartItemsFromOrder);
    }
    // If order has no items, cart remains empty (which is correct for new orders)
    
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

  const handleBackToCategories = () => {
    setShowCategoriesOnIpad(true);
    setSelectedProductType(null);
    // setSelectedOfferingId(null); // Removed this line
  };

  const handleServiceOfferingSelect = (offering: ServiceOffering) => {
    // Prevent adding items to completed orders
    if (selectedOrder?.status === 'completed') {
      toast.error(t("orderCompletedCannotEdit", { ns: "orders", defaultValue: "This order is completed and cannot be edited" }));
      setIsServiceOfferingDialogOpen(false);
      setSelectedProductForDialog(null);
      return;
    }

    // Check if we have a customer (either from order or selected customer)
    const hasCustomer = selectedOrder?.customer || selectedCustomerId;
    if (!hasCustomer) {
      toast.error(t("orderNeedsCustomer", { ns: "orders", defaultValue: "Please select a customer for this order before adding items" }));
      setIsServiceOfferingDialogOpen(false);
      setSelectedProductForDialog(null);
      return;
    }

    if (selectedProductForDialog) {
      // Add to backend first, then show in cart
      handleAddItemToBackend(selectedProductForDialog, offering);
      setIsServiceOfferingDialogOpen(false);
      setSelectedProductForDialog(null);
    }
  };

  const handleCustomerSelected = (customerId: string | null) => {
    setSelectedCustomerId(customerId);
    
    // If we have a selected order without a customer and a customer is selected, update it
    if (selectedOrder && !selectedOrder.customer && customerId) {
      // Update the existing order with the selected customer
      updateOrderDetails(selectedOrder.id, { customer_id: parseInt(customerId) })
        .then((updatedOrder) => {
          setSelectedOrder(updatedOrder);
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
          toast.success(t("customerAssignedToOrder", { ns: "orders", defaultValue: "Customer assigned to order successfully" }));
        })
        .catch((error) => {
          console.error('Failed to update order with customer:', error);
          toast.error(t("failedToAssignCustomer", { ns: "orders", defaultValue: "Failed to assign customer to order" }));
        });
    } else if (isNewOrderMode && customerId) {
      // If we're in new order mode, create a new order with the selected customer
      const newOrderData = {
        customer_id: customerId,
        items: [], // Empty items array for new order
        order_type: orderType,
        dining_table_id: selectedTableId ? parseInt(selectedTableId) : null,
      };
      createOrderMutation.mutate(newOrderData);
    }
    queryClient.invalidateQueries({ queryKey: ['customersForSelect'] });
  };



  const handleAddItemToBackend = async (product: ProductType, offering: ServiceOffering) => {
    if (!selectedOrder) {
      toast.error(t("noOrderSelected", { ns: "orders", defaultValue: "No order selected" }));
      return;
    }

    // Create a temporary cart item with loading state
    const tempItemId = uuidv4();
    const tempItem: CartItem = {
      id: tempItemId,
      productType: product,
      serviceOffering: offering,
      quantity: 1,
      price: product.is_dimension_based 
        ? offering.default_price_per_sq_meter || 0
        : offering.default_price || 0,
      _isQuoting: false,
      _isAdding: true, // Flag to show loading state
    };

    // Add temporary item to cart with loading state
    setCartItems(prev => [...prev, tempItem]);

    try {
      // Prepare the order data with existing items + new item
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

      const newItem = {
        id: tempItemId,
        service_offering_id: offering.id,
        product_type_id: product.id.toString(),
        service_action_id: offering.service_action_id.toString(),
        quantity: 1,
        notes: undefined,
        length_meters: undefined,
        width_meters: undefined,
        _derivedServiceOffering: offering,
        _pricingStrategy: (product.is_dimension_based ? 'dimension_based' : 'fixed') as PricingStrategy,
        _quoted_price_per_unit_item: tempItem.price,
        _quoted_sub_total: tempItem.price,
      };

      const orderData = {
        customer_id: selectedOrder.customer?.id?.toString() || '',
        items: [...existingItems, newItem],
        notes: selectedOrder.notes || undefined,
        due_date: selectedOrder.due_date || undefined,
        order_type: selectedOrder.order_type,
        dining_table_id: selectedOrder.dining_table_id,
      };

      // Call the updateOrder API to add item to the existing order
      const updatedOrder = await updateOrder(selectedOrder.id, orderData, allServiceOfferings);
      
      // Update the selected order with the new data
      setSelectedOrder(updatedOrder.order);
      
      // Remove the temporary item and add the real item from the updated order
      setCartItems(prev => {
        const filtered = prev.filter(item => item.id !== tempItemId);
        // Find the newly added item in the updated order
        const newOrderItem = updatedOrder.order.items?.find(item => 
          item.serviceOffering?.id === offering.id && 
          item.quantity === 1
        );
        
        if (newOrderItem) {
          const realCartItem: CartItem = {
            id: uuidv4(), // Generate new ID for cart item
            productType: {
              id: newOrderItem.serviceOffering?.product_type_id || 0,
              product_category_id: newOrderItem.serviceOffering?.productType?.product_category_id || 0,
              name: newOrderItem.serviceOffering?.productType?.name || 'Unknown Product',
              is_dimension_based: newOrderItem.serviceOffering?.productType?.is_dimension_based || false,
              is_active: newOrderItem.serviceOffering?.productType?.is_active || true,
            } as ProductType,
            serviceOffering: newOrderItem.serviceOffering || {} as ServiceOffering,
            quantity: newOrderItem.quantity,
            price: newOrderItem.calculated_price_per_unit_item,
            notes: newOrderItem.notes || undefined,
            length_meters: newOrderItem.length_meters || undefined,
            width_meters: newOrderItem.width_meters || undefined,
            _isQuoting: false,
            _quotedSubTotal: newOrderItem.sub_total,
          };
          return [...filtered, realCartItem];
        }
        return filtered;
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
      
      toast.success(t("itemAddedToOrder", { ns: "orders", defaultValue: "Item added to order successfully" }));
    } catch (error) {
      console.error('Failed to add item to order:', error);
      toast.error(t("failedToAddItem", { ns: "orders", defaultValue: "Failed to add item to order" }));
      
      // Remove the temporary item on error
      setCartItems(prev => prev.filter(item => item.id !== tempItemId));
    }
  };




  const handleCheckout = async () => {
    // If we have a selected order, we should complete it instead of creating a new one
    if (selectedOrder) {
      // Complete the selected order
      await handleCompleteOrder();
      return;
    }

    // Otherwise, create a new order (this should rarely happen now with the new workflow)
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

  const handleCompleteOrder = async () => {
    if (!selectedOrder) {
      toast.error(t("noOrderSelected", { ns: "orders", defaultValue: "No order selected" }));
      return;
    }

    // Prevent completing already completed orders
    if (selectedOrder.status === 'completed') {
      toast.error(t("orderAlreadyCompleted", { ns: "orders", defaultValue: "This order is already completed" }));
      return;
    }

    // Check if order has a customer (required for completion)
    if (!selectedOrder.customer) {
      toast.error(t("orderNeedsCustomer", { ns: "orders", defaultValue: "Please select a customer for this order before completing it" }));
      return;
    }

    // Complete the order directly (items are already in the backend)
    try {
      setIsProcessing(true);
      
      // Update the order status to completed
      const updatedOrder = await updateOrderDetails(selectedOrder.id, {
        status: 'completed',
        pickup_date: new Date().toISOString(),
      });

      // Update the selected order with the completed status
      setSelectedOrder(updatedOrder);
      
      // Clear the cart
      setCartItems([]);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
      
      toast.success(t("orderCompletedSuccessfully", { ns: "orders", defaultValue: "Order completed successfully" }));
      
      // Auto-show PDF if setting is enabled
      if (settings?.pos_auto_show_pdf) {
        setIsPdfDialogOpen(true);
      }
    } catch (error) {
      console.error('Failed to complete order:', error);
      toast.error(t("failedToCompleteOrder", { ns: "orders", defaultValue: "Failed to complete order" }));
    } finally {
      setIsProcessing(false);
    }
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

  // Effect to detect iPad screen size
  useEffect(() => {
    const checkIpadView = () => {
      const width = window.innerWidth;
      // iPad screens are typically 768px to 1024px wide
      const isIpad = width >= 768 && width <= 1024;
      setIsIpadView(isIpad);
    };

    checkIpadView();
    window.addEventListener('resize', checkIpadView);
    return () => window.removeEventListener('resize', checkIpadView);
  }, []);

  return (
    <div style={{
      userSelect: 'none',
    }} className="flex flex-col h-[calc(100vh-64px)]  mx-2">
               <POSHeader
          selectedCustomerId={selectedCustomerId}
          onCustomerSelected={handleCustomerSelected}
          onNewCustomerClick={() => setIsCustomerModalOpen(true)}
          selectedOrder={selectedOrder}
          orderType={orderType}
          onOrderTypeChange={setOrderType}
          selectedTableId={selectedTableId}
          onTableIdChange={setSelectedTableId}
          diningTables={diningTables}
          todayOrders={todayOrders}
          isProcessing={isProcessing}
          onCalculatorClick={() => setIsCalculatorOpen(true)}
          onPdfClick={() => setIsPdfDialogOpen(true)}
          onPaymentClick={() => setIsPaymentModalOpen(true)}
          onOrderSelect={setSelectedOrder}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={setSelectedCategoryId}
          isNewOrderMode={isNewOrderMode}
          onOrderUpdate={(updatedOrder) => setSelectedOrder(updatedOrder)}
        />

      <main className="flex-1 container mx-auto mt-1 overflow-hidden">
        <div className="flex gap-2 h-full">
          {/* Show product columns only when an order is selected */}
          {selectedOrder ? (
            <>
              {/* iPad Layout */}
              {isIpadView ? (
                <>
                  {/* Categories View */}
                  {showCategoriesOnIpad && (
                    <Card className="flex-1">
                      <CardContent className=" h-full">
                        <CategoryColumn
                          onSelectCategory={(categoryId) => {
                            setSelectedCategoryId(categoryId);
                            setShowCategoriesOnIpad(false);
                          }}
                          selectedCategoryId={selectedCategoryId}
                          selectedCustomerId={selectedCustomerId}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Products and Cart View */}
                  {!showCategoriesOnIpad && (
                    <div className="relative flex-1 flex gap-2">
                    <>
                      {/* Back Button */}
                      <div className="absolute top-4 left-4 z-10">
                        <Button
                          size="sm"
                          onClick={handleBackToCategories}
                          className="flex items-center gap-2"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          {t("backToCategories", { ns: "common", defaultValue: "Back to Categories" })}
                        </Button>
                      </div>
                      
                      {/* Show helpful message when order is selected but cart is empty (iPad) */}
                      {selectedOrder && cartItems.length === 0 && (
                        <div className="absolute top-4 right-4 bg-primary/10 border border-primary/20 rounded-lg p-3 max-w-xs z-10">
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                            <span>{t("addItemsToCart", { ns: "orders", defaultValue: "Add items to see cart" })}</span>
                          </div>
                        </div>
                      )}

                                             {/* Products */}
                       <Card className={`flex-1 flex flex-col ${selectedOrder?.status === 'completed' ? 'blur-sm pointer-events-none' : ''}`}>
                         <CardContent className="flex-1 min-h-0 p-0">
                           {selectedOrder?.status === 'completed' ? (
                             <div className="flex items-center justify-center h-full">
                               <div className="text-center">
                                 <div className="text-4xl mb-2">✅</div>
                                 <p className="text-muted-foreground">
                                   {t("orderCompleted", { ns: "orders", defaultValue: "Order Completed" })}
                                 </p>
                                 <p className="text-sm text-muted-foreground">
                                   {t("noMoreEdits", { ns: "orders", defaultValue: "No more edits allowed" })}
                                 </p>
                               </div>
                             </div>
                           ) : (
                             <>
                               {settings?.pos_show_products_as_list ? (
                                 <ProductListColumn
                                   categoryId={selectedCategoryId}
                                   onSelectProduct={handleSelectProduct}
                                   activeProductId={selectedProductType?.id.toString()}
                                   selectedCustomerId={selectedCustomerId}
                                   cartItems={cartItems}
                                 />
                               ) : (
                                 <ProductColumn
                                   categoryId={selectedCategoryId}
                                   onSelectProduct={handleSelectProduct}
                                   activeProductId={selectedProductType?.id.toString()}
                                   selectedCustomerId={selectedCustomerId}
                                   cartItems={cartItems}
                                 />
                               )}
                             </>
                           )}
                         </CardContent>
                       </Card>

                      {/* Cart - Only show when there are items or an order is selected */}
                      {(cartItems.length > 0 || selectedOrder) && (
                        <Card className="flex-1">
                          <CardContent className="p-1 h-full">
                          <CartColumn
                            items={cartItems}
                            onRemoveItem={handleRemoveItem}
                            onUpdateQuantity={handleUpdateQuantity}
                            onUpdateDimensions={handleUpdateDimensions}
                            onUpdateNotes={handleUpdateNotes}
                            onCheckout={selectedOrder ? handleCompleteOrder : handleCheckout}
                            isProcessing={isProcessing}
                            mode={selectedOrder ? 'order_edit' : 'cart'}
                            orderNumber={selectedOrder?.category_sequences_string || selectedOrder?.daily_order_number?.toString() || selectedOrder?.order_number}
                            isReadOnly={selectedOrder?.status === 'completed'}
                          />
                          </CardContent>
                        </Card>
                      )}
                    </>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Desktop Layout */}
                  {/* Left Section: Categories */}
                  <Card className="w-[100px] flex-shrink-0">
                    <CardContent className="p-1 h-full">
                  <CategoryColumn
                    onSelectCategory={handleSelectCategory}
                    selectedCategoryId={selectedCategoryId}
                    selectedCustomerId={selectedCustomerId}
                  />
                    </CardContent>
                  </Card>

              {/* Middle Section: Products and Services */}
              <div className="flex-1 flex gap-2 min-h-0 mx-2 relative">
                                 {/* Products */}
                     <Card className={`flex-1 flex flex-col ${selectedOrder?.status === 'completed' ? 'blur-sm pointer-events-none' : ''}`}>
                       <CardContent className="flex-1 min-h-0 p-1">
                   <div className="flex-1 min-h-0">
                     {selectedOrder?.status === 'completed' ? (
                       <div className="flex items-center justify-center h-full">
                         <div className="text-center">
                           <div className="text-4xl mb-2">✅</div>
                           <p className="text-muted-foreground">
                             {t("orderCompleted", { ns: "orders", defaultValue: "Order Completed" })}
                           </p>
                           <p className="text-sm text-muted-foreground">
                             {t("noMoreEdits", { ns: "orders", defaultValue: "No more edits allowed" })}
                           </p>
                         </div>
                       </div>
                     ) : (
                       <>
                         {settings?.pos_show_products_as_list ? (
                           <ProductListColumn
                             categoryId={selectedCategoryId}
                             onSelectProduct={handleSelectProduct}
                             activeProductId={selectedProductType?.id.toString()}
                             selectedCustomerId={selectedCustomerId}
                             cartItems={cartItems}
                           />
                         ) : (
                           <ProductColumn
                             categoryId={selectedCategoryId}
                             onSelectProduct={handleSelectProduct}
                             activeProductId={selectedProductType?.id.toString()}
                             selectedCustomerId={selectedCustomerId}
                             cartItems={cartItems}
                           />
                         )}
                       </>
                     )}
                   </div>
                       </CardContent>
                     </Card>

                {/* Removed ServiceOfferingColumn - now handled by dialog */}
              </div>
              
              {/* Show helpful message when order is selected but cart is empty */}
              {selectedOrder && cartItems.length === 0 && (
                <div className="absolute top-4 right-4 bg-primary/10 border border-primary/20 rounded-lg p-3 max-w-xs">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span>{t("addItemsToCart", { ns: "orders", defaultValue: "Add items to see cart" })}</span>
                  </div>
                </div>
              )}
           
                           {/* Right Section: Cart - Only show when there are items or an order is selected */}
                           {(cartItems.length > 0 || selectedOrder) && (
                             <Card className="w-[400px] flex-shrink-0">
                               <CardContent className="p-1 h-full">
                             <CartColumn
                               items={cartItems}
                               onRemoveItem={handleRemoveItem}
                               onUpdateQuantity={handleUpdateQuantity}
                               onUpdateDimensions={handleUpdateDimensions}
                               onUpdateNotes={handleUpdateNotes}
                               onCheckout={selectedOrder ? handleCompleteOrder : handleCheckout}
                               isProcessing={isProcessing}
                               mode={selectedOrder ? 'order_edit' : 'cart'}
                               orderNumber={selectedOrder?.category_sequences_string || selectedOrder?.daily_order_number?.toString() || selectedOrder?.order_number}
                               isReadOnly={selectedOrder?.status === 'completed'}
                                                          />
                                 </CardContent>
                             </Card>
                           )}
                  </>
              )}
            </>
                     ) : (
              /* No order selected - show empty state */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t("noOrderSelected", { ns: "orders", defaultValue: "No Order Selected" })}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t("selectOrderToStart", { ns: "orders", defaultValue: "Select an order from the right panel to start adding items" })}
                  </p>
                  <div className="flex flex-col gap-2 items-center">
              
                    <p className="text-sm text-muted-foreground">
                      {t("orSelectExistingOrder", { ns: "orders", defaultValue: "Or select an existing order from the right panel" })}
                    </p>
                  </div>
                </div>
              </div>
            )}



          {/* Today's Orders Column - Always visible */}
          <TodayOrdersColumn
            onOrderSelect={handleOrderSelect}
            selectedOrderId={selectedOrder?.id?.toString() || undefined}
          />
        </div>
      </main>

      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onOpenChange={setIsCustomerModalOpen}
        onSuccess={(customer) => {
          setSelectedCustomerId(customer.id.toString());
          // If we have a selected order without a customer, update it
          if (selectedOrder && !selectedOrder.customer) {
            // Update the existing order with the newly created customer
            updateOrderDetails(selectedOrder.id, { customer_id: customer.id })
              .then((updatedOrder) => {
                setSelectedOrder(updatedOrder);
                queryClient.invalidateQueries({ queryKey: ["orders"] });
                queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
                toast.success(t("customerAssignedToOrder", { ns: "orders", defaultValue: "Customer assigned to order successfully" }));
              })
              .catch((error) => {
                console.error('Failed to update order with customer:', error);
                toast.error(t("failedToAssignCustomer", { ns: "orders", defaultValue: "Failed to assign customer to order" }));
              });
          }
          queryClient.invalidateQueries({ queryKey: ['customersForSelect'] });
        }}
      />



      <TodayOrders
        isOpen={isTodayOrdersOpen}
        onOpenChange={setIsTodayOrdersOpen}
        onOrderSelect={handleOrderSelect}
        selectedOrderId={selectedOrder?.id?.toString() || undefined}
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

      {/* Service Offering Selection Dialog */}
      <Dialog open={isServiceOfferingDialogOpen} onOpenChange={setIsServiceOfferingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedProductForDialog && t("selectServiceOffering", { 
                ns: "common", 
                defaultValue: "Select Service Offering" 
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedProductForDialog && serviceOfferingsToUse
              .filter(offering => offering.product_type_id === selectedProductForDialog.id)
              .map((offering) => (
                <Button
                  key={offering.id}
                  className="w-full justify-start text-left h-auto p-4"
                  onClick={() => handleServiceOfferingSelect(offering)}
                >
                  <div className="flex flex-col items-start">
                    <div className="font-medium">{offering.display_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedProductForDialog.is_dimension_based 
                        ? `${offering.default_price_per_sq_meter || 0} ${t("perSqMeter", { ns: "common", defaultValue: "per sq meter" })}`
                        : `${offering.default_price || 0} ${t("perItem", { ns: "common", defaultValue: "per item" })}`
                      }
                    </div>
                  </div>
                </Button>
              ))}
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default POSPage; 