import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateListingDto } from './create-listing.dto';

/// Certificates are added and reviewed through the certificate endpoints, not
/// by editing the listing, so that every submission keeps its own audit trail.
export class UpdateListingDto extends PartialType(
  OmitType(CreateListingDto, ['certificates'] as const),
) {}
