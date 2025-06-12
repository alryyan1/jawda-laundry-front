// src/pages/orders/NewOrderPage.tsx
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import {
  FormProvider,
  useForm,
  Controller,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import type { ComboboxOption } from "@/components/ui/combobox";
import { Loader2, ArrowLeft, PlusCircle } from "lucide-react";

import { OrderItemFormLine as OrderItemFormLineComponent } from "@/pages/orders/components/OrderItemFormLine";

import type {
  Customer,
  ProductType,
  ServiceAction,
  ServiceOffering,
  NewOrderFormData,
  Order,
  PricingStrategy,
  PaginatedResponse,
} from "@/types";
import { getCustomers } from "@/api/customerService";
import { getAllProductTypes } from "@/api/productTypeService";
import { getServiceActions } from "@/api/serviceActionService";
import { getAllServiceOfferingsForSelect } from "@/api/serviceOfferingService";
import { createOrder, getOrderItemQuote } from "@/api/orderService";
import type { QuoteItemPayload, QuoteItemResponse } from "@/api/orderService";
import { useDebounce } from "@/hooks/useDebounce";

// Zod Schema (ensure it matches the types)
const orderItemFormLineSchema = z
  .object({
    id: z.string(),
    product_type_id: z
      .string()
      .min(1, { message: "validation.productTypeRequired" }),
    service_action_id: z
      .string()
      .min(1, { message: "validation.serviceActionRequired" }),
    product_description_custom: z.string().optional().or(z.literal("")),
    quantity: z.preprocess(
      (val) =>
        val === "" ||
        val === null ||
        val === undefined ||
        Number.isNaN(parseInt(String(val)))
          ? 1
          : parseInt(String(val), 10),
      z.number().min(1, { message: "validation.quantityMin" })
    ),
    length_meters: z.preprocess(
      (val) =>
        val === "" ||
        val === null ||
        val === undefined ||
        Number.isNaN(parseFloat(String(val)))
          ? undefined
          : parseFloat(String(val)),
      z.number().min(0, { message: "validation.dimensionPositive" }).optional()
    ),
    width_meters: z.preprocess(
      (val) =>
        val === "" ||
        val === null ||
        val === undefined ||
        Number.isNaN(parseFloat(String(val)))
          ? undefined
          : parseFloat(String(val)),
      z.number().min(0, { message: "validation.dimensionPositive" }).optional()
    ),
    notes: z.string().optional().or(z.literal("")),
    _derivedServiceOffering: z
      .custom<ServiceOffering | null | undefined>()
      .optional(), // Not directly validated here, but by logic
    _pricingStrategy: z.custom<PricingStrategy | null | undefined>().optional(),
    _quoted_price_per_unit_item: z.number().optional().nullable(),
    _quoted_sub_total: z.number().optional().nullable(),
    _quoted_applied_unit: z.string().optional().nullable(),
    _isQuoting: z.boolean().optional(),
    _quoteError: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // Ensure dimensions are provided if strategy requires it
      if (data._pricingStrategy === "dimension_based") {
        return (
          data.length_meters !== undefined &&
          data.length_meters > 0 &&
          data.width_meters !== undefined &&
          data.width_meters > 0
        );
      }
      return true;
    },
    {
      message: "validation.dimensionsRequiredForStrategy",
      path: ["length_meters"], // Or a more general path
    }
  );

const newOrderFormSchema = z.object({
  customer_id: z.string().min(1, { message: "validation.customerRequired" }),
  items: z
    .array(orderItemFormLineSchema)
    .min(1, { message: "validation.atLeastOneItem" }),
  notes: z.string().optional().or(z.literal("")),
  due_date: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "validation.invalidDate",
    })
    .or(z.literal("")),
});

