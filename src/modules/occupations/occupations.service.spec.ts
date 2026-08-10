import { OccupationsService } from './occupations.service'

describe('OccupationsService', () => {
  it('shows sample titles when query is empty (no Other)', () => {
    const service = new OccupationsService()
    const page = service.search('')
    const keys = page.items.map((r) => r.key)
    expect(keys.length).toBeGreaterThan(5)
    expect(keys).not.toContain('occupation_other')
    expect(keys).toContain('founder')
    expect(keys).toContain('engineer')
  })

  it('returns ranked title matches from the first letter', () => {
    const service = new OccupationsService()
    const page = service.search('eng')
    expect(
      page.items.some((r) => /eng/i.test(r.name) || /eng/i.test(r.key)),
    ).toBe(true)
  })

  it('does not return Other for partial queries', () => {
    const service = new OccupationsService()
    const page = service.search('o')
    expect(page.items.map((r) => r.key)).not.toContain('occupation_other')
  })

  it('paginates empty-state browse', () => {
    const service = new OccupationsService()
    const first = service.search('', 0, 5)
    const second = service.search('', 5, 5)
    expect(first.items.length).toBe(5)
    expect(second.items.length).toBe(5)
    expect(first.hasMore).toBe(true)
    expect(first.total).toBeGreaterThan(10)
  })

  it('paginates ranked search results', () => {
    const service = new OccupationsService()
    const all = service.search('a', 0, 1000)
    const page = service.search('a', 0, 10)
    expect(page.items.length).toBe(10)
    expect(page.total).toBe(all.total)
    if (all.total > 10) expect(page.hasMore).toBe(true)
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
