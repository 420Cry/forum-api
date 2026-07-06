import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { UserOnboardingService } from './users-onboarding.service'
import { UsersService } from '../users.service'
import { TagsService } from '../../tags/tags.service'
import type { User } from '../entities'
import type { Tag } from '../../tags/entities/tags.entities'
import type { SaveOnboardingDto } from '../dto/save-onboarding.dto'

const UID = '11111111-1111-1111-1111-111111111111'
const EMAIL = 'founder@example.com'

const baseDto: SaveOnboardingDto = {
  role: 'Founder',
  goals: ['raise_capital', 'find_cofounders'],
  firstName: 'Dao',
  lastName: 'Nguyen',
  age: 28,
  location: 'Hanoi',
  occupation: 'Founder',
}

const goalTags: Tag[] = [
  { id: 1, key: 'raise_capital', name: 'Raise capital' },
  { id: 2, key: 'find_cofounders', name: 'Find co-founders' },
]

describe('UserOnboardingService', () => {
  let service: UserOnboardingService
  let usersService: {
    findOrCreate: jest.Mock
    findBySupabaseUidWithTags: jest.Mock
    update: jest.Mock
  }
  let tagsService: {
    findByKeys: jest.Mock
  }

  beforeEach(async () => {
    usersService = {
      findOrCreate: jest.fn(),
      findBySupabaseUidWithTags: jest.fn(),
      update: jest.fn(),
    }
    tagsService = {
      findByKeys: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserOnboardingService,
        { provide: UsersService, useValue: usersService },
        { provide: TagsService, useValue: tagsService },
      ],
    }).compile()

    service = module.get(UserOnboardingService)
  })

  describe('saveOnboarding', () => {
    it('persists all fields atomically and marks user onboarded', async () => {
      const user = { supabaseUid: UID, email: EMAIL } as User
      tagsService.findByKeys.mockResolvedValue(goalTags)
      usersService.findOrCreate.mockResolvedValue(user)
      usersService.update.mockResolvedValue(user)

      await service.saveOnboarding(UID, EMAIL, baseDto)

      expect(tagsService.findByKeys).toHaveBeenCalledWith(baseDto.goals)
      expect(usersService.findOrCreate).toHaveBeenCalledWith(UID, EMAIL)
      expect(usersService.update).toHaveBeenCalledWith(
        user,
        expect.objectContaining({
          role: 'Founder',
          name: 'Dao Nguyen',
          age: 28,
          location: 'Hanoi',
          occupation: 'Founder',
          tags: goalTags,
          onboarded_at: expect.any(Date),
        }),
      )
    })

    it('throws when goal keys are unknown', async () => {
      tagsService.findByKeys.mockResolvedValue([
        { id: 1, key: 'raise_capital', name: 'Raise capital' },
      ])

      await expect(
        service.saveOnboarding(UID, EMAIL, {
          ...baseDto,
          goals: ['raise_capital', 'unknown_goal'],
        }),
      ).rejects.toThrow(BadRequestException)

      expect(usersService.findOrCreate).not.toHaveBeenCalled()
      expect(usersService.update).not.toHaveBeenCalled()
    })
  })

  describe('updateProfile', () => {
    const existingUser = {
      supabaseUid: UID,
      email: EMAIL,
      name: 'Dao Nguyen',
      tags: goalTags,
    } as User

    it('throws when user does not exist', async () => {
      usersService.findBySupabaseUidWithTags.mockResolvedValue(null)

      await expect(
        service.updateProfile(UID, { occupation: 'Investor' }),
      ).rejects.toThrow(BadRequestException)
    })

    it('patches only provided fields', async () => {
      usersService.findBySupabaseUidWithTags.mockResolvedValue(existingUser)
      usersService.update.mockResolvedValue(existingUser)

      await service.updateProfile(UID, { occupation: 'Investor' })

      expect(usersService.update).toHaveBeenCalledWith(existingUser, {
        occupation: 'Investor',
      })
    })

    it('merges partial name updates', async () => {
      usersService.findBySupabaseUidWithTags.mockResolvedValue(existingUser)
      usersService.update.mockResolvedValue(existingUser)

      await service.updateProfile(UID, { lastName: 'Tran' })

      expect(usersService.update).toHaveBeenCalledWith(existingUser, {
        name: 'Dao Tran',
      })
    })

    it('replaces goals when provided', async () => {
      const newTags = [{ id: 3, key: 'gather_feedback', name: 'Gather feedback' }]
      tagsService.findByKeys.mockResolvedValue(newTags)
      usersService.findBySupabaseUidWithTags.mockResolvedValue(existingUser)
      usersService.update.mockResolvedValue(existingUser)

      await service.updateProfile(UID, { goals: ['gather_feedback'] })

      expect(tagsService.findByKeys).toHaveBeenCalledWith(['gather_feedback'])
      expect(usersService.update).toHaveBeenCalledWith(existingUser, {
        tags: newTags,
      })
    })
  })
})
