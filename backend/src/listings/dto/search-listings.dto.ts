import { ApiPropertyOptional } from '@nestjs/swagger';
import { Category, ItemCondition, ListingType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

/// Sorting options offered on the search results page (FR 2.1.4).
export enum ListingSort {
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  ENDING_SOONEST = 'ending_soonest',
  POPULARITY = 'popularity',
}

export class SearchListingsDto extends PaginationDto {
  @ApiPropertyOptional({
    description:
      'Keyword matched against title, description, era and denomination',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: Category })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @ApiPropertyOptional({ enum: ItemCondition })
  @IsOptional()
  @IsEnum(ItemCondition)
  condition?: ItemCondition;

  @ApiPropertyOptional({ enum: ListingType })
  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @ApiPropertyOptional({ description: 'Minimum price in LKR' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price in LKR' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Only listings that passed expert review',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  verifiedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Only rare or featured collectibles' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  featuredOnly?: boolean;

  @ApiPropertyOptional({ description: 'Restrict to one seller' })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional({ enum: ListingSort, default: ListingSort.NEWEST })
  @IsOptional()
  @IsEnum(ListingSort)
  sort?: ListingSort;
}
