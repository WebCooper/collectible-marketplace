import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * For routes a guest may reach but that behave differently for a signed-in
 * user - listing detail, for instance, where the owner also sees a listing
 * still under review. Attaches the user when a valid token is present and
 * lets the request through untouched when it is not.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_err: unknown, user: TUser): TUser | undefined {
    return user || undefined;
  }
}
