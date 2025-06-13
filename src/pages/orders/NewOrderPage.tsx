// src/pages/orders/NewOrderPage.tsx
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid"; // For unique keys for useFieldArray items
// If you see a type error for 'uuid', run: npm install --save-dev @types/uuid

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import type { ComboboxOption } from "@/components/ui/combobox";
import { Loader2, ArrowLeft, PlusCircle, Trash2 } from "lucide-react";
import type { SubmitHandler } from "react-hook-form";

import type {
  Customer,
  ProductType,
  ServiceAction,
  ServiceOffering,
  NewOrderFormData,
  Order,
  PricingStrategy,
  PaginatedResponse as CustomerPaginatedResponse,
} from "@/types";
import {
  getCustomers,
} from "@/api/customerService";
import { getAllProductTypes } from "@/api/productTypeService";
import { getServiceActions } from "@/api/serviceActionService";
import { getAllServiceOfferingsForSelect } from "@/api/serviceOfferingService"; // To find matching offering
import { createOrder } from "@/api/orderService";

// Zod Schema
const orderItemSchema = z.object({
  id: z.string(), // For useFieldArray
  product_type_id: z
    .string()
    .min(1, { message: "validation.productTypeRequired" }),
  service_action_id: z
    .string()
    .min(1, { message: "validation.serviceActionRequired" }),
  product_description_custom: z.string().optional().or(z.literal("")),
  quantity: z.preprocess(
    (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return val;
      return '';
    },
    z.union([z.string(), z.number()]).refine((val) => {
      const num = typeof val === 'string' ? Number(val) : val;
      return !isNaN(num) && num >= 1;
    }, { message: "validation.quantityMin" })
  ),
  length_meters: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : val,
    z.union([z.string(), z.number()]).optional()
  ),
  width_meters: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : val,
    z.union([z.string(), z.number()]).optional()
  ),
  notes: z.string().optional().or(z.literal("")),
  // Temporary fields used for UI logic, not part of backend submission directly from this item schema
  _derivedServiceOffering: z
    .custom<ServiceOffering | null | undefined>((val) => val !== undefined, {
      message: "validation.serviceOfferingRequired",
    })
    .optional(),
  _pricingStrategy: z.custom<PricingStrategy | null | undefined>().optional(),
});

