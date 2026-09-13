import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/// Role-Based Access Control (NFR: Security). Reads the roles declared by
/// @Roles() and compares them with the role carried on the validated JWT.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest()
      .user as AuthenticatedUser | undefined;

    // Administrators are trusted everywhere - they moderate every surface.
    if (user?.role === Role.ADMIN) return true;

    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException(
        `This action requires one of the following roles: ${required.join(', ')}`,
      );
    }
    return true;
  }
}
