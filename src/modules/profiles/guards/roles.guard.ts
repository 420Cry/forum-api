import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from 'src/modules/auth/auth.constants'
import { UsersService } from 'src/modules/users/users.service'
import { RequestWithUser } from 'src/modules/auth/auth.types'
import { Roles } from '../decorators/roles.decorator'

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

    const roles = this.reflector.get(Roles, context.getHandler())
    if (!roles) return true

    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const authUser = request.user

    if (!authUser?.id) {
      throw new BadRequestException(
        'User information cannot be found. Please try again',
      )
    }

    const user = await this.usersService.findBySupabaseUid(authUser.id)
    const userRole = user?.role

    if (userRole !== roles) {
      throw new UnauthorizedException(
        `Permission is only available for ${roles} only`,
      )
    }

    return true
  }
}
