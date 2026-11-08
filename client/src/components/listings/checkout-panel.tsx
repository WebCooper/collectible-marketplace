"use client";

import React, { useState } from "react";
import { CheckCircle2, CreditCard, Truck } from "lucide-react";
import { errorMessage, ordersApi, type CheckoutResponse } from "@/lib/api";
import { checkoutSchema, type CheckoutFormInput } from "@/lib/validations/checkout-schema";
import { apiFormErrors, zodFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { useAuth } from "@/providers/auth-provider";
import { formatLKR } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type Field = keyof CheckoutFormInput;

const FIELDS: { name: Field; label: string; placeholder: string; autoComplete: string }[] = [
  { name: "shippingName", label: "Recipient Name", placeholder: "Kamala Silva", autoComplete: "name" },
  { name: "shippingPhone", label: "Mobile Number", placeholder: "+94771234567", autoComplete: "tel" },
  { name: "shippingAddress", label: "Address", placeholder: "42 Galle Road", autoComplete: "street-address" },
  { name: "shippingCity", label: "City", placeholder: "Colombo", autoComplete: "address-level2" },
  { name: "shippingPostalCode", label: "Postal Code", placeholder: "00300", autoComplete: "postal-code" },
];

/**
 * POST /orders/checkout for an auction win (`auctionId`) or a fixed-price
 * listing (`listingId`) - exactly one must be given. The API reserves the
 * item immediately and returns the payment reference.
 */
export function CheckoutPanel({
  auctionId,
  listingId,
  onCompleted,
}: {
  auctionId?: string;
  listingId?: string;
  onCompleted?: (result: CheckoutResponse) => void;
}) {
  const { user } = useAuth();
  const [values, setValues] = useState<CheckoutFormInput>({
    shippingName: user?.name ?? "",
    shippingPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingPostalCode: "",
  });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CheckoutResponse | null>(null);
  const [paymentNote, setPaymentNote] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = checkoutSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors<Field>(parsed.error));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await ordersApi.checkout({
        ...(auctionId ? { auctionId } : { listingId }),
        ...parsed.data,
      });
      setResult(response);
      onCompleted?.(response);
      // A hosted payment page, when the configured provider uses one.
      if (response.payment.redirectUrl) window.location.assign(response.payment.redirectUrl);
    } catch (error) {
      const mapped = apiFormErrors<Field>(
        error,
        Object.fromEntries(FIELDS.map((f) => [f.name, f.name])) as Record<string, Field>,
      );
      setErrors(mapped.fieldErrors);
      setFormError(mapped.formError);
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Development only: confirm the payment through the `manual` gateway. */
  const simulatePayment = async () => {
    if (!result) return;
    setIsSimulating(true);
    try {
      await ordersApi.paymentCallback({
        transactionRef: result.payment.transactionRef,
        status: "succeeded",
      });
      setPaymentNote("Payment confirmed - the order is now PAID and the seller has been notified.");
    } catch (error) {
      setPaymentNote(errorMessage(error, "The payment callback was rejected."));
    } finally {
      setIsSimulating(false);
    }
  };

  if (result) {
    const isManual = result.payment.transactionRef.startsWith("manual_");
    return (
      <div className="rounded-2xl border border-cyan-400/40 bg-cyan-950/40 p-5 space-y-3">
        <div className="flex items-center gap-2 text-cyan-300">
          <CheckCircle2 className="h-5 w-5" />
          <h3 className="font-serif text-lg font-bold text-white">Order placed</h3>
        </div>
        <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
          <dt className="text-zinc-400">Amount</dt>
          <dd className="text-right font-mono text-[#f1d27a]">{formatLKR(result.order.amount)}</dd>
          <dt className="text-zinc-400">Order status</dt>
          <dd className="text-right font-mono text-zinc-200">{result.order.status}</dd>
          <dt className="text-zinc-400">Payment reference</dt>
          <dd className="text-right font-mono text-zinc-200 truncate" title={result.payment.transactionRef}>
            {result.payment.transactionRef}
          </dd>
        </dl>
        <p className="text-xs text-zinc-400">
          The item is reserved for you. The order moves to PAID once the payment provider confirms.
        </p>
        {isManual && process.env.NODE_ENV !== "production" && (
          <div className="space-y-2 border-t border-white/10 pt-3">
            <p className="text-[11px] text-zinc-500">
              Development: the backend uses its manual payment gateway, which waits for a callback.
            </p>
            <Button
              variant="outline"
              size="sm"
              isLoading={isSimulating}
              disabled={paymentNote !== null}
              onClick={simulatePayment}
              className="w-full text-xs gap-1.5"
            >
              <CreditCard className="h-3.5 w-3.5" /> Simulate successful payment
            </Button>
            {paymentNote && <Alert variant="info">{paymentNote}</Alert>}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Truck className="h-4 w-4 text-[#f1d27a]" /> Shipping details
      </div>
      {formError && <Alert variant="error">{formError}</Alert>}
      {FIELDS.map((field) => (
        <div key={field.name}>
          <Label htmlFor={field.name} required>
            {field.label}
          </Label>
          <Input
            id={field.name}
            name={field.name}
            autoComplete={field.autoComplete}
            placeholder={field.placeholder}
            value={values[field.name]}
            onChange={(e) => {
              setValues((prev) => ({ ...prev, [field.name]: e.target.value }));
              setErrors((prev) => ({ ...prev, [field.name]: undefined }));
            }}
            error={errors[field.name]}
          />
        </div>
      ))}
      <Button
        type="submit"
        variant="gold"
        isLoading={isSubmitting}
        className="w-full text-xs uppercase tracking-wider font-semibold"
      >
        Place Order
      </Button>
    </form>
  );
}
