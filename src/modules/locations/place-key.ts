/** Fixed location keys kept in catalog seeds (not from city search). */
export const FIXED_LOCATION_KEYS = ['remote', 'location_other'] as const

export type FixedLocationKey = (typeof FIXED_LOCATION_KEYS)[number]

export const FIXED_LOCATION_OPTIONS: Array<{
  key: FixedLocationKey
  name: string
  placeId: null
}> = [
  { key: 'remote', name: 'Remote', placeId: null },
  { key: 'location_other', name: 'Other', placeId: null },
]

/**
 * Dynamic location keys from city search (`city_…`) or legacy Places (`place_…`).
 * Must match TAG_KEY_RE.
 */
export const DYNAMIC_LOCATION_KEY_RE =
  /^(?:city|place)_[a-z0-9]+(?:[_-][a-z0-9]+)*$/

export function isFixedLocationKey(key: string): key is FixedLocationKey {
  return (FIXED_LOCATION_KEYS as readonly string[]).includes(key)
}

export function isDynamicLocationKey(key: string): boolean {
  return DYNAMIC_LOCATION_KEY_RE.test(key)
}

function slugPart(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'x'
}

/** Stable tag key from country-state-city fields. */
export function cityToKey(input: {
  name: string
  countryCode: string
  stateCode?: string
}): string {
  const country = slugPart(input.countryCode)
  const state = slugPart(input.stateCode || 'na')
  const city = slugPart(input.name)
  return `city_${country}_${state}_${city}`
}
