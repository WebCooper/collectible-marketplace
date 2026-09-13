import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateAuctionDto {
  @ApiProperty({ example: 18500, description: 'Opening price in LKR' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  startPrice: number;

  @ApiProperty({ example: 500, description: 'Smallest permitted raise in LKR' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  minIncrement: number;

  @ApiPropertyOptional({
    description: 'When bidding opens. Defaults to immediately.',
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiProperty({ description: 'When bidding closes' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({
    example: 35000,
    description: 'Optional Buy Now price that ends the auction at once',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  buyNowPrice?: number;
}

export class PlaceBidDto {
  @ApiProperty({ example: 20000, description: 'Bid amount in LKR' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number;
}

export class BidHistoryDto extends PaginationDto {}
