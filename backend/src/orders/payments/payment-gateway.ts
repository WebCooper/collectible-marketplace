/**
 * Contract between the order module and whichever payment provider the project
 * settles on (PayHere, Stripe, a local bank gateway).
 *
 * Member 3 owns *when* a payment is started and what an order does when one
 * succeeds. Member 4 implements this interface against the real provider and
 * registers it under PAYMENT_GATEWAY; no order logic changes.
 */

export interface PaymentIntent {
  /// Provider-side reference we store on the Payment row and reconcile against.
  transactionRef: string;
  /// Where to send the buyer to authorise the payment, when the provider is
  /// redirect-based.
  redirectUrl?: string;
  /// Anything the checkout page must post to the provider's hosted form.
  formFields?: Record<string, string>;
}

export interface PaymentCallback {
  transactionRef: string;
  succeeded: boolean;
  amount: number;
  rawPayload: Record<string, unknown>;
}

export interface PaymentGateway {
  readonly provider: string;

  /// Starts a payment for an order and returns what the buyer needs to pay.
  createPayment(input: {
    orderId: string;
    amount: number;
    currency: string;
    buyerEmail: string;
    description: string;
  }): Promise<PaymentIntent>;

  /**
   * Verifies the cryptographic signature on a provider callback and normalises
   * it. Returning null means the payload failed verification and must be
   * ignored - the design report calls this out explicitly, because an
   * unverified callback would let anyone mark an order as paid.
   */
  verifyCallback(
    payload: Record<string, unknown>,
    headers: Record<string, string | string[] | undefined>,
  ): PaymentCallback | null;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
