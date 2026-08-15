export const SENDBIRD_DM_CUSTOM_TYPE = 'dm'

export const SENDBIRD_TOKEN_TTL_SECONDS = 3600

/**
 * SDK login payload. `token` is a Sendbird *session* token from the Platform
 * API (`POST /v3/users/{id}/token`), not a permanent access token.
 * Requires Access token permission = Deny login in the Sendbird dashboard.
 */
export type SendbirdSessionResponse = {
  appId: string
  userId: string
  /** Short-lived session token for `SendbirdChat.connect(userId, token)`. */
  token: string
  expiresAt: number
}

export type SendbirdChannelResponse = {
  channelUrl: string
}

export type SendbirdUnreadResponse = {
  unread: number
}

export type SendbirdUserPayload = {
  user_id: string
  nickname?: string
  profile_url?: string
}

export type SendbirdErrorBody = {
  code?: number
  message?: string
  error?: boolean
}
