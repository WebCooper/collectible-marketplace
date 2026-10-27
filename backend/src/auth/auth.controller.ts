import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResendOtpDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

/// Turns a duration such as "15m" or "7d" into milliseconds.
function toMilliseconds(value: string, fallback: number) {
  const match = /^(\d+)\s*(s|m|h|d)?$/.exec(value.trim());
  if (!match) return fallback;
  const unit = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[match[2] ?? 's'] ?? 1e3;
  return Number(match[1]) * unit;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private cookieOptions(maxAge: number, path = '/'): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('NODE_ENV') === 'production',
      maxAge,
      path,
    };
  }

  /// The client keeps its session in httpOnly cookies, out of reach of page
  /// scripts. The tokens are still returned in the body for the admin panel,
  /// which authenticates with a bearer header.
  private setSessionCookies<
    T extends { accessToken: string; refreshToken: string },
  >(res: Response, session: T): T {
    res.cookie(
      ACCESS_COOKIE,
      session.accessToken,
      this.cookieOptions(
        toMilliseconds(this.config.get<string>('JWT_EXPIRES_IN') ?? '15m', 9e5),
      ),
    );
    res.cookie(
      REFRESH_COOKIE,
      session.refreshToken,
      // Scoped to /auth so it is only ever sent to the refresh/logout routes.
      this.cookieOptions(
        toMilliseconds(
          this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
          6048e5,
        ),
        '/auth',
      ),
    );
    return session;
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register as a buyer or seller' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm the 6-digit code and activate the account',
  })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.setSessionCookies(res, await this.auth.verifyOtp(dto));
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a fresh verification code' })
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.auth.resendOtp(dto.email);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in and receive an access + refresh token' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.setSessionCookies(res, await this.auth.login(dto));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new session' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token =
      dto.refreshToken ??
      (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedException('Invalid refresh token');
    return this.setSessionCookies(res, await this.auth.refresh(token));
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear the session cookies' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_COOKIE, this.cookieOptions(0));
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions(0, '/auth'));
    return { message: 'Signed out.' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Choose a new password using a reset token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Identity carried by the current token' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
