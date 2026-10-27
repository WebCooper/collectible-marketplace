import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category, ItemCondition, ListingType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ListingImageDto {
  @ApiProperty({ description: 'Object URL returned by the storage service' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ description: 'Display order, 0 is the cover image' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;
}

export class CertificateInputDto {
  @ApiProperty({ description: 'Object URL of the uploaded certificate' })
  @IsUrl()
  fileUrl: string;

  @ApiProperty({ example: 'ncs-certificate-1957.pdf' })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiPropertyOptional({ example: 'Numismatic Society of Sri Lanka' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  issuer?: string;
}

export class CreateListingDto {
  @ApiProperty({ example: '1957 Ceylon 5 Rupee Commemorative Coin' })
  @IsString()
  @MinLength(5)
  @MaxLength(150)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description: string;

  @ApiProperty({ enum: Category })
  @IsEnum(Category)
  category: Category;

  @ApiProperty({ enum: ItemCondition })
  @IsEnum(ItemCondition)
  condition: ItemCondition;

  @ApiPropertyOptional({ example: '1957', description: 'Era or year of issue' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  era?: string;

  @ApiPropertyOptional({ example: '5 Rupees' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  denomination?: string;

  @ApiProperty({ example: 18500, description: 'Price in LKR' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  startingPrice: number;

  @ApiPropertyOptional({ enum: ListingType, default: ListingType.FIXED_PRICE })
  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @ApiPropertyOptional({
    type: [ListingImageDto],
    description: 'Multiple angles showing the item condition',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ListingImageDto)
  images?: ListingImageDto[];

  @ApiPropertyOptional({
    type: [CertificateInputDto],
    description: 'Authenticity certificates submitted for appraiser review',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => CertificateInputDto)
  certificates?: CertificateInputDto[];
}