const newOrderFormSchema = z.object({
  customer_id: z.string().min(1, { message: "validation.customerRequired" }),
  items: z
    .array(orderItemSchema)
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
  const { t } = useTranslation([
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
    CustomerPaginatedResponse<Customer>,
    Error
  >({
    queryKey: ["customersForSelect"],
    queryFn: () => getCustomers(1, 1000), // Fetch more for combobox
  });
  const customerOptions: ComboboxOption[] = useMemo(
    () =>
      customersResponse?.data.map((cust) => ({
        value: cust.id.toString(),
        label: `${cust.name} (${cust.phone || cust.email || "N/A"})`,
      })) || [],
    [customersResponse]
  );

  const { data: productTypes = [], isLoading: isLoadingPT } = useQuery<
    ProductType[],
    Error
  >({
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

  // Fetch ALL service offerings to perform client-side matching or to pass to createOrder service
  // This could be optimized if the list is huge, e.g., by fetching only relevant ones.
  const { data: allServiceOfferings = [], isLoading: isLoadingSO } = useQuery<
    ServiceOffering[],
    Error
  >({
    queryKey: ["allServiceOfferingsForSelect"],
    queryFn: () => getAllServiceOfferingsForSelect(),
  });

  const isLoadingDropdowns =
    isLoadingCustomers || isLoadingPT || isLoadingSA || isLoadingSO;

  // --- Form Setup ---
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<NewOrderFormData>({
    resolver: zodResolver(newOrderFormSchema),
    defaultValues: {
      customer_id: "",
      items: [
        {
          id: uuidv4(),
          product_type_id: "",
          service_action_id: "",
          quantity: 1,
          _derivedServiceOffering: null,
          _pricingStrategy: null,
        },
      ],
      notes: "",
      due_date: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Watch items to update derived service offering and pricing strategy
  const watchedItems = useWatch({ control, name: "items" });

  // Compute available service actions for each item at the top level
  const availableServiceActionsList = useMemo(() => {
    return watchedItems.map((currentItemValues) => {
      if (!currentItemValues?.product_type_id || !allServiceOfferings.length) return [];
      const relevantOfferings = allServiceOfferings.filter(
        (so: ServiceOffering) => so.productType?.id.toString() === currentItemValues.product_type_id
      );
      const uniqueActionIds = [
        ...new Set(relevantOfferings.map((so: ServiceOffering) => so.serviceAction?.id)),
      ];
      return serviceActions.filter((sa: ServiceAction) => uniqueActionIds.includes(sa.id));
    });
  }, [watchedItems, allServiceOfferings, serviceActions]);

  useEffect(() => {
    watchedItems.forEach((item, index) => {
      if (
        item.product_type_id &&
        item.service_action_id &&
        allServiceOfferings.length > 0
      ) {
        const foundOffering = allServiceOfferings.find(
          (so) =>
            so.productType?.id.toString() === item.product_type_id &&
            so.serviceAction?.id.toString() === item.service_action_id
        );
        // Only update if different to avoid re-renders / infinite loops
        if (
          getValues(`items.${index}._derivedServiceOffering`)?.id !==
          foundOffering?.id
        ) {
          setValue(
            `items.${index}._derivedServiceOffering`,
            foundOffering || null
          );
          setValue(
            `items.${index}._pricingStrategy`,
            foundOffering?.pricing_strategy || null
          );

          // Clear dimensions if strategy changes away from dimension_based
          if (foundOffering?.pricing_strategy !== "dimension_based") {
            setValue(`items.${index}.length_meters`, undefined);
            setValue(`items.${index}.width_meters`, undefined);
          }
        }
      } else if (getValues(`items.${index}._derivedServiceOffering`) !== null) {
        // If selections are cleared
        setValue(`items.${index}._derivedServiceOffering`, null);
        setValue(`items.${index}._pricingStrategy`, null);
      }
    });
  }, [watchedItems, allServiceOfferings, setValue, getValues]);

  // --- Mutation ---
  const createOrderMutation = useMutation<Order, Error, NewOrderFormData>({
    
    mutationFn: (formData) => {
      console.log(formData,'formData')
      // Transform items to match API shape
      const apiItems = formData.items.map((item) => {
        // Find the correct service offering for this item
      
        // Ensure length_meters and width_meters are numbers or undefined
        return {
          service_offering_id: item.service_offering_id, // fallback to empty string if not found
          quantity: typeof item.quantity === 'string' ? Number(item.quantity) : item.quantity,
          product_description_custom: item.product_description_custom,
          length_meters:item.length_meters,
          width_meters:item.width_meters,
        };
      });
      return createOrder({
        ...formData,
        items: apiItems,
      }, allServiceOfferings);
    },
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
      console.log(error)
      toast.error(error.message || t("orderCreationFailed", { ns: "orders" }));
    },
  });

  const onSubmit: SubmitHandler<NewOrderFormData> = (data) => {
    // Transform items to match API shape
    const apiItems = data.items.map((item) => {
      if (!item._derivedServiceOffering) {
        throw new Error('Service offering not found for item');
      }

      // Convert dimensions to numbers if they exist
      const length_meters = item.length_meters ? 
        (typeof item.length_meters === 'string' ? parseFloat(item.length_meters) : item.length_meters) : 
        undefined;
      
      const width_meters = item.width_meters ? 
        (typeof item.width_meters === 'string' ? parseFloat(item.width_meters) : item.width_meters) : 
        undefined;

      return {
        service_offering_id: item._derivedServiceOffering.id,
        quantity: typeof item.quantity === 'string' ? Number(item.quantity) : item.quantity,
        product_description_custom: item.product_description_custom || null,
        length_meters,
        width_meters,
        notes: item.notes || null,
      };
    });

    // Call the mutation with transformed data
    createOrderMutation.mutate({
      ...data,
      items: apiItems,
    });
  };

  const addNewItem = () => {
    append({
      id: uuidv4(),
      product_type_id: "",
      service_action_id: "",
      quantity: 1,
      _derivedServiceOffering: null,
      _pricingStrategy: null,
      product_description_custom: "",
      length_meters: "",
      width_meters: "",
      notes: "",
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {" "}
      {/* Increased max-width for more complex form */}
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
                    searchPlaceholder={t("searchCustomer", { ns: "customers" })}
                    emptyResultText={t("noCustomerFound", { ns: "customers" })}
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
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  {t("orderItems", { ns: "orders" })}
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addNewItem}
                  disabled={createOrderMutation.isPending}
                >
                  <PlusCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  {t("addItem", { ns: "orders" })}
                </Button>
              </div>
              {fields.map((field, index) => {
                const currentItemValues = watch(`items.${index}`); // Get current values for this specific item
                const selectedOffering = currentItemValues?._derivedServiceOffering;
                const pricingStrategy = currentItemValues?._pricingStrategy;

                // Use the precomputed availableServiceActions for this index
                const availableServiceActions = availableServiceActionsList[index] || [];

                return (
                  <div
                    key={field.id}
                    className="p-4 border rounded-md space-y-3 bg-muted/30"
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">
                        {t("item", { ns: "common" })} #{index + 1}
                      </p>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          disabled={createOrderMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Product Type */}
                      <div className="grid gap-1.5">
                        <Label htmlFor={`items.${index}.product_type_id`}>
                          {t("productType", { ns: "services" })}{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Controller
                          name={`items.${index}.product_type_id`}
                          control={control}
                          render={({ field: controllerField }) => (
                            <Select
                              onValueChange={(value) => {
                                controllerField.onChange(value);
                                setValue(
                                  `items.${index}.service_action_id`,
                                  ""
                                ); // Reset action on PT change
                                setValue(
                                  `items.${index}._derivedServiceOffering`,
                                  null
                                );
                              }}
                              value={controllerField.value}
                              disabled={
                                isLoadingDropdowns ||
                                createOrderMutation.isPending
                              }
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    isLoadingPT
                                      ? t("loading")
                                      : t("selectProductType", {
                                          ns: "services",
                                        })
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {productTypes.map((pt) => (
                                  <SelectItem
                                    key={pt.id}
                                    value={pt.id.toString()}
                                  >
                                    {pt.name} ({pt.category?.name})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.items?.[index]?.product_type_id && (
                          <p className="text-sm text-destructive">
                            {t(
                              errors.items[index]?.product_type_id
                                ?.message as string
                            )}
                          </p>
                        )}
                      </div>

                      {/* Service Action */}
                      <div className="grid gap-1.5">
                        <Label htmlFor={`items.${index}.service_action_id`}>
                          {t("serviceAction", { ns: "services" })}{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Controller
                          name={`items.${index}.service_action_id`}
                          control={control}
                          render={({ field: controllerField }) => (
                            <Select
                              onValueChange={controllerField.onChange}
                              value={controllerField.value}
                              disabled={
                                isLoadingDropdowns ||
                                createOrderMutation.isPending ||
                                !currentItemValues?.product_type_id ||
                                availableServiceActions.length === 0
                              }
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    !currentItemValues?.product_type_id
                                      ? t("selectProductTypeFirst", {
                                          ns: "services",
                                        })
                                      : isLoadingSA
                                      ? t("loading")
                                      : t("selectServiceAction", {
                                          ns: "services",
                                        })
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {availableServiceActions.map((sa) => (
                                  <SelectItem
                                    key={sa.id}
                                    value={sa.id.toString()}
                                  >
                                    {sa.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.items?.[index]?.service_action_id && (
                          <p className="text-sm text-destructive">
                            {t(
                              errors.items[index]?.service_action_id
                                ?.message as string
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {selectedOffering && (
                      <div className="p-2 text-xs bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700">
                        Selected Offering:{" "}
                        <strong>{selectedOffering.display_name}</strong> (
                        {t(`strategy.${selectedOffering.pricing_strategy}`, {
                          ns: "services",
                        })}
                        )
                        {selectedOffering.default_price &&
                          ` - Default Price: ${selectedOffering.default_price}`}
                        {selectedOffering.default_price_per_sq_meter &&
                          ` - Price/sq.m: ${selectedOffering.default_price_per_sq_meter}`}
                      </div>
                    )}
                    {errors.items?.[index]?._derivedServiceOffering && (
                      <p className="text-sm text-destructive">
                        {t(
                          errors.items[index]?._derivedServiceOffering
                            ?.message as string
                        )}
                      </p>
                    )}

                    <div className="grid gap-1.5">
                      <Label
                        htmlFor={`items.${index}.product_description_custom`}
                      >
                        {t("itemDescriptionOptional", {
                          ns: "orders",
                          defaultValue: "Specific Item Description (Optional)",
                        })}
                      </Label>
                      <Input
                        id={`items.${index}.product_description_custom`}
                        {...register(
                          `items.${index}.product_description_custom`
                        )}
                        placeholder={t("itemDescriptionPlaceholder", {
                          ns: "orders",
                          defaultValue:
                            "e.g., Brand X, Blue Cotton Shirt, Size M",
                        })}
                        disabled={createOrderMutation.isPending}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Quantity */}
                      <div className="grid gap-1.5">
                        <Label htmlFor={`items.${index}.quantity`}>
                          {t("quantity", { ns: "services" })}{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`items.${index}.quantity`}
                          type="number"
                          {...register(`items.${index}.quantity`)}
                          min="1"
                          disabled={createOrderMutation.isPending}
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="text-sm text-destructive">
                            {t(
                              errors.items[index]?.quantity?.message as string
                            )}
                          </p>
                        )}
                      </div>

                      {/* Conditional Dimension Inputs */}
                      {pricingStrategy === "dimension_based" && (
                        <>
                          <div className="grid gap-1.5">
                            <Label htmlFor={`items.${index}.length_meters`}>
                              {t("lengthMeters", { ns: "orders" })}{" "}
                              {selectedOffering?.applicable_unit ===
                              "sq_meter" ? (
                                <span className="text-destructive">*</span>
                              ) : (
                                ""
                              )}
                            </Label>
                            <Input
                              id={`items.${index}.length_meters`}
                              type="number"
                              step="0.01"
                              {...register(`items.${index}.length_meters`)}
                              placeholder="e.g., 2.5"
                              disabled={createOrderMutation.isPending}
                            />
                            {errors.items?.[index]?.length_meters && (
                              <p className="text-sm text-destructive">
                                {t(
                                  errors.items[index]?.length_meters
                                    ?.message as string
                                )}
                              </p>
                            )}
                          </div>
                          <div className="grid gap-1.5">
                            <Label htmlFor={`items.${index}.width_meters`}>
                              {t("widthMeters", { ns: "orders" })}{" "}
                              {selectedOffering?.applicable_unit ===
                              "sq_meter" ? (
                                <span className="text-destructive">*</span>
                              ) : (
                                ""
                              )}
                            </Label>
                            <Input
                              id={`items.${index}.width_meters`}
                              type="number"
                              step="0.01"
                              {...register(`items.${index}.width_meters`)}
                              placeholder="e.g., 1.8"
                              disabled={createOrderMutation.isPending}
                            />
                            {errors.items?.[index]?.width_meters && (
                              <p className="text-sm text-destructive">
                                {t(
                                  errors.items[index]?.width_meters
                                    ?.message as string
                                )}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor={`items.${index}.notes`}>
                        {t("itemNotesOptional", {
                          ns: "orders",
                          defaultValue: "Notes for this item (Optional)",
                        })}
                      </Label>
                      <Textarea
                        id={`items.${index}.notes`}
                        {...register(`items.${index}.notes`)}
                        rows={2}
                        disabled={createOrderMutation.isPending}
                      />
                    </div>
                  </div>
                );
              })}
              {errors.items && typeof errors.items.message === "string" && (
                <p className="text-sm text-destructive mt-2">
                  {errors.items.message}
                </p>
              )}{" "}
              {/* For array-level error */}
            </div>

            {/* Overall Order Notes & Due Date */}
            <div className="grid gap-1.5">
              <Label htmlFor="notes">
                {t("overallOrderNotesOptional", {
                  ns: "orders",
                  defaultValue: "Overall Order Notes (Optional)",
                })}
              </Label>
              <Textarea
                id="notes"
                {...register("notes")}
                rows={3}
                disabled={createOrderMutation.isPending}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="due_date">
                {t("dueDateOptional", {
                  ns: "orders",
                  defaultValue: "Due Date (Optional)",
                })}
              </Label>
              <Input
                id="due_date"
                type="date"
                {...register("due_date")}
                className="max-w-xs"
                disabled={createOrderMutation.isPending}
              />
              {errors.due_date && (
                <p className="text-sm text-destructive">
                  {t(errors.due_date.message as string)}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 items-stretch sm:items-center">
            {/* TODO: Display calculated total quote here if implementing quoting service */}
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/orders")}
              disabled={createOrderMutation.isPending}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button
              type="submit"
              disabled={isLoadingDropdowns || createOrderMutation.isPending}
            >
              {createOrderMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
              )}
              {t("createOrderCta", { ns: "orders" })}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default NewOrderPage;
