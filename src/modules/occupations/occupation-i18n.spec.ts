import { occupationLabel, occupationCorpus } from './occupation-i18n'

describe('occupation-i18n', () => {
  it('loads bilingual corpus', () => {
    const corpus = occupationCorpus()
    expect(corpus.length).toBeGreaterThan(1000)
    expect(corpus.some((row) => row.key === 'ai_director')).toBe(true)
  })

  it('uses role-first Vietnamese labels', () => {
    expect(occupationLabel('ai_director', 'vn')).toBe('Giám đốc AI')
    expect(occupationLabel('ai_engineer', 'vn')).toBe('Kỹ sư AI')
    expect(occupationLabel('accountant', 'vn')).toBe('Kế toán')
    expect(occupationLabel('ai_director', 'en')).toBe('AI Director')
  })
})
