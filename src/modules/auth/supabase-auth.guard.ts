import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './auth.constants';
import type { RequestWithUser } from './auth.types';
import { SupabaseService } from './supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    if (!this.supabase.isEnabled) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Auth not configured');
      }
      console.warn(
        '[SupabaseAuthGuard] Supabase not initialized - allowing request without auth',
      );
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const result = await this.supabase.verifyToken(token);
    if ('error' in result) {
      throw new UnauthorizedException();
    }

    request.user = {
      id: result.user.id,
      email: result.user.email,
    };
    return true;
  }
}
