import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  IS_PUBLIC_KEY,
  REQUIRES_NOT_ONBOARDED_KEY,
  REQUIRES_ONBOARDED_KEY,
} from '../../auth/auth.constants'
import type { RequestWithUser } from '../../auth/auth.types'
import { UsersService } from '../users.service'

@Injectable()
export class OnboardingStateGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const requiresOnboarded = this.reflector.getAllAndOverride<boolean>(
      REQUIRES_ONBOARDED_KEY,
      [context.getHandler(), context.getClass()],
    )
    const requiresNotOnboarded = this.reflector.getAllAndOverride<boolean>(
      REQUIRES_NOT_ONBOARDED_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!requiresOnboarded && !requiresNotOnboarded) return true

    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const authUser = request.user
    if (!authUser?.id) return true

    const user = await this.usersService.findBySupabaseUidWithTags(authUser.id)
    const isOnboarded = !!user?.onboarded_at

    if (requiresOnboarded && !isOnboarded) {
      throw new ForbiddenException('Onboarding must be completed first')
    }

    if (requiresNotOnboarded && isOnboarded) {
      throw new BadRequestException('Onboarding already completed')
    }

    return true
  }
}
