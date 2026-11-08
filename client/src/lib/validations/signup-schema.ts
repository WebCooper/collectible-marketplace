import { z } from "zod";

/**
 * Password rules enforced by the API (RegisterDto / ResetPasswordDto):
 * 8-72 characters with a lowercase letter, an uppercase letter and a digit.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must not exceed 72 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

/** Sri Lankan number: +94XXXXXXXXX or 0XXXXXXXXX (spaces and dashes allowed). */
const SRI_LANKAN_PHONE = /^(?:\+94|0)\d{9}$/;

/**
 * Strips spaces/dashes and converts a local 0XXXXXXXXX number to E.164
 * (+94XXXXXXXXX), so every stored number has the format SMS providers need.
 * Returns "" for empty input and leaves anything unrecognised for the
 * validator to reject.
 */
export function normalizeSriLankanPhone(value: string): string {
  const compact = value.replace(/[\s-]/g, "");
  return /^0\d{9}$/.test(compact) ? `+94${compact.slice(1)}` : compact;
}

export const sriLankanPhoneSchema = z
  .string()
  .transform(normalizeSriLankanPhone)
  .refine((value) => SRI_LANKAN_PHONE.test(value), {
    message: "Enter a Sri Lankan number, e.g. +94771234567",
  });

/** Mirrors RegisterDto in backend/docs/openapi.json, plus UI-only checks. */
export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must not exceed 100 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Email address is required")
      .email("Please enter a valid email address"),
    // Optional: empty stays empty, anything else must be a valid number.
    phone: z
      .string()
      .transform(normalizeSriLankanPhone)
      .refine((value) => value === "" || SRI_LANKAN_PHONE.test(value), {
        message: "Enter a Sri Lankan number, e.g. +94771234567",
      }),
    role: z.enum(["BUYER", "SELLER"]),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms of service and provenance policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupFormInput = z.input<typeof signupSchema>;
export type SignupFormData = z.output<typeof signupSchema>;

export const otpSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your e-mail"),
});
