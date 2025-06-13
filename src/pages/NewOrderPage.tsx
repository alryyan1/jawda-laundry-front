// src/pages/orders/NewOrderPage.tsx
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

// Feature Components
import { CustomerSelection } from "@/features/orders/components/CustomerSelection";
import { OrderItemsManager } from "@/features/orders/components/OrderItemsManager";
import { OrderOverallDetails } from "@/features/orders/components/OrderOverallDetails";
import { OrderSummaryAndActions } from "@/features/orders/components/OrderSummaryAndActions";

import type {
  ProductType,
  ServiceAction,
  ServiceOffering,
  NewOrderFormData,
  Order,
  OrderItemFormLine,
} from "@/types";

// API services
import { getAllProductTypes } from "@/api/productTypeService";
import { getServiceActions } from "@/api/serviceActionService";
import { getAllServiceOfferingsForSelect } from "@/api/serviceOfferingService";
import { createOrder, getOrderItemQuote } from "@/api/orderService";
import { useDebounce } from "@/hooks/useDebounce";
import { newOrderFormSchema } from "@/schemas/newOrderSchema";

// Define types for quote-related data
interface QuoteItemPayload {
  service_offering_id: number;
  customer_id: string;
  quantity: number;
  length_meters?: number;
  width_meters?: number;
}

interface QuoteItemResponse {
  calculated_price_per_unit_item: number;
  sub_total: number;
  applied_unit: string;
}

