import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PAYMENT_GATEWAY } from './payments/payment-gateway';
import { ManualPaymentGateway } from './payments/manual-payment.gateway';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    // Member 4 swaps this for the real provider (PayHere, Stripe) by
    // implementing PaymentGateway and changing this one line.
    { provide: PAYMENT_GATEWAY, useClass: ManualPaymentGateway },
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
