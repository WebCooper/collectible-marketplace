import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  PaymentCallback,
  PaymentGateway,
  PaymentIntent,
} from './payment-gateway';

/**
 * Stand-in gateway used until Member 4 wires a real provider.
 *
 * It issues a reference and accepts any callback carrying that reference, so
 * the whole checkout path - order, payment row, status transitions,
 * notifications - can be exercised end to end in development. It deliberately
 * refuses to run outside development, because accepting unsigned callbacks in
 * production would let anyone mark an order as paid.
 */
@Injectable()
export class ManualPaymentGateway implements PaymentGateway {
  readonly provider = 'manual';
  private readonly logger = new Logger(ManualPaymentGateway.name);

  createPayment(input: {
    orderId: string;
    amount: number;
  }): Promise<PaymentIntent> {
    const transactionRef = `manual_${randomUUID()}`;
    this.logger.warn(
      `Manual payment ${transactionRef} for order ${input.orderId} (LKR ${input.amount}). ` +
        'Confirm it by posting the reference to /payments/callback.',
    );
    return Promise.resolve({ transactionRef });
  }

  verifyCallback(payload: Record<string, unknown>): PaymentCallback | null {
    if (process.env.NODE_ENV === 'production') {
      this.logger.error(
        'The manual gateway must not be used in production; configure a real provider.',
      );
      return null;
    }

    const transactionRef = payload.transactionRef;
    if (typeof transactionRef !== 'string') return null;

    return {
      transactionRef,
      succeeded: payload.status !== 'failed',
      amount: payload.amount === undefined ? null : Number(payload.amount),
      rawPayload: payload,
    };
  }
}
