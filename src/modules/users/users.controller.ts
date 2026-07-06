import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { UserOnboardingService } from './onboarding/users-onboarding.service'
import type { AuthUser, RequestWithUser } from '../auth/auth.types'
import { SaveOnboardingDto } from './dto/save-onboarding.dto'
import { SaveOnboardingDraftDto } from './dto/save-onboarding-draft.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { RequiresOnboarded } from './decorators/requires-onboarded.decorator'
import { RequiresNotOnboarded } from './decorators/requires-not-onboarded.decorator'
import { OnboardingStateGuard } from './guards/onboarding-state.guard'

@Controller('user')
@UseGuards(OnboardingStateGuard)
export class UsersController {
  constructor(private readonly userOnboardingService: UserOnboardingService) {}

  @Post('onboarding')
  @RequiresNotOnboarded()
  async saveOnboarding(
    @Body() dto: SaveOnboardingDto,
    @Req() req: RequestWithUser,
  ) {
    const { id, email } = req.user as AuthUser
    await this.userOnboardingService.saveOnboarding(id, email as string, dto)
    return { success: true, message: 'Onboarding completed' }
  }

  @Patch('onboarding/draft')
  @RequiresNotOnboarded()
  async saveOnboardingDraft(
    @Body() dto: SaveOnboardingDraftDto,
    @Req() req: RequestWithUser,
  ) {
    const { id, email } = req.user as AuthUser
    await this.userOnboardingService.saveDraft(id, email as string, dto)
    return { success: true, message: 'Onboarding draft saved' }
  }

  @Patch('profile')
  @RequiresOnboarded()
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @Req() req: RequestWithUser,
  ) {
    const { id } = req.user as AuthUser
    await this.userOnboardingService.updateProfile(id, dto)
    return { success: true, message: 'Profile updated' }
  }
}
