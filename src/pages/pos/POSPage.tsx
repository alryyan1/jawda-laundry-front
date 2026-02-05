import React, { useState, useEffect } from "react";
import { BASE_URL } from "@/lib/constants";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useNewOrder } from "@/context/NewOrderContext";
import { useDate } from "@/context/DateContext";
import { useSearch } from "@/context/SearchContext";

import type {
  ProductType,
  ProductCategory,
  ServiceOffering,
  OrderItemFormLine,
  NewOrderFormData,
  Order,
} from "@/types";

import { CategoryColumn } from "@/features/pos/components/CategoryColumn";
import { ProductColumn } from "@/features/pos/components/ProductColumn";
import { ProductListColumn } from "@/features/pos/components/ProductListColumn";
import { CartColumn } from "@/features/pos/components/CartColumn";
import { ActionsComponent } from "@/features/pos/components/ActionsComponent";
import { type CartItem } from "@/features/pos/components/CartItem";
import { CustomerFormModal } from "@/features/pos/components/CustomerFormModal";
import { TodayOrders } from "@/features/pos/components/TodayOrders";
import { TodayOrdersColumn } from "@/features/pos/components/TodayOrdersColumn";
import { POSHeader } from "@/features/pos/components/POSHeader";
import PdfPreviewDialog from "@/features/orders/components/PdfDialog";
import { RecordPaymentModal } from "@/features/orders/components/RecordPaymentModal";
import PaymentCalculator from "@/components/shared/PaymentCalculator";
import {
  createOrder,
  updateOrder,
  deleteOrderItem,
  cancelOrder,
  markOrderReceived,
  getOrderById,
} from "@/api/orderService";
import apiClient from "@/lib/axios";
import type { OrderResponseWithWarnings } from "@/api/orderService";
import { handleOrderResponse } from "@/utils/warningHandler";
import { getAllServiceOfferingsForSelect } from "@/api/serviceOfferingService";
import { getProductCategories } from "@/api/productCategoryService";

