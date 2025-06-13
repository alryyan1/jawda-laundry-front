// src/pages/services/offerings/EditServiceOfferingPage.tsx
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft } from "lucide-react";

import type { ProductType, ServiceAction, PricingStrategy, ServiceOffering } from "@/types";
import { getAllProductTypes } from "@/api/productTypeService";
import { getServiceActions } from "@/api/serviceActionService";
import {
  getServiceOfferingById,
  updateServiceOffering,
} from "@/api/serviceOfferingService";
import { serviceOfferingSchema } from "./NewServiceOfferingPage";

// Define the form data type that matches the schema
type FormData = {
  product_type_id: string;
  service_action_id: string;
  name_override: string;
  description_override: string;
  default_price?: string;
  pricing_strategy: PricingStrategy;
  default_price_per_sq_meter?: string;
  applicable_unit: string;
  is_active: boolean;
};

const EditServiceOfferingPage: React.FC = () => {
  const { t } = useTranslation(["common", "services", "validation"]);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // --- Data Fetching for Form Selects ---
  const { data: productTypes = [], isLoading: isLoadingPT } = useQuery<ProductType[], Error>({
    queryKey: ["allProductTypesForSelect"],
    queryFn: () => getAllProductTypes(),
  });

  const { data: serviceActions = [], isLoading: isLoadingSA } = useQuery<ServiceAction[], Error>({
    queryKey: ["serviceActionsForSelect"],
    queryFn: () => getServiceActions(),
  });

  // --- Data Fetching for the Service Offering to Edit ---
  const {
    data: existingOffering,
    isLoading: isLoadingExisting,
    error: loadingError,
  } = useQuery<ServiceOffering, Error>({
    queryKey: ["serviceOffering", id],
    queryFn: () => getServiceOfferingById(id!),
    enabled: !!id,
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(serviceOfferingSchema),
    defaultValues: {
      is_active: true,
      pricing_strategy: "fixed" as PricingStrategy,
      name_override: "",
      description_override: "",
      applicable_unit: "",
      default_price: "",
      default_price_per_sq_meter: "",
      product_type_id: "",
      service_action_id: "",
    },
  });

  // Pre-fill form when existingOffering data is loaded
  useEffect(() => {
    if (existingOffering) {
      reset({
        product_type_id: existingOffering.product_type_id.toString(),
        service_action_id: existingOffering.service_action_id.toString(),
        name_override: existingOffering.name_override || "",
        description_override: existingOffering.description_override || "",
        pricing_strategy: existingOffering.pricing_strategy,
        default_price: existingOffering.default_price?.toString() || "",
        default_price_per_sq_meter: existingOffering.default_price_per_sq_meter?.toString() || "",
        applicable_unit: existingOffering.applicable_unit || "",
        is_active: existingOffering.is_active,
      });
    }
  }, [existingOffering, reset]);

  const watchedPricingStrategy = watch("pricing_strategy");

  const mutation = useMutation<ServiceOffering, Error, FormData>({
    mutationFn: (formData) => updateServiceOffering(id!, formData),
    onSuccess: (data) => {
      toast.success(
        t("serviceOfferingUpdatedSuccess", {
          ns: "services",
          name: data.display_name,
        })
      );
      queryClient.invalidateQueries({ queryKey: ["serviceOfferings"] });
      queryClient.invalidateQueries({ queryKey: ["serviceOffering", id] });
      queryClient.invalidateQueries({
        queryKey: ["serviceOfferingsForSelect"],
      });
      navigate("/service-offerings");
    },
    onError: (error) => {
      toast.error(
        error.message || t("serviceOfferingUpdateFailed", { ns: "services" })
      );
    },
  });

  const onSubmit: SubmitHandler<FormData> = (formData) => {
    mutation.mutate(formData);
  };

  const isLoadingDropdowns = isLoadingPT || isLoadingSA;

  if (isLoadingExisting)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ms-2">
          {t("loadingOfferingDetails", { ns: "services" })}
        </p>
      </div>
    );

  if (loadingError)
    return (
      <div className="text-center py-10">
        <p className="text-destructive text-lg">
          {t("errorLoading", { ns: "common" })}
        </p>
        <p className="text-muted-foreground">{loadingError.message}</p>
        <Button asChild className="mt-4">
          <Link to="/service-offerings">
            {t("backToOfferings", { ns: "services" })}
          </Link>
        </Button>
      </div>
    );

  if (!existingOffering)
    return (
      <div className="text-center py-10">
        <p className="text-lg">{t("offeringNotFound", { ns: "services" })}</p>
        <Button asChild className="mt-4">
          <Link to="/service-offerings">
            {t("backToOfferings", { ns: "services" })}
          </Link>
        </Button>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/service-offerings">
            <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {t("backToOfferings", { ns: "services" })}
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {t("editServiceOfferingTitle", {
              ns: "services",
              name: existingOffering.display_name,
            })}
          </CardTitle>
          <CardDescription>
            {t("editServiceOfferingDescription", { ns: "services" })}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Product Type */}
            <div className="grid gap-1.5">
              <Label htmlFor="product_type_id">
                {t("productType", { ns: "services" })}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="product_type_id"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value?.toString() || ""}
                    disabled={isLoadingDropdowns}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingPT
                            ? t("loading")
                            : t("selectProductType", { ns: "services" })
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map((pt: ProductType) => (
                        <SelectItem key={pt.id} value={pt.id.toString()}>
                          {pt.name} ({pt.category?.name || "N/A"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.product_type_id && (
                <p className="text-sm text-destructive">
                  {t(errors.product_type_id.message as string)}
                </p>
              )}
            </div>

            {/* Service Action */}
            <div className="grid gap-1.5">
              <Label htmlFor="service_action_id">
                {t("serviceAction", { ns: "services" })}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="service_action_id"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value?.toString() || ""}
                    disabled={isLoadingDropdowns}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingSA
                            ? t("loading")
                            : t("selectServiceAction", { ns: "services" })
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceActions.map((sa: ServiceAction) => (
                        <SelectItem key={sa.id} value={sa.id.toString()}>
                          {sa.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.service_action_id && (
                <p className="text-sm text-destructive">
                  {t(errors.service_action_id.message as string)}
                </p>
              )}
            </div>

            {/* Pricing Strategy */}
            <div className="grid gap-1.5">
              <Label htmlFor="pricing_strategy">
                {t("pricingStrategy", { ns: "services" })}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="pricing_strategy"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("selectPricingStrategy", {
                          ns: "services",
                        })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "fixed",
                        "per_unit_product",
                        "dimension_based",
                        "customer_specific",
                      ].map((ps) => (
                        <SelectItem key={ps} value={ps}>
                          {t(`strategy.${ps}`, { ns: "services" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.pricing_strategy && (
                <p className="text-sm text-destructive">
                  {t(errors.pricing_strategy.message as string)}
                </p>
              )}
            </div>

            {/* Default Price Input */}
            {(watchedPricingStrategy === "fixed" ||
              watchedPricingStrategy === "per_unit_product") && (
              <div className="grid gap-1.5">
                <Label htmlFor="default_price">
                  {t("defaultPriceForItem", { ns: "services" })}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="default_price"
                  type="number"
                  step="0.01"
                  {...register("default_price")}
                  placeholder="e.g., 10.50"
                />
                {errors.default_price && (
                  <p className="text-sm text-destructive">
                    {t(errors.default_price.message as string)}
                  </p>
                )}
              </div>
            )}

            {/* Default Price Per Sq Meter Input */}
            {watchedPricingStrategy === "dimension_based" && (
              <div className="grid gap-1.5">
                <Label htmlFor="default_price_per_sq_meter">
                  {t("defaultPricePerSqMeter", { ns: "services" })}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="default_price_per_sq_meter"
                  type="number"
                  step="0.01"
                  {...register("default_price_per_sq_meter")}
                  placeholder="e.g., 5.00"
                />
                {errors.default_price_per_sq_meter && (
                  <p className="text-sm text-destructive">
                    {t(errors.default_price_per_sq_meter.message as string)}
                  </p>
                )}
              </div>
            )}

            {/* Optional Overrides & Details */}
            <div className="grid gap-1.5">
              <Label htmlFor="name_override">
                {t("nameOverrideOptional", { ns: "services" })}
              </Label>
              <Input
                id="name_override"
                {...register("name_override")}
                placeholder={t("nameOverridePlaceholder", { ns: "services" })}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="description_override">
                {t("descriptionOverrideOptional", { ns: "services" })}
              </Label>
              <Textarea
                id="description_override"
                {...register("description_override")}
                rows={2}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="applicable_unit">
                {t("applicableUnitOptional", { ns: "services" })}
              </Label>
              <Input
                id="applicable_unit"
                {...register("applicable_unit")}
                placeholder={t("applicableUnitPlaceholder", { ns: "services" })}
              />
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="is_active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="is_active">
                {t("isActive", { ns: "services" })}
              </Label>
            </div>
            {errors.root?.message && (
              <p className="text-sm text-destructive">
                {t(errors.root.message as string)}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/service-offerings")}
              disabled={mutation.isPending}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button
              type="submit"
              disabled={
                mutation.isPending || isLoadingDropdowns || isLoadingExisting
              }
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
              )}
              {t("saveChanges", { ns: "common" })}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default EditServiceOfferingPage;
