import type { ZodError } from "zod";
import { ApiError, errorMessage } from "@/lib/api";

export type FieldErrors<F extends string> = Partial<Record<F, string>>;

/** First Zod issue per field. */
export function zodFieldErrors<F extends string>(error: ZodError): FieldErrors<F> {
  const result: FieldErrors<F> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as F | undefined;
    if (field && !result[field]) result[field] = issue.message;
  }
  return result;
}

/**
 * Splits an API error into per-field messages and a form-level message.
 *
 * NestJS validation messages start with the DTO property name
 * ("phone must be a valid phone number"), so a message is attached to a form
 * field when it begins with that field's API name. `fieldMap` maps API names
 * to form field names when they differ.
 */
export function apiFormErrors<F extends string>(
  error: unknown,
  fieldMap: Record<string, F>,
): { fieldErrors: FieldErrors<F>; formError: string | null } {
  if (!(error instanceof ApiError) || error.status !== 400) {
    return { fieldErrors: {}, formError: errorMessage(error) };
  }

  const fieldErrors: FieldErrors<F> = {};
  const unmatched: string[] = [];
  for (const message of error.messages) {
    const apiField = message.split(" ")[0];
    const field = fieldMap[apiField];
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = message.charAt(0).toUpperCase() + message.slice(1);
    } else {
      unmatched.push(message);
    }
  }
  return {
    fieldErrors,
    formError: unmatched.length ? unmatched.join(" ") : null,
  };
}