import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import settingService from "@/services/settingService";
import { getTodayDate } from "@/lib/dateUtils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const POSPage: React.FC = () => {
  const { t } = useTranslation(["common", "orders"]);
  const queryClient = useQueryClient();
  const { selectedDate } = useDate();
  const { setSearchTerm } = useSearch();

  // Initialize real-time updates
  useRealtimeUpdates();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedProductType, setSelectedProductType] =
    useState<ProductType | null>(null);

  // Fetch product categories to check count
  const { data: allCategories = [] } = useQuery<ProductCategory[], Error>({
    queryKey: ["productCategories"],
    queryFn: getProductCategories,
    staleTime: 5 * 60 * 1000,
  });

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<
    "in_house" | "take_away" | "delivery"
  >("in_house");

  const [isProcessing, setIsProcessing] = useState(false);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isTodayOrdersOpen, setIsTodayOrdersOpen] = useState(false);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [pdfOrderId, setPdfOrderId] = useState<number | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isServiceOfferingDialogOpen, setIsServiceOfferingDialogOpen] =
    useState(false);
  const [selectedProductForDialog, setSelectedProductForDialog] =
    useState<ProductType | null>(null);
  const [isIpadView, setIsIpadView] = useState(false);
  const [showCategoriesOnIpad, setShowCategoriesOnIpad] = useState(true);
  const [isNewOrderMode, setIsNewOrderMode] = useState(false);
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [shouldAutoPrint, setShouldAutoPrint] = useState(false);
  const [isLoadingOrderItems, setIsLoadingOrderItems] = useState(false);

  // Use ref for cart items to avoid re-creating handlers
  const cartItemsRef = React.useRef(cartItems);

  // Get today's date for statistics (using local timezone)
  const today = getTodayDate(); // YYYY-MM-DD format

  // Fetch all service offerings for order creation
  const { data: allServiceOfferings = [] } = useQuery<ServiceOffering[], Error>(
    {
      queryKey: ["allServiceOfferingsForSelect"],
      queryFn: () => getAllServiceOfferingsForSelect(),
      staleTime: 5 * 60 * 1000,
    },
  );

  // Determine which service offerings to use
  const serviceOfferingsToUse = allServiceOfferings;

  // Fetch dining tables for in-house orders

  // Fetch settings to determine POS display options
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: settingService.getSettings,
    staleTime: 5 * 60 * 1000,
  });

  const createOrderMutation = useMutation<
    OrderResponseWithWarnings,
    Error,
    NewOrderFormData
  >({
    mutationFn: (orderData: NewOrderFormData) =>
      createOrder(orderData, allServiceOfferings),
    onSuccess: async (response) => {
      console.log("createOrderMutation onSuccess response:", response);
      const createdOrder = handleOrderResponse(
        response,
        t("orderCreatedSuccessfully", { ns: "orders" }),
      );
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
      console.log("createdOrder", createdOrder);
      // Clear the cart and reset selections - ensure cart is empty for new orders
      setCartItems([]);

      // Always reset customer selection to null for new orders to show "required" state
      // This ensures the customer selection component shows the animation and required state
      setSelectedCustomerId(null);

      setSelectedCategoryId(null);
      setSelectedProductType(null);
      // setOrderType(createdOrder.order_type);

      // Clear dialog state
      setSelectedProductForDialog(null);
      setIsServiceOfferingDialogOpen(false);
      setIsNewOrderMode(true); // Keep new order mode active

      // Automatically select the newly created order and receive it
      if (createdOrder) {
        try {
          // Set loading state while fetching order items
          setIsLoadingOrderItems(true);

          // Automatically receive the order after creation
          const receivedOrderResponse = await markOrderReceived(createdOrder.id);
          console.log("receivedOrderResponse", receivedOrderResponse);
          
          // Fetch the full order with items to populate cart
          const fullOrder = await getOrderById(receivedOrderResponse.order.id);
          
          // Update the selected order with the received status
          setSelectedOrder(fullOrder);

          // Set PDF order ID from received order to ensure PDF dialog has the correct order ID
          setPdfOrderId(fullOrder.id);

          // Populate cart items from the fetched order
          if (fullOrder.items && fullOrder.items.length > 0) {
            const cartItemsFromOrder: CartItem[] = fullOrder.items.map((item) => ({
              id: uuidv4(), // Generate new ID for cart item
              backendId: item.id.toString(), // Store backend ID
              productType: {
                id: item.serviceOffering?.product_type_id || 0,
                product_category_id:
                  item.serviceOffering?.productType?.product_category_id || 0,
                name: item.serviceOffering?.productType?.name || "Unknown Product",
                is_dimension_based:
                  item.serviceOffering?.productType?.is_dimension_based || false,
                is_active: item.serviceOffering?.productType?.is_active || true,
              } as ProductType,
              serviceOffering: item.serviceOffering || ({} as ServiceOffering),
              quantity: item.quantity,
              price: item.calculated_price_per_unit_item,
              notes: item.notes || undefined,
              length_meters: item.length_meters || undefined,
              width_meters: item.width_meters || undefined,
              _isQuoting: false,
              _quotedSubTotal: item.sub_total,
              _isExistingOrderItem: true, // Mark as existing order item
            }));
            setCartItems(cartItemsFromOrder);
          }

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          queryClient.invalidateQueries({ queryKey: ["todayOrders"] });

          toast.success(
            t("orderReceivedSuccessfully", {
              ns: "orders",
              defaultValue: "Order received successfully",
            }),
          );

          // Auto-show PDF when order is created and received with auto-print enabled
          setShouldAutoPrint(true);
          setIsPdfDialogOpen(true);

          // Auto-send WhatsApp notifications based on settings
          if (settings) {
            if (
              settings.pos_auto_send_whatsapp_invoice &&
              receivedOrderResponse.order.customer?.phone
            ) {
              try {
                await apiClient.post(
                  `/orders/${receivedOrderResponse.order.id}/send-whatsapp-invoice`,
                );
                toast.success(
                  t("invoiceSentSuccessfully", {
                    ns: "orders",
                    defaultValue: "Invoice sent successfully via WhatsApp",
                  }),
                );
              } catch (error) {
                console.error("Failed to auto-send WhatsApp invoice:", error);
                toast.error(
                  t("failedToSendInvoice", {
                    ns: "orders",
                    defaultValue: "Failed to send invoice",
                  }),
                );
              }
            }
          }
        } catch (error) {
          console.error("Failed to receive order after creation:", error);
          toast.error(
            t("failedToReceiveOrder", {
              ns: "orders",
              defaultValue: "Failed to receive order",
            }),
          );
          // Still show PDF dialog even if receive fails
          setSelectedOrder(createdOrder);
          setPdfOrderId(createdOrder.id);
          setIsPdfDialogOpen(true);
        } finally {
          setIsProcessing(false);
          setIsLoadingOrderItems(false);
        }
      } else {
        setIsProcessing(false);
      }
    },
    onError: (error) => {
      console.error("Failed to create order:", error);
      toast.error(t("failedToCreateOrder", { ns: "orders" }));
      setIsProcessing(false);
    },
  });

  const handleOrderSelect = React.useCallback(
    (order: Order | null) => {
      if (!order) {
        setSelectedOrder(null);
        setCartItems([]);
        setSelectedCustomerId(null);
        setSelectedCategoryId(null);
        setSearchTerm("");
        setIsNewOrderMode(true);
        return;
      }

      setSelectedOrder(order);
      setIsNewOrderMode(false); // Exit new order mode when selecting an existing order

      // Reset deleted items tracker
      setDeletedItemIds([]);

      // Clear current cart items
      setCartItems([]);

      // Set customer if order has one
      if (order.customer) {
        setSelectedCustomerId(order.customer.id.toString());
      } else if (order.customer_id) {
        setSelectedCustomerId(order.customer_id.toString());
      } else {
        setSelectedCustomerId(null);
      }

      // Set order type
      setOrderType(order.order_type);

      // Convert order items to cart items and populate cart only if order has items
      if (order.items && order.items.length > 0) {
        const cartItemsFromOrder: CartItem[] = order.items.map((item) => ({
          id: uuidv4(), // Generate new ID for cart item
          backendId: item.id.toString(), // Store backend ID
          productType: {
            id: item.serviceOffering?.product_type_id || 0,
            product_category_id:
              item.serviceOffering?.productType?.product_category_id || 0,
            name: item.serviceOffering?.productType?.name || "Unknown Product",
            is_dimension_based:
              item.serviceOffering?.productType?.is_dimension_based || false,
            is_active: item.serviceOffering?.productType?.is_active || true,
          } as ProductType,
          serviceOffering: item.serviceOffering || ({} as ServiceOffering),
          quantity: item.quantity,
          price: item.calculated_price_per_unit_item,
          notes: item.notes || undefined,
          length_meters: item.length_meters || undefined,
          width_meters: item.width_meters || undefined,
          _isQuoting: false,
          _quotedSubTotal: item.sub_total,
          _isExistingOrderItem: true, // Mark as existing order item
        }));

        setCartItems(cartItemsFromOrder);
      }
    },
    [setSearchTerm],
  );

  // Use ref for cart items to avoid re-creating handlers
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  const {
    newlyCreatedOrder,
    clearNewlyCreatedOrder,
    shouldCreateNewOrder,
    resetCreateNewOrderTrigger,
  } = useNewOrder();

  // Handle new order trigger (from keyboard shortcut or other context triggers)
  useEffect(() => {
    if (shouldCreateNewOrder) {
      handleOrderSelect(null);
      resetCreateNewOrderTrigger();
    }
  }, [shouldCreateNewOrder, handleOrderSelect, resetCreateNewOrderTrigger]);

  // Auto-select newly created order
  useEffect(() => {
    if (newlyCreatedOrder) {
      handleOrderSelect(newlyCreatedOrder);
      clearNewlyCreatedOrder();
    }
  }, [newlyCreatedOrder, clearNewlyCreatedOrder, handleOrderSelect]);

  // Clear selected order when the date changes via POSDatePicker
  useEffect(() => {
    setSelectedOrder(null);
  }, [selectedDate]);

  const handleReceiveOrder = React.useCallback(async () => {
    console.log("handleReceiveOrder");
    // alert("handleReceiveOrder");
    if (!selectedOrder) {
      toast.error(
        t("noOrderSelected", {
          ns: "orders",
          defaultValue: "No order selected",
        }),
      );
      // Reset auto-print flag if receive fails
      setShouldAutoPrint(false);
      return;
    }

    // Prevent receiving already received orders
    if (selectedOrder.received) {
      toast.error(
        t("orderAlreadyReceived", {
          ns: "orders",
          defaultValue: "This order is already received",
        }),
      );
      // Reset auto-print flag if receive fails
      setShouldAutoPrint(false);
      return;
    }

    // Check if order has a customer (required for receiving)
    if (!selectedOrder.customer && !selectedCustomerId) {
      toast.error(
        t("orderNeedsCustomer", {
          ns: "orders",
          defaultValue:
            "Please select a customer for this order before receiving it",
        }),
      );
      // Reset auto-print flag if receive fails
      setShouldAutoPrint(false);
      return;
    }

    // Check if cart has items (required for receiving)
    if (cartItems.length === 0) {
      toast.error(t("cartIsEmpty", { ns: "orders" }));
      // Reset auto-print flag if receive fails
      setShouldAutoPrint(false);
      return;
    }

    // Update order items and receive in one action
    try {
      setIsProcessing(true);

      // 1. Construct item payload from cart
      const orderItems: OrderItemFormLine[] = cartItems.map((item) => ({
        id: item.backendId || item.id,
        service_offering_id: item.serviceOffering.id,
        product_type_id: item.productType.id.toString(),
        service_action_id: item.serviceOffering.service_action_id.toString(),
        quantity: item.quantity,
        notes: item.notes,
        length_meters: item.length_meters,
        width_meters: item.width_meters,
        _derivedServiceOffering: item.serviceOffering,
        _pricingStrategy: item.productType.is_dimension_based
          ? "dimension_based"
          : "fixed",
        _quoted_price_per_unit_item: item.price,
        _quoted_sub_total: item._quotedSubTotal || item.price * item.quantity,
      }));

      // 2. Handle explicit deletions
      if (deletedItemIds.length > 0) {
        await Promise.all(deletedItemIds.map((id) => deleteOrderItem(id)));
        setDeletedItemIds([]);
      }

      // 3. Update order with cart items
      const orderData = {
        customer_id:
          selectedCustomerId || selectedOrder.customer?.id?.toString() || "",
        items: orderItems,
        notes: selectedOrder.notes || undefined,
        due_date: selectedOrder.due_date || undefined,
        order_type: orderType,
      };

      const updatedOrderResponse = await updateOrder(
        selectedOrder.id,
        orderData,
        allServiceOfferings,
      );

      setSelectedOrder(updatedOrderResponse.order);

      // 4. Mark order as received - backend will recalculate total from order items
      const response = await markOrderReceived(updatedOrderResponse.order.id);

      // Update the selected order with the received status
      setSelectedOrder(response.order);

      // Set PDF order ID to ensure PDF dialog has the correct order ID
      setPdfOrderId(response.order.id);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["todayOrders"] });

      toast.success(
        t("orderReceivedSuccessfully", {
          ns: "orders",
          defaultValue: "Order received successfully",
        }),
      );

      // Auto-show PDF when order is received with auto-print enabled
      setShouldAutoPrint(true);
      setIsPdfDialogOpen(true);

      // Auto-send WhatsApp notifications based on settings
      if (settings) {
        if (
          settings.pos_auto_send_whatsapp_invoice &&
          response.order.customer?.phone
        ) {
          try {
            await apiClient.post(
              `/orders/${response.order.id}/send-whatsapp-invoice`,
            );
            toast.success(
              t("invoiceSentSuccessfully", {
                ns: "orders",
                defaultValue: "Invoice sent successfully via WhatsApp",
              }),
            );
          } catch (error) {
            console.error("Failed to auto-send WhatsApp invoice:", error);
            toast.error(
              t("failedToSendInvoice", {
                ns: "orders",
                defaultValue: "Failed to send invoice",
              }),
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to receive order:", error);
      toast.error(
        t("failedToReceiveOrder", {
          ns: "orders",
          defaultValue: "Failed to receive order",
        }),
      );
      // Reset auto-print flag if receive fails
      setShouldAutoPrint(false);
    } finally {
      setIsProcessing(false);
    }
  }, [
    selectedOrder,
    selectedCustomerId,
    cartItems,
    deletedItemIds,
    orderType,
    allServiceOfferings,
    settings,
    queryClient,
    t,
  ]);

  const handleCheckout = React.useCallback(async () => {
    console.log("handleCheckout");
    // alert("handleCheckout");
    if (!selectedCustomerId && !selectedOrder?.customer) {
      toast.error(t("pleaseSelectCustomer", { ns: "orders" }));
      return;
    }

    if (cartItems.length === 0) {
      toast.error(t("cartIsEmpty", { ns: "orders" }));
      return;
    }

    setIsProcessing(true);

    try {
      // Construct item payload
      const orderItems: OrderItemFormLine[] = cartItems.map((item) => ({
        id: item.backendId || item.id, // Use backendId if available (for updates), otherwise UUID (for creates)
        service_offering_id: item.serviceOffering.id,
        product_type_id: item.productType.id.toString(),
        service_action_id: item.serviceOffering.service_action_id.toString(),
        quantity: item.quantity,
        notes: item.notes,
        length_meters: item.length_meters,
        width_meters: item.width_meters,
        _derivedServiceOffering: item.serviceOffering,
        _pricingStrategy: item.productType.is_dimension_based
          ? "dimension_based"
          : "fixed",
        _quoted_price_per_unit_item: item.price,
        _quoted_sub_total: item._quotedSubTotal || item.price * item.quantity,
      }));

      // If we have a selected order, update it first
      if (selectedOrder) {
        // alert("selectedOrder");
        // 1. Handle explicit deletions
        if (deletedItemIds.length > 0) {
          await Promise.all(deletedItemIds.map((id) => deleteOrderItem(id)));
          setDeletedItemIds([]);
        }

        // 2. Prepare update data
        const orderData = {
          customer_id:
            selectedCustomerId || selectedOrder.customer?.id?.toString() || "",
          items: orderItems,
          notes: selectedOrder.notes || undefined,
          due_date: selectedOrder.due_date || undefined,
          order_type: orderType,
        };

        // 3. Update order
        const updatedOrderResponse = await updateOrder(
          selectedOrder.id,
          orderData,
          allServiceOfferings,
        );

        setSelectedOrder(updatedOrderResponse.order);

        // 4. Proceed to receive with auto-print enabled
        setShouldAutoPrint(true);
        await handleReceiveOrder();
      } else {
        // Create new order
        const orderData: NewOrderFormData = {
          customer_id: selectedCustomerId!,
          items: orderItems,
          notes: undefined,
          due_date: undefined,
          order_type: orderType,
        };

        // Create order - PDF will auto-print via onSuccess callback
        createOrderMutation.mutate(orderData);
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error(
        t("checkoutFailed", {
          ns: "orders",
          defaultValue: "Failed to process order",
        }),
      );
      setIsProcessing(false);
    }
  }, [
    selectedCustomerId,
    selectedOrder,
    cartItems,
    deletedItemIds,
    orderType,
    allServiceOfferings,
    createOrderMutation,
    handleReceiveOrder,
    t,
  ]);

  // Function to update order item dimensions in database

  const handleSelectCategory = React.useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedProductType(null);
  }, []);

  // Remove handleSelectOffering function since it's no longer needed
  // const handleSelectOffering = (offering: ServiceOffering) => { ... };

  const handleRemoveItem = React.useCallback(
    (id: string) => {
      const item = cartItemsRef.current.find((cartItem) => cartItem.id === id);

      if (!item) {
        return;
      }

      // If it's an existing order item with a backend ID, mark it for deletion
      if (item.backendId) {
        setDeletedItemIds((prev) => [...prev, item.backendId!]);
      }

      // Remove from local cart state
      setCartItems((prev) => prev.filter((cartItem) => cartItem.id !== id));

      toast.success(
        t("itemRemovedFromOrder", {
          ns: "orders",
          defaultValue: "Item removed from order",
        }),
      );
    },
    [t],
  );

  const handleUpdateQuantity = React.useCallback(
    (id: string, quantity: number) => {
      // Update local state and calculate subtotal locally
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const unitPrice = item.price || 0;
            let subTotal = unitPrice * quantity;

            if (item.productType.is_dimension_based) {
              const length = item.length_meters || 0;
              const width = item.width_meters || 0;
              subTotal = length * width * quantity * unitPrice;
            }

            return {
              ...item,
              quantity,
              _quotedSubTotal: subTotal,
            };
          }
          return item;
        }),
      );
    },
    [],
  );

  const handleUpdateDimensions = React.useCallback(
    (id: string, dimensions: { length?: number; width?: number }) => {
      // Update local state and calculate subtotal locally
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const unitPrice = item.price || 0;
            const length = dimensions.length ?? item.length_meters ?? 0;
            const width = dimensions.width ?? item.width_meters ?? 0;
            const subTotal = length * width * item.quantity * unitPrice;

            return {
              ...item,
              length_meters: dimensions.length,
              width_meters: dimensions.width,
              _quotedSubTotal: subTotal,
            };
          }
          return item;
        }),
      );
    },
    [],
  );

  const handleUpdateNotes = (id: string, notes: string) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item)),
    );
  };

  const handleBackToCategories = () => {
    setShowCategoriesOnIpad(true);
    setSelectedProductType(null);
    // setSelectedOfferingId(null); // Removed this line
  };

  const handleCustomerSelected = React.useCallback(
    (customerId: string | null) => {
      setSelectedCustomerId(customerId);
      // Removed immediate backend call to updateOrderDetails.
      // Changes will be persisted duringCheckout for existing orders.
    },
    [],
  );

  const handleAddToCart = React.useCallback(
    (product: ProductType, offering: ServiceOffering) => {
      // Client-side logic for both New and Existing Orders
      const tempItemId = uuidv4();
      const newItem: CartItem = {
        id: tempItemId,
        productType: product,
        serviceOffering: offering,
        quantity: 1,
        price: product.is_dimension_based
          ? offering.default_price_per_sq_meter || 0
          : offering.default_price || 0,
        _isQuoting: false,
        _isAdding: false,
        // For new items, no backendId yet
        _isExistingOrderItem: false,
      };

      setCartItems((prev) => [...prev, newItem]);
      toast.success(t("itemAddedToOrder", { ns: "orders" }));
    },
    [t],
  );

  const handleSelectProduct = React.useCallback(
    (product: ProductType) => {
      // alert('ss')
      // Prevent adding items to received orders
      if (selectedOrder?.received) {
        toast.error(
          t("orderReceivedCannotEdit", {
            ns: "orders",
            defaultValue: "This order is received and cannot be edited",
          }),
        );
        return;
      }

      // Check if we have a customer (either from order or selected customer)
      const hasCustomer =
        selectedOrder?.customer ||
        selectedOrder?.customer_id ||
        selectedCustomerId;
      if (!hasCustomer) {
        toast.error(
          t("orderNeedsCustomer", {
            ns: "orders",
            defaultValue:
              "Please select a customer for this order before adding items",
          }),
        );
        return;
      }

      setSelectedProductType(product);

      // Check if product has only one service offering and auto-add to cart
      const productOfferings = serviceOfferingsToUse.filter(
        (offering) => offering.product_type_id === product.id,
      );
      console.log(productOfferings, "productOfferings");
      if (productOfferings.length === 1 && hasCustomer) {
        const offering = productOfferings[0];
        handleAddToCart(product, offering);
      } else if (productOfferings.length > 1 && hasCustomer) {
        // Show dialog for multiple service offerings
        setSelectedProductForDialog(product);
        setIsServiceOfferingDialogOpen(true);
      } else if (isIpadView && hasCustomer) {
        // For iPad view, switch to product view when category is selected
        setShowCategoriesOnIpad(false);
      }
    },
    [
      selectedOrder?.received,
      selectedOrder?.customer,
      selectedOrder?.customer_id,
      selectedCustomerId,
      t,
      serviceOfferingsToUse,
      isIpadView,
      handleAddToCart,
    ],
  );

  const handleServiceOfferingSelect = React.useCallback(
    (offering: ServiceOffering) => {
      // Prevent adding items to received orders
      if (selectedOrder?.received) {
        toast.error(
          t("orderReceivedCannotEdit", {
            ns: "orders",
            defaultValue: "This order is received and cannot be edited",
          }),
        );
        setIsServiceOfferingDialogOpen(false);
        setSelectedProductForDialog(null);
        return;
      }

      // Check if we have a customer
      const hasCustomer =
        selectedOrder?.customer ||
        selectedOrder?.customer_id ||
        selectedCustomerId;
      if (!hasCustomer) {
        toast.error(
          t("orderNeedsCustomer", {
            ns: "orders",
            defaultValue:
              "Please select a customer for this order before adding items",
          }),
        );
        setIsServiceOfferingDialogOpen(false);
        setSelectedProductForDialog(null);
        return;
      }

      if (selectedProductForDialog) {
        // Add to cart
        handleAddToCart(selectedProductForDialog, offering);
        setIsServiceOfferingDialogOpen(false);
        setSelectedProductForDialog(null);
      }
    },
    [
      selectedOrder,
      selectedCustomerId,
      selectedProductForDialog,
      handleAddToCart,
      t,
    ],
  );

  const handleCancelOrder = async () => {
    if (!selectedOrder) {
      toast.error(
        t("noOrderSelected", {
          ns: "orders",
          defaultValue: "No order selected",
        }),
      );
      return;
    }

    // Check if order is received (can only cancel received orders)
    if (!selectedOrder.received) {
      toast.error(
        t("orderNotReceived", {
          ns: "orders",
          defaultValue: "Only received orders can be cancelled",
        }),
      );
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

      toast.success(
        t("orderCancelledSuccessfully", {
          ns: "orders",
          defaultValue: "Order cancelled successfully",
        }),
      );
    } catch (error) {
      console.error("Failed to cancel order:", error);
      toast.error(
        t("failedToCancelOrder", {
          ns: "orders",
          defaultValue: "Failed to cancel order",
        }),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!selectedOrder) {
      toast.error(
        t("noOrderSelected", {
          ns: "orders",
          defaultValue: "No order selected",
        }),
      );
      return;
    }

    try {
      setIsSendingInvoice(true);

      // Call the backend API to send WhatsApp invoice
      const response = await apiClient.post(
        `/orders/${selectedOrder.id}/send-whatsapp-invoice`,
      );

      toast.success(
        t("invoiceSentSuccessfully", {
          ns: "orders",
          defaultValue: "Invoice sent successfully via WhatsApp",
        }),
        {
          description: response.data?.message,
        },
      );
    } catch (error: unknown) {
      console.error("Failed to send invoice:", error);

      // Extract detailed error message from backend response
      const errorResponse = error as {
        response?: { data?: { details?: string; message?: string } };
      };
      const errorMessage =
        errorResponse?.response?.data?.details ||
        errorResponse?.response?.data?.message ||
        (error as Error)?.message ||
        t("failedToSendInvoice", {
          ns: "orders",
          defaultValue: "Failed to send invoice",
        });

      toast.error(
        t("failedToSendInvoice", {
          ns: "orders",
          defaultValue: "Failed to send invoice",
        }),
        {
          description: errorMessage,
        },
      );
    } finally {
      setIsSendingInvoice(false);
    }
  };

  const handleSendWhatsAppText = async () => {
    if (!selectedOrder) {
      toast.error(
        t("noOrderSelected", {
          ns: "orders",
          defaultValue: "No order selected",
        }),
      );
      return;
    }

    if (!selectedOrder.customer?.phone) {
      toast.error(
        t("customerPhoneRequired", {
          ns: "orders",
          defaultValue:
            "Customer phone number is required to send WhatsApp message",
        }),
      );
      return;
    }

    try {
      setIsSendingMessage(true);

      // Call the backend API to send WhatsApp text message
      const response = await apiClient.post(
        `/orders/${selectedOrder.id}/send-whatsapp-message`,
        {
          message: `Hello ${selectedOrder.customer.name}, your order #${selectedOrder.id} is ready for pickup. Thank you for choosing our service!`,
        },
      );

      toast.success(
        t("messageSentSuccessfully", {
          ns: "orders",
          defaultValue: "Message sent successfully via WhatsApp",
        }),
        {
          description: response.data?.message,
        },
      );
    } catch (error: unknown) {
      console.error("Failed to send WhatsApp message:", error);

      // Extract detailed error message from backend response
      const errorResponse = error as {
        response?: { data?: { details?: string; message?: string } };
      };
      const errorMessage =
        errorResponse?.response?.data?.details ||
        errorResponse?.response?.data?.message ||
        (error as Error)?.message ||
        t("failedToSendMessage", {
          ns: "orders",
          defaultValue: "Failed to send WhatsApp message",
        });

      toast.error(
        t("failedToSendMessage", {
          ns: "orders",
          defaultValue: "Failed to send WhatsApp message",
        }),
        {
          description: errorMessage,
        },
      );
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Effect to detect iPad screen size
  useEffect(() => {
    const checkIpadView = () => {
      const width = window.innerWidth;
      // iPad screens are typically 768px to 1024px wide
      const isIpad = width >= 768 && width <= 1024;
      setIsIpadView(isIpad);
    };

    checkIpadView();
    window.addEventListener("resize", checkIpadView);
    return () => window.removeEventListener("resize", checkIpadView);
  }, []);

  // Global keyboard event listener for Enter key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if Enter is pressed and not in a text input/textarea
      if (event.key === "Enter" && !event.shiftKey) {
        const target = event.target as HTMLElement;
        const isInput =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.contentEditable === "true";

        if (!isInput) {
          event.preventDefault();

          // Only trigger checkout if we have items and not processing
          if (cartItems.length > 0 && !isProcessing) {
            if (selectedOrder) {
              // For existing orders: Update items and receive in one action
              setShouldAutoPrint(true);
              handleReceiveOrder();
            } else {
              // For new orders: Create order and receive it with auto-print
              setShouldAutoPrint(true);
              handleCheckout();
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cartItems.length,
    isProcessing,
    selectedOrder,
    handleReceiveOrder,
    handleCheckout,
  ]);

  return (
    <div
      style={{
        userSelect: "none",
      }}
      className="flex flex-col h-[calc(100vh-64px)]  mx-2"
    >
      <POSHeader
        selectedCustomerId={selectedCustomerId}
        onCustomerSelected={handleCustomerSelected}
        onNewCustomerClick={() => setIsCustomerModalOpen(true)}
        selectedOrder={selectedOrder}
        onCalculatorClick={() => setIsCalculatorOpen(true)}
        onPdfClick={() => setIsPdfDialogOpen(true)}
        onOrderSelect={handleOrderSelect}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
        isNewOrderMode={isNewOrderMode}
        onOrderUpdate={handleOrderSelect}
      />

      <main className="flex-1 container mx-auto mt-1 overflow-hidden">
        <div className="flex gap-2 h-full">
          {/* Show product columns when a customer is selected OR in new order mode */}
          {selectedCustomerId || selectedOrder?.customer || isNewOrderMode ? (
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
                            {t("backToCategories", {
                              ns: "common",
                              defaultValue: "Back to Categories",
                            })}
                          </Button>
                        </div>


                        {/* Products */}
                        <div className="flex-1 flex flex-col p-1">
                          {selectedOrder?.received ? (
                            // Show ActionsComponent when order is received
                            <ActionsComponent
                              order={selectedOrder}
                              onPaymentClick={() => {
                                if (!selectedOrder) {
                                  toast.error(
                                    t("noOrderSelected", {
                                      ns: "orders",
                                      defaultValue: "No order selected",
                                    }),
                                  );
                                  return;
                                }
                                setIsPaymentModalOpen(true);
                              }}
                              onInvoiceClick={handleSendInvoice}
                              onPdfClick={() => setIsPdfDialogOpen(true)}
                              onWhatsAppTextClick={handleSendWhatsAppText}
                              isProcessing={isProcessing}
                              isSendingInvoice={isSendingInvoice}
                              isSendingMessage={isSendingMessage}
                            />
                          ) : (
                            // Show ProductColumn when order is not received
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

                        {/* Cart - Always visible */}
                        <CartColumn
                          items={cartItems}
                          onRemoveItem={handleRemoveItem}
                          onUpdateQuantity={handleUpdateQuantity}
                          onUpdateDimensions={handleUpdateDimensions}
                          onUpdateNotes={handleUpdateNotes}
                          onCheckout={
                            selectedOrder
                              ? handleReceiveOrder
                              : handleCheckout
                          }
                          onCancelOrder={
                            selectedOrder?.received
                              ? handleCancelOrder
                              : undefined
                          }
                          isProcessing={isProcessing}
                          isLoading={isLoadingOrderItems}
                          mode={selectedOrder ? "order_edit" : "cart"}
                          orderNumber={
                            selectedOrder?.category_sequences_string ||
                            selectedOrder?.daily_order_number?.toString() ||
                            selectedOrder?.id?.toString()
                          }
                          isReadOnly={selectedOrder?.received}
                          isReceived={selectedOrder?.received === true}
                          paymentStatus={selectedOrder?.payment_status}
                        />
                      </>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Desktop Layout */}
                  {/* Left Section: Categories */}

                  {/* Desktop Layout */}
                  {/* Left Section: Categories - Only show if more than 1 category */}
                  {allCategories.length > 1 && (
                    <CategoryColumn
                      onSelectCategory={handleSelectCategory}
                      selectedCategoryId={selectedCategoryId}
                      selectedCustomerId={selectedCustomerId}
                    />
                  )}

                  {/* Middle Section: Products and Services */}
                  <div className="flex-1 flex gap-2 min-h-0 mx-2 relative">
                    {/* Products */}
                    <div className="flex-1 min-h-0">
                      {selectedOrder?.received ? (
                        // Show ActionsComponent when order is received
                        <ActionsComponent
                          order={selectedOrder}
                          onPaymentClick={() => {
                            if (!selectedOrder) {
                              toast.error(
                                t("noOrderSelected", {
                                  ns: "orders",
                                  defaultValue: "No order selected",
                                }),
                              );
                              return;
                            }
                            setIsPaymentModalOpen(true);
                          }}
                          onInvoiceClick={handleSendInvoice}
                          onPdfClick={() => setIsPdfDialogOpen(true)}
                          onWhatsAppTextClick={handleSendWhatsAppText}
                          isProcessing={isProcessing}
                          isSendingInvoice={isSendingInvoice}
                          isSendingMessage={isSendingMessage}
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
                              selectedCustomerId={selectedCustomerId}
                              cartItems={cartItems}
                            />
                          )}
                        </>
                      )}
                    </div>

                    {/* Removed ServiceOfferingColumn - now handled by dialog */}
                  </div>


                  {/* Right Section: Cart - Always visible */}
                  <CartColumn
                    items={cartItems}
                    onRemoveItem={handleRemoveItem}
                    onUpdateQuantity={handleUpdateQuantity}
                    onUpdateDimensions={handleUpdateDimensions}
                    onUpdateNotes={handleUpdateNotes}
                    onCheckout={handleCheckout}
                    onCancelOrder={
                      selectedOrder?.received ? handleCancelOrder : undefined
                    }
                    isProcessing={isProcessing}
                    isLoading={isLoadingOrderItems}
                    mode={selectedOrder ? "order_edit" : "cart"}
                    orderNumber={
                      selectedOrder?.category_sequences_string ||
                      selectedOrder?.daily_order_number?.toString() ||
                      selectedOrder?.id?.toString()
                    }
                    isReadOnly={selectedOrder?.received}
                    isReceived={selectedOrder?.received === true}
                    paymentStatus={selectedOrder?.payment_status}
                  />
                </>
              )}
            </>
          ) : (
            /* No customer selected - show empty state */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-lg font-semibold mb-2">
                  {t("noCustomerSelected", {
                    ns: "orders",
                    defaultValue: "No Customer Selected",
                  })}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t("selectCustomerToStart", {
                    ns: "orders",
                    defaultValue:
                      "Please select a customer to start adding items to your order",
                  })}
                </p>
                <div className="flex flex-col gap-2 items-center">
                  <p className="text-sm text-muted-foreground">
                    {t("useCustomerSelection", {
                      ns: "orders",
                      defaultValue:
                        "Use the customer selection in the header to choose a customer",
                    })}
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
          queryClient.invalidateQueries({ queryKey: ["customersForSelect"] });
          // Note: Backend assignment to existing orders is now handled at checkout
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
        onOpenChange={(open) => {
          setIsPdfDialogOpen(open);
          // Reset auto-print flag when dialog closes
          if (!open) {
            setShouldAutoPrint(false);
            setPdfOrderId(null);
          }
        }}
        pdfUrl={
          pdfOrderId || selectedOrder?.id
            ? `${BASE_URL.replace("/api", "")}/orders/${pdfOrderId || selectedOrder?.id}/pos-invoice-pdf`
            : null
        }
        title={t("paymentReceipt", {
          ns: "orders",
          defaultValue: "Payment Receipt",
        })}
        fileName={`receipt-${selectedOrder?.id || "order"}.pdf`}
        widthClass="w-[300px]"
        autoPrint={shouldAutoPrint}
      />

      {/* Payment Modal */}
      <RecordPaymentModal
        order={selectedOrder}
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        onOrderUpdate={(updatedOrder) => setSelectedOrder(updatedOrder)}
      />

      {/* Payment Calculator */}
      <PaymentCalculator
        isOpen={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
        dateFrom={today}
        dateTo={today}
      />

      {/* Service Offering Selection Dialog */}
      <Dialog
        open={isServiceOfferingDialogOpen}
        onOpenChange={setIsServiceOfferingDialogOpen}
      >
        <DialogContent className="max-w-md border-2 border-sky-400">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {selectedProductForDialog &&
                t("selectServiceOffering", {
                  ns: "common",
                  defaultValue: "Select Service Offering",
                })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedProductForDialog &&
              serviceOfferingsToUse
                .filter(
                  (offering) =>
                    offering.product_type_id === selectedProductForDialog.id,
                )
                .map((offering) => (
                  <Button
                    key={offering.id}
                    className="w-full justify-start text-left h-auto p-4 border-2 border-sky-300 text-base"
                    onClick={() => handleServiceOfferingSelect(offering)}
                  >
                    <div className="flex flex-col items-start">
                      <div className="font-medium text-base">
                        {offering.display_name}
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
