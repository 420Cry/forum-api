import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { FollowsService } from '../follows/follows.service'
import { UsersService } from '../users/users.service'
import {
  SENDBIRD_TOKEN_TTL_SECONDS,
  type SendbirdChannelResponse,
  type SendbirdSessionResponse,
  type SendbirdUnreadResponse,
} from './chat.types'
import { SendbirdApiError, SendbirdClient } from './sendbird.client'

@Injectable()
export class ChatService {
  constructor(
    private readonly sendbird: SendbirdClient,
    private readonly usersService: UsersService,
    private readonly followsService: FollowsService,
  ) {}

  async getSession(userId: string): Promise<SendbirdSessionResponse> {
    this.assertConfigured()
    const user = await this.requireOnboardedUser(userId)
    await this.upsertForumUser(user.supabaseUid, user.name)

    const expiresAtMs = Date.now() + SENDBIRD_TOKEN_TTL_SECONDS * 1000
    try {
      const issued = await this.sendbird.issueSessionToken(
        user.supabaseUid,
        expiresAtMs,
      )
      return {
        appId: this.sendbird.getAppId(),
        userId: user.supabaseUid,
        token: issued.token,
        expiresAt: issued.expires_at,
      }
    } catch (err) {
      this.rethrow(err)
    }
  }

  async openChannel(
    userId: string,
    peerUserId: string,
  ): Promise<SendbirdChannelResponse> {
    this.assertConfigured()
    if (userId === peerUserId) {
      throw new BadRequestException('Cannot message yourself')
    }

    const [me, peer] = await Promise.all([
      this.requireOnboardedUser(userId),
      this.requireOnboardedUser(peerUserId),
    ])

    const allowed = await this.followsService.canMessagePeer(userId, peerUserId)
    if (!allowed) {
      throw new ForbiddenException(
        'You can only message people you follow or who follow you',
      )
    }

    await Promise.all([
      this.upsertForumUser(me.supabaseUid, me.name),
      this.upsertForumUser(peer.supabaseUid, peer.name),
    ])

    try {
      const channelUrl = await this.sendbird.createDistinctDmChannel(
        me.supabaseUid,
        peer.supabaseUid,
      )
      return { channelUrl }
    } catch (err) {
      this.rethrow(err)
    }
  }

  async getUnread(userId: string): Promise<SendbirdUnreadResponse> {
    if (!this.sendbird.isConfigured()) {
      return { unread: 0 }
    }
    const user = await this.usersService.findBySupabaseUid(userId)
    if (!user?.onboarded_at) {
      return { unread: 0 }
    }
    try {
      const unread = await this.sendbird.getUnreadMessageCount(user.supabaseUid)
      return { unread }
    } catch (err) {
      if (err instanceof SendbirdApiError) {
        return { unread: 0 }
      }
      throw err
    }
  }

  private assertConfigured() {
    if (!this.sendbird.isConfigured()) {
      throw new ServiceUnavailableException('Messaging is not available yet')
    }
  }

  private async requireOnboardedUser(userId: string) {
    const user = await this.usersService.findBySupabaseUid(userId)
    if (!user?.onboarded_at) {
      throw new NotFoundException('User profile not found')
    }
    return user
  }

  private async upsertForumUser(userId: string, name: string | null) {
    try {
      // Nickname only — never push avatar URLs into Sendbird.
      await this.sendbird.upsertUser({
        userId,
        nickname: this.nicknameFor(name),
      })
    } catch (err) {
      this.rethrow(err)
    }
  }

  private nicknameFor(name: string | null): string {
    const trimmed = name?.trim() ?? ''
    if (trimmed) return trimmed.slice(0, 80)
    return 'Member'
  }

  private rethrow(err: unknown): never {
    if (err instanceof SendbirdApiError) {
      throw new ServiceUnavailableException('Could not reach messaging')
    }
    throw err
  }
}
