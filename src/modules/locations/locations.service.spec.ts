import { LocationsService } from './locations.service'
import { cityToKey, isDynamicLocationKey } from './place-key'

describe('cityToKey', () => {
  it('builds a stable TAG_KEY_RE-compatible key', () => {
    const key = cityToKey({
      name: 'Hanoi',
      countryCode: 'VN',
      stateCode: 'HN',
    })
    expect(key).toBe('city_vn_hn_hanoi')
    expect(isDynamicLocationKey(key)).toBe(true)
  })

  it('accepts legacy place_ keys as dynamic', () => {
    expect(isDynamicLocationKey('place_chijn1ttdeuemsrusoyg83fry4')).toBe(true)
  })
})

describe('LocationsService', () => {
  it('shows sample cities plus fixed options when query is empty', () => {
    const service = new LocationsService()
    const rows = service.search('')
    const keys = rows.map((r) => r.key)
    expect(keys.filter((k) => k.startsWith('city_')).length).toBeGreaterThan(5)
    expect(keys.at(-2)).toBe('remote')
    expect(keys.at(-1)).toBe('location_other')
    expect(rows.some((r) => /london/i.test(r.name))).toBe(true)
    expect(rows.some((r) => /hanoi/i.test(r.name))).toBe(true)
  })

  it('returns prefix city matches from the first letter', () => {
    const service = new LocationsService()
    const rows = service.search('H')
    expect(rows.some((r) => /^h/i.test(r.name.split(',')[0] ?? ''))).toBe(true)
    expect(
      rows.every(
        (r) =>
          r.key === 'remote' ||
          r.key === 'location_other' ||
          r.key.startsWith('city_'),
      ),
    ).toBe(true)
  })

  it('returns city matches without an API key', () => {
    const service = new LocationsService()
    const rows = service.search('Hanoi')
    expect(rows.some((r) => /hanoi/i.test(r.name))).toBe(true)
    expect(
      rows.every(
        (r) =>
          r.key === 'remote' ||
          r.key === 'location_other' ||
          r.key.startsWith('city_'),
      ),
    ).toBe(true)
  })

  it('limits city prefix results for snappy dropdowns', () => {
    const service = new LocationsService()
    const rows = service.search('A')
    const cities = rows.filter((r) => r.key.startsWith('city_'))
    expect(cities.length).toBeGreaterThan(0)
    expect(cities.length).toBeLessThanOrEqual(15)
  })

  it('remembers suggestion names for later upsert', () => {
    const service = new LocationsService()
    service.rememberSuggestion(
      'city_vn_hn_hanoi',
      'Hanoi, Vietnam',
      'VN:HN:Hanoi',
    )
    expect(service.cachedName('city_vn_hn_hanoi')).toBe('Hanoi, Vietnam')
  })
})
