import { Body, Controller, Patch, Post, Req } from '@nestjs/common'
import { UserOnboardingService } from './onboarding/users-onboarding.service'
import type { AuthUser, RequestWithUser } from '../auth/auth.types'
import { SaveOnboardingDto } from './dto/save-onboarding.dto'
import { SaveOnboardingDraftDto } from './dto/save-onboarding-draft.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'

@Controller('user')
export class UsersController {
  constructor(private readonly userOnboardingService: UserOnboardingService) {}

  @Post('onboarding')
  async saveOnboarding(
    @Body() dto: SaveOnboardingDto,
    @Req() req: RequestWithUser,
  ) {
    const { id, email } = req.user as AuthUser
    await this.userOnboardingService.saveOnboarding(id, email as string, dto)
    return { success: true, message: 'Onboarding completed' }
  }

  @Patch('onboarding/draft')
  async saveOnboardingDraft(
    @Body() dto: SaveOnboardingDraftDto,
    @Req() req: RequestWithUser,
  ) {
    const { id, email } = req.user as AuthUser
    await this.userOnboardingService.saveDraft(id, email as string, dto)
    return { success: true, message: 'Onboarding draft saved' }
  }

  @Patch('profile')
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @Req() req: RequestWithUser,
  ) {
    const { id } = req.user as AuthUser
    await this.userOnboardingService.updateProfile(id, dto)
    return { success: true, message: 'Profile updated' }
  }
}
