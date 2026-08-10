import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { InvestorProfiles } from '../profiles/entities/investor-profiles.entity'
import { StartupProfiles } from '../profiles/entities/startup-profiles.entity'
import { ProfilesService } from '../profiles/profiles.service'
import { UsersService } from '../users/users.service'
import { Follows } from './entities/follows.entity'
import { FollowsService } from './follows.service'

const UID = '11111111-1111-1111-1111-111111111111'
const OTHER = '33333333-3333-3333-3333-333333333333'
const TARGET = '22222222-2222-2222-2222-222222222222'

describe('FollowsService', () => {
  let service: FollowsService
  let followsRepo: {
    findOne: jest.Mock
    find: jest.Mock
    create: jest.Mock
    save: jest.Mock
    remove: jest.Mock
  }
  let startupRepo: { findOne: jest.Mock }
  let investorRepo: { findOne: jest.Mock }
  let profilesService: {
    assertTargetExists: jest.Mock
    adjustConnections: jest.Mock
  }
  let usersService: {
    findBySupabaseUidWithTags: jest.Mock
    ensureUrlKey: jest.Mock
  }

  beforeEach(async () => {
    followsRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((row: Record<string, unknown>) => row),
      save: jest.fn((row: Record<string, unknown>) => Promise.resolve(row)),
      remove: jest.fn(),
    }
    startupRepo = {
      findOne: jest.fn().mockResolvedValue({ id: TARGET, user_id: OTHER }),
    }
    investorRepo = {
      findOne: jest.fn().mockResolvedValue({ id: TARGET, user_id: OTHER }),
    }
    profilesService = {
      assertTargetExists: jest.fn(),
      adjustConnections: jest.fn(),
    }
    usersService = {
      findBySupabaseUidWithTags: jest.fn(),
      ensureUrlKey: jest.fn((user: Record<string, unknown>) =>
        Promise.resolve(user),
      ),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowsService,
        { provide: getRepositoryToken(Follows), useValue: followsRepo },
        { provide: getRepositoryToken(StartupProfiles), useValue: startupRepo },
        {
          provide: getRepositoryToken(InvestorProfiles),
          useValue: investorRepo,
        },
        { provide: ProfilesService, useValue: profilesService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile()

    service = module.get(FollowsService)
  })

  it('rejects following yourself', async () => {
    await expect(
      service.follow(UID, { targetType: 'user', targetId: UID }),
    ).rejects.toThrow(BadRequestException)
  })

  it('rejects following your own startup', async () => {
    startupRepo.findOne.mockResolvedValue({ id: TARGET, user_id: UID })
    await expect(
      service.follow(UID, { targetType: 'startup', targetId: TARGET }),
    ).rejects.toThrow(BadRequestException)
  })

  it('is idempotent when already following', async () => {
    followsRepo.findOne.mockResolvedValue({ id: 'f1' })
    const result = await service.follow(UID, {
      targetType: 'startup',
      targetId: TARGET,
    })
    expect(result).toEqual({ success: true, following: true })
    expect(followsRepo.save).not.toHaveBeenCalled()
  })

  it('creates a follow and bumps connections for startups', async () => {
    followsRepo.findOne.mockResolvedValue(null)
    const result = await service.follow(UID, {
      targetType: 'startup',
      targetId: TARGET,
    })
    expect(result.following).toBe(true)
    expect(profilesService.adjustConnections).toHaveBeenCalledWith(
      'startup',
      TARGET,
      1,
    )
  })

  it('unfollows and decrements connections', async () => {
    followsRepo.findOne.mockResolvedValue({
      id: 'f1',
      target_type: 'startup',
      target_id: TARGET,
    })
    const result = await service.unfollow(UID, {
      targetType: 'startup',
      targetId: TARGET,
    })
    expect(result.following).toBe(false)
    expect(followsRepo.remove).toHaveBeenCalled()
    expect(profilesService.adjustConnections).toHaveBeenCalledWith(
      'startup',
      TARGET,
      -1,
    )
  })
})
