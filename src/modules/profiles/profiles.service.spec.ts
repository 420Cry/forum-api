import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { UsersService } from '../users/users.service'
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
    createOnboardedQuery: jest.Mock
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
      createOnboardedQuery: jest.fn(),
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
      expect(accounts[1]?.accountType).toBe('startup')
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
})
