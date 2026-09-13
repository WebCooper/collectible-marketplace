import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CheckoutDto {
  @ApiPropertyOptional({
    description: 'Auction won by the buyer. Omit for a fixed-price purchase.',
  })
  @IsOptional()
  @IsUUID()
  auctionId?: string;

  @ApiPropertyOptional({
    description: 'Fixed-price listing being bought. Omit when checking out an auction win.',
  })
  @IsOptional()
  @IsUUID()
  listingId?: string;

  @ApiProperty({ example: 'Kamala Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  shippingName: string;

  @ApiProperty({ example: '+94771234567' })
  @IsPhoneNumber('LK')
  shippingPhone: string;

  @ApiProperty({ example: '42 Galle Road' })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  shippingAddress: string;

  @ApiProperty({ example: 'Colombo' })
  @IsString()
  @MaxLength(100)
  shippingCity: string;

  @ApiProperty({ example: '00300' })
  @IsString()
  @MaxLength(20)
  shippingPostalCode: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Courier tracking number when shipping' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string;
}

export class RaiseDisputeDto {
  @ApiProperty({ example: 'Item does not match the listing description' })
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;
}

export class ListOrdersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
