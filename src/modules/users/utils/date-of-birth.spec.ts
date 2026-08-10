import {
  ageFromDateOfBirth,
  checkDateOfBirth,
  parseDateOfBirth,
} from './date-of-birth'

describe('date-of-birth utils', () => {
  const asOf = new Date(Date.UTC(2026, 7, 10)) // 2026-08-10

  it('parses valid calendar dates only', () => {
    expect(parseDateOfBirth('1998-02-28')?.toISOString()).toBe(
      '1998-02-28T00:00:00.000Z',
    )
    expect(parseDateOfBirth('1998-02-30')).toBeNull()
    expect(parseDateOfBirth('98-02-28')).toBeNull()
  })

  it('computes age relative to asOf', () => {
    expect(ageFromDateOfBirth(new Date(Date.UTC(1998, 7, 10)), asOf)).toBe(28)
    expect(ageFromDateOfBirth(new Date(Date.UTC(1998, 7, 11)), asOf)).toBe(27)
  })

  it('rejects underage, overage, future, and invalid DOBs', () => {
    expect(checkDateOfBirth('2015-01-01', asOf).ok).toBe(false)
    expect(checkDateOfBirth('1890-01-01', asOf).ok).toBe(false)
    expect(checkDateOfBirth('2027-01-01', asOf).ok).toBe(false)
    expect(checkDateOfBirth('not-a-date', asOf).ok).toBe(false)
  })

  it('accepts a valid adult DOB and returns age', () => {
    const result = checkDateOfBirth('1998-08-10', asOf)
    expect(result).toEqual({
      ok: true,
      date: new Date(Date.UTC(1998, 7, 10)),
      age: 28,
      iso: '1998-08-10',
    })
  })
})
