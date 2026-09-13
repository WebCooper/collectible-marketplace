import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

/// Injects the JWT payload resolved by JwtStrategy into a handler argument.
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;
    return data ? user?.[data] : user;
  },
);
