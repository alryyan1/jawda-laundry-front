import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from 'uuid';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNewOrder } from "@/context/NewOrderContext";
import { useDate } from "@/context/DateContext";

import type { ProductType, ServiceOffering, OrderItemFormLine, NewOrderFormData, Order, PricingStrategy } from '@/types';
import type { DiningTable } from '@/types/dining.types';
import { CategoryColumn } from '@/features/pos/components/CategoryColumn';
import { ProductColumn } from '@/features/pos/components/ProductColumn';
import { ProductListColumn } from '@/features/pos/components/ProductListColumn';
import { CartColumn } from '@/features/pos/components/CartColumn';
import { ActionsComponent } from '@/features/pos/components/ActionsComponent';
import { type CartItem } from '@/features/pos/components/CartItem';
import { CustomerFormModal } from '@/features/pos/components/CustomerFormModal';
import { TodayOrders } from '@/features/pos/components/TodayOrders';
import { TodayOrdersColumn } from '@/features/pos/components/TodayOrdersColumn';
import { POSHeader } from '@/features/pos/components/POSHeader';
import PdfPreviewDialog from '@/features/orders/components/PdfDialog';
import { RecordPaymentModal } from '@/features/orders/components/RecordPaymentModal';
import PaymentCalculator from '@/components/shared/PaymentCalculator';
import { createOrder, getTodayOrders, updateOrder, updateOrderDetails, deleteOrderItem, cancelOrder, markOrderReceived, updateOrderItemDimensions, updateOrderItemQuantity, updateOrderItemNotes } from "@/api/orderService";
import apiClient from "@/lib/axios";
import type { OrderResponseWithWarnings } from "@/api/orderService";
import { handleOrderResponse } from "@/utils/warningHandler";
import { getAllServiceOfferingsForSelect } from "@/api/serviceOfferingService";
import { getDiningTables, updateDiningTableStatus } from "@/api/diningTableService";
 
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import settingService from "@/services/settingService";
import { getTodayDate } from "@/lib/dateUtils";


import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ShoppingCart,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";





