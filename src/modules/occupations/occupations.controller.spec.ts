import { OccupationsController } from './occupations.controller'
import { OccupationsService } from './occupations.service'

describe('OccupationsController', () => {
  const service = new OccupationsService()
  const controller = new OccupationsController(service)

  it('returns localized names for locale=vn', () => {
    const page = controller.searchOccupations('ai', '0', '10', 'vn')
    expect(page.occupations.length).toBeGreaterThan(0)
    expect(
      page.occupations.some(
        (row) => row.key === 'ai_director' && row.name === 'Giám đốc AI',
      ),
    ).toBe(true)
  })

  it('resolves a single occupation key', () => {
    expect(controller.resolveOccupation('ai_engineer', 'vn')).toEqual({
      key: 'ai_engineer',
      name: 'Kỹ sư AI',
    })
    expect(controller.resolveOccupation('', 'vn')).toEqual({
      key: null,
      name: null,
    })
  })

  it('defaults to English labels', () => {
    const page = controller.searchOccupations('ai_director', '0', '5')
    expect(page.occupations.some((row) => row.name === 'AI Director')).toBe(
      true,
    )
  })
})
