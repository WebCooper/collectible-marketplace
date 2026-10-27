import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CertificatesService } from './certificates.service';
import {
  ReviewQueueDto,
  UploadCertificateDto,
  VerificationDecisionDto,
} from './dto/certificate.dto';

@ApiTags('certificates & verification')
@ApiBearerAuth()
@Controller()
export class CertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  // --- Seller ------------------------------------------------------------

  @Post('listings/:id/certificates')
  @Roles(Role.SELLER)
  @ApiOperation({ summary: 'Attach an authenticity certificate to a listing' })
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) listingId: string,
    @Body() dto: UploadCertificateDto,
  ) {
    return this.certificates.upload(user, listingId, dto);
  }

  @Get('listings/:id/certificates')
  @Roles(Role.SELLER, Role.APPRAISER)
  @ApiOperation({ summary: 'Certificates attached to a listing' })
  findForListing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) listingId: string,
  ) {
    return this.certificates.findForListing(user, listingId);
  }

  // --- Appraiser ---------------------------------------------------------

  @Get('verification/queue')
  @Roles(Role.APPRAISER)
  @ApiOperation({ summary: 'Listings awaiting expert review, oldest first' })
  reviewQueue(@Query() query: ReviewQueueDto) {
    return this.certificates.reviewQueue(query);
  }

  @Post('listings/:id/verification')
  @Roles(Role.APPRAISER)
  @ApiOperation({
    summary: 'Approve, reject or request more evidence for a listing',
  })
  decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) listingId: string,
    @Body() dto: VerificationDecisionDto,
  ) {
    return this.certificates.decide(user, listingId, dto);
  }

  // --- Everyone ----------------------------------------------------------

  @Public()
  @Get('listings/:id/verification')
  @ApiOperation({
    summary: 'Verification history for a listing, for reference and disputes',
  })
  history(@Param('id', ParseUUIDPipe) listingId: string) {
    return this.certificates.history(listingId);
  }
}
