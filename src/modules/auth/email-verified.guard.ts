import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY, SKIP_EMAIL_VERIFICATION_KEY } from './auth.constants'
import type { RequestWithUser } from './auth.types'

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const skipVerification = this.reflector.getAllAndOverride<boolean>(
      SKIP_EMAIL_VERIFICATION_KEY,
      [context.getHandler(), context.getClass()],
    )
    if (skipVerification) return true

    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const user = request.user

    // Dev bypass: SupabaseAuthGuard may allow requests without attaching a user.
    if (!user) return true

    if (!user.emailVerified) {
      throw new ForbiddenException('Email address not verified')
    }

    return true
  }
}