const NewOrderPage: React.FC = () => {
  const { t } = useTranslation([
    "common",
    "orders",
    "customers",
    "services",
    "validation",
  ]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- Data Fetching for dropdowns ---
  const { data: productTypes = [], isLoading: isLoadingPT } = useQuery({
    queryKey: ["allProductTypesForSelect"],
    queryFn: () => getAllProductTypes(),
  });

  const { data: serviceActions = [], isLoading: isLoadingSA } = useQuery({
    queryKey: ["serviceActionsForSelect"],
    queryFn: () => getServiceActions(),
  });

  const { data: allServiceOfferings = [], isLoading: isLoadingSO } = useQuery({
    queryKey: ["allServiceOfferingsForSelect"],
    queryFn: () => getAllServiceOfferingsForSelect(),
  });

  // isLoadingCustomers is handled within CustomerSelection component
  const isLoadingPagePrerequisites = isLoadingPT || isLoadingSA || isLoadingSO;

  // --- Form Setup ---
  const methods = useForm<NewOrderFormData>({
    resolver: zodResolver(newOrderFormSchema) as Resolver<NewOrderFormData>,
    defaultValues: {
      customer_id: "",
      items: [{
        id: uuidv4(),
        product_type_id: "",
        service_action_id: "",
        quantity: 1,
        product_description_custom: "",
        length_meters: "",
        width_meters: "",
        notes: "",
        _derivedServiceOffering: null,
        _pricingStrategy: null,
        _quoted_price_per_unit_item: null,
        _quoted_sub_total: null,
        _quoted_applied_unit: null,
        _isQuoting: false,
        _quoteError: null,
      }],
      notes: "",
      due_date: "",
    },
  });
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    setError,
  } = methods;

  const watchedAllItems = useWatch({ control, name: "items" });
  const watchedCustomerId = useWatch({ control, name: "customer_id" });

  // --- Quote Mutation ---
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
      const errorMessage =
        error.message || t("quoteFailedForItemGeneric", { ns: "orders" });
      setValue(`items.${variables.itemIndex}._isQuoting`, false);
      setValue(
        `items.${variables.itemIndex}._quoted_price_per_unit_item`,
        null
      );
      setValue(`items.${variables.itemIndex}._quoted_sub_total`, null);
      setValue(`items.${variables.itemIndex}._quoted_applied_unit`, null);
      setValue(`items.${variables.itemIndex}._quoteError`, errorMessage);
    },
  });

  const debouncedWatchedItems = useDebounce(watchedAllItems, 750);

  // --- Effect for Deriving Service Offering & Triggering Quotes ---
  useEffect(() => {
    if (
      !debouncedWatchedItems ||
      debouncedWatchedItems.length === 0 ||
      !allServiceOfferings ||
      allServiceOfferings.length === 0
    ) {
      return;
    }

    debouncedWatchedItems.forEach((watchedItemState, index) => {
      const currentFormItem = getValues(`items.${index}`);
      if (!currentFormItem) return; // Item might have been removed

      let newOffering: ServiceOffering | null = null;

      if (
        watchedItemState.product_type_id &&
        watchedItemState.service_action_id
      ) {
        newOffering =
          allServiceOfferings.find(
            (so: ServiceOffering) =>
              so.productType?.id.toString() ===
                watchedItemState.product_type_id &&
              so.serviceAction?.id.toString() ===
                watchedItemState.service_action_id
          ) || null;
      }

      if (currentFormItem._derivedServiceOffering?.id !== newOffering?.id) {
        setValue(`items.${index}._derivedServiceOffering`, newOffering, {
          shouldValidate: true,
        });
        setValue(
          `items.${index}._pricingStrategy`,
          newOffering?.pricing_strategy || null
        );
        if (newOffering?.pricing_strategy !== "dimension_based") {
          setValue(`items.${index}.length_meters`, "");
          setValue(`items.${index}.width_meters`, "");
        }
        setValue(`items.${index}._quoted_price_per_unit_item`, null);
        setValue(`items.${index}._quoted_sub_total`, null);
        setValue(`items.${index}._quoted_applied_unit`, null);
        setValue(`items.${index}._quoteError`, null);
        setValue(`items.${index}._isQuoting`, false);
      }

      const offeringToQuote =
        newOffering || currentFormItem._derivedServiceOffering;
      const quantityStr = String(watchedItemState.quantity);
      const quantityNum =
        quantityStr && !isNaN(parseInt(quantityStr))
          ? parseInt(quantityStr, 10)
          : 0;

      if (offeringToQuote && watchedCustomerId && quantityNum > 0) {
        let readyToQuote = true;
        const quotePayload: QuoteItemPayload = {
          service_offering_id: offeringToQuote.id,
          customer_id: watchedCustomerId,
          quantity: quantityNum,
        };

        if (offeringToQuote.pricing_strategy === "dimension_based") {
          const lengthStr = String(watchedItemState.length_meters);
          const widthStr = String(watchedItemState.width_meters);
          const lengthNum =
            lengthStr && !isNaN(parseFloat(lengthStr))
              ? parseFloat(lengthStr)
              : 0;
          const widthNum =
            widthStr && !isNaN(parseFloat(widthStr)) ? parseFloat(widthStr) : 0;

          if (lengthNum > 0 && widthNum > 0) {
            quotePayload.length_meters = lengthNum;
            quotePayload.width_meters = widthNum;
          } else {
            readyToQuote = false;
          }
        }

        if (readyToQuote && !currentFormItem._isQuoting) {
          setValue(`items.${index}._isQuoting`, true);
          setValue(`items.${index}._quoteError`, null);
          quoteItemMutation.mutate({ itemIndex: index, payload: quotePayload });
        }
      } else if (currentFormItem._quoted_sub_total !== null) {
        setValue(`items.${index}._quoted_price_per_unit_item`, null);
        setValue(`items.${index}._quoted_sub_total`, null);
        setValue(`items.${index}._quoted_applied_unit`, null);
        setValue(`items.${index}._quoteError`, null);
        setValue(`items.${index}._isQuoting`, false);
      }
    });
  }, [
    debouncedWatchedItems,
    allServiceOfferings,
    watchedCustomerId,
    setValue,
    getValues,
    quoteItemMutation,
  ]);

  // --- Create Order Mutation ---
  const createOrderMutation = useMutation<Order, Error, NewOrderFormData>({
    mutationFn: (formData) => createOrder(formData, allServiceOfferings as ServiceOffering[]),
    onSuccess: (data) => {
      toast.success(
        t("orderCreatedSuccess", {
          ns: "orders",
          orderNumber: data.order_number,
        })
      );
      queryClient.invalidateQueries({ queryKey: ["orders"] }); // Invalidate orders list
      navigate("/orders");
    },
    onError: (error) => {
      // Check for structured validation errors from backend
      const apiErrors = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
      if (apiErrors) {
        Object.keys(apiErrors).forEach((key) => {
          const fieldKey = key.startsWith("items.")
            ? key
            : `items.0.${key}`;
          setError(fieldKey as `items.${number}.${keyof OrderItemFormLine}`, { type: "server", message: apiErrors[key][0] });
        });
        toast.error(t("validation.fixErrors", { ns: "validation" }));
      } else {
        toast.error(
          error.message || t("orderCreationFailed", { ns: "orders" })
        );
      }
    },
  });

  const onSubmit = (data: NewOrderFormData) => {
    console.log('Raw form data:', data);
    console.log('All service offerings:', allServiceOfferings);
    alert('k')
    let allItemsValid = true;
    // Final client-side validation pass before submit
    data.items.forEach((item, index) => {
      console.log(`Validating item ${index}:`, item);
      
      const offering = (allServiceOfferings as ServiceOffering[]).find(
        (so: ServiceOffering) =>
          so.productType?.id.toString() === item.product_type_id &&
          so.serviceAction?.id.toString() === item.service_action_id
      );
      console.log(`Found offering for item ${index}:`, offering);

      if (!offering) {
        setError(`items.${index}._derivedServiceOffering` as `items.${number}._derivedServiceOffering`, {
          type: "manual",
          message: t("validation.serviceOfferingRequired"),
        });
        allItemsValid = false;
      }

      if (offering?.pricing_strategy === "dimension_based") {
        const length = item.length_meters ? Number(item.length_meters) : 0;
        const width = item.width_meters ? Number(item.width_meters) : 0;

        if (!(length > 0 && width > 0)) {
          if (!errors.items?.[index]?.length_meters) {
            setError(`items.${index}.length_meters` as `items.${number}.length_meters`, {
              type: "manual",
              message: t("validation.dimensionsRequiredForStrategy"),
            });
          }
          if (!errors.items?.[index]?.width_meters) {
            setError(`items.${index}.width_meters` as `items.${number}.width_meters`, {
              type: "manual",
              message: " ",
            });
          }
          allItemsValid = false;
        }
      }
      if (item._quoteError) {
        allItemsValid = false; // Don't submit if an item has a quote error
      }
    });

    alert('s')
    if (!allItemsValid) {
      toast.error(t("pleaseCorrectErrorsInItems", { ns: "orders" }));
      return;
    }

    // Ensure we're passing the correct data structure while maintaining types
    const formDataToSubmit: NewOrderFormData = {
      customer_id: data.customer_id,
      notes: data.notes,
      due_date: data.due_date,
      items: data.items.map(item => {
        console.log('Processing item for submission:', item);
        return {
          id: item.id,
          product_type_id: item.product_type_id,
          service_action_id: item.service_action_id,
          quantity: item.quantity,
          product_description_custom: item.product_description_custom || "",
          length_meters: item.length_meters || "",
          width_meters: item.width_meters || "",
          notes: item.notes || "",
          _derivedServiceOffering: item._derivedServiceOffering,
          _pricingStrategy: item._pricingStrategy,
          _quoted_price_per_unit_item: item._quoted_price_per_unit_item,
          _quoted_sub_total: item._quoted_sub_total,
          _quoted_applied_unit: item._quoted_applied_unit,
          _isQuoting: item._isQuoting,
          _quoteError: item._quoteError
        };
      })
    };

    console.log('Final form data to submit:', formDataToSubmit);
    createOrderMutation.mutate(formDataToSubmit);
  };

  const orderTotal = useMemo(() => {
    return watchedAllItems.reduce((total, item) => {
      return total + (item._quoted_sub_total || 0);
    }, 0);
  }, [watchedAllItems]);

  if (isLoadingPagePrerequisites) {
    // Show a page loader while essential dropdown data loads
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg">
          {t("loadingOrderForm", {
            ns: "orders",
            defaultValue: "Loading order form...",
          })}
        </p>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="max-w-4xl mx-auto pb-20">
        {" "}
        {/* Added more padding bottom */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild className="h-9 w-9">
              <Link to="/orders">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">
                  {t("backToOrders", { ns: "orders" })}
                </span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {t("newOrder", { ns: "common" })}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("newOrderDescription", { ns: "orders" })}
              </p>
            </div>
          </div>
        </div>
        <Card className="shadow-lg">
          {/* Removed CardHeader as title is now above the card */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              {" "}
              {/* Added pt-6 */}
              <CustomerSelection
                control={control}
                error={errors.customer_id}
                disabled={
                  createOrderMutation.isPending || quoteItemMutation.isPending
                }
              />
              <OrderItemsManager
                productTypes={productTypes as ProductType[]}
                serviceActions={serviceActions as ServiceAction[]}
                allServiceOfferings={allServiceOfferings as ServiceOffering[]}
                isSubmittingOrder={createOrderMutation.isPending}
                isLoadingDropdowns={isLoadingPagePrerequisites}
                itemsArrayErrors={errors.items}
              />
              <OrderOverallDetails
                disabled={createOrderMutation.isPending}
                notesError={errors.notes}
                dueDateError={errors.due_date}
              />
            </CardContent>

            <OrderSummaryAndActions
              orderTotal={orderTotal}
              isSubmitting={createOrderMutation.isPending}
              isQuotingAnyItem={
                watchedAllItems?.some((item) => item._isQuoting) || false
              }
              isLoadingDropdowns={isLoadingPagePrerequisites} // General loading state for submit button
              isCustomerSelected={!!watchedCustomerId}
              hasItems={watchedAllItems?.length > 0}
            />
          </form>
        </Card>
      </div>
    </FormProvider>
  );
};

export default NewOrderPage;
