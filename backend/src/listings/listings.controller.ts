import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  // --- Discovery (open to guests) -----------------------------------------

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search, filter and sort marketplace listings' })
  search(@Query() query: SearchListingsDto) {
    return this.listings.search(query);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Rare and featured collectibles for the homepage' })
  featured(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.listings.featured(limit ?? 8);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Live listing count per category' })
  categories() {
    return this.listings.categoryCounts();
  }

  // --- Seller dashboard ---------------------------------------------------

  @Get('mine')
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "The seller's own listings, including drafts" })
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchListingsDto,
  ) {
    return this.listings.findMine(user.id, query);
  }

  @Post()
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a listing; it enters the review queue' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateListingDto,
  ) {
    return this.listings.create(user.id, dto);
  }

  @Patch(':id')
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit a listing before bidding starts' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listings.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw a listing before bidding starts' })
  withdraw(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.listings.withdraw(user, id);
  }

  // --- Detail (guest-readable, richer for the owner) ----------------------

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Full listing detail' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.listings.findOne(id, user);
  }
}
