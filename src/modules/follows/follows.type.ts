export const followTargetTypes = ['user', 'startup', 'investor'] as const
export type FollowTargetType = (typeof followTargetTypes)[number]
