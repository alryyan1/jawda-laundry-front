// src/pages/orders/schemas/newOrderSchema.ts
import { z } from 'zod';
import type { ServiceOffering, PricingStrategy } from '@/types';

// Zod Schema for an individual item line within the form.
// This validates the data structure that react-hook-form manages for each item.
export const orderItemFormLineSchema = z.object({
    // Client-side ID for react-hook-form's useFieldArray key. Required.
    id: z.string(),

    // Required by backend API
    service_offering_id: z.union([z.string(), z.number()]).transform(val => 
        typeof val === 'string' ? (val === '' ? undefined : Number(val)) : val
    ).refine(val => val !== undefined && !isNaN(val as number), {
        message: "validation.serviceOfferingRequired"
    }),

    // User-selected IDs from dropdowns.
    product_type_id: z.string().min(1, { message: "validation.productTypeRequired" }),
    service_action_id: z.string().min(1, { message: "validation.serviceActionRequired" }),

    // Optional user inputs for the item.
    product_description_custom: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),

    // Quantity input. Preprocess handles empty strings from the input field.
    quantity: z.preprocess(
        (val) => (val === "" || val === null || val === undefined || Number.isNaN(parseInt(String(val)))) ? 1 : parseInt(String(val), 10),
        z.number({ invalid_type_error: "validation.quantityMustBeNumber" }).min(1, { message: "validation.quantityMin" })
    ),

    // Dimension inputs. Preprocess handles empty strings.
    length_meters: z.preprocess(
        (val) => (val === "" || val === null || val === undefined || Number.isNaN(parseFloat(String(val)))) ? undefined : parseFloat(String(val)),
        z.number({ invalid_type_error: "validation.dimensionInvalid" }).min(0, { message: "validation.dimensionPositive" }).optional()
    ),
    width_meters: z.preprocess(
        (val) => (val === "" || val === null || val === undefined || Number.isNaN(parseFloat(String(val)))) ? undefined : parseFloat(String(val)),
        z.number({ invalid_type_error: "validation.dimensionInvalid" }).min(0, { message: "validation.dimensionPositive" }).optional()
    ),

    // Client-side state fields managed by useEffect/mutations.
    // They are optional in the schema because they are populated programmatically.
    _derivedServiceOffering: z.custom<ServiceOffering | null | undefined>().optional(),
    _pricingStrategy: z.custom<PricingStrategy | null | undefined>().optional(),
    _quoted_price_per_unit_item: z.number().optional().nullable(),
    _quoted_sub_total: z.number().optional().nullable(),
    _quoted_applied_unit: z.string().optional().nullable(),
    _isQuoting: z.boolean().optional(),
    _quoteError: z.string().optional().nullable(),
})
.refine(data => {
    // Custom validation: If the pricing strategy derived from the offering is 'dimension_based',
    // then length and width must be provided and be greater than 0.
    if (data._derivedServiceOffering?.productType?.is_dimension_based) { // Using the memorized productType flag
        const length = data.length_meters ? Number(data.length_meters) : 0;
        const width = data.width_meters ? Number(data.width_meters) : 0;
        return length > 0 && width > 0;
    }
    return true; // If not dimension-based, this rule passes.
}, {
    // This message will be attached to a specific field if the path is set.
    message: "validation.dimensionsRequiredForStrategy",
    path: ["length_meters"], // Attach error message to the 'length_meters' field for better UX.
});

// Zod Schema for the entire new order form.
export const newOrderFormSchema = z.object({
    customer_id: z.string().min(1, { message: "validation.customerRequired" }),
    items: z.array(orderItemFormLineSchema).min(1, { message: "validation.atLeastOneItem" }),
    notes: z.string().optional().or(z.literal('')),
    due_date: z.string().optional().refine(val => {
        // Allow empty string, but if a value exists, it must be a valid date.
        if (!val || val === '') return true;
        return !isNaN(Date.parse(val));
    }, {
        message: "validation.invalidDate"
    }).or(z.literal('')),
});