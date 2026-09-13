import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationDecision } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class UploadCertificateDto {
  @ApiProperty({ description: 'Object URL returned by the storage service' })
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

export class VerificationDecisionDto {
  @ApiProperty({ enum: VerificationDecision })
  @IsEnum(VerificationDecision)
  decision: VerificationDecision;

  @ApiPropertyOptional({ description: 'Certificate this decision refers to' })
  @IsOptional()
  @IsUUID()
  certificateId?: string;

  @ApiPropertyOptional({
    description:
      'Required when rejecting or requesting more evidence, so the seller knows why',
  })
  @ValidateIf(
    (dto: VerificationDecisionDto) =>
      dto.decision !== VerificationDecision.APPROVED,
  )
  @IsString()
  @MaxLength(1000)
  comments?: string;

  @ApiPropertyOptional({
    description: 'Base value the appraiser places on the item, in LKR',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  appraisedValue?: number;
}

export class ReviewQueueDto extends PaginationDto {}
