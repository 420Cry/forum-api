import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { SaveUserRoleDto } from './dto/save_user_role.dto';
import { UserOnboardingService } from './onboarding/users_onboarding.service';
import type { RequestWithUser } from '../auth/auth.types';

@Controller('user')
export class UsersController {
  constructor(private readonly userOnboardingService: UserOnboardingService) {}

  @Post('role')
  async saveUserRole(
    @Body() userRole: SaveUserRoleDto,
    @Req() req: RequestWithUser,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('Please login to continue onboarding');
    }

    try {
      const { id, email } = req.user;
      await this.userOnboardingService.saveUserRole(
        id,
        email as string,
        userRole.role,
      );
      return { success: true, message: 'Saves role successfully' };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        { message: 'Internal Server Error', success: false },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
