import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ACCESS_COOKIE,
  AuthController,
  REFRESH_COOKIE,
} from './auth.controller';
import { AuthService } from './auth.service';

const session = { accessToken: 'access-jwt', refreshToken: 'refresh-jwt' };

describe('AuthController session cookies', () => {
  let controller: AuthController;
  let auth: { login: jest.Mock; refresh: jest.Mock };
  let res: { cookie: jest.Mock; clearCookie: jest.Mock };

  beforeEach(() => {
    auth = {
      login: jest.fn().mockResolvedValue(session),
      refresh: jest.fn().mockResolvedValue(session),
    };
    res = { cookie: jest.fn(), clearCookie: jest.fn() };
    const config = {
      get: (key: string) => (key === 'NODE_ENV' ? 'production' : undefined),
    };
    controller = new AuthController(
      auth as unknown as AuthService,
      config as unknown as ConfigService,
    );
  });

  it('sets httpOnly access and refresh cookies on login', async () => {
    const body = await controller.login(
      { email: 'a@b.lk', password: 'x' },
      res as unknown as Response,
    );

    expect(body).toEqual(session);
    expect(res.cookie).toHaveBeenCalledWith(
      ACCESS_COOKIE,
      'access-jwt',
      expect.objectContaining({ httpOnly: true, secure: true, path: '/' }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_COOKIE,
      'refresh-jwt',
      expect.objectContaining({
        httpOnly: true,
        path: '/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }),
    );
  });

  it('refreshes from the cookie when the body carries no token', async () => {
    const req = { cookies: { [REFRESH_COOKIE]: 'cookie-refresh' } };

    await controller.refresh(
      {},
      req as unknown as Request,
      res as unknown as Response,
    );

    expect(auth.refresh).toHaveBeenCalledWith('cookie-refresh');
  });

  it('rejects a refresh with no token anywhere', async () => {
    await expect(
      controller.refresh(
        {},
        { cookies: {} } as unknown as Request,
        res as unknown as Response,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('clears both cookies on logout', () => {
    controller.logout(res as unknown as Response);

    expect(res.clearCookie).toHaveBeenCalledWith(
      ACCESS_COOKIE,
      expect.any(Object),
    );
    expect(res.clearCookie).toHaveBeenCalledWith(
      REFRESH_COOKIE,
      expect.any(Object),
    );
  });
});
