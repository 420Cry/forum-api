import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { EnvService } from 'src/config/config.service'
import { SENDBIRD_DM_CUSTOM_TYPE, type SendbirdErrorBody } from './chat.types'

export class SendbirdApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: number | null,
    message: string,
  ) {
    super(message)
    this.name = 'SendbirdApiError'
  }
}

/** HTTP client for the Sendbird Platform API (users, session tokens, channels). */
@Injectable()
export class SendbirdClient {
  private readonly logger = new Logger(SendbirdClient.name)

  constructor(private readonly env: EnvService) {}

  isConfigured(): boolean {
    return this.env.getSendbirdConfig() !== null
  }

  getAppId(): string {
    return this.requireConfig().appId
  }

  /**
   * Create/update a Sendbird user without an access token.
   * Dashboard "Access token permission" = Deny login — clients authenticate
   * only with short-lived session tokens from {@link issueSessionToken}.
   */
  async upsertUser(params: {
    userId: string
    nickname: string
    profileUrl: string
  }): Promise<void> {
    const created = await this.request('POST', '/v3/users', {
      user_id: params.userId,
      nickname: params.nickname,
      profile_url: params.profileUrl,
      // Never issue a permanent access token (deny-login apps reject those).
      issue_access_token: false,
    })
    if (created.ok || this.isAlreadyExists(created)) {
      if (!created.ok) {
        const updated = await this.request(
          'PUT',
          `/v3/users/${encodeURIComponent(params.userId)}`,
          {
            nickname: params.nickname,
            profile_url: params.profileUrl,
          },
        )
        if (!updated.ok) this.throwFrom(updated)
      }
      return
    }
    this.throwFrom(created)
  }

  /**
   * Platform API session token for SDK `connect(userId, token)`.
   * Required when Access token permission is Deny login.
   */
  async issueSessionToken(
    userId: string,
    expiresAtMs: number,
  ): Promise<{ token: string; expires_at: number }> {
    const result = await this.request(
      'POST',
      `/v3/users/${encodeURIComponent(userId)}/token`,
      { expires_at: expiresAtMs },
    )
    if (!result.ok) this.throwFrom(result)
    const token = typeof result.body.token === 'string' ? result.body.token : ''
    if (!token) {
      throw new SendbirdApiError(502, null, 'Sendbird session token missing')
    }
    const expiresAt =
      typeof result.body.expires_at === 'number'
        ? result.body.expires_at
        : expiresAtMs
    return { token, expires_at: expiresAt }
  }

  async createDistinctDmChannel(
    inviterId: string,
    peerId: string,
  ): Promise<string> {
    const result = await this.request('POST', '/v3/group_channels', {
      user_ids: [inviterId, peerId],
      inviter_id: inviterId,
      is_distinct: true,
      custom_type: SENDBIRD_DM_CUSTOM_TYPE,
    })
    if (!result.ok) this.throwFrom(result)
    const channelUrl =
      typeof result.body.channel_url === 'string' ? result.body.channel_url : ''
    if (!channelUrl) {
      throw new SendbirdApiError(502, null, 'Sendbird channel URL missing')
    }
    return channelUrl
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const result = await this.request(
      'GET',
      `/v3/users/${encodeURIComponent(userId)}/unread_message_count`,
    )
    if (!result.ok) {
      if (this.isNotFound(result)) return 0
      this.throwFrom(result)
    }
    const count = result.body.unread_count
    return typeof count === 'number' ? count : 0
  }

  private requireConfig() {
    const config = this.env.getSendbirdConfig()
    if (!config) {
      throw new ServiceUnavailableException('Sendbird is not configured')
    }
    return config
  }

  private async request(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<{
    ok: boolean
    status: number
    body: Record<string, unknown> & SendbirdErrorBody
  }> {
    const { appId, apiToken } = this.requireConfig()
    const url = `https://api-${appId}.sendbird.com${path}`
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Api-Token': apiToken,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const text = await response.text()
    let parsed: Record<string, unknown> & SendbirdErrorBody = {}
    if (text) {
      try {
        parsed = JSON.parse(text) as Record<string, unknown> & SendbirdErrorBody
      } catch {
        this.logger.warn(`Sendbird non-JSON response (${response.status})`)
      }
    }

    return { ok: response.ok, status: response.status, body: parsed }
  }

  private isAlreadyExists(result: {
    status: number
    body: SendbirdErrorBody
  }): boolean {
    return result.status === 400 && result.body.code === 400202
  }

  private isNotFound(result: {
    status: number
    body: SendbirdErrorBody
  }): boolean {
    return result.status === 400 && result.body.code === 400201
  }

  private throwFrom(result: {
    status: number
    body: SendbirdErrorBody
  }): never {
    const message =
      result.body.message || `Sendbird request failed (${result.status})`
    this.logger.warn(
      `Sendbird error ${result.status} ${result.body.code}: ${message}`,
    )
    throw new SendbirdApiError(
      result.status,
      typeof result.body.code === 'number' ? result.body.code : null,
      message,
    )
  }
}
