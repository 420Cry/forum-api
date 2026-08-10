import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { In } from 'typeorm'
import { TagsService } from '../tags/tags.service'
import { UsersService } from '../users/users.service'
import { LocationsService } from '../locations/locations.service'
import { OccupationsService } from '../occupations/occupations.service'
import { InvestorProfiles } from './entities/investor-profiles.entity'
import { StartupProfiles } from './entities/startup-profiles.entity'
import { ProfilesService } from './profiles.service'

const UID = '11111111-1111-1111-1111-111111111111'

describe('ProfilesService', () => {
  let service: ProfilesService
  let startupRepo: {
    findOne: jest.Mock
    find: jest.Mock
    create: jest.Mock
    save: jest.Mock
  }
  let investorRepo: {
    findOne: jest.Mock
    find: jest.Mock
    create: jest.Mock
    save: jest.Mock
  }
  let usersService: {
    findBySupabaseUid: jest.Mock
    findBySupabaseUidWithTags: jest.Mock
    findOnboardedByUrlKeyOrId: jest.Mock
    ensureUrlKey: jest.Mock
    createOnboardedQuery: jest.Mock
  }
  let tagsService: {
    labelMap: jest.Mock
  }

  beforeEach(async () => {
    startupRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((row: Record<string, unknown>) => row),
      save: jest.fn((row: Record<string, unknown>) =>
        Promise.resolve({
          id: '22222222-2222-2222-2222-222222222222',
          views: 0,
          connections: 0,
          ...row,
        }),
      ),
    }
    investorRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((row: Record<string, unknown>) => row),
      save: jest.fn((row: Record<string, unknown>) =>
        Promise.resolve({
          id: '33333333-3333-3333-3333-333333333333',
          views: 0,
          connections: 0,
          ...row,
        }),
      ),
    }
    usersService = {
      findBySupabaseUid: jest.fn(),
      findBySupabaseUidWithTags: jest.fn(),
      findOnboardedByUrlKeyOrId: jest.fn(),
      ensureUrlKey: jest.fn((user: Record<string, unknown>) =>
        Promise.resolve({
          ...user,
          url_key: user.url_key ?? 'alex-morgan',
        }),
      ),
      createOnboardedQuery: jest.fn(),
    }
    tagsService = {
      labelMap: jest.fn((keys: Array<string | null | undefined>) => {
        const map = new Map<string, string>()
        for (const key of keys) {
          if (key) map.set(key, key === 'climate' ? 'Climate' : key)
        }
        return Promise.resolve(map)
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        { provide: getRepositoryToken(StartupProfiles), useValue: startupRepo },
        {
          provide: getRepositoryToken(InvestorProfiles),
          useValue: investorRepo,
        },
        { provide: UsersService, useValue: usersService },
        { provide: TagsService, useValue: tagsService },
        {
          provide: LocationsService,
          useValue: { nameForKey: jest.fn(() => undefined) },
        },
        {
          provide: OccupationsService,
          useValue: { nameForKey: jest.fn(() => undefined) },
        },
      ],
    }).compile()

    service = module.get(ProfilesService)
  })

  describe('createStartup', () => {
    it('creates a startup profile for an onboarded user', async () => {
      usersService.findBySupabaseUid.mockResolvedValue({
        supabaseUid: UID,
        onboarded_at: new Date(),
      })
      startupRepo.findOne.mockResolvedValue(null)

      const result = await service.createStartup(UID, {
        companyName: 'HelloWorld',
        stage: 'pre_seed',
        industry: 'Climate',
        contactEmail: 'hello@example.com',
        foundedAt: '2024-01-15',
      })

      expect(result.companyName).toBe('HelloWorld')
      expect(startupRepo.save).toHaveBeenCalled()
    })

    it('rejects when startup already exists', async () => {
      usersService.findBySupabaseUid.mockResolvedValue({
        supabaseUid: UID,
        onboarded_at: new Date(),
      })
      startupRepo.findOne.mockResolvedValue({ id: 'existing' })

      await expect(
        service.createStartup(UID, {
          companyName: 'HelloWorld',
          stage: 'pre_seed',
          industry: 'Climate',
          contactEmail: 'hello@example.com',
          foundedAt: '2024-01-15',
        }),
      ).rejects.toThrow(ConflictException)
    })

    it('rejects when user is not onboarded', async () => {
      usersService.findBySupabaseUid.mockResolvedValue({
        supabaseUid: UID,
        onboarded_at: null,
      })

      await expect(
        service.createStartup(UID, {
          companyName: 'HelloWorld',
          stage: 'pre_seed',
          industry: 'Climate',
          contactEmail: 'hello@example.com',
          foundedAt: '2024-01-15',
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('listAccounts', () => {
    it('returns personal + org accounts', async () => {
      usersService.findBySupabaseUidWithTags.mockResolvedValue({
        supabaseUid: UID,
        email: 'founder@example.com',
        name: 'Alex Morgan',
        role: 'Founder',
        location: 'Austin',
        avatar_url: null,
        url_key: 'alex-morgan',
        onboarded_at: new Date(),
        tags: [],
      })
      startupRepo.findOne.mockResolvedValue({
        id: '22222222-2222-2222-2222-222222222222',
        company_name: 'HelloWorld',
        industry: 'Climate',
        stage: 'pre_seed',
        avatar_url: null,
        logo_url: null,
        views: 10,
        connections: 2,
      })
      investorRepo.findOne.mockResolvedValue(null)

      const accounts = await service.listAccounts(UID)
      expect(accounts).toHaveLength(2)
      expect(accounts[0]?.accountType).toBe('user')
      expect(accounts[0]?.href).toBe('/u/alex-morgan')
      expect(accounts[1]?.accountType).toBe('startup')
      expect(accounts[1]?.href).toBe(
        '/startup/22222222-2222-2222-2222-222222222222',
      )
    })
  })

  describe('getStartup', () => {
    it('increments views', async () => {
      startupRepo.findOne.mockResolvedValue({
        id: '22222222-2222-2222-2222-222222222222',
        user_id: UID,
        company_name: 'HelloWorld',
        description: null,
        stage: 'pre_seed',
        industry: 'Climate',
        website_url: null,
        contact_email: 'hello@example.com',
        avatar_url: null,
        logo_url: null,
        founded_at: new Date('2024-01-15'),
        views: 3,
        connections: 0,
      })
      startupRepo.save.mockImplementation((row: Record<string, unknown>) =>
        Promise.resolve(row),
      )

      const result = await service.getStartup(
        '22222222-2222-2222-2222-222222222222',
      )
      expect(result.views).toBe(4)
    })

    it('throws when missing', async () => {
      startupRepo.findOne.mockResolvedValue(null)
      await expect(
        service.getStartup('22222222-2222-2222-2222-222222222222'),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('createInvestor', () => {
    it('creates an investor profile', async () => {
      usersService.findBySupabaseUid.mockResolvedValue({
        supabaseUid: UID,
        onboarded_at: new Date(),
      })
      investorRepo.findOne.mockResolvedValue(null)

      const result = await service.createInvestor(UID, {
        firmName: 'North Bench',
        industry: 'Climate',
        contactEmail: 'partners@example.com',
        minInvestmentUsd: 50_000,
        maxInvestmentUsd: 200_000,
      })

      expect(result.firmName).toBe('North Bench')
      expect(result.minInvestmentUsd).toBe(50_000)
    })
  })

  describe('search', () => {
    it('excludes the viewer from user results', async () => {
      const andWhere = jest.fn().mockReturnThis()
      const take = jest.fn().mockReturnThis()
      const getMany = jest.fn().mockResolvedValue([
        {
          supabaseUid: '22222222-2222-2222-2222-222222222222',
          name: 'Other',
          role: 'Founder',
          occupation: null,
          location: null,
          avatar_url: null,
          url_key: 'other-user',
          tags: [],
        },
      ])
      usersService.createOnboardedQuery.mockReturnValue({
        andWhere,
        take,
        getMany,
      })
      startupRepo.find.mockResolvedValue([])
      investorRepo.find.mockResolvedValue([])

      const result = await service.search(UID, { type: 'user' })

      expect(andWhere).toHaveBeenCalledWith('user.supabaseUid != :viewerId', {
        viewerId: UID,
      })
      expect(result.users).toHaveLength(1)
      expect(result.users[0]?.id).toBe('22222222-2222-2222-2222-222222222222')
      expect(result.users[0]?.urlKey).toBe('other-user')
      expect(result.users[0]?.profilePath).toBe('/u/other-user')
      expect(result.users[0]?.goals).toEqual([])
    })

    it('applies multi-value location and industry filters', async () => {
      const andWhere = jest.fn().mockReturnThis()
      usersService.createOnboardedQuery.mockReturnValue({
        andWhere,
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })
      startupRepo.find.mockResolvedValue([])
      investorRepo.find.mockResolvedValue([])

      await service.search(UID, {
        type: 'all',
        location: 'austin-us,berlin-de',
        industry: 'climate,fintech',
      })

      expect(andWhere).toHaveBeenCalledWith(
        'user.location IN (:...locations)',
        { locations: ['austin-us', 'berlin-de'] },
      )
      expect(startupRepo.find).toHaveBeenCalledTimes(1)
      const findCalls = startupRepo.find.mock.calls as Array<
        [{ where: { industry: unknown } }]
      >
      const findArg = findCalls[0]?.[0]
      expect(findArg?.where.industry).toEqual(In(['climate', 'fintech']))
    })

    it('resolves public user by urlKey or uuid and returns goal keys', async () => {
      const user = {
        supabaseUid: UID,
        onboarded_at: new Date(),
        name: 'Alex Morgan',
        role: 'Founder',
        occupation: null,
        location: null,
        avatar_url: null,
        url_key: 'alex-morgan',
        tags: [
          { id: 1, key: 'raise_capital', name: 'Raise capital', kind: 'goal' },
        ],
      }
      usersService.findOnboardedByUrlKeyOrId.mockResolvedValue(user)

      await expect(service.getPublicUser('alex-morgan')).resolves.toEqual(
        expect.objectContaining({
          id: UID,
          urlKey: 'alex-morgan',
          profilePath: '/u/alex-morgan',
          goals: ['raise_capital'],
          occupationKey: null,
          locationKey: null,
        }),
      )
      expect(usersService.findOnboardedByUrlKeyOrId).toHaveBeenCalledWith(
        'alex-morgan',
      )
    })

    it('returns suggestions without a query', async () => {
      const andWhere = jest.fn().mockReturnThis()
      usersService.createOnboardedQuery.mockReturnValue({
        andWhere,
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })
      startupRepo.find.mockResolvedValue([])
      investorRepo.find.mockResolvedValue([])

      await service.search(UID, {})

      expect(startupRepo.find).toHaveBeenCalled()
      expect(investorRepo.find).toHaveBeenCalled()
      expect(andWhere).toHaveBeenCalledWith('user.supabaseUid != :viewerId', {
        viewerId: UID,
      })
    })
  })
})
