import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { InvestorProfiles } from '../profiles/entities/investor-profiles.entity'
import { StartupProfiles } from '../profiles/entities/startup-profiles.entity'
import {
  investorAccountSummary,
  personalAccountSummary,
  startupAccountSummary,
  type AccountSummary,
} from '../profiles/profiles.mapper'
import { ProfilesService } from '../profiles/profiles.service'
import { UsersService } from '../users/users.service'
import { FollowDto } from './dto/follow.dto'
import { Follows } from './entities/follows.entity'

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
  ) {}

  async follow(userId: string, dto: FollowDto) {
    if (dto.targetType === 'user' && dto.targetId === userId) {
      throw new BadRequestException('Cannot follow yourself')
    }

    await this.profilesService.assertTargetExists(dto.targetType, dto.targetId)

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

    const summaries: AccountSummary[] = []
    for (const row of rows) {
      if (row.target_type === 'user') {
        const user = await this.usersService.findBySupabaseUidWithTags(
          row.target_id,
        )
        if (user?.onboarded_at) summaries.push(personalAccountSummary(user))
        continue
      }
      if (row.target_type === 'startup') {
        const startup = await this.startupRepo.findOne({
          where: { id: row.target_id },
        })
        if (startup) summaries.push(startupAccountSummary(startup))
        continue
      }
      const investor = await this.investorRepo.findOne({
        where: { id: row.target_id },
      })
      if (investor) summaries.push(investorAccountSummary(investor))
    }
    return summaries
  }
}
