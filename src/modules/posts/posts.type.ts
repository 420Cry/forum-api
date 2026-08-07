export const postVisibility = ['public', 'private'] as const
export type VisibilityType = (typeof postVisibility)[number]
