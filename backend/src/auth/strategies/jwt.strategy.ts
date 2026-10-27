import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { jwtAccessSecret } from '../jwt-secrets';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/// Claims carried in the signed access token.
export interface JwtTokenPayload {
  sub: string;
  email: string;
  role: AuthenticatedUser['role'];
  /// Issued-at, in seconds; added by the JWT library when signing.
  iat?: number;
}

/// A token minted before the password last changed must stop working, so a
/// stolen session does not survive a password reset. Compared in whole seconds
/// because `iat` has no finer resolution.
export function issuedBeforePasswordChange(
  iat: number | undefined,
  passwordChangedAt: Date | null,
) {
  if (!passwordChangedAt) return false;
  return (iat ?? 0) < Math.floor(passwordChangedAt.getTime() / 1000);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // The client stores the access token in an httpOnly cookie; the admin
        // panel sends it as a bearer header. Accept both.
        // @types/cookie-parser types `cookies` as `any`, so narrow it here.
        (req: Request) =>
          (req?.cookies as Record<string, string> | undefined)?.access_token ??
          null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtAccessSecret(config),
    });
  }

  /// Validating against the database on every request costs one indexed lookup
  /// but means a suspended account loses access immediately rather than when
  /// its token happens to expire.
  async validate(payload: JwtTokenPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        passwordChangedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended');
    }

    if (issuedBeforePasswordChange(payload.iat, user.passwordChangedAt)) {
      throw new UnauthorizedException('Session expired, please sign in again');
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}
