import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { LocationsService } from '../locations/locations.service'
import { InvestorProfiles } from '../profiles/entities/investor-profiles.entity'
import { StartupProfiles } from '../profiles/entities/startup-profiles.entity'
import { ProfilesService } from '../profiles/profiles.service'
import { TagsService } from '../tags/tags.service'
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
    count: jest.Mock
  }
  let startupRepo: { findOne: jest.Mock }
  let investorRepo: { findOne: jest.Mock }
  let profilesService: {
    assertTargetExists: jest.Mock
    adjustConnections: jest.Mock
  }
  let usersService: {
    findBySupabaseUid: jest.Mock
    findBySupabaseUidWithTags: jest.Mock
    findOnboardedBySupabaseUids: jest.Mock
    ensureUrlKey: jest.Mock
  }
  let locationsService: { nameForKey: jest.Mock }
  let tagsService: { labelMap: jest.Mock }

  beforeEach(async () => {
    followsRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((row: Record<string, unknown>) => row),
      save: jest.fn((row: Record<string, unknown>) => Promise.resolve(row)),
      remove: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
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
      findBySupabaseUid: jest.fn(),
      findBySupabaseUidWithTags: jest.fn(),
      findOnboardedBySupabaseUids: jest.fn().mockResolvedValue([]),
      ensureUrlKey: jest.fn((user: Record<string, unknown>) =>
        Promise.resolve(user),
      ),
    }
    locationsService = {
      nameForKey: jest.fn((key: string) =>
        key === 'city_nl_nh_amsterdam' ? 'Amsterdam, Netherlands' : undefined,
      ),
    }
    tagsService = {
      labelMap: jest.fn(() => Promise.resolve(new Map())),
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
        { provide: LocationsService, useValue: locationsService },
        { provide: TagsService, useValue: tagsService },
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

  it('resolves city location keys when listing following', async () => {
    followsRepo.find.mockResolvedValue([
      { target_type: 'user', target_id: OTHER, createdAt: new Date() },
    ])
    usersService.findBySupabaseUidWithTags.mockResolvedValue({
      supabaseUid: OTHER,
      onboarded_at: new Date(),
      location: 'city_nl_nh_amsterdam',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      url_key: 'ada',
      role: 'Founder',
      avatar_url: null,
    })

    const list = await service.listFollowing(UID)
    expect(list).toHaveLength(1)
    expect(list[0]?.location).toBe('Amsterdam, Netherlands')
    expect(locationsService.nameForKey).toHaveBeenCalledWith(
      'city_nl_nh_amsterdam',
    )
  })

  it('labels startup industry headlines when listing following', async () => {
    followsRepo.find.mockResolvedValue([
      { target_type: 'startup', target_id: TARGET, createdAt: new Date() },
    ])
    startupRepo.findOne.mockResolvedValue({
      id: TARGET,
      user_id: OTHER,
      company_name: 'Acme',
      industry: 'fintech',
      stage: 'seed',
      url_key: 'acme',
    })
    tagsService.labelMap.mockResolvedValue(new Map([['fintech', 'Fintech']]))

    const list = await service.listFollowing(UID)
    expect(list).toHaveLength(1)
    expect(list[0]?.headline).toBe('Fintech / seed')
  })

  it('counts followers and following', async () => {
    followsRepo.count.mockResolvedValueOnce(4).mockResolvedValueOnce(7)
    await expect(service.countFollowers('user', TARGET)).resolves.toBe(4)
    await expect(service.countFollowing(UID)).resolves.toBe(7)
    expect(followsRepo.count).toHaveBeenCalledWith({
      where: { target_type: 'user', target_id: TARGET },
    })
    expect(followsRepo.count).toHaveBeenCalledWith({
      where: { follower_user_id: UID },
    })
  })

  it('lists followers as account summaries', async () => {
    followsRepo.find.mockResolvedValue([
      { follower_user_id: OTHER, createdAt: new Date() },
    ])
    usersService.findBySupabaseUidWithTags.mockResolvedValue({
      supabaseUid: OTHER,
      onboarded_at: new Date(),
      location: null,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      url_key: 'ada',
      role: 'Founder',
      avatar_url: null,
    })

    const list = await service.listFollowers('startup', TARGET)
    expect(profilesService.assertTargetExists).toHaveBeenCalledWith(
      'startup',
      TARGET,
    )
    expect(list).toHaveLength(1)
    expect(list[0]?.id).toBe(OTHER)
    expect(list[0]?.name).toBe('Ada Lovelace')
  })

  it('lists following for another user when onboarded', async () => {
    usersService.findBySupabaseUid.mockResolvedValue({
      supabaseUid: OTHER,
      onboarded_at: new Date(),
    })
    followsRepo.find.mockResolvedValue([])
    await expect(service.listFollowingForUser(OTHER)).resolves.toEqual([])
    expect(followsRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { follower_user_id: OTHER },
      }),
    )
  })

  it('lists user connections with mutual and one-sided relations', async () => {
    const mutual = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    const onlyFollowing = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    const onlyFollower = 'cccccccc-cccc-cccc-cccc-cccccccccccc'

    followsRepo.find
      .mockResolvedValueOnce([
        { target_id: mutual },
        { target_id: onlyFollowing },
      ])
      .mockResolvedValueOnce([
        { follower_user_id: mutual },
        { follower_user_id: onlyFollower },
      ])

    usersService.findOnboardedBySupabaseUids.mockResolvedValue([
      {
        supabaseUid: mutual,
        url_key: 'mutual-user',
        name: 'Mutual User',
        email: 'mutual@example.com',
        role: 'Founder',
        location: null,
        avatar_url: null,
        onboarded_at: new Date(),
      },
      {
        supabaseUid: onlyFollowing,
        url_key: 'following-user',
        name: 'Following User',
        email: 'following@example.com',
        role: 'Investor',
        location: null,
        avatar_url: null,
        onboarded_at: new Date(),
      },
      {
        supabaseUid: onlyFollower,
        url_key: 'follower-user',
        name: 'Follower User',
        email: 'follower@example.com',
        role: 'Founder',
        location: null,
        avatar_url: null,
        onboarded_at: new Date(),
      },
    ])

    const list = await service.listUserConnections(UID)
    expect(list.map((row) => [row.id, row.relation])).toEqual([
      [mutual, 'mutual'],
      [onlyFollowing, 'following'],
      [onlyFollower, 'follower'],
    ])
  })
})
