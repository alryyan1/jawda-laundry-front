import { z } from "zod";
import type { ServiceOffering, PricingStrategy } from "@/types";

export const newOrderFormSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  items: z.array(
    z.object({
      id: z.string(), // For useFieldArray
      product_type_id: z.string().min(1, "Product type is required"),
      service_action_id: z.string().min(1, "Service action is required"),
      quantity: z.union([z.string(), z.number()]).transform((val) => {
        if (typeof val === 'string') {
          const num = Number(val);
          return isNaN(num) ? 0 : num;
        }
        return val;
      }).refine((val) => val >= 1, "Quantity must be at least 1"),
      product_description_custom: z.string().optional(),
      length_meters: z.union([z.string(), z.number(), z.null()]).optional(),
      width_meters: z.union([z.string(), z.number(), z.null()]).optional(),
      notes: z.string().optional(),
      _derivedServiceOffering: z.custom<ServiceOffering | null>().nullable(),
      _pricingStrategy: z.custom<PricingStrategy | null>().nullable(),
      _quoted_price_per_unit_item: z.number().nullable(),
      _quoted_sub_total: z.number().nullable(),
      _quoted_applied_unit: z.string().nullable(),
      _isQuoting: z.boolean().optional(),
      _quoteError: z.string().nullable(),
    })
  ).min(1, "At least one item is required"),
  notes: z.string().optional(),
  due_date: z.string().optional(),
});

export type NewOrderFormData = z.infer<typeof newOrderFormSchema>; 