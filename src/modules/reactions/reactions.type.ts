export const reactionList = [
  'back',
  'watch',
  'signal',
  'celebrate',
  'insight',
] as const
export const reactableContent = ['post', 'comment'] as const
export const reactProfile = ['user', 'organization'] as const

export type ReactionType = (typeof reactionList)[number]
export type ReactableType = (typeof reactableContent)[number]
export type ReactProfileType = (typeof reactProfile)[number]
