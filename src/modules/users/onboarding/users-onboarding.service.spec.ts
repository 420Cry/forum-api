import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { UserOnboardingService } from './users-onboarding.service'
import { UsersService } from '../users.service'
import { TagsService } from '../../tags/tags.service'
import { LocationsService } from '../../locations/locations.service'
import { OccupationsService } from '../../occupations/occupations.service'
import type { User } from '../entities'
import type { Tag } from '../../tags/entities/tags.entities'
import type { SaveOnboardingDto } from '../dto/save-onboarding.dto'
import { ageFromDateOfBirth, parseDateOfBirth } from '../utils/date-of-birth'

const UID = '11111111-1111-1111-1111-111111111111'
const EMAIL = 'founder@example.com'

const baseDto: SaveOnboardingDto = {
  role: 'Founder',
  goals: ['raise_capital', 'find_cofounders'],
  firstName: 'Alex',
  lastName: 'Morgan',
  dateOfBirth: '1998-01-01',
  location: 'austin-us',
  occupation: 'founder',
}

const goalTags: Tag[] = [
  { id: 1, key: 'raise_capital', name: 'Raise capital', kind: 'goal' },
  { id: 2, key: 'find_cofounders', name: 'Find co-founders', kind: 'goal' },
]

describe('UserOnboardingService', () => {
  let service: UserOnboardingService
  let usersService: {
    findOrCreate: jest.Mock
    findBySupabaseUidWithTags: jest.Mock
    update: jest.Mock
    allocateUrlKeyForUser: jest.Mock
    resolveUrlKeyUpdate: jest.Mock
  }
  let tagsService: {
    findByKeysAndKind: jest.Mock
    findOneByKeyAndKind: jest.Mock
    upsertLocation: jest.Mock
    upsertOccupation: jest.Mock
  }
  let locationsService: {
    cachedName: jest.Mock
  }
  let occupationsService: {
    cachedName: jest.Mock
    nameForKey: jest.Mock
  }

  beforeEach(async () => {
    usersService = {
      findOrCreate: jest.fn(),
      findBySupabaseUidWithTags: jest.fn(),
      update: jest.fn(),
      allocateUrlKeyForUser: jest.fn().mockResolvedValue('alex-morgan'),
      resolveUrlKeyUpdate: jest.fn(),
    }
    tagsService = {
      findByKeysAndKind: jest.fn(),
      findOneByKeyAndKind: jest.fn((key: string, kind: string) =>
        Promise.resolve({
          id: 99,
          key,
          name: key,
          kind,
        }),
      ),
      upsertLocation: jest.fn(),
      upsertOccupation: jest.fn(),
    }
    locationsService = {
      cachedName: jest.fn(),
    }
    occupationsService = {
      cachedName: jest.fn(),
      nameForKey: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserOnboardingService,
        { provide: UsersService, useValue: usersService },
        { provide: TagsService, useValue: tagsService },
        { provide: LocationsService, useValue: locationsService },
        { provide: OccupationsService, useValue: occupationsService },
      ],
    }).compile()

    service = module.get(UserOnboardingService)
  })

  describe('saveOnboarding', () => {
    it('persists all fields atomically and marks user onboarded', async () => {
      const user = { supabaseUid: UID, email: EMAIL } as User
      tagsService.findByKeysAndKind.mockResolvedValue(goalTags)
      usersService.findOrCreate.mockResolvedValue(user)
      usersService.update.mockResolvedValue(user)

      await service.saveOnboarding(UID, EMAIL, baseDto)

      expect(tagsService.findByKeysAndKind).toHaveBeenCalledWith(
        baseDto.goals,
        'goal',
      )
      expect(usersService.findOrCreate).toHaveBeenCalledWith(UID, EMAIL)
      expect(usersService.allocateUrlKeyForUser).toHaveBeenCalledWith({
        supabaseUid: UID,
        name: 'Alex Morgan',
        email: EMAIL,
      })
      const expectedAge = ageFromDateOfBirth(
        parseDateOfBirth(baseDto.dateOfBirth)!,
      )
      expect(usersService.update).toHaveBeenCalledWith(
        user,
        expect.objectContaining({
          role: 'Founder',
          name: 'Alex Morgan',
          date_of_birth: '1998-01-01',
          age: expectedAge,
          location: 'austin-us',
          occupation: 'founder',
          tags: goalTags,
          url_key: 'alex-morgan',
          onboarded_at: expect.any(Date) as Date,
          onboarding_step: null,
        }),
      )
    })

    it('rejects repeat onboarding submit', async () => {
      usersService.findBySupabaseUidWithTags.mockResolvedValue({
        supabaseUid: UID,
        onboarded_at: new Date(),
      })

      await expect(service.saveOnboarding(UID, EMAIL, baseDto)).rejects.toThrow(
        BadRequestException,
      )

      expect(usersService.findOrCreate).not.toHaveBeenCalled()
      expect(usersService.update).not.toHaveBeenCalled()
    })

    it('upserts a city location tag when the key is new', async () => {
      const user = { supabaseUid: UID, email: EMAIL } as User
      tagsService.findOneByKeyAndKind.mockImplementation(
        (key: string, kind: string) => {
          if (kind === 'location') return Promise.resolve(null)
          return Promise.resolve({ id: 99, key, name: key, kind })
        },
      )
      tagsService.findByKeysAndKind.mockResolvedValue(goalTags)
      tagsService.upsertLocation.mockResolvedValue({
        id: 50,
        key: 'city_vn_hn_hanoi',
        name: 'Hanoi, Vietnam',
        kind: 'location',
      })
      usersService.findOrCreate.mockResolvedValue(user)
      usersService.update.mockResolvedValue(user)

      await service.saveOnboarding(UID, EMAIL, {
        ...baseDto,
        location: 'city_vn_hn_hanoi',
        locationName: 'Hanoi, Vietnam',
      })

      expect(tagsService.upsertLocation).toHaveBeenCalledWith(
        'city_vn_hn_hanoi',
        'Hanoi, Vietnam',
      )
      expect(usersService.update).toHaveBeenCalledWith(
        user,
        expect.objectContaining({ location: 'city_vn_hn_hanoi' }),
      )
    })

    it('upserts a free-text occupation tag when the key is new', async () => {
      const user = { supabaseUid: UID, email: EMAIL } as User
      tagsService.findOneByKeyAndKind.mockImplementation(
        (key: string, kind: string) => {
          if (kind === 'occupation') return Promise.resolve(null)
          return Promise.resolve({ id: 99, key, name: key, kind })
        },
      )
      tagsService.findByKeysAndKind.mockResolvedValue(goalTags)
      tagsService.upsertOccupation.mockResolvedValue({
        id: 51,
        key: 'software_engineer',
        name: 'Software Engineer',
        kind: 'occupation',
      })
      usersService.findOrCreate.mockResolvedValue(user)
      usersService.update.mockResolvedValue(user)

      await service.saveOnboarding(UID, EMAIL, {
        ...baseDto,
        occupation: 'software_engineer',
        occupationName: 'Software Engineer',
      })

      expect(tagsService.upsertOccupation).toHaveBeenCalledWith(
        'software_engineer',
        'Software Engineer',
      )
      expect(usersService.update).toHaveBeenCalledWith(
        user,
        expect.objectContaining({ occupation: 'software_engineer' }),
      )
    })

    it('upserts an occupation from the search index when name is omitted', async () => {
      const user = { supabaseUid: UID, email: EMAIL } as User
      tagsService.findOneByKeyAndKind.mockImplementation(
        (key: string, kind: string) => {
          if (kind === 'occupation') return Promise.resolve(null)
          return Promise.resolve({ id: 99, key, name: key, kind })
        },
      )
      occupationsService.cachedName.mockReturnValue(undefined)
      occupationsService.nameForKey.mockReturnValue('Software Engineer')
      tagsService.findByKeysAndKind.mockResolvedValue(goalTags)
      tagsService.upsertOccupation.mockResolvedValue({
        id: 51,
        key: 'software_engineer',
        name: 'Software Engineer',
        kind: 'occupation',
      })
      usersService.findOrCreate.mockResolvedValue(user)
      usersService.update.mockResolvedValue(user)

      await service.saveOnboarding(UID, EMAIL, {
        ...baseDto,
        occupation: 'software_engineer',
      })

      expect(occupationsService.nameForKey).toHaveBeenCalledWith(
        'software_engineer',
      )
      expect(tagsService.upsertOccupation).toHaveBeenCalledWith(
        'software_engineer',
        'Software Engineer',
      )
    })

    it('rejects a new city location without a display name', async () => {
      tagsService.findOneByKeyAndKind.mockResolvedValue(null)
      locationsService.cachedName.mockReturnValue(undefined)

      await expect(
        service.saveOnboarding(UID, EMAIL, {
          ...baseDto,
          location: 'city_vn_hn_hanoi',
        }),
      ).rejects.toThrow(BadRequestException)

      expect(usersService.update).not.toHaveBeenCalled()
    })
  })

  describe('saveDraft', () => {
    it('persists partial progress without marking onboarded', async () => {
      const user = { supabaseUid: UID, email: EMAIL } as User
      usersService.findBySupabaseUidWithTags.mockResolvedValue(null)
      usersService.findOrCreate.mockResolvedValue(user)
      usersService.update.mockResolvedValue(user)
      tagsService.findByKeysAndKind.mockResolvedValue([goalTags[0]])

      await service.saveDraft(UID, EMAIL, {
        step: 2,
        role: 'Founder',
        goals: ['raise_capital'],
      })

      expect(usersService.findOrCreate).toHaveBeenCalledWith(UID, EMAIL)
      expect(usersService.update).toHaveBeenCalledWith(
        user,
        expect.objectContaining({
          onboarding_step: 2,
          role: 'Founder',
          tags: [goalTags[0]],
        }),
      )
    })

    it('rejects draft when onboarding is already complete', async () => {
      usersService.findBySupabaseUidWithTags.mockResolvedValue({
        supabaseUid: UID,
        onboarded_at: new Date(),
      })

      await expect(
        service.saveDraft(UID, EMAIL, { step: 1, role: 'Founder' }),
      ).rejects.toThrow(BadRequestException)

      expect(usersService.findOrCreate).not.toHaveBeenCalled()
    })

    it('skips update when draft payload is empty', async () => {
      usersService.findBySupabaseUidWithTags.mockResolvedValue(null)

      await service.saveDraft(UID, EMAIL, {})

      expect(usersService.findOrCreate).not.toHaveBeenCalled()
      expect(usersService.update).not.toHaveBeenCalled()
    })

    it('clears goals when an empty goals array is sent', async () => {
      const user = { supabaseUid: UID, email: EMAIL, tags: goalTags } as User
      usersService.findBySupabaseUidWithTags.mockResolvedValue(user)
      usersService.findOrCreate.mockResolvedValue(user)
      usersService.update.mockResolvedValue(user)

      await service.saveDraft(UID, EMAIL, { goals: [] })

      expect(usersService.update).toHaveBeenCalledWith(user, { tags: [] })
    })

    it('persists avatarUrl on draft', async () => {
      const user = { supabaseUid: UID, email: EMAIL } as User
      usersService.findBySupabaseUidWithTags.mockResolvedValue(user)
      usersService.findOrCreate.mockResolvedValue(user)
      usersService.update.mockResolvedValue(user)

      await service.saveDraft(UID, EMAIL, {
        step: 3,
        avatarUrl: 'https://cdn.example.com/a.webp',
      })

      expect(usersService.update).toHaveBeenCalledWith(
        user,
        expect.objectContaining({
          onboarding_step: 3,
          avatar_url: 'https://cdn.example.com/a.webp',
        }),
      )
    })
  })

  describe('updateProfile', () => {
    const existingUser = {
      supabaseUid: UID,
      email: EMAIL,
      name: 'Alex Morgan',
      url_key: 'alex-morgan',
      tags: goalTags,
    } as User

    it('throws when user does not exist', async () => {
      usersService.findBySupabaseUidWithTags.mockResolvedValue(null)

      await expect(
        service.updateProfile(UID, { occupation: 'Investor' }),
      ).rejects.toThrow(BadRequestException)
    })

    it('throws when onboarding is not complete', async () => {
      usersService.findBySupabaseUidWithTags.mockResolvedValue({
        supabaseUid: UID,
        onboarded_at: null,
      })

      await expect(
        service.updateProfile(UID, { occupation: 'Investor' }),
      ).rejects.toThrow(BadRequestException)

      expect(usersService.update).not.toHaveBeenCalled()
    })

    it('patches only provided fields', async () => {
      const onboardedUser = {
        ...existingUser,
        onboarded_at: new Date(),
      }
      usersService.findBySupabaseUidWithTags.mockResolvedValue(onboardedUser)
      usersService.update.mockResolvedValue(onboardedUser)

      await service.updateProfile(UID, { occupation: 'Investor' })

      expect(usersService.update).toHaveBeenCalledWith(onboardedUser, {
        occupation: 'Investor',
      })
    })

    it('merges partial name updates without renaming url_key', async () => {
      const onboardedUser = {
        ...existingUser,
        onboarded_at: new Date(),
      }
      usersService.findBySupabaseUidWithTags.mockResolvedValue(onboardedUser)
      usersService.update.mockResolvedValue(onboardedUser)

      await service.updateProfile(UID, { lastName: 'Walker' })

      expect(usersService.update).toHaveBeenCalledWith(onboardedUser, {
        name: 'Alex Walker',
      })
      expect(usersService.allocateUrlKeyForUser).not.toHaveBeenCalled()
    })

    it('replaces goals when provided', async () => {
      const newTags = [
        { id: 3, key: 'gather_feedback', name: 'Gather feedback' },
      ]
      const onboardedUser = {
        ...existingUser,
        onboarded_at: new Date(),
      }
      tagsService.findByKeysAndKind.mockResolvedValue(newTags)
      usersService.findBySupabaseUidWithTags.mockResolvedValue(onboardedUser)
      usersService.update.mockResolvedValue(onboardedUser)

      await service.updateProfile(UID, { goals: ['gather_feedback'] })

      expect(tagsService.findByKeysAndKind).toHaveBeenCalledWith(
        ['gather_feedback'],
        'goal',
      )
      expect(usersService.update).toHaveBeenCalledWith(onboardedUser, {
        tags: newTags,
      })
    })

    it('sets and clears avatarUrl', async () => {
      const onboardedUser = {
        ...existingUser,
        onboarded_at: new Date(),
        url_key: 'alex-morgan',
      }
      usersService.findBySupabaseUidWithTags.mockResolvedValue(onboardedUser)
      usersService.update.mockResolvedValue(onboardedUser)

      await service.updateProfile(UID, {
        avatarUrl: 'https://cdn.example.com/a.png',
      })
      expect(usersService.update).toHaveBeenCalledWith(onboardedUser, {
        avatar_url: 'https://cdn.example.com/a.png',
      })

      await service.updateProfile(UID, { avatarUrl: '' })
      expect(usersService.update).toHaveBeenCalledWith(onboardedUser, {
        avatar_url: null,
      })
    })

    it('updates urlKey when valid and available', async () => {
      const onboardedUser = {
        ...existingUser,
        onboarded_at: new Date(),
        url_key: 'alex-morgan',
      }
      usersService.findBySupabaseUidWithTags.mockResolvedValue(onboardedUser)
      usersService.update.mockResolvedValue(onboardedUser)
      usersService.resolveUrlKeyUpdate.mockResolvedValue('dao-nguyen')

      await service.updateProfile(UID, { urlKey: 'dao-nguyen' })

      expect(usersService.resolveUrlKeyUpdate).toHaveBeenCalledWith(
        onboardedUser,
        'dao-nguyen',
      )
      expect(usersService.update).toHaveBeenCalledWith(onboardedUser, {
        url_key: 'dao-nguyen',
      })
    })

    it('assigns a url_key when missing on profile update', async () => {
      const onboardedUser = {
        ...existingUser,
        onboarded_at: new Date(),
        url_key: null,
      }
      usersService.findBySupabaseUidWithTags.mockResolvedValue(onboardedUser)
      usersService.update.mockResolvedValue(onboardedUser)
      usersService.allocateUrlKeyForUser.mockResolvedValue('alex-morgan')

      await service.updateProfile(UID, { occupation: 'founder' })

      expect(usersService.allocateUrlKeyForUser).toHaveBeenCalled()
      expect(usersService.update).toHaveBeenCalledWith(onboardedUser, {
        occupation: 'founder',
        url_key: 'alex-morgan',
      })
    })
  })
})
