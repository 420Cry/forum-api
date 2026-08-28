import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
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
import {
  classifyUserFollowRelations,
  followRelationRank,
  type FollowRelation,
} from './follow-relation'
import type { FollowTargetType } from './follows.type'

export type UserConnection = AccountSummary & {
  relation: FollowRelation
}

type PendingSummary =
  | { kind: 'user'; summary: AccountSummary }
  | { kind: 'startup'; summary: AccountSummary; startup: StartupProfiles }
  | { kind: 'investor'; summary: AccountSummary; investor: InvestorProfiles }

const LIST_CAP = 200

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

  async countFollowers(
    targetType: FollowTargetType,
    targetId: string,
  ): Promise<number> {
    return this.followsRepo.count({
      where: { target_type: targetType, target_id: targetId },
    })
  }

  async countFollowing(userId: string): Promise<number> {
    return this.followsRepo.count({
      where: { follower_user_id: userId },
    })
  }

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

  /**
   * True when either user follows the other (person-to-person).
   * Used to gate unsolicited DM channel creation.
   */
  async canMessagePeer(userId: string, peerUserId: string): Promise<boolean> {
    if (userId === peerUserId) return false
    const row = await this.followsRepo.findOne({
      where: [
        {
          follower_user_id: userId,
          target_type: 'user',
          target_id: peerUserId,
        },
        {
          follower_user_id: peerUserId,
          target_type: 'user',
          target_id: userId,
        },
      ],
    })
    return !!row
  }

  /**
   * Person-to-person network for chat search: mutual connectors plus
   * one-sided following / follower rows (tagged via `relation`).
   */
  async listUserConnections(userId: string): Promise<UserConnection[]> {
    const [outgoing, incoming] = await Promise.all([
      this.followsRepo.find({
        where: { follower_user_id: userId, target_type: 'user' },
        take: LIST_CAP,
      }),
      this.followsRepo.find({
        where: { target_type: 'user', target_id: userId },
        take: LIST_CAP,
      }),
    ])

    const relations = classifyUserFollowRelations(
      outgoing.map((row) => row.target_id),
      incoming.map((row) => row.follower_user_id),
    )
    const ids = [...relations.keys()]
    if (!ids.length) return []

    const users = await this.usersService.findOnboardedBySupabaseUids(ids)
    const pending: PendingSummary[] = []
    for (const user of users) {
      const ready = await this.usersService.ensureUrlKey(user)
      pending.push({ kind: 'user', summary: personalAccountSummary(ready) })
    }

    const summaries = await this.labelSummaries(pending)
    return summaries
      .map((summary) => ({
        ...summary,
        relation: relations.get(summary.id) ?? 'following',
      }))
      .sort((a, b) => {
        const byRelation =
          followRelationRank(a.relation) - followRelationRank(b.relation)
        if (byRelation !== 0) return byRelation
        return a.name.localeCompare(b.name)
      })
  }

  async listFollowing(userId: string): Promise<AccountSummary[]> {
    const rows = await this.followsRepo.find({
      where: { follower_user_id: userId },
      order: { createdAt: 'DESC' },
      take: LIST_CAP,
    })

    const pending: PendingSummary[] = []
    for (const row of rows) {
      const item = await this.resolveFollowTarget(row)
      if (item) pending.push(item)
    }

    return this.labelSummaries(pending)
  }

  /**
   * Following lists are owner-only. Peers use follower counts / public
   * follower sheets; scraping another user's full graph is not allowed.
   */
  async listFollowingForUser(
    viewerId: string,
    userId: string,
  ): Promise<AccountSummary[]> {
    if (viewerId !== userId) {
      throw new ForbiddenException('Following list is private')
    }
    const user = await this.usersService.findBySupabaseUid(userId)
    if (!user?.onboarded_at) {
      throw new NotFoundException('User profile not found')
    }
    return this.listFollowing(userId)
  }

  async listFollowers(
    targetType: FollowTargetType,
    targetId: string,
  ): Promise<AccountSummary[]> {
    await this.profilesService.assertTargetExists(targetType, targetId)

    const rows = await this.followsRepo.find({
      where: { target_type: targetType, target_id: targetId },
      order: { createdAt: 'DESC' },
      take: LIST_CAP,
    })

    const pending: PendingSummary[] = []
    for (const row of rows) {
      const user = await this.usersService.findBySupabaseUidWithTags(
        row.follower_user_id,
      )
      if (!user?.onboarded_at) continue
      const ready = await this.usersService.ensureUrlKey(user)
      pending.push({ kind: 'user', summary: personalAccountSummary(ready) })
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
