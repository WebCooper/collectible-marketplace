import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, TokenType, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    authToken: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let notifications: { notify: jest.Mock };
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };

  const activeUser = {
    id: 'user-1',
    name: 'Kamala Silva',
    email: 'kamala@example.lk',
    phone: '+94771234567',
    role: Role.BUYER,
    status: UserStatus.ACTIVE,
    avatarUrl: null,
    // bcrypt hash of 'Password123!'
    passwordHash: bcrypt.hashSync('Password123!', 4),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({
          ...activeUser,
          status: UserStatus.PENDING_VERIFICATION,
        }),
        update: jest.fn().mockResolvedValue(activeUser),
      },
      authToken: {
        create: jest.fn().mockResolvedValue({ id: 'token-1' }),
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      // The real calls pass an array of operations; return the user for the
      // second slot, which verifyOtp destructures.
      $transaction: jest.fn().mockResolvedValue([{}, activeUser]),
    };
    notifications = { notify: jest.fn().mockResolvedValue({}) };
    jwt = {
      signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
      verifyAsync: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
        {
          provide: JwtService,
          useValue: jwt,
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'BCRYPT_SALT_ROUNDS' ? 4 : undefined,
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('creates a pending account and sends a verification code', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.register({
        name: 'Kamala Silva',
        email: 'kamala@example.lk',
        password: 'Password123!',
      });

      expect(result.userId).toBe('user-1');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: UserStatus.PENDING_VERIFICATION,
          }),
        }),
      );
      expect(notifications.notify).toHaveBeenCalled();
    });

    it('never stores the password in the clear', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await service.register({
        name: 'Kamala Silva',
        email: 'kamala@example.lk',
        password: 'Password123!',
      });

      const { passwordHash } = (
        prisma.user.create.mock.calls[0] as [{ data: { passwordHash: string } }]
      )[0].data;
      expect(passwordHash).not.toBe('Password123!');
      expect(bcrypt.compareSync('Password123!', passwordHash)).toBe(true);
    });

    it('stores only the hash of the verification code', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await service.register({
        name: 'Kamala Silva',
        email: 'kamala@example.lk',
        password: 'Password123!',
      });

      const storedHash =
        prisma.authToken.create.mock.calls[0][0].data.tokenHash;
      const sentMessage = notifications.notify.mock.calls[0][0]
        .message as string;
      const code = /\b(\d{6})\b/.exec(sentMessage)?.[1];

      expect(code).toBeDefined();
      expect(storedHash).not.toContain(code!);
      expect(storedHash).toBe(sha256(code!));
    });

    it('rejects a duplicate e-mail', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          name: 'Kamala Silva',
          email: 'kamala@example.lk',
          password: 'Password123!',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses to self-register an appraiser or administrator', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.register({
          name: 'Not An Admin',
          email: 'sneaky@example.lk',
          password: 'Password123!',
          role: Role.ADMIN,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('issues a session for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(activeUser);

      const result = await service.login({
        email: activeUser.email,
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user.email).toBe(activeUser.email);
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('rejects a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(activeUser);

      await expect(
        service.login({ email: activeUser.email, password: 'WrongPassword1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('gives an unknown e-mail the same answer as a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.lk', password: 'Password123!' }),
      ).rejects.toThrow('Invalid e-mail or password');
    });

    it('turns away a suspended account', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        status: UserStatus.SUSPENDED,
      });

      await expect(
        service.login({ email: activeUser.email, password: 'Password123!' }),
      ).rejects.toThrow('suspended');
    });

    it('turns away an account that has not verified its code', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        status: UserStatus.PENDING_VERIFICATION,
      });

      await expect(
        service.login({ email: activeUser.email, password: 'Password123!' }),
      ).rejects.toThrow('Verify your account');
    });
  });

  describe('verifyOtp', () => {
    it('activates the account and signs the user in', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        status: UserStatus.PENDING_VERIFICATION,
      });
      prisma.authToken.findFirst.mockResolvedValue({
        id: 'token-1',
        userId: activeUser.id,
      });

      const result = await service.verifyOtp({
        email: activeUser.email,
        code: '123456',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('looks the code up by hash, never by its plain value', async () => {
      prisma.user.findUnique.mockResolvedValue(activeUser);
      prisma.authToken.findFirst.mockResolvedValue({
        id: 'token-1',
        userId: activeUser.id,
      });

      await service.verifyOtp({ email: activeUser.email, code: '123456' });

      expect(prisma.authToken.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tokenHash: sha256('123456'),
          type: TokenType.EMAIL_VERIFICATION,
          consumedAt: null,
        }),
      });
    });

    it('rejects an expired or already used code', async () => {
      prisma.user.findUnique.mockResolvedValue(activeUser);
      prisma.authToken.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyOtp({ email: activeUser.email, code: '000000' }),
      ).rejects.toThrow('Invalid or expired code');
    });
  });

  describe('forgotPassword', () => {
    it('answers identically for an unknown address, so accounts cannot be enumerated', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const unknown = await service.forgotPassword({
        email: 'nobody@example.lk',
      });

      prisma.user.findUnique.mockResolvedValue(activeUser);
      const known = await service.forgotPassword({ email: activeUser.email });

      expect(unknown).toEqual(known);
      // ...but only the real account actually gets a token issued.
      expect(prisma.authToken.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetPassword', () => {
    it('rejects an invalid or expired token', async () => {
      prisma.authToken.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'bogus', password: 'NewPassword123!' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sets the new password and burns the token', async () => {
      prisma.authToken.findFirst.mockResolvedValue({
        id: 'token-1',
        userId: activeUser.id,
      });

      const result = await service.resetPassword({
        token: 'valid-token',
        password: 'NewPassword123!',
      });

      expect(result.message).toContain('Password updated');
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    it('refuses a refresh token issued before the password changed', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: activeUser.id,
        iat: nowSeconds - 3600,
      });
      prisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        passwordChangedAt: new Date(),
      });

      await expect(service.refresh('old-refresh')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('accepts a refresh token issued after the password changed', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: activeUser.id,
        iat: nowSeconds,
      });
      prisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        passwordChangedAt: new Date(Date.now() - 3600_000),
      });

      await expect(service.refresh('fresh-refresh')).resolves.toHaveProperty(
        'accessToken',
      );
    });
  });

  it('stamps passwordChangedAt when a password is reset', async () => {
    prisma.authToken.findFirst.mockResolvedValue({
      id: 'token-1',
      userId: activeUser.id,
    });

    await service.resetPassword({ token: 't', password: 'NewPassword123!' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passwordChangedAt: expect.any(Date) }),
      }),
    );
  });
});
