export type OccupationTitle = {
  key: string
  name: string
}

export const FIXED_OCCUPATION_OPTIONS: OccupationTitle[] = [
  { key: 'occupation_other', name: 'Other' },
]

export function isOtherOccupationKey(key: string): boolean {
  return key === 'occupation_other' || key.endsWith('_other')
}
