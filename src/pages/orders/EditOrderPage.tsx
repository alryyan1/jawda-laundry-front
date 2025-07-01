// src/pages/orders/EditOrderPage.tsx
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FormProvider,
  useForm,
  useFieldArray,
} from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";

// Layout & Child Components
import { OrderCart } from "@/features/orders/components/wizard/OrderCart";

// Schema, Types, and Services
import type {
  NewOrderFormData,
  ServiceOffering,
  Order,
  OrderItemFormLine,
  OrderItem,
} from "@/types";
import { getAllServiceOfferingsForSelect } from "@/api/serviceOfferingService";
import {
  getOrderById,
  updateOrder,
} from "@/api/orderService";
import { Loader2, ArrowLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

const EditOrderPage: React.FC = () => {
  const { t } = useTranslation(["common", "orders", "services", "validation"]);
  const navigate = useNavigate();
  const { id: orderId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const methods = useForm<NewOrderFormData>({
    defaultValues: { customer_id: "", items: [], notes: "", due_date: "" },
  });
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = methods;

  const { fields, remove } = useFieldArray({ control, name: "items" });

  const {
    data: existingOrder,
    isLoading: isLoadingOrder,
    error: loadingError,
  } = useQuery<Order, Error>({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById(orderId!),
    enabled: !!orderId,
  });

  const { data: allServiceOfferings = [] } = useQuery<ServiceOffering[], Error>(
    {
      queryKey: ["allServiceOfferingsForSelect"],
      queryFn: () => getAllServiceOfferingsForSelect(),
    }
  );

  const updateOrderMutation = useMutation<Order, Error, NewOrderFormData>({
    mutationFn: (formData) =>
      updateOrder(orderId!, formData, allServiceOfferings),
    onSuccess: (data) => {
      toast.success(
        t("orderUpdatedSuccess", {
          ns: "orders",
          orderNumber: data.order_number,
        })
      );
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.setQueryData(["order", orderId], data);
      navigate(`/orders/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || t("orderUpdateFailed", { ns: "orders" }));
    },
  });

  useEffect(() => {
    if (existingOrder && allServiceOfferings.length > 0) {
      const formItems: OrderItemFormLine[] = existingOrder.items.map(
        (backendItem: OrderItem) => {
          const offeringDetails =
            allServiceOfferings.find(
              (so) => so.id === backendItem.service_offering_id
            ) || backendItem.serviceOffering;
          const clientSideId = uuidv4();

          return {
            id: clientSideId,
            service_offering_id: backendItem.service_offering_id,
            product_type_id: offeringDetails?.product_type_id.toString() || "",
            service_action_id:
              offeringDetails?.service_action_id.toString() || "",
            quantity: backendItem.quantity,
            product_description_custom:
              backendItem.product_description_custom || "",
            length_meters: backendItem.length_meters?.toString() || "",
            width_meters: backendItem.width_meters?.toString() || "",
            notes: backendItem.notes || "",
            _derivedServiceOffering: offeringDetails || null,
            _pricingStrategy: offeringDetails?.productType?.is_dimension_based
              ? "dimension_based"
              : "fixed",
            _quoted_price_per_unit_item:
              backendItem.calculated_price_per_unit_item,
            _quoted_sub_total: backendItem.sub_total,
            _quoted_applied_unit: offeringDetails?.applicable_unit || null,
            _isQuoting: false,
            _quoteError: null,
          };
        }
      );

      reset({
        customer_id: existingOrder.customer_id.toString(),
        items: formItems,
        notes: existingOrder.notes || "",
        due_date: existingOrder.due_date
          ? format(new Date(existingOrder.due_date), "yyyy-MM-dd")
          : "",
      });
    }
  }, [existingOrder, allServiceOfferings, reset]);

  const handleEditItem = () => {
    toast.info(t('editItemNotAvailable', { ns: 'orders', defaultValue: 'Item editing not available in edit mode' }));
  };

  const onSubmit = (data: NewOrderFormData) => {
    if (!isDirty) {
      toast.info(t("noChangesToSave", { ns: "orders" }));
      return;
    }
    updateOrderMutation.mutate(data);
  };

  if (isLoadingOrder) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">
          {t("loadingOrder", { ns: "orders" })}
        </p>
      </div>
    );
  }
  if (loadingError)
    return (
      <div className="p-8 text-destructive text-center">
        {t("errorLoadingOrder", { ns: "orders" })}: {loadingError.message}
      </div>
    );
  if (!existingOrder)
    return (
      <div className="p-8 text-center">
        {t("orderNotFound", { ns: "orders" })}
      </div>
    );

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col h-screen bg-muted/30 overflow-hidden">
        <header className="shrink-0 p-4 border-b bg-card flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild className="h-9 w-9">
              <Link to={`/orders/${orderId}`}>
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">
                  {t("backToOrderDetails", { ns: "orders" })}
                </span>
              </Link>
            </Button>
            <ShoppingCart className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-lg font-semibold leading-none">
                {t("editOrderTitle", {
                  ns: "orders",
                  orderNumber: existingOrder.order_number,
                })}
              </h1>
              <p className="text-sm text-muted-foreground">
                {existingOrder.customer.name}
              </p>
            </div>
          </div>
        </header>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-grow overflow-hidden"
        >
          <main className="w-full h-full">
            <OrderCart
              control={control}
              errors={errors}
              fields={fields}
              remove={remove}
              onEditItem={handleEditItem}
              onNewOrderClick={() => navigate("/orders/new")}
              isSubmitting={updateOrderMutation.isPending}
              isEditing={true}
            />
          </main>
        </form>
      </div>
    </FormProvider>
  );
};

export default EditOrderPage;
