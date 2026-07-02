import { Body, Controller, Post, Req } from '@nestjs/common';
import { UserRoleDto } from './dto/user-role.dto';
import { UserOnboardingService } from './onboarding/users-onboarding.service';
import type { AuthUser, RequestWithUser } from '../auth/auth.types';
import { UserGoalsDto } from './dto/user-goals.dto';

@Controller('user')
export class UsersController {
  constructor(private readonly userOnboardingService: UserOnboardingService) {}

  @Post('role')
  async saveUserRole(
    @Body() userRole: UserRoleDto,
    @Req() req: RequestWithUser,
  ) {
    const { id, email } = req.user as AuthUser;
    await this.userOnboardingService.saveUserRole(
      id,
      email as string,
      userRole.role,
    );
    return { success: true, message: 'Saves role successfully' };
  }

  @Post('goals')
  async saveUserGoals(
    @Body() userGoals: UserGoalsDto,
    @Req() req: RequestWithUser,
  ) {
    const { id } = req.user as AuthUser;
    await this.userOnboardingService.saveUserGoal(id, userGoals.goals);
    return { success: true, message: 'Saves goals successfully' };
  }
}
