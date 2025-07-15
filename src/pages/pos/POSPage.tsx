import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from 'uuid';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { materialColors } from "@/lib/colors";

import type { ProductType, ServiceOffering, OrderItemFormLine, NewOrderFormData, QuoteItemPayload, QuoteItemResponse, Order } from '@/types';
import { CategoryColumn } from '@/features/pos/components/CategoryColumn';
import { ProductColumn } from '@/features/pos/components/ProductColumn';
import { ServiceOfferingColumn } from '@/features/pos/components/ServiceOfferingColumn';
import { CartColumn } from '@/features/pos/components/CartColumn';
import { CustomerSelection } from '@/features/pos/components/CustomerSelection';
import { CustomerFormModal } from '@/features/pos/components/CustomerFormModal';
import { TodayOrders } from '@/features/pos/components/TodayOrders';
import { TodayOrdersColumn } from '@/features/pos/components/TodayOrdersColumn';
import { createOrder, getOrderItemQuote } from "@/api/orderService";
import { getAllServiceOfferingsForSelect } from "@/api/serviceOfferingService";
import { useDebounce } from "@/hooks/useDebounce";

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

const POSPage: React.FC = () => {
  const { t } = useTranslation(["common", "orders"]);
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [lastQuotedInputs, setLastQuotedInputs] = useState<Record<string, string>>({});
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isTodayOrdersOpen, setIsTodayOrdersOpen] = useState(false);
  console.log(selectedOrder,'selectedOrder')
  const debouncedCartItems = useDebounce(cartItems, 500);

  // Fetch all service offerings for order creation
  const { data: allServiceOfferings = [] } = useQuery<ServiceOffering[], Error>({
    queryKey: ["allServiceOfferingsForSelect"],
    queryFn: () => getAllServiceOfferingsForSelect(),
    staleTime: 5 * 60 * 1000,
  });

  const createOrderMutation = useMutation({
    mutationFn: (orderData: NewOrderFormData) => createOrder(orderData, allServiceOfferings),
    onSuccess: () => {
      toast.success(t("orderCreatedSuccessfully", { ns: "orders" }));
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
      
      // Clear the cart and reset selections
      setCartItems([]);
      setSelectedCustomerId(null);
      setSelectedCategoryId(null);
      setSelectedProductType(null);
      setSelectedOfferingId(null);
      setIsProcessing(false);
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
    setSelectedProductType(product);
    setSelectedOfferingId(null); // Reset selected offering when product changes
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
    if (item && item.productType.is_dimension_based && selectedCustomerId && quantity > 0) {
      const lengthNum = item.length_meters || 0;
      const widthNum = item.width_meters || 0;
      
      if (lengthNum > 0 && widthNum > 0) {
        const quotePayload: QuoteItemPayload = {
          service_offering_id: item.serviceOffering.id,
          customer_id: selectedCustomerId,
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
    if (item && item.productType.is_dimension_based && selectedCustomerId && item.quantity > 0) {
      const lengthNum = dimensions.length || 0;
      const widthNum = dimensions.width || 0;
      
      if (lengthNum > 0 && widthNum > 0) {
        const quotePayload: QuoteItemPayload = {
          service_offering_id: item.serviceOffering.id,
          customer_id: selectedCustomerId,
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
      order_type: 'in_house', // Default to in_house
    };

    createOrderMutation.mutate(orderData);
  };

  // Effect for quoting items
  useEffect(() => {
    if (!debouncedCartItems || debouncedCartItems.length === 0 || !selectedCustomerId) return;

    debouncedCartItems.forEach((item) => {
      if (!item._isQuoting && item.quantity > 0) {
        let readyToQuote = true;
        const quotePayload: QuoteItemPayload = {
          service_offering_id: item.serviceOffering.id,
          customer_id: selectedCustomerId,
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
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Customer Selection Bar */}
      <div className="border-b shadow-sm bg-background" style={{ borderColor: materialColors.divider }}>
        <div className="container mx-auto px-4 py-1 flex justify-between items-center">
          <CustomerSelection
            selectedCustomerId={selectedCustomerId}
            onCustomerSelected={setSelectedCustomerId}
            onNewCustomerClick={() => setIsCustomerModalOpen(true)}
            disabled={!!selectedOrder}
            forcedCustomer={selectedOrder?.customer || null}
          />
        
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-4 min-h-0">
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
            <div className="flex-1 bg-background rounded-lg shadow-sm overflow-hidden flex flex-col min-w-[160px]">
              <h2 className="text-lg font-semibold p-4 border-b" style={{ borderColor: materialColors.divider }}>
                {t("product", { ns: "common" })}
              </h2>
              <div className="flex-1 min-h-0">
                <ProductColumn
                  categoryId={selectedCategoryId}
                  onSelectProduct={handleSelectProduct}
                  activeProductId={selectedProductType?.id.toString()}
                />
              </div>
            </div>

            {/* Services */}
            <div className="flex-1 bg-background rounded-lg shadow-sm overflow-hidden flex flex-col min-w-[160px]">
              <h2 className="text-lg font-semibold p-4 border-b" style={{ borderColor: materialColors.divider }}>
                {t("serviceOffering", { ns: "common" })}
              </h2>
              <div className="flex-1 min-h-0">
                <ServiceOfferingColumn
                  productType={selectedProductType}
                  onSelectOffering={handleSelectOffering}
                  disabled={!selectedCustomerId}
                  disabledMessage={t("selectCustomerFirst", { ns: "orders" })}
                  activeOfferingId={selectedOfferingId}
                />
              </div>
            </div>
          </div>

          {/* Today's Orders Column */}
       
          {/* Right Section: Cart */}
          <div className="w-[400px] bg-background rounded-lg shadow-sm overflow-hidden">
            {selectedOrder ? (
              <CartColumn
                items={selectedOrder.items?.map(item => ({
                  id: item.id.toString(),
                  productType: item.serviceOffering?.productType || {} as ProductType,
                  serviceOffering: item.serviceOffering || {} as ServiceOffering,
                  quantity: item.quantity,
                  price: item.calculated_price_per_unit_item,
                  notes: item.notes || undefined,
                  length_meters: item.length_meters || undefined,
                  width_meters: item.width_meters || undefined,
                  _quotedSubTotal: item.sub_total,
                })) || []}
                onRemoveItem={() => {}}
                onUpdateQuantity={() => {}}
                onUpdateDimensions={() => {}}
                onUpdateNotes={() => {}}
                onEditItem={() => {}}
                onCheckout={() => {}}
                isProcessing={false}
                mode="order_view"
                orderNumber={selectedOrder.daily_order_number?.toString() || selectedOrder.order_number}
              />
            ) : (
              <CartColumn
                items={cartItems}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                onUpdateDimensions={handleUpdateDimensions}
                onUpdateNotes={handleUpdateNotes}
                onEditItem={() => {}}
                onCheckout={handleCheckout}
                isProcessing={isProcessing}
                mode="cart"
              />
            )}
          </div>
          <TodayOrdersColumn
            onOrderSelect={handleOrderSelect}
            selectedOrderId={selectedOrder?.id.toString()}
            onNewOrder={() => {
              setSelectedOrder(null);
              setCartItems([]);
              setSelectedCustomerId(null);
              setSelectedCategoryId(null);
              setSelectedProductType(null);
              setSelectedOfferingId(null);
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
    </div>
  );
};

export default POSPage; 