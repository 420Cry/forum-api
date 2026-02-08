import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { FirebaseService } from './firebase.service';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    if (!this.firebase.isEnabled) {
      console.warn(
        '[FirebaseAuthGuard] Firebase not initialized - allowing request without auth',
      );
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const result = await this.firebase.verifyIdToken(token);
    if ('error' in result) {
      throw new UnauthorizedException(result.error);
    }

    const { decoded } = result;
    (request as Request & { user?: { uid: string; email?: string } }).user = {
      uid: decoded.uid,
      email: decoded.email,
    };
    return true;
  }
}
