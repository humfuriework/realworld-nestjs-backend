import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | false,
    _info?: unknown,
    _context?: ExecutionContext,
    _status?: unknown,
  ): TUser | null {
    void _info;
    void _context;
    void _status;

    if (err) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    if (!user || user === false) {
      return null;
    }

    return user;
  }
}
