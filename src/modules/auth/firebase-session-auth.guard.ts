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
export class FirebaseSessionAuthGuard implements CanActivate {
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

    const handlerName = context.getHandler().name;

    if (!this.firebase.isEnabled) {
      console.warn(
        '[FirebaseAuthGuard] Firebase not initialized - allowing request without auth',
      );
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (handlerName === 'createSession') {
      return true;
    }

    const sessionId = request.cookies['sessionId'] as string | null;
    if (!sessionId) {
      throw new UnauthorizedException();
    }

    const result = await this.firebase.verifySessionCookie(sessionId);

    if ('error' in result) {
      throw new UnauthorizedException();
    }

    const { decoded } = result;
    (
      request as Request & {
        user?: { uid: string; email?: string };
      }
    ).user = {
      uid: decoded.uid,
      email: decoded.email,
    };
    return true;
  }
}