const NewOrderPage: React.FC = () => {
  const { t, i18n } = useTranslation([
    "common",
    "orders",
    "customers",
    "services",
    "validation",
  ]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- Data Fetching ---
  const { data: customersResponse, isLoading: isLoadingCustomers } = useQuery<
    PaginatedResponse<Customer>,
    Error
  >({
    queryKey: ["customersForSelect"],
    queryFn: () => getCustomers(1, 1000),
  });
  const customerOptions: ComboboxOption[] = useMemo(
    () =>
      customersResponse?.data.map((cust) => ({
        value: cust.id.toString(),
        label: `${cust.name} (${cust.phone || cust.email || "N/A"})`,
      })) || [],
    [customersResponse]
  );

  const { data: productTypes = [], isLoading: isLoadingPT } = useQuery<ProductType[], Error>({
    queryKey: ["allProductTypesForSelect"],
    queryFn: () => getAllProductTypes(),
  });

  const { data: serviceActions = [], isLoading: isLoadingSA } = useQuery<
    ServiceAction[],
    Error
  >({
    queryKey: ["serviceActionsForSelect"],
    queryFn: getServiceActions,
  });

  const { data: allServiceOfferings = [], isLoading: isLoadingSO } = useQuery<ServiceOffering[], Error>({
    queryKey: ["allServiceOfferingsForSelect"],
    queryFn: () => getAllServiceOfferingsForSelect(),
  });

  const isLoadingDropdowns =
    isLoadingCustomers || isLoadingPT || isLoadingSA || isLoadingSO;

  // --- Form Setup ---
  const methods = useForm<NewOrderFormData>({
    resolver: zodResolver(newOrderFormSchema),
    defaultValues: {
      customer_id: "",
      items: [
        {
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
        },
      ],
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
    register,
  } = methods;

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedAllItems = useWatch({ control, name: "items" }); // Watch the entire items array
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
      const currentFormItem = getValues(`items.${variables.itemIndex}`);
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

  // Debounce individual item changes to trigger quote
  const debouncedWatchedItems = useDebounce(watchedAllItems, 750);

  useEffect(() => {
    debouncedWatchedItems.forEach((item, index) => {
      const currentFormItem = getValues(`items.${index}`); // Get latest from form state
      let newOffering: ServiceOffering | null = null;

      if (
        item.product_type_id &&
        item.service_action_id &&
        allServiceOfferings.length > 0
      ) {
        newOffering =
          allServiceOfferings.find(
            (so) =>
              so.productType?.id.toString() === item.product_type_id &&
              so.serviceAction?.id.toString() === item.service_action_id
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
          setValue(`items.${index}.length_meters`, ""); // Use empty string to clear input
          setValue(`items.${index}.width_meters`, "");
        }
        setValue(`items.${index}._quoted_price_per_unit_item`, null);
        setValue(`items.${index}._quoted_sub_total`, null);
        setValue(`items.${index}._quoted_applied_unit`, null);
        setValue(`items.${index}._quoteError`, null);
      }

      const offeringToQuote =
        newOffering || currentFormItem._derivedServiceOffering;
      if (offeringToQuote && watchedCustomerId && item.quantity) {
        const quantityNum =
          typeof item.quantity === "string"
            ? parseInt(item.quantity)
            : Number(item.quantity); // Ensure number
        if (quantityNum > 0) {
          let readyToQuote = true;
          const quotePayload: QuoteItemPayload = {
            service_offering_id: offeringToQuote.id,
            customer_id: watchedCustomerId,
            quantity: quantityNum,
          };

          if (offeringToQuote.pricing_strategy === "dimension_based") {
            const lengthNum = item.length_meters
              ? typeof item.length_meters === "string"
                ? parseFloat(item.length_meters)
                : Number(item.length_meters)
              : null;
            const widthNum = item.width_meters
              ? typeof item.width_meters === "string"
                ? parseFloat(item.width_meters)
                : Number(item.width_meters)
              : null;

            if (lengthNum && lengthNum > 0 && widthNum && widthNum > 0) {
              quotePayload.length_meters = lengthNum;
              quotePayload.width_meters = widthNum;
            } else {
              readyToQuote = false;
            }
          }

          if (readyToQuote && !currentFormItem._isQuoting) {
            // Simple check: if quote is null, or if key inputs changed (less precise but avoids stringify)
            const inputsChanged = currentFormItem._quoted_sub_total === null;

            if (inputsChanged || true) {
              // For now, always try to quote if ready and not already quoting
              setValue(`items.${index}._isQuoting`, true);
              setValue(`items.${index}._quoteError`, null); // Clear previous error before new quote
              quoteItemMutation.mutate({
                itemIndex: index,
                payload: quotePayload,
              });
            }
          }
        }
      } else if (currentFormItem._quoted_sub_total !== null) {
        setValue(`items.${index}._quoted_price_per_unit_item`, null);
        setValue(`items.${index}._quoted_sub_total`, null);
        setValue(`items.${index}._quoted_applied_unit`, null);
        setValue(`items.${index}._quoteError`, null);
      }
    });
  }, [
    debouncedWatchedItems,
    allServiceOfferings,
    watchedCustomerId,
    setValue,
    getValues,
    quoteItemMutation,
  ]); // Added getValues and quoteItemMutation

  // --- Create Order Mutation ---
  const createOrderMutation = useMutation<Order, Error, NewOrderFormData>({
    mutationFn: (formData) => createOrder(formData, allServiceOfferings),
    onSuccess: (data) => {
      toast.success(
        t("orderCreatedSuccess", {
          ns: "orders",
          orderNumber: data.order_number,
        })
      );
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      navigate("/orders");
    },
    onError: (error) => {
      toast.error(error.message || t("orderCreationFailed", { ns: "orders" }));
    },
  });

  const onSubmit = (data: NewOrderFormData) => {
    let allItemsValid = true;
    data.items.forEach((item, index) => {
      if (!item._derivedServiceOffering) {
        // This error should ideally be caught by Zod on _derivedServiceOffering if made mandatory
        // Or by setting a form error manually
        methods.setError(`items.${index}._derivedServiceOffering`, {
          type: "manual",
          message: t("validation.serviceOfferingRequired"),
        });
        allItemsValid = false;
      }
      if (
        item._pricingStrategy === "dimension_based" &&
        (!item.length_meters || !item.width_meters)
      ) {
        methods.setError(`items.${index}.length_meters`, {
          type: "manual",
          message: t("validation.dimensionsRequiredForStrategy"),
        });
        allItemsValid = false;
      }
    });
    if (!allItemsValid) {
      toast.error(t("pleaseCorrectErrorsInItems", { ns: "orders" }));
      return;
    }
    createOrderMutation.mutate(data);
  };

  const addNewItem = () => {
    append({
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
    });
  };

  const orderTotal = useMemo(() => {
    return watchedAllItems.reduce((total, item) => {
      return total + (item._quoted_sub_total || 0);
    }, 0);
  }, [watchedAllItems]);

  return (
    <FormProvider {...methods}>
      <div className="max-w-4xl mx-auto pb-12">
        <div className="mb-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/orders">
              <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t("backToOrders", { ns: "orders" })}
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("newOrder", { ns: "common" })}</CardTitle>
            <CardDescription>
              {t("newOrderDescription", { ns: "orders" })}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Customer Selection */}
              <div className="grid gap-1.5">
                <Label htmlFor="customer_id">
                  {t("customer", { ns: "customers" })}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="customer_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={customerOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={
                        isLoadingCustomers
                          ? t("loading")
                          : t("selectCustomer", { ns: "customers" })
                      }
                      searchPlaceholder={t("searchCustomer", {
                        ns: "customers",
                      })}
                      emptyResultText={t("noCustomerFound", {
                        ns: "customers",
                      })}
                      disabled={
                        isLoadingDropdowns || createOrderMutation.isPending
                      }
                    />
                  )}
                />
                {errors.customer_id && (
                  <p className="text-sm text-destructive">
                    {t(errors.customer_id.message as string)}
                  </p>
                )}
              </div>

              {/* Order Items Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center pt-4 border-t">
                  <h3 className="text-xl font-semibold">
                    {t("orderItems", { ns: "orders" })}
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={addNewItem}
                    disabled={
                      createOrderMutation.isPending || !watchedCustomerId
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                    {t("addItem", { ns: "orders" })}
                  </Button>
                </div>
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("noItemsAdded", { ns: "orders" })}
                  </p>
                )}

                <div className="space-y-6">
                  {fields.map((field, index) => {
                    const currentItemFormState = getValues(`items.${index}`); // Get values for props
                    return (
                      <OrderItemFormLineComponent
                        key={field.id}
                        index={index}
                        onRemove={remove}
                        productTypes={productTypes}
                        serviceActions={serviceActions}
                        allServiceOfferings={allServiceOfferings}
                        isSubmittingOrder={createOrderMutation.isPending}
                        isLoadingDropdowns={isLoadingDropdowns}
                        isQuotingItem={currentItemFormState._isQuoting || false}
                        quotedSubtotal={currentItemFormState._quoted_sub_total}
                        quotedPricePerUnit={
                          currentItemFormState._quoted_price_per_unit_item
                        }
                        quotedAppliedUnit={
                          currentItemFormState._quoted_applied_unit
                        }
                        quoteError={currentItemFormState._quoteError}
                      />
                    );
                  })}
                </div>
                {errors.items && typeof errors.items.message === "string" && (
                  <p className="text-sm text-destructive mt-2">
                    {errors.items.message}
                  </p>
                )}
                {errors.items &&
                  Array.isArray(errors.items) &&
                  errors.items.some((itemErr) => itemErr?.root) && (
                    <p className="text-sm text-destructive mt-2">
                      {t("checkItemErrors", { ns: "orders" })}
                    </p>
                  )}
              </div>

              {/* Overall Order Notes & Due Date */}
              <div className="pt-4 border-t space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="notes">
                    {t("overallOrderNotesOptional", { ns: "orders" })}
                  </Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    rows={3}
                    disabled={createOrderMutation.isPending}
                  />
                </div>
                <div className="grid gap-1.5 max-w-xs">
                  <Label htmlFor="due_date">
                    {t("dueDateOptional", { ns: "orders" })}
                  </Label>
                  <Input
                    id="due_date"
                    type="date"
                    {...register("due_date")}
                    disabled={createOrderMutation.isPending}
                  />
                  {errors.due_date && (
                    <p className="text-sm text-destructive">
                      {t(errors.due_date.message as string)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 mt-4 border-t">
              <div className="text-xl font-bold">
                {t("estimatedTotal", { ns: "orders" })}:
                <span className="text-primary ml-2 rtl:mr-2">
                  {new Intl.NumberFormat(i18n.language, {
                    style: "currency",
                    currency: "USD",
                  }).format(orderTotal)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/orders")}
                  disabled={
                    createOrderMutation.isPending ||
                    fields.some((item) => item._isQuoting)
                  }
                >
                  {t("cancel", { ns: "common" })}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isLoadingDropdowns ||
                    createOrderMutation.isPending ||
                    fields.some((item) => item._isQuoting) ||
                    !watchedCustomerId ||
                    fields.length === 0
                  }
                >
                  {(createOrderMutation.isPending ||
                    fields.some((item) => item._isQuoting)) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
                  )}
                  {t("createOrderCta", { ns: "orders" })}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </FormProvider>
  );
};

export default NewOrderPage;
