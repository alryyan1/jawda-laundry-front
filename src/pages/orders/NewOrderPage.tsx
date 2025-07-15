// src/pages/orders/NewOrderPage.tsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  FormProvider,
  useForm,
  useFieldArray,
} from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

// Layout & Child Components
import { OrderCart } from "@/features/orders/components/wizard/OrderCart";
import { StepCustomer } from "@/features/orders/components/wizard/StepCustomer";
import { StepCategory } from "@/features/orders/components/wizard/StepCategory";
import { StepProductType } from "@/features/orders/components/wizard/StepProductType";
import { StepServiceOffering } from "@/features/orders/components/wizard/StepServiceOffering";

// Schema, Types, and Services
import type {
  NewOrderFormData,
  ServiceOffering,
  Order,
  ProductType,
  OrderItemFormLine,
  QuoteItemPayload,
  QuoteItemResponse,
} from "@/types";
import { getAllServiceOfferingsForSelect } from "@/api/serviceOfferingService";
import { createOrder, getOrderItemQuote } from "@/api/orderService";
import { useDebounce } from "@/hooks/useDebounce";

export type WizardStep =
  | "CUSTOMER"
  | "CATEGORY"
  | "PRODUCT"
  | "SERVICE"
  | "EDIT_ITEM";

const NewOrderPage: React.FC = () => {
  const { t } = useTranslation(["common", "orders", "services", "validation"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- State Management for UI flow ---
  const [currentStep, setCurrentStep] = useState<WizardStep>("CUSTOMER");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [selectedProductType, setSelectedProductType] =
    useState<ProductType | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [lastQuotedInputs, setLastQuotedInputs] = useState<
    Record<string, string>
  >({}); // State to prevent re-quoting

  // --- Form Setup ---
  const methods = useForm<NewOrderFormData>({
    defaultValues: { customer_id: "", table_id: null, items: [], notes: "", due_date: "" },
  });
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
  } = methods;

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  });
  const watchedAllItems = watch("items");
  const watchedCustomerId = watch("customer_id");
  const debouncedWatchedItems = useDebounce(watchedAllItems, 500);

  // --- Data Fetching ---
  const { data: allServiceOfferings = [] } = useQuery<
    ServiceOffering[],
    Error
  >({
    queryKey: ["allServiceOfferingsForSelect"],
    queryFn: () => getAllServiceOfferingsForSelect(),
  });

  // --- Mutations ---
  const createOrderMutation = useMutation<Order, Error, NewOrderFormData>({
    mutationFn: (formData) => createOrder(formData, allServiceOfferings),
    onSuccess: (data) => {
      toast.success(t('orderCreatedSuccess', { ns: 'orders', orderNumber: data.order_number }));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate(`/orders/${data.id}`);
    },
    onError: (error) => { toast.error(error.message || t('orderCreationFailed', { ns: 'orders' })); }
  });
  
  const quoteItemMutation = useMutation<
    QuoteItemResponse,
    Error,
    { itemIndex: number; payload: QuoteItemPayload }
  >({
    mutationFn: async ({ payload }) => getOrderItemQuote(payload),
    onSuccess: (data, variables) => {
      setValue(
        `items.${variables.itemIndex}._quoted_price_per_unit_item`,
        data.calculated_price_per_unit_item
      );
      setValue(
        `items.${variables.itemIndex}._quoted_sub_total`,
        data.sub_total
      );
      setValue(
        `items.${variables.itemIndex}._quoted_applied_unit`,
        data.applied_unit
      );
      setValue(`items.${variables.itemIndex}._isQuoting`, false);
      setValue(`items.${variables.itemIndex}._quoteError`, null);
    },
    onError: (error, variables) => {
      setValue(`items.${variables.itemIndex}._isQuoting`, false);
      setValue(`items.${variables.itemIndex}._quoted_sub_total`, null);
      setValue(
        `items.${variables.itemIndex}._quoteError`,
        error.message || t("quoteFailedForItemGeneric", { ns: "orders" })
      );
    },
  });

  // --- Logic & Handlers ---
  const resetSelectionFlow = () => {
    setCurrentStep("CATEGORY");
    setSelectedCategoryId(null);
    setSelectedProductType(null);
    setEditingItemIndex(null);
  };

  // NEW: Handles adding a single item directly on click
  const handleAddItemsToCart = (offeringIds: string[]) => {
    const newItems: OrderItemFormLine[] = [];
    offeringIds.forEach(id => {
      const offering = allServiceOfferings.find(
        (o) => o.id.toString() === id
      );
      if (!offering || !offering.productType) return;

      const alreadyInCart = watchedAllItems.some(
        (item) => item._derivedServiceOffering?.id === offering.id
      );
      if (alreadyInCart) {
        toast.info(
          `"${offering.display_name}" ${t("isAlreadyInOrder", { ns: "orders" })}`
        );
        return;
      }

      const newItem: OrderItemFormLine = {
        id: uuidv4(),
        service_offering_id: offering.id,
        product_type_id: offering.product_type_id.toString(),
        service_action_id: offering.service_action_id.toString(),
        quantity: 1,
        _derivedServiceOffering: offering,
        _pricingStrategy: offering.productType.is_dimension_based
          ? "dimension_based"
          : "fixed",
        product_description_custom: "",
        length_meters: "",
        width_meters: "",
        notes: "",
        _isQuoting: false,
        _quoteError: null,
        _quoted_price_per_unit_item: null,
        _quoted_sub_total: null,
        _quoted_applied_unit: null,
      };

      newItems.push(newItem);
    });

    if (newItems.length > 0) {
      append(newItems);
      toast.success(
        `${newItems.length} item(s) ${t("addedToOrder", {
          ns: "orders",
          defaultValue: "added to order.",
        })}`
      );
    }
    // We no longer reset the flow, so user can add more services for the same product.
  };

  // Other handlers remain the same
  const handleCustomerSelected = (customerId: string) => {
    if (customerId) setCurrentStep("CATEGORY");
  };
  const handleCategorySelected = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setCurrentStep("PRODUCT");
  };
  const handleProductTypeSelected = (productType: ProductType) => {
    setSelectedProductType(productType);
    setCurrentStep("SERVICE");
  };
  const handleEditItem = (index: number) => {
    const item = getValues(`items.${index}`);
    if (!item || !item._derivedServiceOffering?.productType) return;
    setEditingItemIndex(index);
    setSelectedCategoryId(item._derivedServiceOffering.productType.product_category_id.toString());
    setSelectedProductType(item._derivedServiceOffering.productType);
    setCurrentStep('EDIT_ITEM');
  };
  const handleUpdateItem = (
    index: number,
    updatedItemData: Partial<OrderItemFormLine>
  ) => {
    update(index, { ...getValues(`items.${index}`), ...updatedItemData });
    resetSelectionFlow();
  };
  const handleResetOrder = () => {
    reset();
    setCurrentStep('CUSTOMER');
    setSelectedCategoryId(null);
    setSelectedProductType(null);
    setEditingItemIndex(null);
    toast.info(t('newOrderFormCleared', { ns: 'orders' }));
  };
  const onSubmit = (data: NewOrderFormData) => {
    createOrderMutation.mutate(data);
  };

  // --- Side Effects ---
  // CORRECTED: useEffect for quoting with infinite loop fix
  useEffect(() => {
    if (
      !debouncedWatchedItems ||
      debouncedWatchedItems.length === 0 ||
      !watchedCustomerId
    )
      return;

    debouncedWatchedItems.forEach((item, index) => {
      const currentFormItem = getValues(`items.${index}`);
      if (!currentFormItem) return;

      const offeringToQuote = currentFormItem._derivedServiceOffering;
      const quantityNum = Number(item.quantity) || 0;

      if (offeringToQuote && watchedCustomerId && quantityNum > 0) {
        let readyToQuote = true;
        const quotePayload: QuoteItemPayload = {
          service_offering_id: offeringToQuote.id,
          customer_id: watchedCustomerId,
          quantity: quantityNum,
        };

        if (offeringToQuote.productType?.is_dimension_based) {
          const lengthNum = Number(item.length_meters) || 0;
          const widthNum = Number(item.width_meters) || 0;
          if (lengthNum > 0 && widthNum > 0) {
            quotePayload.length_meters = lengthNum;
            quotePayload.width_meters = widthNum;
          } else {
            readyToQuote = false;
          }
        }

        const currentQuoteInputSignature = JSON.stringify(quotePayload);

        if (
          readyToQuote &&
          !currentFormItem._isQuoting &&
          lastQuotedInputs[item.id] !== currentQuoteInputSignature
        ) {
          setLastQuotedInputs((prev) => ({
            ...prev,
            [item.id]: currentQuoteInputSignature,
          }));
          setValue(`items.${index}._isQuoting`, true);
          setValue(`items.${index}._quoteError`, null);
          quoteItemMutation.mutate({ itemIndex: index, payload: quotePayload });
        }
      }
    });
  }, [
    debouncedWatchedItems,
    watchedCustomerId,
    getValues,
    setValue,
    quoteItemMutation,
    lastQuotedInputs,
  ]);

  // Effect to manage wizard flow based on customer selection
  useEffect(() => {
    if (!watchedCustomerId) setCurrentStep("CUSTOMER");
    else if (currentStep === "CUSTOMER" && watchedCustomerId)
      setCurrentStep("CATEGORY");
  }, [watchedCustomerId, currentStep]);

  const renderCurrentStep = () => {
    if (!watchedCustomerId) {
      return (
        <StepCustomer
          onCustomerSelected={handleCustomerSelected}
          control={control}
          error={errors.customer_id}
        />
      );
    }

    switch (currentStep) {
      case "CATEGORY":
        return (
          <StepCategory
            onSelectCategory={handleCategorySelected}
            selectedCategoryId={selectedCategoryId}
          />
        );
      case "PRODUCT":
        return (
          <StepProductType
            categoryId={selectedCategoryId!}
            onSelectProductType={handleProductTypeSelected}
            onBack={() => {
              setSelectedProductType(null);
              setCurrentStep("CATEGORY");
            }}
          />
        );
      case "SERVICE":
        return (
          <StepServiceOffering
            productType={selectedProductType!}
            onAddItemsToCart={handleAddItemsToCart}
            onBack={() => setCurrentStep("PRODUCT")}
          />
        );
      case "EDIT_ITEM": {
        // This logic remains for editing an item's service offering from the cart
        const itemToEdit = getValues(`items.${editingItemIndex!}`);
        return itemToEdit?._derivedServiceOffering?.productType ? (
          <StepServiceOffering
            productType={itemToEdit._derivedServiceOffering.productType}
            onAddItemsToCart={() => {}} // Not used
            onBack={resetSelectionFlow}
            isEditing={true}
            itemToEdit={itemToEdit}
            onItemUpdate={(updatedData) =>
              handleUpdateItem(editingItemIndex!, updatedData)
            }
          />
        ) : (
          <div className="p-4">
            {t("itemDataMissingError", { ns: "orders" })}
          </div>
        );
      }
      default:
        return (
          <StepCategory
            onSelectCategory={handleCategorySelected}
            selectedCategoryId={selectedCategoryId}
          />
        );
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="h-screen w-screen bg-muted/30 fixed inset-0">
        <form onSubmit={handleSubmit(onSubmit)} className="flex h-full">
          {/* Left Panel: Order Cart */}
          <div className="w-full lg:w-2/5 xl:w-1/3 flex-shrink-0 border-r bg-background h-full shadow-lg">
            <OrderCart
              control={control}
              errors={errors}
              fields={fields}
              remove={remove}
              onEditItem={handleEditItem}
              onNewOrderClick={handleResetOrder}
              isSubmitting={createOrderMutation.isPending}
            />
          </div>
          {/* Right Panel: Dynamic Selection Area */}
          <div className="hidden lg:block lg:w-3/5 xl:w-2/3 h-full flex-col mt-10">
            {renderCurrentStep()}
          </div>
        </form>
      </div>
    </FormProvider>
  );
};
export default NewOrderPage;
