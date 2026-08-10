import { OccupationsService } from './occupations.service'

describe('OccupationsService', () => {
  it('shows sample titles plus Other when query is empty', () => {
    const service = new OccupationsService()
    const rows = service.search('')
    const keys = rows.map((r) => r.key)
    expect(keys.length).toBeGreaterThan(5)
    expect(keys.at(-1)).toBe('occupation_other')
    expect(keys).toContain('founder')
    expect(keys).toContain('engineer')
  })

  it('returns ranked title matches from the first letter', () => {
    const service = new OccupationsService()
    const rows = service.search('eng')
    expect(rows.some((r) => /eng/i.test(r.name) || /eng/i.test(r.key))).toBe(
      true,
    )
    expect(rows.length).toBeLessThanOrEqual(16)
  })

  it('keeps Other last when it matches the query', () => {
    const service = new OccupationsService()
    const rows = service.search('o')
    expect(rows.map((r) => r.key)).toContain('occupation_other')
    expect(rows.at(-1)?.key).toBe('occupation_other')
  })

  it('limits results for snappy dropdowns', () => {
    const service = new OccupationsService()
    const rows = service.search('a')
    const titles = rows.filter((r) => r.key !== 'occupation_other')
    expect(titles.length).toBeGreaterThan(0)
    expect(titles.length).toBeLessThanOrEqual(15)
  })

  it('remembers suggestion names for later upsert', () => {
    const service = new OccupationsService()
    service.rememberSuggestion('software_engineer', 'Software Engineer')
    expect(service.cachedName('software_engineer')).toBe('Software Engineer')
  })

  it('resolves corpus names by key', () => {
    const service = new OccupationsService()
    expect(service.nameForKey('founder')).toBe('Founder')
    expect(service.nameForKey('software_engineer')).toBe('Software Engineer')
  })
})
