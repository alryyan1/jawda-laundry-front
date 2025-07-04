import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import type { ProductType, ServiceOffering, OrderItemFormLine, NewOrderFormData, QuoteItemPayload, QuoteItemResponse } from '@/types';
import { CategoryColumn } from '@/features/pos/components/CategoryColumn';
import { ProductColumn } from '@/features/pos/components/ProductColumn';
import { ServiceOfferingColumn } from '@/features/pos/components/ServiceOfferingColumn';
import { CartColumn } from '@/features/pos/components/CartColumn';
import { CustomerSelection } from '@/features/pos/components/CustomerSelection';
import { CustomerFormModal } from '@/features/pos/components/CustomerFormModal';
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastQuotedInputs, setLastQuotedInputs] = useState<Record<string, string>>({});
  const [isCategoryCollapsed, setIsCategoryCollapsed] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const debouncedCartItems = useDebounce(cartItems, 500);

  // Fetch all service offerings for order creation
  const { data: allServiceOfferings = [] } = useQuery<ServiceOffering[], Error>({
    queryKey: ["allServiceOfferingsForSelect"],
    queryFn: () => getAllServiceOfferingsForSelect(),
    staleTime: 5 * 60 * 1000,
  });

  const createOrderMutation = useMutation({
    mutationFn: (orderData: NewOrderFormData) => createOrder(orderData, allServiceOfferings),
    onSuccess: (response) => {
      toast.success(t("orderCreatedSuccessfully", { ns: "orders" }));
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      navigate(`/orders/${response.id}`);
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
    setIsCategoryCollapsed(true);
  };

  const handleShowCategories = () => {
    setIsCategoryCollapsed(false);
    setSelectedProductType(null); // Clear product selection when returning to categories
  };

  const handleSelectProduct = (product: ProductType) => {
    setSelectedProductType(product);
  };

  const handleSelectOffering = (offering: ServiceOffering) => {
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



  const handleNewOrder = () => {
    setSelectedCustomerId(null);
    setSelectedCategoryId(null);
    setSelectedProductType(null);
    setCartItems([]);
    setOrderNotes("");
    setDueDate("");
    toast.info(t("newOrderFormCleared", { ns: "orders" }));
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
      notes: orderNotes || undefined,
      due_date: dueDate || undefined,
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
    <div className="flex flex-col bg-muted">
 

      {/* Customer Selection Bar */}
      <div className="bg-background border-b">
        <CustomerSelection
          selectedCustomerId={selectedCustomerId}
          onCustomerSelected={setSelectedCustomerId}
          onNewCustomerClick={() => setIsCustomerModalOpen(true)}
        />
      </div>

      <main className="flex-1 overflow-hidden">
        <div className="h-full p-4 flex gap-4">
          {/* Left Section: Categories and Products */}
          <div className="flex-1 flex gap-4">
            {/* Category Column */}
            <CategoryColumn
              onSelectCategory={handleSelectCategory}
              selectedCategoryId={selectedCategoryId}
              isCollapsed={isCategoryCollapsed}
              onToggleCollapse={handleShowCategories}
            />

            {/* Product and Service Columns Container */}
            <div className={cn(
              "flex gap-4 transition-all duration-300",
              isCategoryCollapsed ? "flex-1" : "w-2/3"
            )}>
              {/* Show placeholder when no category is selected */}
              {!selectedCategoryId && (
                <div className="flex-1 bg-background rounded-lg shadow flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium">{t("selectCategoryFirst", { ns: "common" })}</p>
                    <p className="text-sm mt-2">{t("selectCategoryToViewProducts", { ns: "common", defaultValue: "Select a category to view available products" })}</p>
                  </div>
                </div>
              )}

              {/* Show products when category is selected */}
              {selectedCategoryId && (
                <>
                  <div className="flex-1 bg-background rounded-lg shadow">
                    <h2 className="text-lg font-semibold p-4 border-b">{t("product", { ns: "common" })}</h2>
                    <ScrollArea className="h-[calc(100vh-13rem)]">
                      <ProductColumn
                        categoryId={selectedCategoryId}
                        onSelectProduct={handleSelectProduct}
                      />
                    </ScrollArea>
                  </div>

                  {/* Show service offerings when product is selected */}
                  {selectedProductType ? (
                    <div className="flex-1 bg-background rounded-lg shadow">
                      <h2 className="text-lg font-semibold p-4 border-b">{t("serviceOffering", { ns: "common" })}</h2>
                      <ScrollArea className="h-[calc(100vh-13rem)]">
                        <ServiceOfferingColumn
                          productType={selectedProductType}
                          onSelectOffering={handleSelectOffering}
                          disabled={!selectedCustomerId}
                          disabledMessage={t("selectCustomerFirst", { ns: "orders" })}
                        />
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="flex-1 bg-background rounded-lg shadow flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <p className="text-lg font-medium">{t("selectProductFirst", { ns: "common" })}</p>
                        <p className="text-sm mt-2">{t("selectProductToViewServices", { ns: "common", defaultValue: "Select a product to view available services" })}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Section: Cart */}
          <div className="w-[400px] bg-background rounded-lg shadow">
            <CartColumn
              items={cartItems}
              onRemoveItem={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateDimensions={handleUpdateDimensions}
              onUpdateNotes={handleUpdateNotes}
              onUpdateOrderNotes={setOrderNotes}
              onUpdateDueDate={setDueDate}
              onNewOrder={handleNewOrder}
              orderNotes={orderNotes}
              dueDate={dueDate}
              onCheckout={handleCheckout}
              isProcessing={isProcessing}
            />
          </div>
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
    </div>
  );
};

export default POSPage; 