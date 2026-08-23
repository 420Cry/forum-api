import { Controller, Get, Req } from '@nestjs/common'
import { UsersService } from '../users/users.service'
import type { RequestWithUser } from './auth.types'
import { toAuthProfile } from './auth-profile.mapper'
import { SkipEmailVerification } from './skip-email-verification.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @SkipEmailVerification()
  async getMe(@Req() req: RequestWithUser) {
    const authUser = req.user
    if (!authUser?.id) {
      return { id: null, email: null, profile: null }
    }

    let user = await this.usersService.findBySupabaseUidWithTags(authUser.id)
    if (user?.onboarded_at) {
      user = await this.usersService.ensureUrlKey(user)
    }

    return {
      id: authUser.id,
      email: authUser.email ?? null,
      profile: toAuthProfile(user),
    }
  }
}
