import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/// Self-registration is limited to the two public roles. Appraisers and
/// administrators are provisioned by an existing administrator.
export const SELF_REGISTERABLE_ROLES = [Role.BUYER, Role.SELLER] as const;

export class RegisterDto {
  @ApiProperty({ example: 'Kamala Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'kamala@example.lk' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+94771234567' })
  @IsOptional()
  @IsPhoneNumber('LK')
  phone?: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'password must contain at least one lowercase letter, one uppercase letter and one digit',
  })
  password: string;

  @ApiPropertyOptional({ enum: SELF_REGISTERABLE_ROLES, default: Role.BUYER })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class LoginDto {
  @ApiProperty({ example: 'kamala@example.lk' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'kamala@example.lk' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '482913' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: 'kamala@example.lk' })
  @IsEmail()
  email: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'kamala@example.lk' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token from the password reset e-mail link' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewPassword123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'password must contain at least one lowercase letter, one uppercase letter and one digit',
  })
  password: string;
}

export class RefreshTokenDto {
  /// Optional: browser clients send the refresh token as an httpOnly cookie.
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