const POSPage: React.FC = () => {
  const { t } = useTranslation(["common", "orders"]);
  const queryClient = useQueryClient();
  const { can } = useAuth();
  const { newlyCreatedOrder, clearNewlyCreatedOrder } = useNewOrder();
  const { selectedDate } = useDate();
  
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

  // Clear selected order when the date changes via POSDatePicker
  useEffect(() => {
    setSelectedOrder(null);
  }, [selectedDate]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string>(' ');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'in_house' | 'take_away' | 'delivery'>('in_house');

  const [isProcessing, setIsProcessing] = useState(false);
  
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
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  
  const [isNarrow, setIsNarrow] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 800 : false);
  const [isCartDialogOpen, setIsCartDialogOpen] = useState(false);

  // Get today's date for statistics (using local timezone)
  const today = getTodayDate(); // YYYY-MM-DD format

  // Removed customer-specific pricing rules usage

  // Fetch all service offerings for order creation (fallback)
  const { data: allServiceOfferings = [] } = useQuery<ServiceOffering[], Error>({
    queryKey: ["allServiceOfferingsForSelect"],
    queryFn: () => getAllServiceOfferingsForSelect(),
    staleTime: 5 * 60 * 1000,
  });

  // Always use general service offerings
  const serviceOfferingsToUse = allServiceOfferings;

  // Fetch dining tables for in-house orders
  useQuery<DiningTable[], Error>({
    queryKey: ["diningTables"],
    queryFn: getDiningTables,
  });

  // Fetch settings to determine POS display options
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: settingService.getSettings,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch orders for the selected date
  useQuery<Order[], Error>({
    queryKey: ["todayOrders", selectedDate],
    queryFn: () => getTodayOrders(selectedDate),
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
        
        // Auto-show PDF when order is created
        setIsPdfDialogOpen(true);
      }
    },
    onError: (error) => {
      console.error('Failed to create order:', error);
      toast.error(t("failedToCreateOrder", { ns: "orders" }));
      setIsProcessing(false);
    },
  });

  

  // Function to update order item dimensions in database
  const updateOrderItemDimensionsInDB = async (orderItemId: string | number, dimensions: { length_meters?: number | null; width_meters?: number | null }) => {
    try {
      const data = await updateOrderItemDimensions(orderItemId, dimensions);
      
      // Update the selected order with the new total
      if (selectedOrder) {
        setSelectedOrder(prev => prev ? { ...prev, total_amount: data.order_total } : null);
      }
      
      // Update the cart item with the new dimensions and subtotal
      setCartItems(prev => prev.map(item => {
        if (item._isExistingOrderItem && selectedOrder) {
          // Find the corresponding order item in the selected order
          const orderItem = selectedOrder.items?.find(oi => 
            oi.serviceOffering?.id === item.serviceOffering.id &&
            oi.quantity === item.quantity
          );
          
          if (orderItem && orderItem.id.toString() === orderItemId.toString()) {
            return {
              ...item,
              length_meters: data.order_item.length_meters || undefined,
              width_meters: data.order_item.width_meters || undefined,
              _quotedSubTotal: data.order_item.sub_total,
              price: data.order_item.calculated_price_per_unit_item,
            };
          }
        }
        return item;
      }));
      
      toast.success(t("dimensionsUpdatedSuccessfully", { ns: "orders", defaultValue: "Dimensions updated successfully" }));
    } catch {
      toast.error(t("failedToUpdateDimensions", { ns: "orders", defaultValue: "Failed to update dimensions" }));
    }
  };

  // Function to update order item quantity in database
  const updateOrderItemQuantityInDB = async (orderItemId: string | number, quantity: number) => {
    try {
      const data = await updateOrderItemQuantity(orderItemId, quantity);
      
      // Update the selected order with the new total
      if (selectedOrder) {
        setSelectedOrder(prev => prev ? { ...prev, total_amount: data.order_total } : null);
      }
      
      // Update the cart item with the new quantity and subtotal
      setCartItems(prev => prev.map(item => {
        if (item._isExistingOrderItem && selectedOrder) {
          // Find the corresponding order item in the selected order
          const orderItem = selectedOrder.items?.find(oi => 
            oi.serviceOffering?.id === item.serviceOffering.id &&
            oi.quantity === item.quantity
          );
          
          if (orderItem && orderItem.id.toString() === orderItemId.toString()) {
            return {
              ...item,
              quantity: data.order_item.quantity,
              _quotedSubTotal: data.order_item.sub_total,
              price: data.order_item.calculated_price_per_unit_item,
            };
          }
        }
        return item;
      }));
      
      toast.success(t("quantityUpdatedSuccessfully", { ns: "orders", defaultValue: "Quantity updated successfully" }));
    } catch {
      toast.error(t("failedToUpdateQuantity", { ns: "orders", defaultValue: "Failed to update quantity" }));
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedProductType(null);
  };

  const handleSelectProduct = (product: ProductType) => {
    // Prevent adding items to received orders
    if (selectedOrder?.received) {
      toast.error(t("orderReceivedCannotEdit", { ns: "orders", defaultValue: "This order is received and cannot be edited" }));
      return;
    }

    // Check if we have a customer (either from order or selected customer)
    // But allow adding items without customer in new order mode
    const hasCustomer = selectedOrder?.customer || selectedCustomerId;
    if (!hasCustomer && !isNewOrderMode) {
      toast.error(t("orderNeedsCustomer", { ns: "orders", defaultValue: "Please select a customer for this order before adding items" }));
      return;
    }

    setSelectedProductType(product);
    
    // Check if product has only one service offering and auto-add to cart
    const productOfferings = serviceOfferingsToUse.filter(
      offering => offering.product_type_id === product.id
    );
    
    if (productOfferings.length === 1 && (hasCustomer || isNewOrderMode)) {
      const offering = productOfferings[0];
      // Add to backend first, then show in cart
      handleAddItemToBackend(product, offering);
    } else if (productOfferings.length > 1 && (hasCustomer || isNewOrderMode)) {
      // Show dialog for multiple service offerings
      setSelectedProductForDialog(product);
      setIsServiceOfferingDialogOpen(true);
    } else if (isIpadView && (hasCustomer || isNewOrderMode)) {
      // For iPad view, switch to product view when category is selected
      setShowCategoriesOnIpad(false);
    }
  };

  // Remove handleSelectOffering function since it's no longer needed
  // const handleSelectOffering = (offering: ServiceOffering) => { ... };

  const handleRemoveItem = async (id: string) => {
    // Find the item to check if it's an existing order item
    const item = cartItems.find(cartItem => cartItem.id === id);
    
    if (!item) {
      console.error('Item not found in cart:', id);
      return;
    }

    console.log('Removing item:', {
      id,
      isExistingOrderItem: item._isExistingOrderItem,
      selectedOrder: selectedOrder?.id,
      serviceOfferingId: item.serviceOffering?.id,
      quantity: item.quantity
    });

    // Set loading state immediately for all items
    setCartItems(prev => prev.map(cartItem => 
      cartItem.id === id ? { ...cartItem, _isDeleting: true } : cartItem
    ));

    try {
      // If it's an existing order item, delete from backend first
      if (item._isExistingOrderItem && item._orderItemId) {
        console.log('Deleting order item from backend:', item._orderItemId);
        
        // Delete from backend using stored order item ID
        const response = await deleteOrderItem(item._orderItemId);
        
        console.log('Backend response:', response);
        
        // Update the selected order with the updated order from backend
        setSelectedOrder(response.order);
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
        
        toast.success(t("itemRemovedFromOrder", { ns: "orders", defaultValue: "Item removed from order successfully" }));
      } else {
        console.log('Item is not an existing order item, removing from cart only');
      }
      
      // Remove from cart only on success (for both existing and new items)
      setCartItems(prev => prev.filter(cartItem => cartItem.id !== id));
      
    } catch (error) {
      console.error('Failed to remove item from order:', error);
      toast.error(t("failedToRemoveItem", { ns: "orders", defaultValue: "Failed to remove item from order" }));
      
      // Remove loading state on error
      setCartItems(prev => prev.map(cartItem => 
        cartItem.id === id ? { ...cartItem, _isDeleting: false } : cartItem
      ));
    }
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));

    // Find the cart item
    const item = cartItems.find(cartItem => cartItem.id === id);
    if (!item) return;

    // If this is an existing order item, save quantity to database
    if (item._isExistingOrderItem && item._orderItemId) {
      // Save quantity to database using stored order item ID
      updateOrderItemQuantityInDB(item._orderItemId, quantity);
    }

    // No quoting. Price remains as default, backend recalculates on save when needed.
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

    // Find the cart item
    const item = cartItems.find(cartItem => cartItem.id === id);
    if (!item) return;

    // If this is an existing order item, save dimensions to database
    if (item._isExistingOrderItem && item._orderItemId) {
      // Save dimensions to database using stored order item ID
      updateOrderItemDimensionsInDB(item._orderItemId, {
        length_meters: dimensions.length || null,
        width_meters: dimensions.width || null,
      });
    }

    // No quoting. Price remains as default, backend recalculates on save when needed.
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setCartItems(prev => prev.map(item =>
      item.id === id ? { ...item, notes } : item
    ));
  };

  const handleSaveNotesToBackend = async (orderItemId: string | number, notes: string) => {
    try {
      // Update the order item notes in the backend
      const response = await updateOrderItemNotes(orderItemId, notes);
      
      // Update the selected order with the new data
      if (selectedOrder) {
        setSelectedOrder(prev => prev ? { ...prev, items: response.order.items } : null);
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
      
    } catch (error) {
      console.error('Failed to save notes to backend:', error);
      toast.error(t("failedToSaveNotes", { ns: "orders", defaultValue: "Failed to save notes" }));
    }
  };

  const handleUpdateCompositions = (id: string, excludedIds: number[]) => {
    setCartItems(prev => prev.map(item =>
      item.id === id ? { ...item, excludedCompositionIds: excludedIds } : item
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
      const cartItemsFromOrder: CartItem[] = order.items.map((item, index) => ({
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
        _isExistingOrderItem: true, // Mark as existing order item
        _orderItemId: item.id, // Store the original order item ID
        _addedAt: Date.now() - (order.items.length - index) * 1000, // Assign timestamps in reverse order (newest first)
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
    // Prevent adding items to received orders
    if (selectedOrder?.received) {
      toast.error(t("orderReceivedCannotEdit", { ns: "orders", defaultValue: "This order is received and cannot be edited" }));
      setIsServiceOfferingDialogOpen(false);
      setSelectedProductForDialog(null);
      return;
    }

    // Check if we have a customer (either from order or selected customer)
    // But allow adding items without customer in new order mode
    const hasCustomer = selectedOrder?.customer || selectedCustomerId;
    if (!hasCustomer && !isNewOrderMode) {
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
    // BUT only if we're not in new order mode
    if (selectedOrder && !selectedOrder.customer && customerId && !isNewOrderMode) {
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
      // If we're in new order mode, just set the selected customer locally
      // Don't create an order yet - wait for items to be added
      setSelectedCustomerId(customerId);
      // Don't create order here - order will be created when items are added
    }
    queryClient.invalidateQueries({ queryKey: ['customersForSelect'] });
  };



  const handleAddItemToBackend = async (product: ProductType, offering: ServiceOffering) => {
    // If no order is selected, create a new order without customer (new order mode)
    if (!selectedOrder) {
      // Create a new order without customer
      const newOrderData = {
        customer_id: '', // Empty string for no customer
        items: [], // Empty items array for new order
        order_type: orderType,
        dining_table_id: selectedTableId ? parseInt(selectedTableId) : null,
      };
      
      try {
        const response = await createOrder(newOrderData, allServiceOfferings);
        const createdOrder = handleOrderResponse(response, t("orderCreatedSuccessfully", { ns: "orders" }));
        
        // Set the newly created order as selected
        setSelectedOrder(createdOrder);
        
        // Now add the item to the newly created order
        await handleAddItemToBackend(product, offering);
        return;
      } catch (error) {
        console.error('Failed to create new order:', error);
        toast.error(t("failedToCreateOrder", { ns: "orders" }));
        return;
      }
    }

    // Create a temporary cart item with loading state
    const tempItemId = uuidv4();
    const tempItem: CartItem = {
      id: tempItemId,
      productType: product,
      serviceOffering: offering,
      quantity: 1,
      price: offering.default_price || 0,
      _isQuoting: false,
      _isAdding: true, // Flag to show loading state
      _addedAt: Date.now(), // Add timestamp for sorting
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
            _isExistingOrderItem: true, // Mark as existing order item since it's now saved to backend
            _orderItemId: newOrderItem.id, // Store the original order item ID
            _addedAt: Date.now(), // Add timestamp for sorting
          };
          return [...filtered, realCartItem];
        }
        return filtered;
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      
    } catch (error) {
      console.error('Failed to add item to order:', error);
      toast.error(t("failedToAddItem", { ns: "orders", defaultValue: "Failed to add item to order" }));
      
      // Remove the temporary item on error
      setCartItems(prev => prev.filter(item => item.id !== tempItemId));
    }
  };




  const handleCheckout = async () => {
          // If we have a selected order, we should receive it instead of creating a new one
      if (selectedOrder) {
        // Receive the selected order
        await handleReceiveOrder();
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

  const handleReceiveOrder = async () => {
    if (!selectedOrder) {
      toast.error(t("noOrderSelected", { ns: "orders", defaultValue: "No order selected" }));
      return;
    }

    // Prevent receiving already received orders
    if (selectedOrder.received) {
      toast.error(t("orderAlreadyReceived", { ns: "orders", defaultValue: "This order is already received" }));
      return;
    }

    // Check if order has a customer (required for receiving)
    if (!selectedOrder.customer) {
      toast.error(t("orderNeedsCustomer", { ns: "orders", defaultValue: "Please select a customer for this order before receiving it" }));
      return;
    }

    console.log('Receiving order - backend will recalculate total from order items');
    
    // Mark order as received - backend will recalculate total from order items
    try {
      setIsProcessing(true);
      
      // Use the markOrderReceived endpoint - backend will recalculate total from order items
      const response = await markOrderReceived(selectedOrder.id);
      
      // Update the selected order with the received status
      setSelectedOrder(response.order);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
      
      toast.success(t("orderReceivedSuccessfully", { ns: "orders", defaultValue: "Order received successfully" }));
      
      // Auto-show PDF when order is received
      setIsPdfDialogOpen(true);

      // Auto-send WhatsApp notifications based on settings
      if (settings) {
        // Auto-send WhatsApp invoice if enabled
        if (settings.pos_auto_send_whatsapp_invoice && response.order.customer?.phone) {
          try {
            await apiClient.post(`/orders/${response.order.id}/send-whatsapp-invoice`);
            toast.success(t("invoiceSentSuccessfully", { ns: "orders", defaultValue: "Invoice sent successfully via WhatsApp" }));
          } catch (error) {
            console.error('Failed to auto-send WhatsApp invoice:', error);
            toast.error(t("failedToSendInvoice", { ns: "orders", defaultValue: "Failed to send invoice" }));
          }
        }

        // // Auto-send WhatsApp text if enabled
        // if (settings.pos_auto_send_whatsapp_text && response.order.customer?.phone) {
        //   try {
        //     await apiClient.post(`/orders/${response.order.id}/send-whatsapp-message`, {
        //       message: `Hello ${response.order.customer.name}, your order #${response.order.id} is ready for pickup. Thank you for choosing our service!`
        //     });
        //     toast.success(t("messageSentSuccessfully", { ns: "orders", defaultValue: "Message sent successfully via WhatsApp" }));
        //   } catch (error) {
        //     console.error('Failed to auto-send WhatsApp message:', error);
        //     toast.error(t("failedToSendMessage", { ns: "orders", defaultValue: "Failed to send WhatsApp message" }));
        //   }
        // }
      }
    } catch (error) {
      console.error('Failed to receive order:', error);
      toast.error(t("failedToReceiveOrder", { ns: "orders", defaultValue: "Failed to receive order" }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) {
      toast.error(t("noOrderSelected", { ns: "orders", defaultValue: "No order selected" }));
      return;
    }

    // Check if order is received (can only cancel received orders)
    if (!selectedOrder.received) {
      toast.error(t("orderNotReceived", { ns: "orders", defaultValue: "Only received orders can be cancelled" }));
      return;
    }

    try {
      setIsProcessing(true);
      
      // Use the dedicated cancel order endpoint
      const response = await cancelOrder(selectedOrder.id);
      
      // Update the selected order with the cancelled status
      setSelectedOrder(response.order);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
      
      toast.success(t("orderCancelledSuccessfully", { ns: "orders", defaultValue: "Order cancelled successfully" }));
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error(t("failedToCancelOrder", { ns: "orders", defaultValue: "Failed to cancel order" }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!selectedOrder) {
      toast.error(t("noOrderSelected", { ns: "orders", defaultValue: "No order selected" }));
      return;
    }

    try {
      setIsSendingInvoice(true);
      
      // Call the backend API to send WhatsApp invoice
      const response = await apiClient.post(`/orders/${selectedOrder.id}/send-whatsapp-invoice`);
      
      toast.success(t("invoiceSentSuccessfully", { ns: "orders", defaultValue: "Invoice sent successfully via WhatsApp" }), {
        description: response.data?.message
      });
    } catch (error: unknown) {
      console.error('Failed to send invoice:', error);
      
      // Extract detailed error message from backend response
      const errorResponse = error as { response?: { data?: { details?: string; message?: string } } };
      const errorMessage = errorResponse?.response?.data?.details || 
                          errorResponse?.response?.data?.message || 
                          (error as Error)?.message || 
                          t("failedToSendInvoice", { ns: "orders", defaultValue: "Failed to send invoice" });
      
      toast.error(t("failedToSendInvoice", { ns: "orders", defaultValue: "Failed to send invoice" }), {
        description: errorMessage
      });
    } finally {
      setIsSendingInvoice(false);
    }
  };

  // Removed quoting logic; prices use service offering defaults.

  // Effect to detect iPad screen size
  useEffect(() => {
    const checkIpadView = () => {
      const width = window.innerWidth;
      // iPad screens are typically 768px to 1024px wide
      const isIpad = width >= 768 && width <= 1024;
      setIsIpadView(isIpad);
      setIsNarrow(width < 800);
    };

    checkIpadView();
    window.addEventListener('resize', checkIpadView);
    return () => window.removeEventListener('resize', checkIpadView);
  }, []);

  // Global keyboard event listener for Enter key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if Enter is pressed and not in a text input/textarea
      if (event.key === 'Enter' && !event.shiftKey) {
        const target = event.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';
        
        if (!isInput) {
          event.preventDefault();
          
          // Only trigger checkout if we have items and not processing
          if (cartItems.length > 0 && !isProcessing) {
            if (selectedOrder) {
              handleReceiveOrder();
            } else {
              handleCheckout();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems.length, isProcessing, selectedOrder]);

  return (
    <div style={{
      userSelect: 'none',
    }} className="flex flex-col h-[calc(100vh-64px)]  ">
               <POSHeader
          selectedCustomerId={selectedCustomerId}
          onCustomerSelected={handleCustomerSelected}
          onNewCustomerClick={() => setIsCustomerModalOpen(true)}
          selectedOrder={selectedOrder}
          onCalculatorClick={() => setIsCalculatorOpen(true)}
          onOrderSelect={setSelectedOrder}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={setSelectedCategoryId}
          isNewOrderMode={isNewOrderMode}
          onOrderUpdate={(updatedOrder) => setSelectedOrder(updatedOrder)}
          orderType={orderType}
          onOrderTypeChange={setOrderType}
        />

      {/* Narrow screens: open Cart in a dialog */}
      {isNarrow && (
        <div className="px-2 pt-1 flex items-center gap-2">
          {isIpadView && !showCategoriesOnIpad && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleBackToCategories}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToCategories", { ns: "common", defaultValue: "Back to Categories" })}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCartDialogOpen(true)}
            disabled={cartItems.length === 0}
            className="flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            {t("viewCart", { ns: "orders", defaultValue: "View Cart" })}
            {cartItems.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">{cartItems.length}</Badge>
            )}
          </Button>
        </div>
      )}

      <main className="flex-1  mt-1 overflow-hidden">
        <div className="flex gap-2 h-full">
          {/* Show product columns only when a customer is selected */}
          {(selectedCustomerId || selectedOrder?.customer) ? (
            <>
              {/* iPad Layout */}
              {isIpadView ? (
                <>
                  {/* Categories View */}
                  {showCategoriesOnIpad && (
                    <div   className="flex-1">
                      <div className=" h-full">
                        <CategoryColumn
                          onSelectCategory={(categoryId) => {
                            setSelectedCategoryId(categoryId);
                            setShowCategoriesOnIpad(false);
                          }}
                          selectedCategoryId={selectedCategoryId}
                          selectedCustomerId={selectedCustomerId}
                          enabled={!isNewOrderMode} // Don't fetch categories when creating new order
                        />
                      </div>
                    </div>
                  )}

                  {/* Products and Cart View */}
                  {!showCategoriesOnIpad && (
                    <div className="relative flex-1 flex gap-2">
                    <>
                      {/* Back Button overlay removed; handled in narrow controls row */}
                       
 
 
                                              {/* Products */}
                       <div className="flex-1 flex flex-col p-1">
                           {selectedOrder?.received ? (
                             // Show ActionsComponent when order is received
                             <ActionsComponent
                               order={selectedOrder}
                               onPaymentClick={() => setIsPaymentModalOpen(true)}
                               onInvoiceClick={handleSendInvoice}
                               onPdfClick={() => setIsPdfDialogOpen(true)}
                               isProcessing={isProcessing}
                               isSendingInvoice={isSendingInvoice}
                               onOrderUpdate={(updatedOrder) => setSelectedOrder(updatedOrder)}
                             />
                           ) : (
                             // Show ProductColumn when order is not received
                             <>
                               {settings?.pos_show_products_as_list ? (
                                 <ProductListColumn
                                   categoryId={selectedCategoryId}
                                   onSelectProduct={handleSelectProduct}
                                   activeProductId={selectedProductType?.id.toString()}
                                   cartItems={cartItems}
                                 />
                               ) : (
                                 <ProductColumn
                                   categoryId={selectedCategoryId}
                                   onSelectProduct={handleSelectProduct}
                                   activeProductId={selectedProductType?.id.toString()}
                                   cartItems={cartItems}
                                 />
                               )}
                             </>
                           )}
                       </div>

                      {/* Cart - Only show when wide enough and there are items */}
                      {!isNarrow && cartItems.length > 0 && (
                        <div className="flex-1">
                          <div className="p-1 h-full">
                          <CartColumn
                            items={cartItems}
                            onRemoveItem={handleRemoveItem}
                            onUpdateQuantity={handleUpdateQuantity}
                            onUpdateDimensions={handleUpdateDimensions}
                            onUpdateNotes={handleUpdateNotes}
                            onUpdateCompositions={handleUpdateCompositions}
                            onSaveNotesToBackend={handleSaveNotesToBackend}
                            onCheckout={selectedOrder ? handleReceiveOrder : handleCheckout}
                            onCancelOrder={selectedOrder?.received ? handleCancelOrder : undefined}
                            isProcessing={isProcessing}
                            mode={selectedOrder ? 'order_edit' : 'cart'}
                            isReadOnly={selectedOrder?.received}
                            isReceived={selectedOrder?.received === true}
                            paymentStatus={selectedOrder?.payment_status}
                          />
                          </div>
                        </div>
                      )}
                    </>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Desktop Layout */}
                  {/* Left Section: Categories */}
                  <div className="w-[160px] flex-shrink-0 ">
                    <div className="p-1 h-full">
                  <CategoryColumn
                    onSelectCategory={handleSelectCategory}
                    selectedCategoryId={selectedCategoryId}
                    enabled={!isNewOrderMode} // Don't fetch categories when creating new order
                  />
                    </div>
                  </div>

              {/* Middle Section: Products and Services */}
              <div className="flex-1 flex gap-2 min-h-0 mx-2 relative">
                                 {/* Products */}
                     <div className="flex-1 flex flex-col ">
                       <div className="flex-1 min-h-0 p-1">
                         <div className="flex-1 min-h-0">
                           {selectedOrder?.received ? (
                             // Show ActionsComponent when order is received
                             <ActionsComponent
                               order={selectedOrder}
                               onPaymentClick={() => setIsPaymentModalOpen(true)}
                               onInvoiceClick={handleSendInvoice}
                               onPdfClick={() => setIsPdfDialogOpen(true)}
                               isProcessing={isProcessing}
                               isSendingInvoice={isSendingInvoice}
                               onOrderUpdate={(updatedOrder) => setSelectedOrder(updatedOrder)}
                             />
                           ) : (
                             // Show ProductColumn when order is not completed
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
                                   cartItems={cartItems}
                                 />
                               )}
                             </>
                           )}
                         </div>
                       </div>
                     </div>

                {/* Removed ServiceOfferingColumn - now handled by dialog */}
              </div>
              

           
                           {/* Right Section: Cart - Only show when wide enough and there are items */}
                           {!isNarrow && cartItems.length > 0 && (
                             <div className="w-[400px] flex-shrink-0 ">
                               <div className="p-1 h-full">
                             <CartColumn
                               items={cartItems}
                               onRemoveItem={handleRemoveItem}
                               onUpdateQuantity={handleUpdateQuantity}
                               onUpdateDimensions={handleUpdateDimensions}
                               onUpdateNotes={handleUpdateNotes}
                               onUpdateCompositions={handleUpdateCompositions}
                               onSaveNotesToBackend={handleSaveNotesToBackend}
                               onCheckout={selectedOrder ? handleReceiveOrder : handleCheckout}
                               onCancelOrder={selectedOrder?.received ? handleCancelOrder : undefined}
                               isProcessing={isProcessing}
                               mode={selectedOrder ? 'order_edit' : 'cart'}
                               isReadOnly={selectedOrder?.received}
                                isReceived={selectedOrder?.received === true}
                               paymentStatus={selectedOrder?.payment_status}
                                                          />
                                 </div>
                             </div>
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
                    {t("noOrderSelected", { ns: "orders", defaultValue: "No Order Selected or Create New Order" })}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t("selectOrderToStart", { ns: "orders", defaultValue: "Please select an existing order or create a new one to start adding items" })}
                  </p>
                  <div className="flex flex-col gap-2 items-center">
                    <p className="text-sm text-muted-foreground">
                      {t("useOrderSelection", { ns: "orders", defaultValue: "Use the order selection in the header or create a new order" })}
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
          // Only update the selected order with the newly created customer if not in new order mode
          if (selectedOrder && !isNewOrderMode) {
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
        <DialogContent className="max-w-md border-2 border-sky-400">
          <DialogHeader>
            <DialogTitle className="text-lg">
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
                  className="w-full justify-start text-left h-auto p-4 border-2 border-sky-300 text-base"
                  onClick={() => handleServiceOfferingSelect(offering)}
                >
                  <div className="flex flex-col items-start">
                    <div className="font-medium text-base">{offering.display_name}</div>
                  </div>
                </Button>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cart Dialog for narrow screens */}
      <Dialog open={isCartDialogOpen} onOpenChange={setIsCartDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("cart", { ns: "orders", defaultValue: "Cart" })}</DialogTitle>
          </DialogHeader>
          <div className="p-1">
            <CartColumn
              items={cartItems}
              onRemoveItem={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateDimensions={handleUpdateDimensions}
              onUpdateNotes={handleUpdateNotes}
              onUpdateCompositions={handleUpdateCompositions}
              onSaveNotesToBackend={handleSaveNotesToBackend}
              onCheckout={selectedOrder ? handleReceiveOrder : handleCheckout}
              onCancelOrder={selectedOrder?.received ? handleCancelOrder : undefined}
              isProcessing={isProcessing}
              mode={selectedOrder ? 'order_edit' : 'cart'}
              isReadOnly={selectedOrder?.received}
              isReceived={selectedOrder?.received === true}
              paymentStatus={selectedOrder?.payment_status}
            />
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default POSPage; 