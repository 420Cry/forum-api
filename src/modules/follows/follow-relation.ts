export type FollowRelation = 'mutual' | 'following' | 'follower'

const RELATION_RANK: Record<FollowRelation, number> = {
  mutual: 0,
  following: 1,
  follower: 2,
}

/**
 * Classify person-to-person follows for chat contact search.
 * `followingIds` = users I follow; `followerIds` = users who follow me.
 */
export function classifyUserFollowRelations(
  followingIds: readonly string[],
  followerIds: readonly string[],
): Map<string, FollowRelation> {
  const following = new Set(followingIds)
  const followers = new Set(followerIds)
  const out = new Map<string, FollowRelation>()

  for (const id of following) {
    if (!id) continue
    out.set(id, followers.has(id) ? 'mutual' : 'following')
  }
  for (const id of followers) {
    if (!id || out.has(id)) continue
    out.set(id, 'follower')
  }
  return out
}

export function followRelationRank(relation: FollowRelation): number {
  return RELATION_RANK[relation]
}
