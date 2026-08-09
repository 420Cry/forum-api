import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ILike, Repository } from 'typeorm'
import { UsersService } from '../users/users.service'
import {
  CreateInvestorProfileDto,
  UpdateInvestorProfileDto,
} from './dto/create-investor-profile.dto'
import {
  CreateStartupProfileDto,
  UpdateStartupProfileDto,
} from './dto/create-startup-profile.dto'
import { InvestorProfiles } from './entities/investor-profiles.entity'
import { StartupProfiles } from './entities/startup-profiles.entity'
import {
  investorAccountSummary,
  personalAccountSummary,
  toInvestorResponse,
  toPublicUserProfile,
  toStartupResponse,
  startupAccountSummary,
  type AccountSummary,
  type InvestorProfileResponse,
  type PublicUserProfileResponse,
  type StartupProfileResponse,
} from './profiles.mapper'

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(StartupProfiles)
    private readonly startupRepo: Repository<StartupProfiles>,
    @InjectRepository(InvestorProfiles)
    private readonly investorRepo: Repository<InvestorProfiles>,
    private readonly usersService: UsersService,
  ) {}

  async listAccounts(userId: string): Promise<AccountSummary[]> {
    const user = await this.usersService.findBySupabaseUidWithTags(userId)
    if (!user?.onboarded_at) {
      throw new BadRequestException('Onboarding must be completed first')
    }

    const [startup, investor] = await Promise.all([
      this.startupRepo.findOne({ where: { user_id: userId } }),
      this.investorRepo.findOne({ where: { user_id: userId } }),
    ])

    const accounts: AccountSummary[] = [personalAccountSummary(user)]
    if (startup) accounts.push(startupAccountSummary(startup))
    if (investor) accounts.push(investorAccountSummary(investor))
    return accounts
  }

  async createStartup(
    userId: string,
    dto: CreateStartupProfileDto,
  ): Promise<StartupProfileResponse> {
    await this.requireOnboarded(userId)
    const existing = await this.startupRepo.findOne({
      where: { user_id: userId },
    })
    if (existing) {
      throw new ConflictException('Startup profile already exists')
    }

    const profile = this.startupRepo.create({
      user_id: userId,
      company_name: dto.companyName,
      description: dto.description,
      stage: dto.stage,
      industry: dto.industry,
      website_url: dto.websiteUrl,
      contact_email: dto.contactEmail,
      avatar_url: dto.avatarUrl,
      logo_url: dto.logoUrl,
      founded_at: new Date(dto.foundedAt),
    })
    const saved = await this.startupRepo.save(profile)
    return toStartupResponse(saved)
  }

  async updateStartup(
    userId: string,
    dto: UpdateStartupProfileDto,
  ): Promise<StartupProfileResponse> {
    await this.requireOnboarded(userId)
    const profile = await this.startupRepo.findOne({
      where: { user_id: userId },
    })
    if (!profile) throw new NotFoundException('Startup profile not found')

    if (dto.companyName !== undefined) profile.company_name = dto.companyName
    if (dto.description !== undefined) profile.description = dto.description
    if (dto.stage !== undefined) profile.stage = dto.stage
    if (dto.industry !== undefined) profile.industry = dto.industry
    if (dto.websiteUrl !== undefined) {
      profile.website_url = dto.websiteUrl === '' ? undefined : dto.websiteUrl
    }
    if (dto.contactEmail !== undefined) profile.contact_email = dto.contactEmail
    if (dto.avatarUrl !== undefined) {
      profile.avatar_url = dto.avatarUrl === '' ? undefined : dto.avatarUrl
    }
    if (dto.logoUrl !== undefined) {
      profile.logo_url = dto.logoUrl === '' ? undefined : dto.logoUrl
    }
    if (dto.foundedAt !== undefined) {
      profile.founded_at = new Date(dto.foundedAt)
    }

    const saved = await this.startupRepo.save(profile)
    return toStartupResponse(saved)
  }

  async getStartup(id: string): Promise<StartupProfileResponse> {
    const profile = await this.startupRepo.findOne({ where: { id } })
    if (!profile) throw new NotFoundException('Startup profile not found')
    profile.views += 1
    await this.startupRepo.save(profile)
    return toStartupResponse(profile)
  }

  async createInvestor(
    userId: string,
    dto: CreateInvestorProfileDto,
  ): Promise<InvestorProfileResponse> {
    await this.requireOnboarded(userId)
    const existing = await this.investorRepo.findOne({
      where: { user_id: userId },
    })
    if (existing) {
      throw new ConflictException('Investor profile already exists')
    }

    const profile = this.investorRepo.create({
      user_id: userId,
      firm_name: dto.firmName,
      description: dto.description,
      industry: dto.industry,
      contact_email: dto.contactEmail,
      avatar_url: dto.avatarUrl,
      logo_url: dto.logoUrl,
      website_url: dto.websiteUrl,
      min_investment_usd: dto.minInvestmentUsd,
      max_investment_usd: dto.maxInvestmentUsd,
    })
    const saved = await this.investorRepo.save(profile)
    return toInvestorResponse(saved)
  }

  async updateInvestor(
    userId: string,
    dto: UpdateInvestorProfileDto,
  ): Promise<InvestorProfileResponse> {
    await this.requireOnboarded(userId)
    const profile = await this.investorRepo.findOne({
      where: { user_id: userId },
    })
    if (!profile) throw new NotFoundException('Investor profile not found')

    if (dto.firmName !== undefined) profile.firm_name = dto.firmName
    if (dto.description !== undefined) profile.description = dto.description
    if (dto.industry !== undefined) profile.industry = dto.industry
    if (dto.contactEmail !== undefined) profile.contact_email = dto.contactEmail
    if (dto.avatarUrl !== undefined) {
      profile.avatar_url = dto.avatarUrl === '' ? undefined : dto.avatarUrl
    }
    if (dto.logoUrl !== undefined) {
      profile.logo_url = dto.logoUrl === '' ? undefined : dto.logoUrl
    }
    if (dto.websiteUrl !== undefined) {
      profile.website_url = dto.websiteUrl === '' ? undefined : dto.websiteUrl
    }
    if (dto.minInvestmentUsd !== undefined) {
      profile.min_investment_usd = dto.minInvestmentUsd ?? undefined
    }
    if (dto.maxInvestmentUsd !== undefined) {
      profile.max_investment_usd = dto.maxInvestmentUsd ?? undefined
    }

    const saved = await this.investorRepo.save(profile)
    return toInvestorResponse(saved)
  }

  async getInvestor(id: string): Promise<InvestorProfileResponse> {
    const profile = await this.investorRepo.findOne({ where: { id } })
    if (!profile) throw new NotFoundException('Investor profile not found')
    profile.views += 1
    await this.investorRepo.save(profile)
    return toInvestorResponse(profile)
  }

  async getPublicUser(id: string): Promise<PublicUserProfileResponse> {
    const user = await this.usersService.findBySupabaseUidWithTags(id)
    if (!user?.onboarded_at) {
      throw new NotFoundException('User profile not found')
    }
    return toPublicUserProfile(user)
  }

  async search(params: {
    q?: string
    type?: 'user' | 'startup' | 'investor' | 'all'
    industry?: string
    stage?: string
    location?: string
    role?: string
    limit?: number
  }) {
    const type = params.type ?? 'all'
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 50)
    const q = params.q?.trim()

    const [users, startups, investors] = await Promise.all([
      type === 'all' || type === 'user'
        ? this.searchUsers({
            q,
            location: params.location,
            role: params.role,
            limit,
          })
        : Promise.resolve([]),
      type === 'all' || type === 'startup'
        ? this.searchStartups({
            q,
            industry: params.industry,
            stage: params.stage,
            limit,
          })
        : Promise.resolve([]),
      type === 'all' || type === 'investor'
        ? this.searchInvestors({ q, industry: params.industry, limit })
        : Promise.resolve([]),
    ])

    return { users, startups, investors }
  }

  async adjustConnections(
    targetType: 'startup' | 'investor',
    targetId: string,
    delta: 1 | -1,
  ): Promise<void> {
    if (targetType === 'startup') {
      const profile = await this.startupRepo.findOne({
        where: { id: targetId },
      })
      if (!profile) return
      profile.connections = Math.max(0, profile.connections + delta)
      await this.startupRepo.save(profile)
      return
    }
    const profile = await this.investorRepo.findOne({ where: { id: targetId } })
    if (!profile) return
    profile.connections = Math.max(0, profile.connections + delta)
    await this.investorRepo.save(profile)
  }

  async assertTargetExists(
    targetType: 'user' | 'startup' | 'investor',
    targetId: string,
  ): Promise<void> {
    if (targetType === 'user') {
      const user = await this.usersService.findBySupabaseUid(targetId)
      if (!user?.onboarded_at) {
        throw new NotFoundException('Target user not found')
      }
      return
    }
    if (targetType === 'startup') {
      const profile = await this.startupRepo.findOne({
        where: { id: targetId },
      })
      if (!profile) throw new NotFoundException('Target startup not found')
      return
    }
    const profile = await this.investorRepo.findOne({ where: { id: targetId } })
    if (!profile) throw new NotFoundException('Target investor not found')
  }

  private async requireOnboarded(userId: string): Promise<void> {
    const user = await this.usersService.findBySupabaseUid(userId)
    if (!user?.onboarded_at) {
      throw new BadRequestException('Onboarding must be completed first')
    }
  }

  private async searchUsers(params: {
    q?: string
    location?: string
    role?: string
    limit: number
  }) {
    const qb = this.usersService.createOnboardedQuery()
    if (params.q) {
      qb.andWhere('user.name ILIKE :q', { q: `%${params.q}%` })
    }
    if (params.location) {
      qb.andWhere('user.location ILIKE :location', {
        location: `%${params.location}%`,
      })
    }
    if (params.role === 'Founder' || params.role === 'Investor') {
      qb.andWhere('user.role = :role', { role: params.role })
    }
    qb.take(params.limit)
    const users = await qb.getMany()
    return users.map(toPublicUserProfile)
  }

  private async searchStartups(params: {
    q?: string
    industry?: string
    stage?: string
    limit: number
  }) {
    const where: Record<string, unknown> = {}
    if (params.q) where.company_name = ILike(`%${params.q}%`)
    if (params.industry) where.industry = ILike(`%${params.industry}%`)
    if (params.stage) where.stage = params.stage

    const rows = await this.startupRepo.find({
      where,
      take: params.limit,
      order: { createdAt: 'DESC' },
    })
    return rows.map(toStartupResponse)
  }

  private async searchInvestors(params: {
    q?: string
    industry?: string
    limit: number
  }) {
    const where: Record<string, unknown> = {}
    if (params.q) where.firm_name = ILike(`%${params.q}%`)
    if (params.industry) where.industry = ILike(`%${params.industry}%`)

    const rows = await this.investorRepo.find({
      where,
      take: params.limit,
      order: { createdAt: 'DESC' },
    })
    return rows.map(toInvestorResponse)
  }
}
