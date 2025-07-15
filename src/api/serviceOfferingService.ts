// src/api/serviceOfferingService.ts
import apiClient from "./apiClient";
import  type {
  ServiceOffering,
  PaginatedResponse,
  PricingStrategy, // Make sure PricingStrategy type is correctly defined and exported in your types
  ProductType, // For payload if productType/serviceAction objects are sent
  ServiceAction, // For payload
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
const preparePayload = (formData: Partial<ServiceOfferingFormData>): any => {
  const payload: any = { ...formData };

  if (formData.product_type_id !== undefined) {
    payload.product_type_id = parseInt(String(formData.product_type_id), 10);
  }
  if (formData.service_action_id !== undefined) {
    payload.service_action_id = parseInt(
      String(formData.service_action_id),
      10
    );
  }

  if (formData.default_price !== undefined) {
    payload.default_price =
      formData.default_price === "" || formData.default_price === null
        ? null
        : parseFloat(String(formData.default_price));
  }
  if (formData.default_price_per_sq_meter !== undefined) {
    payload.default_price_per_sq_meter =
      formData.default_price_per_sq_meter === "" ||
      formData.default_price_per_sq_meter === null
        ? null
        : parseFloat(String(formData.default_price_per_sq_meter));
  }
  // is_active is already boolean from Switch component
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
  }
): Promise<PaginatedResponse<ServiceOffering>> => {
  const params: any = { page, per_page: perPage, ...filters };
  // Remove undefined/null filter values
  Object.keys(params).forEach(
    (key) =>
      (params[key] === undefined || params[key] === null) && delete params[key]
  );

  const { data } = await apiClient.get<PaginatedResponse<ServiceOffering>>(
    "/service-offerings",
    { params }
  );
  return data;
};

/**
 * Fetches all active service offerings (non-paginated), typically for select dropdowns.
 * Can be filtered by product_type_id.
 */
export const getAllServiceOfferingsForSelect = async (
  productTypeId?: number | string
): Promise<ServiceOffering[]> => {
  const params: any = {};
  if (productTypeId) {
    params.product_type_id = productTypeId;
  }
  // Assuming backend /all-for-select endpoint filters by is_active=true by default
  const { data } = await apiClient.get<{ data: ServiceOffering[] }>(
    "/service-offerings/all-for-select",
    { params }
  );
  return data.data; // API ResourceCollection wraps in 'data'
};

/**
 * Fetches a single service offering by its ID.
 */
export const getServiceOfferingById = async (
  id: string | number
): Promise<ServiceOffering> => {
  const { data } = await apiClient.get<{ data: ServiceOffering }>(
    `/service-offerings/${id}`
  );
  return data.data; // API Resource wraps in 'data'
};

/**
 * Creates a new service offering.
 */
export const createServiceOffering = async (
  formData: ServiceOfferingFormData
): Promise<ServiceOffering> => {
  const payload = preparePayload(formData);
  const { data } = await apiClient.post<{ data: ServiceOffering }>(
    "/service-offerings",
    payload
  );
  return data.data;
};

/**
 * Updates an existing service offering.
 */
export const updateServiceOffering = async (
  id: string | number,
  formData: Partial<ServiceOfferingFormData>
): Promise<ServiceOffering> => {
  const payload = preparePayload(formData);
  const { data } = await apiClient.put<{ data: ServiceOffering }>(
    `/service-offerings/${id}`,
    payload
  );
  return data.data;
};

/**
 * Updates the first service offering's price for a product type.
 */
export const updateFirstOfferingPrice = async (
  productTypeId: string | number,
  defaultPrice: number
): Promise<ServiceOffering> => {
  const { data } = await apiClient.put<{ data: ServiceOffering }>(
    `/product-types/${productTypeId}/first-offering-price`,
    { default_price: defaultPrice }
  );
  return data.data;
};

/**
 * Deletes a service offering by its ID.
 * Backend returns a message object.
 */
export const deleteServiceOffering = async (
  id: string | number
): Promise<{ message: string }> => {
  const { data } = await apiClient.delete<{ message: string }>(
    `/service-offerings/${id}`
  );
  return data;
};
