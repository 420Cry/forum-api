import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from 'src/modules/auth/auth.constants'
import { UsersService } from 'src/modules/users/users.service'
import { IS_INVESTOR_KEY, IS_STARTUP_KEY } from '../profiles.constant'
import { RequestWithUser } from 'src/modules/auth/auth.types'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getClass(),
      context.getHandler(),
    ])
    if (isPublic) return true

    const isStartup = this.reflector.getAllAndOverride<boolean>(
      IS_STARTUP_KEY,
      [context.getClass(), context.getHandler()],
    )

    const isInvestor = this.reflector.getAllAndOverride<boolean>(
      IS_INVESTOR_KEY,
      [context.getClass(), context.getHandler()],
    )

    if (!isStartup && !isInvestor) return true

    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const authUser = request.user

    if (!authUser?.id) {
      throw new BadRequestException(
        'User information cannot be found. Please try again',
      )
    }
  }
}
