import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { NotificationsService } from './notifications.service';
import { ListNotificationsDto } from './dto/list-notifications.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'In-app notification centre for the current user' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotificationsDto,
  ) {
    const pagination = Object.assign(new PaginationDto(), {
      page: query.page,
      limit: query.limit,
    });
    return this.notifications.findForUser(
      user.id,
      pagination,
      query.unreadOnly ?? false,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread badge count' })
  async unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return { count: await this.notifications.unreadCount(user.id) };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.markRead(user.id, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark every notification as read' })
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markAllRead(user.id);
  }
}
