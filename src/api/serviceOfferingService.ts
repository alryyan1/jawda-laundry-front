// src/api/serviceOfferingService.ts
import apiClient from "./apiClient";
import type {
  ServiceOffering,
  PaginatedResponse,
  PricingStrategy, // Make sure PricingStrategy type is correctly defined and exported in your types
} from "@/types"; // Or from specific type files e.g. '@/types/service.types'

// This interface should match the data structure expected by your form and what you send to the API
export interface ServiceOfferingFormData {
  product_type_id: number | string; // string from form, number for API
  service_action_id: number | string; // string from form, number for API
  name_override?: string | null;
  description_override?: string | null;
  default_price?: number | string | null; // string from form, number/null for API
  pricing_strategy: PricingStrategy;
  default_price_per_sq_meter?: number | string | null; // string from form, number/null for API
  applicable_unit?: string | null;
  is_active: boolean;
}

/**
 * Helper function to prepare payload for create/update.
 * Converts string IDs and prices to numbers, handles optional fields.
 */
const preparePayload = (
  formData: Partial<ServiceOfferingFormData>,
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    ...formData,
    product_type_id:
      formData.product_type_id !== undefined
        ? parseInt(String(formData.product_type_id), 10)
        : undefined,
    service_action_id:
      formData.service_action_id !== undefined
        ? parseInt(String(formData.service_action_id), 10)
        : undefined,
    default_price:
      formData.default_price !== undefined
        ? formData.default_price === "" || formData.default_price === null
          ? null
          : parseFloat(String(formData.default_price))
        : undefined,
    default_price_per_sq_meter:
      formData.default_price_per_sq_meter !== undefined
        ? formData.default_price_per_sq_meter === "" ||
          formData.default_price_per_sq_meter === null
          ? null
          : parseFloat(String(formData.default_price_per_sq_meter))
        : undefined,
  };

  // Remove undefined values that might result from conditional assignments
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};

/**
 * Fetches a paginated list of service offerings.
 */
export const getServiceOfferings = async (
  page: number = 1,
  perPage: number = 10,
  filters?: {
    product_type_id?: number | string;
    service_action_id?: number | string;
    is_active?: boolean;
    search?: string;
  },
): Promise<PaginatedResponse<ServiceOffering>> => {
  const params: Record<string, unknown> = {
    page,
    per_page: perPage,
    ...filters,
  };
  // Remove undefined/null filter values
  Object.keys(params).forEach(
    (key) =>
      (params[key] === undefined || params[key] === null) && delete params[key],
  );

  const { data } = await apiClient.get<PaginatedResponse<ServiceOffering>>(
    "/service-offerings",
    { params },
  );
  return data;
};

/**
 * Fetches all active service offerings (non-paginated), typically for select dropdowns.
 * Can be filtered by product_type_id.
 */
export const clearServiceOfferingsCache = () => {
  // Find all keys starting with service_offerings_select_ and remove them
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("service_offerings_select_")) {
      localStorage.removeItem(key);
      i--; // Adjust index after removal
    }
  }
};

export const getAllServiceOfferingsForSelect = async (
  productTypeId?: number | string,
): Promise<ServiceOffering[]> => {
  const cacheKey = productTypeId
    ? `service_offerings_select_${productTypeId}`
    : "service_offerings_select_all";

  // Check localStorage cache
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      // Cache for 24 hours
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return data as ServiceOffering[];
      }
    } catch (e) {
      console.warn("Parsed cached service offerings failed", e);
    }
  }

  const params: Record<string, unknown> = {};
  if (productTypeId) {
    params.product_type_id = productTypeId;
  }
  // Assuming backend /all-for-select endpoint filters by is_active=true by default
  const { data } = await apiClient.get<{ data: ServiceOffering[] }>(
    "/service-offerings/all-for-select",
    { params },
  );

  // Store in localStorage
  localStorage.setItem(
    cacheKey,
    JSON.stringify({
      data: data.data,
      timestamp: Date.now(),
    }),
  );

  return data.data; // API ResourceCollection wraps in 'data'
};

/**
 * Fetches a single service offering by its ID.
 */
export const getServiceOfferingById = async (
  id: string | number,
): Promise<ServiceOffering> => {
  const { data } = await apiClient.get<{ data: ServiceOffering }>(
    `/service-offerings/${id}`,
  );
  return data.data; // API Resource wraps in 'data'
};

/**
 * Creates a new service offering.
 */
export const createServiceOffering = async (
  formData: ServiceOfferingFormData,
): Promise<ServiceOffering> => {
  const payload = preparePayload(formData);
  const { data } = await apiClient.post<{ data: ServiceOffering }>(
    "/service-offerings",
    payload,
  );
  clearServiceOfferingsCache();
  return data.data;
};

/**
 * Updates an existing service offering.
 */
export const updateServiceOffering = async (
  id: string | number,
  formData: Partial<ServiceOfferingFormData>,
): Promise<ServiceOffering> => {
  const payload = preparePayload(formData);
  const { data } = await apiClient.put<{ data: ServiceOffering }>(
    `/service-offerings/${id}`,
    payload,
  );
  clearServiceOfferingsCache();
  return data.data;
};

/**
 * Updates the first service offering's price for a product type.
 */
export const updateFirstOfferingPrice = async (
  productTypeId: string | number,
  defaultPrice: number,
): Promise<ServiceOffering> => {
  const { data } = await apiClient.put<{ data: ServiceOffering }>(
    `/product-types/${productTypeId}/first-offering-price`,
    { default_price: defaultPrice },
  );
  clearServiceOfferingsCache();
  return data.data;
};

/**
 * Deletes a service offering by its ID.
 * Backend returns a message object.
 */
export const deleteServiceOffering = async (
  id: string | number,
): Promise<{ message: string }> => {
  const { data } = await apiClient.delete<{ message: string }>(
    `/service-offerings/${id}`,
  );
  clearServiceOfferingsCache();
  return data;
};
