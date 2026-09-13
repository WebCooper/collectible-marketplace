import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { OrdersService } from './orders.service';
import {
  CheckoutDto,
  ListOrdersDto,
  RaiseDisputeDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';

@ApiTags('transactions & orders')
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post('orders/checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check out an auction win or a fixed-price listing' })
  checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutDto) {
    return this.orders.checkout(user, dto);
  }

  @Get('orders')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase history for the current user' })
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListOrdersDto,
  ) {
    return this.orders.findMine(user, query);
  }

  @Get('orders/sales')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sales history for the current user as a seller' })
  findSales(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListOrdersDto,
  ) {
    return this.orders.findMine(user, query, true);
  }

  @Get('orders/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'One order, visible to its buyer, seller or an admin' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.orders.findOne(user, id);
  }

  @Patch('orders/:id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Advance an order: paid, shipped, completed' })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(user, id, dto);
  }

  @Post('orders/:id/disputes')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Raise a dispute for administrator review' })
  raiseDispute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RaiseDisputeDto,
  ) {
    return this.orders.raiseDispute(user, id, dto);
  }

  /**
   * The payment provider calls this, not a signed-in user, so it cannot carry
   * a JWT. Its authentication is the cryptographic signature on the payload,
   * which the gateway implementation verifies before anything is written.
   */
  @Public()
  @Post('payments/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment gateway callback (signature verified)' })
  paymentCallback(
    @Body() payload: Record<string, unknown>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.orders.handlePaymentCallback(payload, headers);
  }
}
