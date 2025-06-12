// src/services/serviceOfferingService.ts
import apiClient from "@/lib/axios";
import { ServiceOffering, PaginatedResponse, PricingStrategy } from "@/types";

export interface ServiceOfferingFormData {
  product_type_id: number | string;
  service_action_id: number | string;
  name_override?: string;
  description_override?: string;
  default_price?: number | string; // Allow string for form input
  pricing_strategy: PricingStrategy;
  default_price_per_sq_meter?: number | string;
  applicable_unit?: string;
  is_active: boolean;
}

export const getServiceOfferings = async (
  page: number = 1,
  perPage: number = 10
): Promise<PaginatedResponse<ServiceOffering>> => {
  const { data } = await apiClient.get("/service-offerings", {
    params: { page, per_page: perPage },
  });
  return data;
};

export const getAllServiceOfferingsForSelect = async (): Promise<
  ServiceOffering[]
> => {
  const { data } = await apiClient.get("/service-offerings/all-for-select");
  return data.data;
};

export const getServiceOfferingById = async (
  id: string | number
): Promise<ServiceOffering> => {
  const { data } = await apiClient.get(`/service-offerings/${id}`);
  return data.data;
};

export const createServiceOffering = async (
  formData: ServiceOfferingFormData
): Promise<ServiceOffering> => {
  const payload = {
    ...formData,
    default_price: formData.default_price
      ? parseFloat(formData.default_price as string)
      : undefined,
    default_price_per_sq_meter: formData.default_price_per_sq_meter
      ? parseFloat(formData.default_price_per_sq_meter as string)
      : undefined,
  };
  const { data } = await apiClient.post("/service-offerings", payload);
  return data.data;
};

export const updateServiceOffering = async (
  id: string | number,
  formData: Partial<ServiceOfferingFormData>
): Promise<ServiceOffering> => {
  const payload = {
    ...formData,
    default_price: formData.default_price
      ? parseFloat(formData.default_price as string)
      : undefined,
    default_price_per_sq_meter: formData.default_price_per_sq_meter
      ? parseFloat(formData.default_price_per_sq_meter as string)
      : undefined,
  };
  const { data } = await apiClient.put(`/service-offerings/${id}`, payload);
  return data.data;
};

export const deleteServiceOffering = async (
  id: string | number
): Promise<void> => {
  await apiClient.delete(`/service-offerings/${id}`);
};
