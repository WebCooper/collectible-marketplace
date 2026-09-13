import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DisputeStatus,
  ListingStatus,
  ReportStatus,
  ReportTargetType,
  Role,
  UserStatus,
} from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ListUsersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Match against name or e-mail' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

export class SuspendUserDto {
  @ApiProperty({ example: 'Repeated listings of counterfeit coins' })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}

export class ModerateListingDto {
  @ApiProperty({
    enum: [
      ListingStatus.ACTIVE,
      ListingStatus.REMOVED,
      ListingStatus.UNDER_REVIEW,
    ],
    description: 'Approve (ACTIVE), remove (REMOVED) or send back for review',
  })
  @IsEnum(ListingStatus)
  status: ListingStatus;

  @ApiPropertyOptional({ description: 'Required when removing a listing' })
  @ValidateIf((dto: ModerateListingDto) => dto.status === ListingStatus.REMOVED)
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CreateReportDto {
  @ApiProperty({ enum: ReportTargetType })
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @ApiPropertyOptional({ description: 'Required when reporting a listing' })
  @ValidateIf(
    (dto: CreateReportDto) => dto.targetType === ReportTargetType.LISTING,
  )
  @IsUUID()
  reportedListingId?: string;

  @ApiPropertyOptional({ description: 'Required when reporting a user' })
  @ValidateIf(
    (dto: CreateReportDto) => dto.targetType === ReportTargetType.USER,
  )
  @IsUUID()
  reportedUserId?: string;

  @ApiProperty({ example: 'Listing appears to be a modern replica' })
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

export class ResolveReportDto {
  @ApiProperty({ enum: [ReportStatus.ACTIONED, ReportStatus.DISMISSED] })
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @ApiProperty({ example: 'Listing removed and the seller warned' })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  resolutionNote: string;
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: [DisputeStatus.RESOLVED, DisputeStatus.REJECTED] })
  @IsEnum(DisputeStatus)
  status: DisputeStatus;

  @ApiProperty({
    example: 'Refunded the buyer in full after inspecting photos',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  resolution: string;
}

export class ListReportsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ReportStatus })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}

export class ListDisputesDto extends PaginationDto {
  @ApiPropertyOptional({ enum: DisputeStatus })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;
}
