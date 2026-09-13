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
import { AuctionsService } from './auctions.service';
import {
  BidHistoryDto,
  CreateAuctionDto,
  PlaceBidDto,
} from './dto/auction.dto';

@ApiTags('auctions & bidding')
@Controller()
export class AuctionsController {
  constructor(private readonly auctions: AuctionsService) {}

  @Post('listings/:id/auction')
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Turn a listing into an auction' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) listingId: string,
    @Body() dto: CreateAuctionDto,
  ) {
    return this.auctions.create(user, listingId, dto);
  }

  @Public()
  @Get('auctions/:id')
  @ApiOperation({ summary: 'Current state of an auction' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auctions.findOne(id);
  }

  @Public()
  @Get('auctions/:id/bids')
  @ApiOperation({ summary: 'Bidding history for an auction' })
  bidHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BidHistoryDto,
  ) {
    return this.auctions.bidHistory(id, query);
  }

  @Post('auctions/:id/bids')
  @Roles(Role.BUYER, Role.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Place a bid' })
  placeBid(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PlaceBidDto,
  ) {
    return this.auctions.placeBid(user, id, dto);
  }

  @Post('auctions/:id/buy-now')
  @Roles(Role.BUYER, Role.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buy the item at the fixed Buy Now price' })
  buyNow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.auctions.buyNow(user, id);
  }

  @Get('bids/mine')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Every auction the current user has bid on' })
  myBids(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: BidHistoryDto,
  ) {
    return this.auctions.myBids(user.id, query);
  }
}
