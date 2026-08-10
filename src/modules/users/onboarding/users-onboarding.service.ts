import { BadRequestException, Injectable } from '@nestjs/common'
import { UsersService } from '../users.service'
import { SaveOnboardingDto } from '../dto/save-onboarding.dto'
import { SaveOnboardingDraftDto } from '../dto/save-onboarding-draft.dto'
import { UpdateProfileDto } from '../dto/update-profile.dto'
import { TagsService } from '../../tags/tags.service'
import { Tag } from '../../tags/entities/tags.entities'
import { LocationsService } from '../../locations/locations.service'
import {
  isFixedLocationKey,
  isDynamicLocationKey,
} from '../../locations/place-key'
import { OccupationsService } from '../../occupations/occupations.service'
import { TAG_KEY_RE } from '../../tags/tag-key'
import { checkDateOfBirth } from '../utils/date-of-birth'
import { UpdateUserType } from '../users.type'

@Injectable()
export class UserOnboardingService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tagsService: TagsService,
    private readonly locationsService: LocationsService,
    private readonly occupationsService: OccupationsService,
  ) {}

  private async resolveGoalTags(goalKeys: string[]): Promise<Tag[]> {
    const tags = await this.tagsService.findByKeysAndKind(goalKeys, 'goal')
    if (tags.length !== goalKeys.length) {
      const found = new Set(tags.map((tag) => tag.key))
      const unknown = goalKeys.filter((key) => !found.has(key))
      throw new BadRequestException(`Unknown goal(s): ${unknown.join(', ')}`)
    }
    return tags
  }

  /**
   * Accept existing location tags, fixed seeds, or city-search keys
   * (upserting a tag row when the place is new).
   */
  private async assertLocation(
    key: string,
    locationName?: string,
  ): Promise<void> {
    const existing = await this.tagsService.findOneByKeyAndKind(key, 'location')
    if (existing) return

    if (isFixedLocationKey(key)) {
      throw new BadRequestException(`Unknown location tag: ${key}`)
    }

    if (!isDynamicLocationKey(key)) {
      throw new BadRequestException(`Unknown location tag: ${key}`)
    }

    const name =
      locationName?.trim() || this.locationsService.cachedName(key) || ''
    if (!name) {
      throw new BadRequestException(
        'locationName is required when selecting a new city location',
      )
    }

    await this.tagsService.upsertLocation(key, name)
  }

  /**
   * Accept seeded occupation tags, corpus titles, or free-text titles
   * slugified client-side (`occupationName` / cache / index for display).
   */
  private async assertOccupation(
    key: string,
    occupationName?: string,
  ): Promise<void> {
    const existing = await this.tagsService.findOneByKeyAndKind(
      key,
      'occupation',
    )
    if (existing) return

    if (!TAG_KEY_RE.test(key)) {
      throw new BadRequestException(`Unknown occupation tag: ${key}`)
    }

    const name =
      occupationName?.trim() ||
      this.occupationsService.cachedName(key) ||
      this.occupationsService.nameForKey(key) ||
      ''
    if (!name) {
      throw new BadRequestException(
        'occupationName is required when selecting a new occupation',
      )
    }

    await this.tagsService.upsertOccupation(key, name)
  }

  private async assertCatalogFields(dto: {
    location?: string
    locationName?: string
    occupation?: string
    occupationName?: string
  }): Promise<void> {
    if (dto.location !== undefined && dto.location !== '') {
      await this.assertLocation(dto.location, dto.locationName)
    }
    if (dto.occupation !== undefined && dto.occupation !== '') {
      await this.assertOccupation(dto.occupation, dto.occupationName)
    }
  }

  private resolveDateOfBirth(raw: string): { iso: string; age: number } {
    const result = checkDateOfBirth(raw)
    if (!result.ok) {
      const messages: Record<typeof result.reason, string> = {
        invalid: 'Date of birth must be YYYY-MM-DD',
        future: 'Date of birth cannot be in the future',
        too_young: 'You must be older than 16',
        too_old: 'Date of birth is out of range',
      }
      throw new BadRequestException(messages[result.reason])
    }
    return { iso: result.iso, age: result.age }
  }

  private applyProfileFields(
    patch: UpdateUserType,
    dto: SaveOnboardingDraftDto | UpdateProfileDto,
    user: { name?: string | null },
  ): void {
    if (dto.role !== undefined) patch.role = dto.role
    if (dto.dateOfBirth !== undefined) {
      const dob = this.resolveDateOfBirth(dto.dateOfBirth)
      patch.date_of_birth = dob.iso
      patch.age = dob.age
    }
    if (dto.location !== undefined) patch.location = dto.location
    if (dto.occupation !== undefined) patch.occupation = dto.occupation
    if ('avatarUrl' in dto && dto.avatarUrl !== undefined) {
      patch.avatar_url = dto.avatarUrl === '' ? null : dto.avatarUrl
    }
    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      const [currentFirst = '', ...currentRest] = (user.name ?? '')
        .trim()
        .split(/\s+/)
      const firstName = dto.firstName ?? currentFirst
      const lastName = dto.lastName ?? currentRest.join(' ')
      patch.name = `${firstName} ${lastName}`.trim()
    }
  }

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

    await this.assertCatalogFields(dto)

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
   * Completes onboarding and assigns a unique `url_key` from the display name
   * (server-side only — never generated by the client).
   */
  async saveOnboarding(
    supabaseUid: string,
    email: string,
    dto: SaveOnboardingDto,
  ): Promise<void> {
    const existing =
      await this.usersService.findBySupabaseUidWithTags(supabaseUid)
    if (existing?.onboarded_at) {
      throw new BadRequestException('Onboarding already completed')
    }

    await this.assertCatalogFields(dto)
    const tags = await this.resolveGoalTags(dto.goals)
    const user = await this.usersService.findOrCreate(supabaseUid, email)
    const name = `${dto.firstName} ${dto.lastName}`
    const url_key =
      existing?.url_key ??
      (await this.usersService.allocateUrlKeyForUser({
        supabaseUid,
        name,
        email,
      }))

    const dob = this.resolveDateOfBirth(dto.dateOfBirth)

    await this.usersService.update(user, {
      role: dto.role,
      name,
      date_of_birth: dob.iso,
      age: dob.age,
      location: dto.location,
      occupation: dto.occupation,
      tags,
      url_key,
      onboarded_at: new Date(),
      onboarding_step: null,
    })
  }

  /**
   * Editing an already-onboarded profile. Name changes do not rename url_key
   * (stable URLs). Optional `urlKey` updates are validated server-side.
   */
  async updateProfile(
    supabaseUid: string,
    dto: UpdateProfileDto,
  ): Promise<void> {
    const user = await this.usersService.findBySupabaseUidWithTags(supabaseUid)
    if (!user) {
      throw new BadRequestException('This user does not exist')
    }
    if (!user.onboarded_at) {
      throw new BadRequestException('Onboarding must be completed first')
    }

    await this.assertCatalogFields(dto)

    const patch: UpdateUserType = {}
    this.applyProfileFields(patch, dto, user)
    if (dto.goals !== undefined) {
      patch.tags = await this.resolveGoalTags(dto.goals)
    }

    if (dto.urlKey !== undefined) {
      const next = await this.usersService.resolveUrlKeyUpdate(user, dto.urlKey)
      if (next) patch.url_key = next
    } else if (!user.url_key) {
      patch.url_key = await this.usersService.allocateUrlKeyForUser({
        supabaseUid,
        name: patch.name ?? user.name,
        email: user.email,
      })
    }

    if (Object.keys(patch).length === 0) return
    await this.usersService.update(user, patch)
  }
}
