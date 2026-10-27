import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import {
  NotificationChannel,
  NotificationType,
  Role,
  TokenType,
  User,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SELF_REGISTERABLE_ROLES,
  VerifyOtpDto,
} from './dto/auth.dto';
import { jwtRefreshSecret } from './jwt-secrets';
import { issuedBeforePasswordChange } from './strategies/jwt.strategy';
import type { JwtTokenPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  // --- Registration & verification ----------------------------------------

  async register(dto: RegisterDto) {
    const role = dto.role ?? Role.BUYER;
    type SelfRegisterableRole = (typeof SELF_REGISTERABLE_ROLES)[number];
    if (!SELF_REGISTERABLE_ROLES.includes(role as SelfRegisterableRole)) {
      throw new BadRequestException(
        'Appraiser and administrator accounts are created by an administrator',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('An account with this e-mail already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role,
        passwordHash: await this.hashPassword(dto.password),
        // Full marketplace access waits for OTP verification (FR 2.1.1).
        status: UserStatus.PENDING_VERIFICATION,
      },
    });

    await this.issueOtp(user);

    return {
      message:
        'Account created. Check your e-mail for the 6-digit verification code.',
      userId: user.id,
    };
  }

  /// Generates a 6-digit OTP, stores only its hash, and sends the code out of
  /// band. The plaintext code never touches the database.
  private async issueOtp(user: User) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const ttlMinutes = Number(this.config.get('OTP_TTL_MINUTES') ?? 10);

    // Any code issued earlier is void as soon as a new one is requested.
    await this.prisma.authToken.updateMany({
      where: {
        userId: user.id,
        type: TokenType.EMAIL_VERIFICATION,
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });

    await this.prisma.authToken.create({
      data: {
        userId: user.id,
        type: TokenType.EMAIL_VERIFICATION,
        tokenHash: this.hashToken(code),
        expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
      },
    });

    await this.notifications.notify(
      {
        userId: user.id,
        type: NotificationType.OTP,
        title: 'Verify your account',
        message: `Your verification code is ${code}. It expires in ${ttlMinutes} minutes.`,
        email: user.email,
        phone: user.phone ?? undefined,
      },
      [NotificationChannel.EMAIL, NotificationChannel.SMS],
    );
  }

  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Reply identically whether or not the account exists, so this endpoint
    // cannot be used to enumerate registered e-mail addresses.
    if (user && user.status === UserStatus.PENDING_VERIFICATION) {
      await this.issueOtp(user);
    }
    return {
      message: 'If that account needs verification, a code has been sent.',
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new BadRequestException('Invalid or expired code');

    const token = await this.prisma.authToken.findFirst({
      where: {
        userId: user.id,
        type: TokenType.EMAIL_VERIFICATION,
        tokenHash: this.hashToken(dto.code),
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!token) throw new BadRequestException('Invalid or expired code');

    const [, verified] = await this.prisma.$transaction([
      this.prisma.authToken.update({
        where: { id: token.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { status: UserStatus.ACTIVE, emailVerified: true },
      }),
    ]);

    return this.issueSession(verified);
  }

  // --- Login --------------------------------------------------------------

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Hash even when the account is missing so the response time does not
    // reveal whether the e-mail is registered.
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user?.passwordHash ??
        '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv',
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid e-mail or password');
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException(
        'This account has been suspended. Contact support.',
      );
    }
    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new UnauthorizedException(
        'Verify your account with the code sent to your e-mail before signing in.',
      );
    }

    return this.issueSession(user);
  }

  async refresh(refreshToken: string) {
    let payload: JwtTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtTokenPayload>(refreshToken, {
        secret: jwtRefreshSecret(this.config),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }
    if (issuedBeforePasswordChange(payload.iat, user.passwordChangedAt)) {
      throw new UnauthorizedException('Session expired, please sign in again');
    }
    return this.issueSession(user);
  }

  // --- Password recovery --------------------------------------------------

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      const token = randomBytes(32).toString('hex');
      const ttlMinutes = Number(
        this.config.get('PASSWORD_RESET_TTL_MINUTES') ?? 30,
      );

      await this.prisma.authToken.create({
        data: {
          userId: user.id,
          type: TokenType.PASSWORD_RESET,
          tokenHash: this.hashToken(token),
          expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
        },
      });

      await this.notifications.notify(
        {
          userId: user.id,
          type: NotificationType.OTP,
          title: 'Reset your password',
          message: `Use this link to choose a new password. It expires in ${ttlMinutes} minutes.`,
          payload: { token },
          email: user.email,
        },
        [NotificationChannel.EMAIL],
      );
    }

    // Always the same answer, so the endpoint cannot confirm who has an account.
    return {
      message: 'If that e-mail is registered, a reset link is on its way.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const token = await this.prisma.authToken.findFirst({
      where: {
        type: TokenType.PASSWORD_RESET,
        tokenHash: this.hashToken(dto.token),
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!token) {
      throw new BadRequestException(
        'This reset link is invalid or has expired',
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: token.userId },
        data: {
          passwordHash: await this.hashPassword(dto.password),
          passwordChangedAt: new Date(),
        },
      }),
      this.prisma.authToken.update({
        where: { id: token.id },
        data: { consumedAt: new Date() },
      }),
      // Burn every other outstanding reset token for this account.
      this.prisma.authToken.updateMany({
        where: {
          userId: token.userId,
          type: TokenType.PASSWORD_RESET,
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      }),
    ]);

    return { message: 'Password updated. You can now sign in.' };
  }

  // --- Helpers ------------------------------------------------------------

  private hashPassword(plain: string) {
    const rounds = Number(this.config.get('BCRYPT_SALT_ROUNDS') ?? 10);
    return bcrypt.hash(plain, rounds);
  }

  /// OTP codes and reset tokens are single-use secrets we only ever need to
  /// compare, so a fast digest is enough - and it keeps the lookup indexable.
  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueSession(user: User) {
    const payload: JwtTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload),
      this.jwt.signAsync(payload, {
        secret: jwtRefreshSecret(this.config),
        expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ??
          '7d') as JwtSignOptions['expiresIn'],
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
