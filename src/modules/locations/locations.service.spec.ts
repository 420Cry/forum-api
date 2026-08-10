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
  it('shows Remote/Other then sample cities when query is empty', () => {
    const service = new LocationsService()
    const page = service.search('')
    const keys = page.items.map((r) => r.key)
    expect(keys.slice(0, 2)).toEqual(['remote', 'location_other'])
    expect(keys.filter((k) => k.startsWith('city_')).length).toBeGreaterThan(5)
    expect(page.items.some((r) => /london/i.test(r.name))).toBe(true)
    expect(page.items.some((r) => /hanoi/i.test(r.name))).toBe(true)
  })

  it('returns prefix city matches from the first letter', () => {
    const service = new LocationsService()
    const page = service.search('H')
    expect(page.items.some((r) => /^h/i.test(r.name.split(',')[0] ?? ''))).toBe(
      true,
    )
    expect(
      page.items
        .filter((r) => r.placeId)
        .every((r) => r.key.startsWith('city_')),
    ).toBe(true)
  })

  it('returns city matches without an API key', () => {
    const service = new LocationsService()
    const page = service.search('Hanoi')
    expect(page.items.some((r) => /hanoi/i.test(r.name))).toBe(true)
    expect(
      page.items
        .filter((r) => r.placeId)
        .every((r) => r.key.startsWith('city_')),
    ).toBe(true)
  })

  it('matches diacritic / alias queries for major VN cities', () => {
    const service = new LocationsService()
    expect(
      service.search('Hà Nội').items.some((r) => /hanoi/i.test(r.name)),
    ).toBe(true)
    expect(
      service.search('Đà Nẵng').items.some((r) => /da nang/i.test(r.name)),
    ).toBe(true)
    expect(
      service.search('Sài Gòn').items.some((r) => /ho chi minh/i.test(r.name)),
    ).toBe(true)
  })

  it('matches fixed Remote and country names', () => {
    const service = new LocationsService()
    expect(service.search('Rem').items.some((r) => r.key === 'remote')).toBe(
      true,
    )
    const vietnam = service.search('Vietnam', 0, 50)
    expect(vietnam.items.some((r) => /vietnam/i.test(r.name))).toBe(true)
  })

  it('paginates empty-state browse', () => {
    const service = new LocationsService()
    const first = service.search('', 0, 5)
    const second = service.search('', 5, 5)
    expect(first.items.length).toBe(5)
    expect(second.items.length).toBe(5)
    expect(first.items[0]?.key).not.toBe(second.items[0]?.key)
    expect(first.hasMore).toBe(true)
    expect(first.total).toBeGreaterThan(10)
  })

  it('paginates prefix search results', () => {
    const service = new LocationsService()
    const all = service.search('A', 0, 1000)
    const page = service.search('A', 0, 10)
    expect(page.items.length).toBe(10)
    expect(page.total).toBe(all.total)
    if (all.total > 10) expect(page.hasMore).toBe(true)
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

  it('resolves fixed and city names by key', () => {
    const service = new LocationsService()
    expect(service.nameForKey('remote')).toBe('Remote')
    expect(service.nameForKey('location_other')).toBe('Other')
  })
})
