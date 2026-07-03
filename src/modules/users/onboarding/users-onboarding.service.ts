import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users.service';
import { onboardProcess, RolesSelectionType } from '../users.type';
import { UserInfoDto } from '../dto/user-info.dto';
import { TagsService } from 'src/modules/tags/tags.service';

@Injectable()
export class UserOnboardingService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tagsService: TagsService,
  ) {}

  async saveUserRole(
    supabaseUid: string,
    email: string,
    role: RolesSelectionType,
  ): Promise<void> {
    const foundUser = await this.usersService.findBySupabaseUid(supabaseUid);
    if (!foundUser) {
      const newUser = await this.usersService.findOrCreate(supabaseUid, email);
      newUser.role = role;
      newUser.onboard_process = onboardProcess[1];
      await this.usersService.save(newUser);
    } else {
      await this.usersService.update(foundUser, {
        role,
        onboard_process: onboardProcess[1],
      });
    }
  }

  async saveUserGoal(supabaseUid: string, goals: string[]) {
    const foundUser =
      await this.usersService.findBySupabaseUidWithTags(supabaseUid);
    if (!foundUser) {
      throw new BadRequestException('This user is not existed');
    }
    if (foundUser.onboard_process !== onboardProcess[1]) {
      throw new BadRequestException('Complete the previous step first');
    }

    const allTags = await this.tagsService.findAllTags();
    const matchesAnyGoal = (tagName: string) =>
      goals.some((goal) => goal.toLowerCase().includes(tagName.toLowerCase()));
    const foundTags = allTags.filter((tag) => matchesAnyGoal(tag.name));
    if (foundTags.length === 0) {
      throw new BadRequestException(
        'These goal is not available in the system',
      );
    }
    await this.usersService.update(foundUser, {
      tags: foundTags,
      onboard_process: onboardProcess[2],
    });
  }

  async saveUserInfo(supabaseUid: string, info: UserInfoDto) {
    const foundUser =
      await this.usersService.findBySupabaseUidWithTags(supabaseUid);
    if (!foundUser) {
      throw new BadRequestException('This user is not existed');
    }
    if (foundUser.onboard_process !== onboardProcess[2]) {
      throw new BadRequestException('Complete the previous step first');
    }

    const { firstName, lastName, ...rest } = info;
    const userName = `${firstName} ${lastName}`;
    const userInfo = { ...rest, name: userName };
    await this.usersService.update(foundUser, {
      ...userInfo,
      onboard_process: onboardProcess[3],
    });
  }
}
