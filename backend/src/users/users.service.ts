import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ListingStatus, Prisma, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, CreateStaffUserDto, UpdateProfileDto } from './dto/user.dto';

/// Columns safe to return to the owner of the account. Never includes
/// passwordHash.
const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  emailVerified: true,
  phoneVerified: true,
  avatarUrl: true,
  bio: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

/// Columns safe to show to anyone, e.g. the seller panel on a listing page.
const PUBLIC_SELECT = {
  id: true,
  name: true,
  role: true,
  avatarUrl: true,
  bio: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PROFILE_SELECT,
    });
    if (!user) throw new NotFoundException('Account not found');
    return user;
  }

  /// Public seller profile shown on listing pages, with the counts a buyer
  /// uses to judge a seller's track record.
  async findPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...PUBLIC_SELECT,
        _count: {
          select: {
            listings: { where: { status: ListingStatus.ACTIVE } },
            ordersAsSeller: { where: { status: 'COMPLETED' } },
          },
        },
      },
    });
    if (!user || user.role === Role.ADMIN) {
      throw new NotFoundException('User not found');
    }

    const { _count, ...profile } = user;
    return {
      ...profile,
      activeListings: _count.listings,
      completedSales: _count.ordersAsSeller,
    };
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    // Role, status and e-mail are deliberately not updatable here - changing
    // them is either an administrative action or needs re-verification.
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: PROFILE_SELECT,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Account not found');

    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'The new password must differ from the current one',
      );
    }

    const rounds = Number(this.config.get('BCRYPT_SALT_ROUNDS') ?? 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, rounds) },
    });

    return { message: 'Password updated' };
  }

  /// Appraisers and administrators are created here rather than through public
  /// registration (FR 2.1.1 role-based access).
  async createStaffUser(dto: CreateStaffUserDto) {
    if (dto.role !== Role.APPRAISER && dto.role !== Role.ADMIN) {
      throw new BadRequestException(
        'Use public registration to create buyer and seller accounts',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) throw new ConflictException('That e-mail is already in use');

    const rounds = Number(this.config.get('BCRYPT_SALT_ROUNDS') ?? 10);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: dto.role,
        passwordHash: await bcrypt.hash(dto.password, rounds),
        // Staff accounts are trusted on creation, so they skip OTP.
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
      select: PROFILE_SELECT,
    });
  }
}

export { PROFILE_SELECT, PUBLIC_SELECT };
