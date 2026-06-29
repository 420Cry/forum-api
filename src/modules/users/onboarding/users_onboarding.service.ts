import { Injectable } from '@nestjs/common';
import { UsersService } from '../users.service';
import { RolesSelectionType } from '../users.type';

@Injectable()
export class UserOnboardingService {
  constructor(private readonly usersService: UsersService) {}

  async saveUserRole(
    supabaseUid: string,
    email: string,
    role: RolesSelectionType,
  ): Promise<void> {
    const foundUser = await this.usersService.findBySupabaseUid(supabaseUid);
    if (!foundUser) {
      const newUser = await this.usersService.findOrCreate(supabaseUid, email);
      newUser.role = role;
      newUser.onboard_process = 'GoalSelection';
      await this.usersService.save(newUser);
    } else {
      await this.usersService.update(foundUser, { role });
    }
  }
}
