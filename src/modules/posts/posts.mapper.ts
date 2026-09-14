import type { AccountSummary } from '../profiles/profiles.mapper'
import { reactionList } from '../reactions/reactions.type'
import type { ReactionType } from '../reactions/reactions.type'
import type { Posts } from './entities/posts.entity'
import type { VisibilityType } from './posts.type'

export type ReactionCounts = Record<ReactionType, number>

export type ReactionInfo = {
  total: number
  counts: ReactionCounts
  viewerReaction: ReactionType | null
}

export type PostResponse = {
  id: string
  content: string
  visibility: VisibilityType
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  author: AccountSummary
  reactionInfo: ReactionInfo
}

export type PostFeedResponse = {
  items: PostResponse[]
  nextCursor: string | null
  hasMore: boolean
}

/** Zero-filled counts for every reaction type. */
export function emptyReactionCounts(): ReactionCounts {
  return reactionList.reduce((acc, type) => {
    acc[type] = 0
    return acc
  }, {} as ReactionCounts)
}

export function toReactionInfo(
  grouped: { type: ReactionType; count: number | string }[],
  viewerReaction: ReactionType | null,
): ReactionInfo {
  const counts = emptyReactionCounts()
  let total = 0
  for (const row of grouped) {
    const n = Number(row.count) || 0
    counts[row.type] = n
    total += n
  }
  return { total, counts, viewerReaction }
}

export function toIso(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString()
}

export function toPostResponse(
  post: Posts,
  author: AccountSummary,
  reactionInfo: ReactionInfo,
): PostResponse {
  return {
    id: post.id,
    content: post.content,
    visibility: post.visibility,
    imageUrl: post.image_url ?? null,
    createdAt: toIso(post.createdAt),
    updatedAt: toIso(post.updatedAt),
    author,
    reactionInfo,
  }
}
