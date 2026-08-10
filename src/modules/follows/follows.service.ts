import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { LocationsService } from '../locations/locations.service'
import { InvestorProfiles } from '../profiles/entities/investor-profiles.entity'
import { StartupProfiles } from '../profiles/entities/startup-profiles.entity'
import {
  investorAccountSummary,
  personalAccountSummary,
  startupAccountSummary,
  type AccountSummary,
} from '../profiles/profiles.mapper'
import { ProfilesService } from '../profiles/profiles.service'
import { TagsService } from '../tags/tags.service'
import { UsersService } from '../users/users.service'
import { FollowDto } from './dto/follow.dto'
import { Follows } from './entities/follows.entity'

type PendingSummary =
  | { kind: 'user'; summary: AccountSummary }
  | { kind: 'startup'; summary: AccountSummary; startup: StartupProfiles }
  | { kind: 'investor'; summary: AccountSummary; investor: InvestorProfiles }

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follows)
    private readonly followsRepo: Repository<Follows>,
    @InjectRepository(StartupProfiles)
    private readonly startupRepo: Repository<StartupProfiles>,
    @InjectRepository(InvestorProfiles)
    private readonly investorRepo: Repository<InvestorProfiles>,
    private readonly profilesService: ProfilesService,
    private readonly usersService: UsersService,
    private readonly locationsService: LocationsService,
    private readonly tagsService: TagsService,
  ) {}

  async follow(userId: string, dto: FollowDto) {
    if (dto.targetType === 'user' && dto.targetId === userId) {
      throw new BadRequestException('Cannot follow yourself')
    }

    await this.profilesService.assertTargetExists(dto.targetType, dto.targetId)

    if (dto.targetType === 'startup') {
      const startup = await this.startupRepo.findOne({
        where: { id: dto.targetId },
      })
      if (startup?.user_id === userId) {
        throw new BadRequestException('Cannot follow your own startup')
      }
    } else if (dto.targetType === 'investor') {
      const investor = await this.investorRepo.findOne({
        where: { id: dto.targetId },
      })
      if (investor?.user_id === userId) {
        throw new BadRequestException('Cannot follow your own investor page')
      }
    }

    const existing = await this.followsRepo.findOne({
      where: {
        follower_user_id: userId,
        target_type: dto.targetType,
        target_id: dto.targetId,
      },
    })
    if (existing) {
      return { success: true, following: true }
    }

    await this.followsRepo.save(
      this.followsRepo.create({
        follower_user_id: userId,
        target_type: dto.targetType,
        target_id: dto.targetId,
      }),
    )

    if (dto.targetType === 'startup' || dto.targetType === 'investor') {
      await this.profilesService.adjustConnections(
        dto.targetType,
        dto.targetId,
        1,
      )
    }

    return { success: true, following: true }
  }

  async unfollow(userId: string, dto: FollowDto) {
    const existing = await this.followsRepo.findOne({
      where: {
        follower_user_id: userId,
        target_type: dto.targetType,
        target_id: dto.targetId,
      },
    })
    if (!existing) {
      return { success: true, following: false }
    }

    await this.followsRepo.remove(existing)

    if (dto.targetType === 'startup' || dto.targetType === 'investor') {
      await this.profilesService.adjustConnections(
        dto.targetType,
        dto.targetId,
        -1,
      )
    }

    return { success: true, following: false }
  }

  async isFollowing(
    userId: string,
    targetType: FollowDto['targetType'],
    targetId: string,
  ): Promise<{ following: boolean }> {
    const existing = await this.followsRepo.findOne({
      where: {
        follower_user_id: userId,
        target_type: targetType,
        target_id: targetId,
      },
    })
    return { following: !!existing }
  }

  async listFollowing(userId: string): Promise<AccountSummary[]> {
    const rows = await this.followsRepo.find({
      where: { follower_user_id: userId },
      order: { createdAt: 'DESC' },
    })

    const pending: PendingSummary[] = []
    for (const row of rows) {
      const item = await this.resolveFollowTarget(row)
      if (item) pending.push(item)
    }

    return this.labelSummaries(pending)
  }

  private async resolveFollowTarget(
    row: Follows,
  ): Promise<PendingSummary | null> {
    if (row.target_type === 'user') {
      const user = await this.usersService.findBySupabaseUidWithTags(
        row.target_id,
      )
      if (!user?.onboarded_at) return null
      const ready = await this.usersService.ensureUrlKey(user)
      return { kind: 'user', summary: personalAccountSummary(ready) }
    }

    if (row.target_type === 'startup') {
      const startup = await this.startupRepo.findOne({
        where: { id: row.target_id },
      })
      if (!startup) return null
      return {
        kind: 'startup',
        summary: startupAccountSummary(startup),
        startup,
      }
    }

    const investor = await this.investorRepo.findOne({
      where: { id: row.target_id },
    })
    if (!investor) return null
    return {
      kind: 'investor',
      summary: investorAccountSummary(investor),
      investor,
    }
  }

  /** Match listAccounts: resolve location/industry keys to display labels. */
  private async labelSummaries(
    pending: PendingSummary[],
  ): Promise<AccountSummary[]> {
    const labels = await this.tagsService.labelMap(
      pending.flatMap((item) => {
        if (item.kind === 'user') return [item.summary.location]
        if (item.kind === 'startup') return [item.startup.industry]
        return [item.investor.industry]
      }),
    )

    return pending.map((item) => {
      if (item.kind === 'user') {
        const key = item.summary.location
        if (!key) return item.summary
        return {
          ...item.summary,
          location:
            labels.get(key) ?? this.locationsService.nameForKey(key) ?? key,
        }
      }
      if (item.kind === 'startup') {
        const { startup, summary } = item
        return {
          ...summary,
          headline: `${labels.get(startup.industry) ?? startup.industry} / ${startup.stage}`,
        }
      }
      const { investor, summary } = item
      return {
        ...summary,
        headline: labels.get(investor.industry) ?? investor.industry,
      }
    })
  }
}
