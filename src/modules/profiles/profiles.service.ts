import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ILike, In, Not, Repository } from 'typeorm'
import { TagsService } from '../tags/tags.service'
import { UsersService } from '../users/users.service'
import { LocationsService } from '../locations/locations.service'
import { OccupationsService } from '../occupations/occupations.service'
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

type FindSort = 'newest' | 'name'

/** Comma-separated query values → unique non-empty tokens. */
function parseMulti(value?: string): string[] {
  if (!value?.trim()) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of value.split(',')) {
    const token = part.trim()
    if (!token || seen.has(token)) continue
    seen.add(token)
    out.push(token)
  }
  return out
}

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(StartupProfiles)
    private readonly startupRepo: Repository<StartupProfiles>,
    @InjectRepository(InvestorProfiles)
    private readonly investorRepo: Repository<InvestorProfiles>,
    private readonly usersService: UsersService,
    private readonly tagsService: TagsService,
    private readonly locationsService: LocationsService,
    private readonly occupationsService: OccupationsService,
  ) {}

  async listAccounts(userId: string): Promise<AccountSummary[]> {
    const user = await this.usersService.findBySupabaseUidWithTags(userId)
    if (!user?.onboarded_at) {
      throw new BadRequestException('Onboarding must be completed first')
    }

    const [readyUser, startup, investor] = await Promise.all([
      this.usersService.ensureUrlKey(user),
      this.startupRepo.findOne({ where: { user_id: userId } }),
      this.investorRepo.findOne({ where: { user_id: userId } }),
    ])

    const accounts: AccountSummary[] = [personalAccountSummary(readyUser)]
    if (startup) accounts.push(startupAccountSummary(startup))
    if (investor) accounts.push(investorAccountSummary(investor))

    const labels = await this.tagsService.labelMap([
      readyUser.location,
      startup?.industry,
      investor?.industry,
    ])
    return accounts.map((account) => {
      if (account.accountType === 'user' && readyUser.location) {
        return {
          ...account,
          location:
            labels.get(readyUser.location) ??
            this.locationsService.nameForKey(readyUser.location) ??
            account.location,
        }
      }
      if (account.accountType === 'startup' && startup) {
        return {
          ...account,
          headline: `${labels.get(startup.industry) ?? startup.industry} / ${startup.stage}`,
        }
      }
      if (account.accountType === 'investor' && investor) {
        return {
          ...account,
          headline: labels.get(investor.industry) ?? investor.industry,
        }
      }
      return account
    })
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
      profile.website_url = dto.websiteUrl || undefined
    }
    if (dto.contactEmail !== undefined) profile.contact_email = dto.contactEmail
    if (dto.avatarUrl !== undefined) {
      profile.avatar_url = dto.avatarUrl || undefined
    }
    if (dto.logoUrl !== undefined) {
      profile.logo_url = dto.logoUrl || undefined
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
    const [labeled] = await this.toLabeledStartupResponses([profile])
    return labeled
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
      profile.avatar_url = dto.avatarUrl || undefined
    }
    if (dto.logoUrl !== undefined) {
      profile.logo_url = dto.logoUrl || undefined
    }
    if (dto.websiteUrl !== undefined) {
      profile.website_url = dto.websiteUrl || undefined
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
    const [labeled] = await this.toLabeledInvestorResponses([profile])
    return labeled
  }

  async getPublicUser(urlKeyOrId: string): Promise<PublicUserProfileResponse> {
    const user = await this.usersService.findOnboardedByUrlKeyOrId(urlKeyOrId)
    if (!user) {
      throw new NotFoundException('User profile not found')
    }
    return this.toLabeledPublicUser(user)
  }

  async search(
    viewerId: string,
    params: {
      q?: string
      type?: 'user' | 'startup' | 'investor' | 'all'
      industry?: string
      stage?: string
      location?: string
      occupation?: string
      role?: string
      sort?: FindSort
      limit?: number
    },
  ) {
    const type = params.type ?? 'all'
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 50)
    const q = params.q?.trim()
    const sort: FindSort = params.sort === 'name' ? 'name' : 'newest'

    const [users, startups, investors] = await Promise.all([
      type === 'all' || type === 'user'
        ? this.searchUsers({
            viewerId,
            q,
            locations: parseMulti(params.location),
            occupations: parseMulti(params.occupation),
            roles: parseMulti(params.role).filter(
              (r): r is 'Founder' | 'Investor' =>
                r === 'Founder' || r === 'Investor',
            ),
            sort,
            limit,
          })
        : Promise.resolve([]),
      type === 'all' || type === 'startup'
        ? this.searchStartups({
            viewerId,
            q,
            industries: parseMulti(params.industry),
            stages: parseMulti(params.stage),
            sort,
            limit,
          })
        : Promise.resolve([]),
      type === 'all' || type === 'investor'
        ? this.searchInvestors({
            viewerId,
            q,
            industries: parseMulti(params.industry),
            sort,
            limit,
          })
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
    viewerId: string
    q?: string
    locations: string[]
    occupations: string[]
    roles: Array<'Founder' | 'Investor'>
    sort: FindSort
    limit: number
  }) {
    const qb = this.usersService.createOnboardedQuery(params.sort)
    qb.andWhere('user.supabaseUid != :viewerId', {
      viewerId: params.viewerId,
    })
    if (params.q) {
      qb.andWhere('user.name ILIKE :q', { q: `%${params.q}%` })
    }
    if (params.locations.length) {
      qb.andWhere('user.location IN (:...locations)', {
        locations: params.locations,
      })
    }
    if (params.occupations.length) {
      qb.andWhere('user.occupation IN (:...occupations)', {
        occupations: params.occupations,
      })
    }
    if (params.roles.length) {
      qb.andWhere('user.role IN (:...roles)', { roles: params.roles })
    }
    qb.take(params.limit)
    const users = await qb.getMany()
    const withKeys = await Promise.all(
      users.map((user) => this.usersService.ensureUrlKey(user)),
    )
    return Promise.all(withKeys.map((user) => this.toLabeledPublicUser(user)))
  }

  private async searchStartups(params: {
    viewerId: string
    q?: string
    industries: string[]
    stages: string[]
    sort: FindSort
    limit: number
  }) {
    const where: Record<string, unknown> = {
      user_id: Not(params.viewerId),
    }
    if (params.q) where.company_name = ILike(`%${params.q}%`)
    if (params.industries.length) where.industry = In(params.industries)
    if (params.stages.length) where.stage = In(params.stages)

    const rows = await this.startupRepo.find({
      where,
      take: params.limit,
      order:
        params.sort === 'name'
          ? { company_name: 'ASC' }
          : { createdAt: 'DESC' },
    })
    return this.toLabeledStartupResponses(rows)
  }

  private async searchInvestors(params: {
    viewerId: string
    q?: string
    industries: string[]
    sort: FindSort
    limit: number
  }) {
    const base: Record<string, unknown> = {
      user_id: Not(params.viewerId),
    }
    if (params.q) base.firm_name = ILike(`%${params.q}%`)
    if (params.industries.length) base.industry = In(params.industries)

    const rows = await this.investorRepo.find({
      where: base,
      take: params.limit,
      order:
        params.sort === 'name' ? { firm_name: 'ASC' } : { createdAt: 'DESC' },
    })
    return this.toLabeledInvestorResponses(rows)
  }

  private async toLabeledPublicUser(
    user: Parameters<typeof toPublicUserProfile>[0],
  ): Promise<PublicUserProfileResponse> {
    const labels = await this.tagsService.labelMap([
      user.location,
      user.occupation,
    ])
    const profile = toPublicUserProfile(user)
    const locationKey = user.location ?? null
    const occupationKey = user.occupation ?? null
    const location = locationKey
      ? (labels.get(locationKey) ??
        this.locationsService.nameForKey(locationKey) ??
        locationKey)
      : null
    const occupation = occupationKey
      ? (labels.get(occupationKey) ??
        this.occupationsService.nameForKey(occupationKey) ??
        occupationKey)
      : null
    return {
      ...profile,
      location,
      locationKey,
      occupation,
      occupationKey,
    }
  }

  private async toLabeledStartupResponses(
    rows: StartupProfiles[],
  ): Promise<StartupProfileResponse[]> {
    const labels = await this.tagsService.labelMap(rows.map((r) => r.industry))
    return rows.map((row) => {
      const res = toStartupResponse(row)
      return {
        ...res,
        industry: labels.get(row.industry) ?? row.industry,
      }
    })
  }

  private async toLabeledInvestorResponses(
    rows: InvestorProfiles[],
  ): Promise<InvestorProfileResponse[]> {
    const labels = await this.tagsService.labelMap(rows.map((r) => r.industry))
    return rows.map((row) => {
      const res = toInvestorResponse(row)
      return {
        ...res,
        industry: labels.get(row.industry) ?? row.industry,
      }
    })
  }
}
