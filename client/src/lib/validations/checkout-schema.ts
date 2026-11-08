import { z } from "zod";
import { sriLankanPhoneSchema } from "./signup-schema";

/** Shipping fields of CheckoutDto in backend/docs/openapi.json. */
export const checkoutSchema = z.object({
  shippingName: z
    .string()
    .trim()
    .min(2, "Recipient name must be at least 2 characters")
    .max(100, "Recipient name must not exceed 100 characters"),
  shippingPhone: sriLankanPhoneSchema,
  shippingAddress: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(255, "Address must not exceed 255 characters"),
  shippingCity: z.string().trim().min(1, "City is required").max(100, "City is too long"),
  shippingPostalCode: z
    .string()
    .trim()
    .min(1, "Postal code is required")
    .max(20, "Postal code is too long"),
});

export type CheckoutFormInput = z.input<typeof checkoutSchema>;
