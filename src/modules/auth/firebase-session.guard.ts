import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { FirebaseService } from './firebase.service';

@Injectable()
export class FirebaseSessionGuard implements CanActivate {
  constructor(private readonly firebase: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    try {
      await this.firebase.verifyIdToken(token);
    } catch (err) {
      console.warn(err);
      throw new UnauthorizedException('This token cannot be verified');
    }

    (request as Request & { token: string }).token = token;
    return true;
  }
}
