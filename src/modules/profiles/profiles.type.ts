export const startupProfilesStage = [
  'pre_seed',
  'seed',
  'series_a',
  'growth',
  'scale',
  'exit',
] as const

export type StageType = (typeof startupProfilesStage)[number]
