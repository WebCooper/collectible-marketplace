import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import {
  CreateReportDto,
  ListDisputesDto,
  ListReportsDto,
  ListUsersDto,
  ModerateListingDto,
  ResolveDisputeDto,
  ResolveReportDto,
  SuspendUserDto,
} from './dto/admin.dto';

/// Reporting is open to every signed-in user; everything else on this
/// controller is administrator-only.
@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly admin: AdminService) {}

  @Post()
  @ApiOperation({ summary: 'Report a suspicious listing or user' })
  createReport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReportDto,
  ) {
    return this.admin.createReport(user, dto);
  }
}

@ApiTags('administration & moderation')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // --- Users --------------------------------------------------------------

  @Get('users')
  @ApiOperation({ summary: 'Browse and search user accounts' })
  listUsers(@Query() query: ListUsersDto) {
    return this.admin.listUsers(query);
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend an account and pull its live listings' })
  suspendUser(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendUserDto,
  ) {
    return this.admin.suspendUser(admin, id, dto);
  }

  @Patch('users/:id/reinstate')
  @ApiOperation({ summary: 'Reinstate a suspended account' })
  reinstateUser(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admin.reinstateUser(admin, id);
  }

  // --- Listings -----------------------------------------------------------

  @Patch('listings/:id/moderate')
  @ApiOperation({ summary: 'Approve, remove or re-review a listing' })
  moderateListing(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerateListingDto,
  ) {
    return this.admin.moderateListing(admin, id, dto);
  }

  // --- Reported content ---------------------------------------------------

  @Get('reports')
  @ApiOperation({ summary: 'Reported content queue, oldest first' })
  listReports(@Query() query: ListReportsDto) {
    return this.admin.listReports(query);
  }

  @Patch('reports/:id/resolve')
  @ApiOperation({ summary: 'Action or dismiss a report' })
  resolveReport(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.admin.resolveReport(admin, id, dto);
  }

  // --- Disputes -----------------------------------------------------------

  @Get('disputes')
  @ApiOperation({ summary: 'Disputed transactions awaiting review' })
  listDisputes(@Query() query: ListDisputesDto) {
    return this.admin.listDisputes(query);
  }

  @Patch('disputes/:id/resolve')
  @ApiOperation({ summary: 'Record a dispute outcome' })
  resolveDispute(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.admin.resolveDispute(admin, id, dto);
  }

  // --- Analytics ----------------------------------------------------------

  @Get('analytics')
  @ApiOperation({ summary: 'Marketplace activity overview' })
  analytics() {
    return this.admin.analytics();
  }

  @Get('audit-log')
  @ApiOperation({ summary: 'Recent administrative activity' })
  auditLog(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.admin.auditLog(limit ?? 50);
  }
}
