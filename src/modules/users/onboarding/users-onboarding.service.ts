import { BadRequestException, Injectable } from '@nestjs/common'
import { UsersService } from '../users.service'
import { SaveOnboardingDto } from '../dto/save-onboarding.dto'
import { SaveOnboardingDraftDto } from '../dto/save-onboarding-draft.dto'
import { UpdateProfileDto } from '../dto/update-profile.dto'
import { TagsService } from '../../tags/tags.service'
import { Tag } from '../../tags/entities/tags.entities'
import { UpdateUserType } from '../users.type'

@Injectable()
export class UserOnboardingService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tagsService: TagsService,
  ) {}

  private async resolveGoalTags(goalKeys: string[]): Promise<Tag[]> {
    const tags = await this.tagsService.findByKeys(goalKeys)
    if (tags.length !== goalKeys.length) {
      const found = new Set(tags.map((tag) => tag.key))
      const unknown = goalKeys.filter((key) => !found.has(key))
      throw new BadRequestException(`Unknown goal(s): ${unknown.join(', ')}`)
    }
    return tags
  }

  private applyProfileFields(
    patch: UpdateUserType,
    dto: SaveOnboardingDraftDto | UpdateProfileDto,
    user: { name?: string | null },
  ): void {
    if (dto.role !== undefined) patch.role = dto.role
    if (dto.age !== undefined) patch.age = dto.age
    if (dto.location !== undefined) patch.location = dto.location
    if (dto.occupation !== undefined) patch.occupation = dto.occupation
    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      const [currentFirst = '', ...currentRest] = (user.name ?? '')
        .trim()
        .split(/\s+/)
      const firstName = dto.firstName ?? currentFirst
      const lastName = dto.lastName ?? currentRest.join(' ')
      patch.name = `${firstName} ${lastName}`.trim()
    }
  }

  /**
   * Saves partial onboarding progress without marking the user as onboarded.
   */
  async saveDraft(
    supabaseUid: string,
    email: string,
    dto: SaveOnboardingDraftDto,
  ): Promise<void> {
    const existing =
      await this.usersService.findBySupabaseUidWithTags(supabaseUid)
    if (existing?.onboarded_at) {
      throw new BadRequestException('Onboarding already completed')
    }

    const patch: UpdateUserType = {}

    if (dto.step !== undefined) patch.onboarding_step = dto.step
    this.applyProfileFields(patch, dto, existing ?? { name: null })

    if (dto.goals !== undefined) {
      patch.tags =
        dto.goals.length === 0 ? [] : await this.resolveGoalTags(dto.goals)
    }

    if (Object.keys(patch).length === 0) return

    const user = await this.usersService.findOrCreate(supabaseUid, email)
    await this.usersService.update(user, patch)
  }

  /**
   * Onboarding is a single atomic submit. All fields are collected client-side
   * and persisted in one shot; completion is marked with onboarded_at.
   */
  async saveOnboarding(
    supabaseUid: string,
    email: string,
    dto: SaveOnboardingDto,
  ): Promise<void> {
    const tags = await this.resolveGoalTags(dto.goals)
    const user = await this.usersService.findOrCreate(supabaseUid, email)

    await this.usersService.update(user, {
      role: dto.role,
      name: `${dto.firstName} ${dto.lastName}`,
      age: dto.age,
      location: dto.location,
      occupation: dto.occupation,
      tags,
      onboarded_at: new Date(),
      onboarding_step: null,
    })
  }

  /**
   * Editing an already-onboarded profile. Only provided fields are updated.
   */
  async updateProfile(
    supabaseUid: string,
    dto: UpdateProfileDto,
  ): Promise<void> {
    const user = await this.usersService.findBySupabaseUidWithTags(supabaseUid)
    if (!user) {
      throw new BadRequestException('This user does not exist')
    }

    const patch: UpdateUserType = {}
    this.applyProfileFields(patch, dto, user)
    if (dto.goals !== undefined) {
      patch.tags = await this.resolveGoalTags(dto.goals)
    }

    await this.usersService.update(user, patch)
  }
}
