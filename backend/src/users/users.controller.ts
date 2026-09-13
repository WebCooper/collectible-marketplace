import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import {
  ChangePasswordDto,
  CreateStaffUserDto,
  UpdateProfileDto,
} from './dto/user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Full profile of the signed-in user' })
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.users.findMe(user.id);
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update contact details, picture and bio' })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.updateProfile(user.id, dto);
  }

  @Patch('me/password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password while signed in' })
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.users.changePassword(user.id, dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Public seller profile shown beside a listing' })
  findPublicProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findPublicProfile(id);
  }

  @Post('staff')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an appraiser or administrator account' })
  createStaffUser(@Body() dto: CreateStaffUserDto) {
    return this.users.createStaffUser(dto);
  }
}
